import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { createSupabaseMock, sessionRow, usersHandler, filterValue, Handler } from './helpers/supabaseMock';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn(), sign: vi.fn(() => 'signed-token') },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

const BUYER_ID = '11111111-1111-4111-8111-111111111111';
const SELLER_A = '33333333-3333-4333-8333-333333333333';
const SELLER_B = '44444444-4444-4444-8444-444444444444';
const P1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const P2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const P3 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const setup = (tables: Record<string, Handler> = {}) => {
  const mock = createSupabaseMock({
    users: usersHandler(sessionRow({ id: BUYER_ID, role: 'acheteur' }), () => ({ data: { email: 'seller@example.com', name: 'Vendeur' } })),
    ...tables,
  });
  vi.mocked(getSupabase).mockReturnValue(mock.client as any);
  return mock;
};

describe('Demande de devis groupée', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: 'u', token_version: 1 } as any);
  });

  it('exige une connexion', async () => {
    setup();
    const res = await request(app).post('/api/messages/quote-requests').send({ product_ids: [P1] });
    expect(res.status).toBe(401);
  });

  it('écrit une fois à chaque fournisseur, déduit des produits publiés', async () => {
    const mock = setup({
      products: () => ({
        data: [
          { id: P1, name: 'Compresseur', owner_id: SELLER_A },
          { id: P2, name: 'Pompe', owner_id: SELLER_A },
          { id: P3, name: 'Moteur', owner_id: SELLER_B },
        ],
      }),
      messages: (q) => {
        if (q.op === 'insert') return { data: q.payload.map((row: any, i: number) => ({ id: `m${i}`, ...row })) };
      },
    });

    const res = await request(app)
      .post('/api/messages/quote-requests')
      .set('Cookie', ['token=t'])
      .send({ product_ids: [P1, P2, P3], note: 'Livraison à Sétif' });

    expect(res.status).toBe(201);
    expect(res.body.sent).toBe(2);

    const productQuery = mock.queries.find((q) => q.table === 'products');
    expect(filterValue(productQuery!, 'in', 'status')?.[1]).toEqual(['Actif', 'active']);

    const insert = mock.queries.find((q) => q.table === 'messages' && q.op === 'insert');
    expect(insert?.payload).toHaveLength(2);
    const toA = insert?.payload.find((row: any) => row.receiver_id === SELLER_A);
    expect(toA.sender_id).toBe(BUYER_ID);
    expect(toA.text).toContain('Compresseur');
    expect(toA.text).toContain('Pompe');
    expect(toA.text).toContain('Livraison à Sétif');
  });

  it('ne s\'écrit pas à soi-même et refuse une liste sans fournisseur', async () => {
    const mock = setup({
      products: () => ({ data: [{ id: P1, name: 'Mon produit', owner_id: BUYER_ID }] }),
    });
    const res = await request(app)
      .post('/api/messages/quote-requests')
      .set('Cookie', ['token=t'])
      .send({ product_ids: [P1] });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('QUOTE_NO_SUPPLIER');
    expect(mock.queries.some((q) => q.table === 'messages' && q.op === 'insert')).toBe(false);
  });

  it('refuse plus de quatre produits ou un identifiant invalide', async () => {
    setup();
    const tooMany = await request(app)
      .post('/api/messages/quote-requests')
      .set('Cookie', ['token=t'])
      .send({ product_ids: [P1, P2, P3, P1, P2] });
    expect(tooMany.status).toBe(400);
    const bad = await request(app)
      .post('/api/messages/quote-requests')
      .set('Cookie', ['token=t'])
      .send({ product_ids: ['1 OR 1=1'] });
    expect(bad.status).toBe(400);
  });
});

describe('Notification de nouveau message', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: 'u', token_version: 1 } as any);
  });

  it('ne recherche pas le destinataire si un e-mail est parti dans l\'heure', async () => {
    const mock = setup({
      messages: (q) => {
        if (q.op === 'insert') return { data: { id: 'new', ...q.payload[0], created_at: new Date().toISOString() } };
        if (q.op === 'select') return { data: [{ id: 'recent' }] };
      },
    });
    const res = await request(app)
      .post('/api/messages')
      .set('Cookie', ['token=t'])
      .send({ text: 'Bonjour', receiver_id: SELLER_A });
    expect(res.status).toBe(201);
    const recentCheck = mock.queries.find((q) => q.table === 'messages' && q.op === 'select');
    expect(filterValue(recentCheck!, 'neq', 'id')?.[1]).toBe('new');
    // Un seul select users après le contrôle d'existence : pas de recherche d'e-mail.
    const emailLookups = mock.queries.filter((q) => q.table === 'users' && q.columns === 'email, name');
    expect(emailLookups).toHaveLength(0);
  });
});
