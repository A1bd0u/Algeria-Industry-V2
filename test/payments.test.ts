import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { createApp } from '../server';
import express from 'express';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../server/db/supabaseClient';
import { createSupabaseMock, filterValue, sessionRow, usersHandler, Handler } from './helpers/supabaseMock';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn(() => 'signed-token'),
  },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

const USER_ID = '11111111-1111-4111-8111-111111111111';
const COMPANY_ID = '22222222-2222-4222-8222-222222222222';
const SUB_ID = '33333333-3333-4333-8333-333333333333';
const SECRET = 'test_sk_unit_secret';

const setup = (handlers: Record<string, Handler>, session: any = sessionRow()) => {
  const mock = createSupabaseMock({ users: usersHandler(session), ...handlers });
  vi.mocked(getSupabase).mockReturnValue(mock.client as any);
  return mock;
};

const ownedCompany: Handler = (q) => {
  if (q.op === 'select') return { data: { id: COMPANY_ID, name: 'Test SARL', owner_id: USER_ID, plan: 'free', plan_ends_at: null } };
};

describe('Abonnements client', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: USER_ID, token_version: 1 } as any);
  });

  it('refuse la souscription à un utilisateur qui n\'est pas titulaire de l\'entreprise', async () => {
    setup({
      companies: (q) => {
        if (q.op === 'select') return { data: { id: COMPANY_ID, owner_id: 'someone-else', plan: 'free' } };
      },
    });

    const res = await request(app).post('/api/subscriptions').set('Cookie', ['token=t']).send({ plan: 'pro' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('COMPANY_REQUIRED');
  });

  it('refuse une offre inconnue ou attribuée par un admin', async () => {
    setup({ companies: ownedCompany });
    const res = await request(app).post('/api/subscriptions').set('Cookie', ['token=t']).send({ plan: 'founder' });
    expect(res.status).toBe(400);
  });

  it('émet une facture en attente au prix officiel, quel que soit le corps envoyé', async () => {
    const mock = setup({
      companies: ownedCompany,
      subscriptions: (q) => {
        if (q.op === 'insert') return { data: { id: SUB_ID, ...q.payload[0] } };
      },
    });

    const res = await request(app)
      .post('/api/subscriptions')
      .set('Cookie', ['token=t'])
      .send({ plan: 'basic', amount_dzd: 1, status: 'active' });

    expect(res.status).toBe(201);
    const insert = mock.queries.find((q) => q.table === 'subscriptions' && q.op === 'insert');
    expect(insert?.payload[0]).toMatchObject({
      plan: 'basic',
      amount_dzd: 18000,
      status: 'pending',
      source: 'self_service',
      company_id: COMPANY_ID,
      user_id: USER_ID,
    });
  });

  it('renvoie la facture en attente existante au lieu d\'en créer une seconde', async () => {
    const mock = setup({
      companies: ownedCompany,
      subscriptions: (q) => {
        if (q.op === 'select' && filterValue(q, 'eq', 'status')?.[1] === 'pending') {
          return { data: { id: SUB_ID, plan: 'pro', status: 'pending' } };
        }
      },
    });

    const res = await request(app).post('/api/subscriptions').set('Cookie', ['token=t']).send({ plan: 'pro' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(SUB_ID);
    expect(mock.queries.some((q) => q.table === 'subscriptions' && q.op === 'insert')).toBe(false);
  });

  it('refuse un justificatif déposé hors du dossier de l\'utilisateur', async () => {
    setup({});
    const res = await request(app)
      .post(`/api/subscriptions/${SUB_ID}/transfer-proof`)
      .set('Cookie', ['token=t'])
      .send({ path: 'autre-utilisateur/preuve.pdf' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PROOF_INVALID');
  });

  it('refuse l\'accès à la facture d\'un autre utilisateur', async () => {
    setup({
      subscriptions: (q) => {
        if (q.op === 'select') return { data: { id: SUB_ID, user_id: 'someone-else', status: 'pending' } };
      },
    });
    const res = await request(app)
      .post(`/api/subscriptions/${SUB_ID}/transfer-proof`)
      .set('Cookie', ['token=t'])
      .send({ path: `${USER_ID}/preuve.pdf` });
    expect(res.status).toBe(404);
  });

  it('enregistre le justificatif sur sa propre facture en attente', async () => {
    const mock = setup({
      subscriptions: (q) => {
        if (q.op === 'select') return { data: { id: SUB_ID, user_id: USER_ID, status: 'pending' } };
        if (q.op === 'update') return { data: { id: SUB_ID, ...q.payload } };
      },
    });
    const res = await request(app)
      .post(`/api/subscriptions/${SUB_ID}/transfer-proof`)
      .set('Cookie', ['token=t'])
      .send({ path: `${USER_ID}/preuve.pdf` });
    expect(res.status).toBe(200);
    const update = mock.queries.find((q) => q.table === 'subscriptions' && q.op === 'update');
    expect(update?.payload.transfer_proof_path).toBe(`${USER_ID}/preuve.pdf`);
  });

  it('indique que le paiement en ligne est désactivé sans clé Chargily', async () => {
    delete process.env.CHARGILY_SECRET_KEY;
    setup({});
    const res = await request(app).post(`/api/subscriptions/${SUB_ID}/checkout`).set('Cookie', ['token=t']);
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('ONLINE_PAYMENT_DISABLED');
  });
});

describe('Limite de produits par offre', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: USER_ID, token_version: 1 } as any);
  });

  it('bloque le 6e produit en offre gratuite', async () => {
    setup({
      companies: (q) => {
        if (q.op === 'select') return { data: { plan: 'free', plan_ends_at: null } };
      },
      products: (q) => {
        if (q.op === 'select') return { count: 5 };
        if (q.op === 'insert') return { data: { id: 'p', ...q.payload[0] } };
      },
    });

    const res = await request(app).post('/api/products').set('Cookie', ['token=t']).send({ name: 'Produit', price: 100 });
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ code: 'PLAN_LIMIT_REACHED', plan: 'free', limit: 5 });
  });

  it('ne limite pas une offre Pro en cours', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    setup({
      companies: (q) => {
        if (q.op === 'select') return { data: { plan: 'pro', plan_ends_at: future } };
      },
      products: (q) => {
        if (q.op === 'select') return { count: 500 };
        if (q.op === 'insert') return { data: { id: 'p', ...q.payload[0] } };
      },
    });

    const res = await request(app).post('/api/products').set('Cookie', ['token=t']).send({ name: 'Produit', price: 100 });
    expect(res.status).toBe(201);
  });

  it('applique la limite gratuite quand l\'offre payante est échue', async () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    setup({
      companies: (q) => {
        if (q.op === 'select') return { data: { plan: 'basic', plan_ends_at: past } };
      },
      products: (q) => {
        if (q.op === 'select') return { count: 5 };
      },
    });

    const res = await request(app).post('/api/products').set('Cookie', ['token=t']).send({ name: 'Produit', price: 100 });
    expect(res.status).toBe(403);
    expect(res.body.plan).toBe('free');
  });
});

describe('Webhook Chargily', () => {
  let app: express.Express;

  const sign = (body: string) => crypto.createHmac('sha256', SECRET).update(body).digest('hex');
  const paidEvent = (amount = 29900) => JSON.stringify({
    id: 'evt_1',
    type: 'checkout.paid',
    data: { id: 'chk_1', amount, status: 'paid' },
  });

  beforeEach(async () => {
    process.env.CHARGILY_SECRET_KEY = SECRET;
    app = await createApp();
  });

  afterEach(() => {
    delete process.env.CHARGILY_SECRET_KEY;
  });

  const pendingSubscription: Handler = (q) => {
    if (q.op === 'select' && filterValue(q, 'eq', 'checkout_id')) {
      return { data: { id: SUB_ID, invoice_number: 'AI-2026-0001' } };
    }
    if (q.op === 'select' && filterValue(q, 'eq', 'id')) {
      return { data: { id: SUB_ID, invoice_number: 'AI-2026-0001', status: 'pending', plan: 'pro', amount_dzd: 29900, company_id: COMPANY_ID, user_id: USER_ID } };
    }
    if (q.op === 'update') return { data: { id: SUB_ID, ...q.payload } };
  };

  it('rejette une signature invalide sans toucher à la base', async () => {
    const mock = setup({});
    const body = paidEvent();
    const res = await request(app)
      .post('/api/payments/chargily/webhook')
      .set('Content-Type', 'application/json')
      .set('signature', 'a'.repeat(64))
      .send(body);
    expect(res.status).toBe(403);
    expect(mock.queries.length).toBe(0);
  });

  it('rejette un webhook sans signature', async () => {
    setup({});
    const res = await request(app)
      .post('/api/payments/chargily/webhook')
      .set('Content-Type', 'application/json')
      .send(paidEvent());
    expect(res.status).toBe(403);
  });

  it('active l\'abonnement sur checkout.paid signé', async () => {
    const mock = setup({ subscriptions: pendingSubscription });
    const body = paidEvent();
    const res = await request(app)
      .post('/api/payments/chargily/webhook')
      .set('Content-Type', 'application/json')
      .set('signature', sign(body))
      .send(body);

    expect(res.status).toBe(200);
    const activation = mock.queries.find((q) => q.table === 'subscriptions' && q.op === 'update');
    expect(activation?.payload).toMatchObject({ status: 'active', payment_method: 'cib_edahabia', payment_reference: 'chk_1' });
    expect(filterValue(activation!, 'eq', 'status')?.[1]).toBe('pending');
    const company = mock.queries.find((q) => q.table === 'companies' && q.op === 'update');
    expect(company?.payload.plan).toBe('pro');
    const tx = mock.queries.find((q) => q.table === 'transactions' && q.op === 'insert');
    expect(tx?.payload[0]).toMatchObject({ amount: 29900, payment_method: 'cib_edahabia' });
  });

  it('n\'active pas si le montant payé diffère de la facture', async () => {
    const mock = setup({ subscriptions: pendingSubscription });
    const body = paidEvent(100);
    const res = await request(app)
      .post('/api/payments/chargily/webhook')
      .set('Content-Type', 'application/json')
      .set('signature', sign(body))
      .send(body);

    expect(res.status).toBe(200);
    expect(mock.queries.some((q) => q.table === 'subscriptions' && q.op === 'update')).toBe(false);
  });

  it('ignore un événement déjà reçu', async () => {
    const mock = setup({
      payment_events: (q) => {
        if (q.op === 'insert') return { error: { code: '23505', message: 'duplicate' } };
      },
      subscriptions: pendingSubscription,
    });
    const body = paidEvent();
    const res = await request(app)
      .post('/api/payments/chargily/webhook')
      .set('Content-Type', 'application/json')
      .set('signature', sign(body))
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.duplicate).toBe(true);
    expect(mock.queries.some((q) => q.table === 'subscriptions')).toBe(false);
  });
});
