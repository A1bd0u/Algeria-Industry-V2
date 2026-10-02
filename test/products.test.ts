import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import express from 'express';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../server/db/supabaseClient';
import { createSupabaseMock, sessionRow, usersHandler } from './helpers/supabaseMock';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn(() => 'signed-token'),
  },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

const mockSession = (session: any) => {
  const mock = createSupabaseMock({
    users: usersHandler(session),
    products: (q) => {
      if (q.op === 'insert') return { data: { id: 'prod-1', ...q.payload[0] } };
    },
  });
  vi.mocked(getSupabase).mockReturnValue(mock.client as any);
  return mock;
};

describe('Products Roles', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    // Le JWT ne porte que l'identité : même s'il prétend "admin", le rôle vient de la base.
    vi.mocked(jwt.verify).mockReturnValue({ id: 'x', role: 'admin', token_version: 1 } as any);
  });

  describe('POST /api/products', () => {
    it('devrait rejeter si l\'utilisateur est un simple acheteur', async () => {
      mockSession(sessionRow({ role: 'acheteur' }));

      const res = await request(app)
        .post('/api/products')
        .set('Cookie', ['token=valid-token'])
        .send({ name: 'Nouveau Produit', price: 100 });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Accès interdit. Rôle insuffisant.');
    });

    it('devrait rejeter si l\'e-mail est vérifié mais pas le KYC', async () => {
      mockSession(sessionRow({ email_verified: true, kyc_status: 'none' }));

      const res = await request(app)
        .post('/api/products')
        .set('Cookie', ['token=valid-token'])
        .send({ name: 'Nouveau Produit', price: 100 });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('KYC_REQUIRED');
    });

    it('devrait rejeter si le KYC est seulement en attente', async () => {
      mockSession(sessionRow({ kyc_status: 'pending' }));

      const res = await request(app)
        .post('/api/products')
        .set('Cookie', ['token=valid-token'])
        .send({ name: 'Nouveau Produit', price: 100 });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('KYC_REQUIRED');
    });

    it('devrait accepter si le KYC du fournisseur est approuvé', async () => {
      const mock = mockSession(sessionRow({ kyc_status: 'approved' }));

      const res = await request(app)
        .post('/api/products')
        .set('Cookie', ['token=valid-token'])
        .send({ name: 'Nouveau Produit', price: 100 });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Nouveau Produit');
      // owner_id et company_id sont tous deux renseignés.
      const insert = mock.queries.find((q) => q.table === 'products' && q.op === 'insert');
      expect(insert?.payload[0].owner_id).toBe(sessionRow().id);
      expect(insert?.payload[0].company_id).toBe(sessionRow().company_id);
      // Plus d'image picsum inventée.
      expect(res.body.file_url).toBeNull();
    });
  });
});

describe('Catalogue public : filtres et tri côté serveur', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
  });

  const listWith = async (query: string) => {
    const mock = createSupabaseMock({
      products: () => ({ data: [{ id: 'p1', name: 'Pompe', status: 'Actif', company: { name: 'Acme', status: 'approved' } }], count: 1 }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).get(`/api/products?${query}`);
    return { res, q: mock.queries.find((q) => q.table === 'products')! };
  };

  it('développe un groupe de catégories en ses sous-catégories', async () => {
    const { res, q } = await listWith(`category=${encodeURIComponent('Composants & Pièces Détachées')}`);
    expect(res.status).toBe(200);
    const inFilter = q.filters.find((f) => f.method === 'in' && f.args[0] === 'category');
    expect(inFilter?.args[1]).toContain('Pièces mécaniques : Engrenages, roulements, joints.');
  });

  it('trie par prix et filtre par wilaya et par entreprise', async () => {
    const companyId = '55555555-5555-4555-8555-555555555555';
    const { q } = await listWith(`sort=price_asc&region=Oran&company_id=${companyId}`);
    expect(q.filters.find((f) => f.method === 'order')?.args).toEqual(['price', { ascending: true, nullsFirst: false }]);
    expect(q.filters.find((f) => f.method === 'ilike' && f.args[0] === 'region')?.args[1]).toBe('Oran');
    expect(q.filters.find((f) => f.method === 'eq' && f.args[0] === 'company_id')?.args[1]).toBe(companyId);
  });

  it('expose le nom et le statut du fournisseur', async () => {
    const { res } = await listWith('');
    expect(res.body.data[0]).toMatchObject({ company_name: 'Acme', company_verified: true });
    expect(res.body.data[0].company).toBeUndefined();
  });
});

describe('Galerie produit', () => {
  let app: express.Express;
  const IMG = (n: number) => `https://proj.supabase.co/storage/v1/object/public/product-images/${sessionRow().id}/p${n}.jpg`;

  beforeEach(async () => {
    process.env.SUPABASE_URL = 'https://proj.supabase.co';
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: 'x', token_version: 1 } as any);
  });

  it('enregistre les images dans l\'ordre, la première servant de vignette', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow()),
      companies: () => ({ data: { plan: 'free', plan_ends_at: null } }),
      products: (q) => (q.op === 'insert' ? { data: { id: 'p1', ...q.payload[0] } } : { data: [], count: 0 }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).post('/api/products').set('Cookie', ['token=valid-token'])
      .send({ name: 'Pompe', images: [IMG(1), IMG(2)] });
    expect(res.status).toBe(201);
    const insert = mock.queries.find((q) => q.table === 'products' && q.op === 'insert');
    expect(insert?.payload[0]).toMatchObject({ images: [IMG(1), IMG(2)], file_url: IMG(1) });
  });

  it('refuse plus d\'images que l\'offre ne le permet', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow()),
      companies: () => ({ data: { plan: 'free', plan_ends_at: null } }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).post('/api/products').set('Cookie', ['token=valid-token'])
      .send({ name: 'Pompe', images: [IMG(1), IMG(2), IMG(3)] });
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ code: 'PLAN_IMAGE_LIMIT', limit: 2 });
    expect(mock.queries.some((q) => q.table === 'products' && q.op === 'insert')).toBe(false);
  });

  it('refuse une image hors du dossier de l\'utilisateur', async () => {
    const mock = createSupabaseMock({ users: usersHandler(sessionRow()) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).post('/api/products').set('Cookie', ['token=valid-token'])
      .send({ name: 'Pompe', images: ['https://proj.supabase.co/storage/v1/object/public/product-images/autre/x.jpg'] });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PRODUCT_IMAGE_INVALID');
  });
});
