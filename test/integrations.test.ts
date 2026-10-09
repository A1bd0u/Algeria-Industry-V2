import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { createSupabaseMock, filterValue, sessionRow, usersHandler, Handler } from './helpers/supabaseMock';
import { signPayload, verifySignature, generateApiKey, hashApiKey } from '../server/services/integrations/signature';
import { isPublicIp, validateOutboundUrl } from '../server/utils/safeFetch';
import { entitlementsFor } from '../server/services/integrations/entitlements';
import { rowsFromFeedTable, tableFromJson } from '../server/services/integrations/feeds';
import { syncProducts } from '../server/services/integrations/catalogSync';
import { decryptSecret } from '../server/utils/totp';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn(), sign: vi.fn(() => 'signed-token') },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const COMPANY_ID = '22222222-2222-4222-8222-222222222222';

const plan = (name: string): Handler => (q) => {
  if (q.columns?.includes('plan_ends_at')) return { data: { plan: name, plan_ends_at: null } };
};

describe('Signature des webhooks', () => {
  it('vérifie une signature valide et refuse un corps modifié ou trop ancien', () => {
    const body = JSON.stringify({ event: 'ping' });
    const header = signPayload('whsec_test', body, 1_000_000);
    expect(verifySignature('whsec_test', body, header, 300, 1_000_100)).toBe(true);
    expect(verifySignature('whsec_test', body + ' ', header, 300, 1_000_100)).toBe(false);
    expect(verifySignature('autre', body, header, 300, 1_000_100)).toBe(false);
    expect(verifySignature('whsec_test', body, header, 300, 1_000_400)).toBe(false);
  });

  it('génère des clés d\'API reconnaissables dont seule l\'empreinte est gardée', () => {
    const { key, prefix, hash } = generateApiKey();
    expect(key.startsWith('ind_live_')).toBe(true);
    expect(key.startsWith(prefix)).toBe(true);
    expect(hash).toBe(hashApiKey(key));
    expect(hash).not.toContain(key);
  });
});

describe('Adresses sortantes (webhooks, flux)', () => {
  it('refuse les adresses privées, locales ou réservées', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1']) {
      expect(isPublicIp(ip), ip).toBe(false);
    }
    for (const ip of ['41.111.10.1', '8.8.8.8', '2a00:1450:4007::1']) {
      expect(isPublicIp(ip), ip).toBe(true);
    }
  });

  it('n\'accepte que https, sans identifiants ni nom local', () => {
    expect(() => validateOutboundUrl('http://crm.example.dz/hook')).toThrow();
    expect(() => validateOutboundUrl('https://user:pass@crm.example.dz/hook')).toThrow();
    expect(() => validateOutboundUrl('https://localhost/hook')).toThrow();
    expect(() => validateOutboundUrl('https://169.254.169.254/latest')).toThrow();
    expect(validateOutboundUrl('https://crm.example.dz/hook?token=abc').hostname).toBe('crm.example.dz');
  });
});

describe('Droits d\'intégration', () => {
  const supplier = { role: 'fournisseur', emailVerified: true, kycStatus: 'approved' };
  it('dépendent de l\'offre et du KYC pour les fournisseurs', () => {
    expect(entitlementsFor(supplier, 'free')).toMatchObject({ feed: false, webhooks: false, apiKeys: false });
    expect(entitlementsFor(supplier, 'basic')).toMatchObject({ feed: true, feedHourly: false, webhooks: false, apiKeys: false });
    expect(entitlementsFor(supplier, 'pro')).toMatchObject({ feed: true, feedHourly: true, webhooks: true, apiKeys: true });
    expect(entitlementsFor(supplier, 'pro').scopes).toContain('products:write');
    expect(entitlementsFor({ ...supplier, kycStatus: 'pending' }, 'pro').scopes).not.toContain('products:write');
    expect(entitlementsFor({ ...supplier, kycStatus: 'pending' }, 'pro').feed).toBe(false);
  });

  it('donnent aux acheteurs webhooks et lecture des messages', () => {
    const buyer = entitlementsFor({ role: 'acheteur', emailVerified: true, kycStatus: 'none' }, 'free');
    expect(buyer).toMatchObject({ feed: false, webhooks: true, apiKeys: true, scopes: ['messages:read'], events: ['message.received'] });
    expect(entitlementsFor({ role: 'acheteur', emailVerified: false, kycStatus: 'none' }, 'free').apiKeys).toBe(false);
  });
});

describe('Lecture des flux catalogue', () => {
  it('lit un JSON { products: [...] } comme un tableau', () => {
    const table = tableFromJson({ products: [{ reference: 'A1', name: 'Pompe', price: 100 }, { reference: 'B2', name: 'Vanne' }] });
    expect(table[0]).toEqual(['reference', 'name', 'price']);
    const rows = rowsFromFeedTable(table);
    expect(rows.map((r) => r.row.reference)).toEqual(['A1', 'B2']);
    expect(rows[0].row.price).toBe(100);
  });

  it('exige une colonne de référence', () => {
    expect(() => rowsFromFeedTable([['nom', 'prix'], ['Pompe', '10']])).toThrow(/référence/);
  });
});

describe('Synchronisation par référence', () => {
  it('met à jour les produits connus, crée les nouveaux en brouillon et retire les absents', async () => {
    const mock = createSupabaseMock({
      companies: plan('pro'),
      products: (q) => {
        if (q.op === 'select' && q.columns?.includes('external_ref')) {
          return { data: [
            { id: 'p1', external_ref: 'A1', name: 'Pompe', category: 'X', price: 100, description: 'd', status: 'Actif' },
            { id: 'p2', external_ref: 'OLD', name: 'Ancien', category: 'X', price: 5, description: '', status: 'Actif' },
          ] };
        }
        if (q.op === 'insert') return { data: q.payload.map((_: any, i: number) => ({ id: `n${i}` })) };
      },
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const rows = rowsFromFeedTable([['reference', 'nom', 'prix'], ['A1', 'Pompe', '120'], ['C3', 'Compresseur', ''], ['', 'Sans ref', '1']]);
    const report = await syncProducts({ id: USER_ID, role: 'fournisseur', company_id: COMPANY_ID }, rows, { deactivateMissing: true });

    expect(report).toMatchObject({ received: 3, created: 1, updated: 1, deactivated: 1, rejected: 1 });
    const update = mock.queries.find((q) => q.table === 'products' && q.op === 'update' && filterValue(q, 'eq', 'id')?.[1] === 'p1');
    expect(update?.payload).toMatchObject({ price: 120 });
    const insert = mock.queries.find((q) => q.table === 'products' && q.op === 'insert');
    expect(insert?.payload[0]).toMatchObject({ external_ref: 'C3', status: 'Brouillon', owner_id: USER_ID });
    const deactivate = mock.queries.find((q) => q.table === 'products' && q.op === 'update' && filterValue(q, 'in', 'id'));
    expect(filterValue(deactivate!, 'in', 'id')?.[1]).toEqual(['p2']);
    expect(deactivate?.payload).toMatchObject({ status: 'Inactif' });
  });
});

describe('Routes /api/integrations', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: USER_ID, token_version: 1 } as any);
  });

  it('refuse les webhooks en offre Basic', async () => {
    const mock = createSupabaseMock({ users: usersHandler(sessionRow()), companies: plan('basic') });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).post('/api/integrations/webhooks').set('Cookie', ['token=t'])
      .send({ url: 'https://crm.example.dz/hook', events: ['quote_request.received'] });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('WEBHOOKS_NOT_ALLOWED');
  });

  it('crée un webhook Pro avec un secret chiffré, renvoyé une seule fois', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow()),
      companies: plan('pro'),
      webhooks: (q) => {
        if (q.op === 'select') return { count: 0 };
        if (q.op === 'insert') return { data: { id: 'w1', url: q.payload.url, events: q.payload.events, active: true } };
      },
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).post('/api/integrations/webhooks').set('Cookie', ['token=t'])
      .send({ url: 'https://crm.example.dz/hook', events: ['quote_request.received'] });
    expect(res.status).toBe(201);
    expect(res.body.secret).toMatch(/^whsec_/);
    const insert = mock.queries.find((q) => q.table === 'webhooks' && q.op === 'insert');
    expect(insert?.payload.secret_enc).not.toContain(res.body.secret);
    expect(decryptSecret(insert?.payload.secret_enc)).toBe(res.body.secret);
  });

  it('refuse une adresse de webhook interne', async () => {
    const mock = createSupabaseMock({ users: usersHandler(sessionRow()), companies: plan('pro') });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).post('/api/integrations/webhooks').set('Cookie', ['token=t'])
      .send({ url: 'https://127.0.0.1/hook', events: ['quote_request.received'] });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('URL_PRIVATE');
  });

  it('crée une clé d\'API dont seule l\'empreinte est enregistrée', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow()),
      companies: plan('pro'),
      api_keys: (q) => {
        if (q.op === 'select') return { count: 0 };
        if (q.op === 'insert') return { data: { id: 'k1', name: q.payload.name, prefix: q.payload.prefix, scopes: q.payload.scopes } };
      },
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).post('/api/integrations/api-keys').set('Cookie', ['token=t'])
      .send({ name: 'ERP Sage', scopes: ['products:read', 'products:write'] });
    expect(res.status).toBe(201);
    const insert = mock.queries.find((q) => q.table === 'api_keys' && q.op === 'insert');
    expect(insert?.payload.key_hash).toBe(hashApiKey(res.body.key));
    expect(JSON.stringify(insert?.payload)).not.toContain(res.body.key);
  });
});

describe('API publique /api/v1', () => {
  let app: express.Express;
  const { key, hash } = generateApiKey();

  const apiMock = (role = 'fournisseur', planName = 'pro', scopes = ['products:read', 'products:write', 'messages:read'], extra: Record<string, Handler> = {}) =>
    createSupabaseMock({
      api_keys: (q) => (q.op === 'select' && filterValue(q, 'eq', 'key_hash')?.[1] === hash
        ? { data: { id: 'k1', user_id: USER_ID, scopes, revoked_at: null, last_used_at: new Date().toISOString() } }
        : undefined),
      users: () => ({ data: { ...sessionRow({ role }) } }),
      companies: plan(planName),
      ...extra,
    });

  beforeEach(async () => {
    app = await createApp();
  });

  it('exige une clé valide', async () => {
    vi.mocked(getSupabase).mockReturnValue(apiMock().client as any);
    expect((await request(app).get('/api/v1/me')).status).toBe(401);
    const bad = await request(app).get('/api/v1/me').set('Authorization', 'Bearer ind_live_inconnue');
    expect(bad.status).toBe(401);
    expect(bad.body.code).toBe('API_KEY_INVALID');
    const ok = await request(app).get('/api/v1/me').set('Authorization', `Bearer ${key}`);
    expect(ok.status).toBe(200);
    expect(ok.body.scopes).toContain('products:write');
  });

  it('coupe l\'accès quand l\'offre Pro a pris fin', async () => {
    vi.mocked(getSupabase).mockReturnValue(apiMock('fournisseur', 'basic').client as any);
    const res = await request(app).get('/api/v1/products').set('Authorization', `Bearer ${key}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('API_NOT_ALLOWED');
  });

  it('limite l\'acheteur à la lecture de ses messages', async () => {
    vi.mocked(getSupabase).mockReturnValue(apiMock('acheteur', 'free', ['messages:read', 'products:write']).client as any);
    const res = await request(app).put('/api/v1/products/A1').set('Authorization', `Bearer ${key}`).send({ name: 'Pompe' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('API_SCOPE_MISSING');
  });

  it('ne transmet l\'e-mail de l\'expéditeur qu\'avec son accord', async () => {
    const mock = apiMock('fournisseur', 'pro', undefined, {
      messages: () => ({ data: [
        { id: 'm1', text: 'Devis ?', kind: 'quote_request', share_contact: true, created_at: '2026-10-09T10:00:00Z', sender: { id: 's1', name: 'Karim', email: 'k@ex.dz', company: 'SARL' } },
        { id: 'm2', text: 'Bonjour', kind: 'message', share_contact: false, created_at: '2026-10-09T09:00:00Z', sender: { id: 's2', name: 'Lina', email: 'l@ex.dz', company: null } },
      ] }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).get('/api/v1/messages').set('Authorization', `Bearer ${key}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].sender.email).toBe('k@ex.dz');
    expect(res.body.data[1].sender.email).toBeNull();
  });

  it('refuse de mettre en vente un produit sans photo', async () => {
    const product = { id: 'p1', external_ref: 'A1', name: 'Pompe', category: 'X', price: 100, description: '', status: 'Brouillon', images: [], file_url: null };
    const mock = apiMock('fournisseur', 'pro', undefined, {
      products: (q) => {
        if (q.op === 'select' && filterValue(q, 'not', 'external_ref')) return { data: [product] };
        if (q.op === 'select') return { data: product };
      },
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).put('/api/v1/products/A1').set('Authorization', `Bearer ${key}`).send({ name: 'Pompe', price: 100, status: 'Actif' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PRODUCT_PHOTO_REQUIRED');
  });
});

describe('Envoi des webhooks', () => {
  it('signe l\'envoi et enregistre le succès', async () => {
    const http = await import('http');
    const { emitEvent } = await import('../server/services/integrations/webhooks');
    const { encryptSecret } = await import('../server/utils/totp');
    process.env.INTEGRATIONS_ALLOW_HTTP = 'true';
    process.env.INTEGRATIONS_ALLOW_PRIVATE = 'true';
    let received: { headers: any; body: string } | null = null;
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => { received = { headers: req.headers, body }; res.statusCode = 204; res.end(); });
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    const port = (server.address() as any).port;
    try {
      const mock = createSupabaseMock({
        webhooks: (q) => (q.op === 'select'
          ? { data: [{ id: 'w1', url: `http://127.0.0.1:${port}/hook`, secret_enc: encryptSecret('whsec_local'), active: true, consecutive_failures: 0, events: ['quote_request.received'] }] }
          : undefined),
        webhook_deliveries: (q) => (q.op === 'insert' ? { data: { id: q.payload.id, webhook_id: 'w1', event: q.payload.event, payload: q.payload.payload, attempts: 0 } } : undefined),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);
      await emitEvent(USER_ID, 'quote_request.received', { text: 'Devis' });
      await vi.waitFor(() => {
        expect(mock.queries.some((q) => q.table === 'webhook_deliveries' && q.op === 'update' && q.payload.status === 'success')).toBe(true);
      });
      expect(received).not.toBeNull();
      expect(received!.headers['x-industigo-event']).toBe('quote_request.received');
      expect(verifySignature('whsec_local', received!.body, received!.headers['x-industigo-signature'])).toBe(true);
      expect(JSON.parse(received!.body).data).toEqual({ text: 'Devis' });
      // Un événement auquel le webhook n'est pas abonné n'est pas envoyé.
      const before = mock.queries.filter((q) => q.table === 'webhook_deliveries' && q.op === 'insert').length;
      await emitEvent(USER_ID, 'message.received', { text: 'x' });
      expect(mock.queries.filter((q) => q.table === 'webhook_deliveries' && q.op === 'insert').length).toBe(before);
    } finally {
      server.close();
      delete process.env.INTEGRATIONS_ALLOW_HTTP;
      delete process.env.INTEGRATIONS_ALLOW_PRIVATE;
    }
  });
});

describe('Demande de devis depuis une fiche produit', () => {
  it('marque le message comme demande de devis avec l\'accord de partage', async () => {
    const app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: USER_ID, token_version: 1 } as any);
    const SELLER = '33333333-3333-4333-8333-333333333333';
    const PRODUCT = '44444444-4444-4444-8444-444444444444';
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow({ role: 'acheteur' }), (q) => (q.op === 'select' ? { data: { id: SELLER, email: 's@ex.dz', name: 'S' } } : undefined)),
      products: () => ({ data: { id: PRODUCT, name: 'Pompe', external_ref: 'A1', reference_id: 'PRD-1', owner_id: SELLER } }),
      messages: (q) => (q.op === 'insert' ? { data: { id: 'm1', ...q.payload[0], created_at: '2026-10-09T10:00:00Z' } } : { data: [] }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).post('/api/messages').set('Cookie', ['token=t'])
      .send({ text: 'Bonjour, devis ?', receiver_id: SELLER, quote_product_id: PRODUCT, share_contact: true });
    expect(res.status).toBe(201);
    const insert = mock.queries.find((q) => q.table === 'messages' && q.op === 'insert');
    expect(insert?.payload[0]).toMatchObject({ kind: 'quote_request', share_contact: true, text: 'Bonjour, devis ?' });
  });
});
