import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import express from 'express';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../server/db/supabaseClient';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

describe('Products Roles', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
  });

  describe('POST /api/products', () => {
    it('devrait rejeter si l\'utilisateur est un simple acheteur', async () => {
      vi.mocked(jwt.verify).mockReturnValue({ id: 'user-1', role: 'acheteur', token_version: 1, isVerified: true } as any);

      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { token_version: 1 } })
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      const mockSupabase = { from: fromMock };
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

      const res = await request(app)
        .post('/api/products')
        .set('Cookie', ['token=valid-token'])
        .send({
          name: 'Nouveau Produit',
          price: 100
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Accès interdit. Rôle insuffisant.');
    });

    it('devrait rejeter si le fournisseur n\'est pas vérifié', async () => {
      // isVerified: false -> that is what requireVerified checks in middleware
      vi.mocked(jwt.verify).mockReturnValue({ id: 'user-1', role: 'fournisseur', token_version: 1, isVerified: false } as any);

      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { token_version: 1 } }) // the user is passed in req from jwt payload
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      const mockSupabase = { from: fromMock };
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

      const res = await request(app)
        .post('/api/products')
        .set('Cookie', ['token=valid-token'])
        .send({
          name: 'Nouveau Produit',
          price: 100
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Accès interdit. Compte non vérifié.');
    });

    it('devrait accepter si le fournisseur est vérifié', async () => {
      vi.mocked(jwt.verify).mockReturnValue({ id: 'user-1', role: 'fournisseur', token_version: 1, isVerified: true } as any);

      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { token_version: 1, company_id: 'comp-1' } }) // we need to mock owner's company_id ? no, requireAuth handles it but verifyRole might not. Wait, the endpoint inserts product.
          };
        }
        if (table === 'products') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'prod-1', name: 'Nouveau Produit' } })
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      const mockSupabase = { from: fromMock };
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

      const res = await request(app)
        .post('/api/products')
        .set('Cookie', ['token=valid-token'])
        .send({
          name: 'Nouveau Produit',
          price: 100
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Nouveau Produit');
    });
  });
});
