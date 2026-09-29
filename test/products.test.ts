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
