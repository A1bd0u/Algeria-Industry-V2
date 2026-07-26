import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import express from 'express';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../server/db/supabaseClient';
import { logAdminAction } from '../server/utils/auditLogger';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

vi.mock('../server/utils/auditLogger', () => ({
  logAdminAction: vi.fn(),
}));

describe('KYC Routes', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
  });

  describe('POST /api/kyc/submit', () => {
    it('devrait permettre de soumettre un dossier KYC', async () => {
      vi.mocked(jwt.verify).mockReturnValue({ id: 'user-1', role: 'fournisseur', token_version: 1, isVerified: false } as any);

      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { token_version: 1, email: 'test@example.com', name: 'Test User' } }),
            single: vi.fn().mockResolvedValue({ data: { company_id: 'comp-1', company: 'Test Company' } }),
            update: vi.fn().mockReturnThis()
          };
        }
        if (table === 'kyc_requests') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'kyc-123', status: 'pending' } })
          };
        }
        if (table === 'kyc_documents') {
            return {
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis()
            };
        }
        if (table === 'companies') {
            return {
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis()
            };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      const mockSupabase = { from: fromMock };
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

      const res = await request(app)
        .post('/api/kyc/submit')
        .set('Cookie', ['token=valid-token'])
        .send({
          activity: 'Fabrication de pièces métalliques',
          files: [
            { type: 'RC', url: 'http://example.com/rc.pdf' },
            { type: 'NIF', url: 'http://example.com/nif.pdf' }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Votre demande KYC a bien été soumise.');
    });
  });

  describe('POST /api/kyc/:id/approve', () => {
    it('devrait refuser si l\'utilisateur n\'est pas admin', async () => {
      vi.mocked(jwt.verify).mockReturnValue({ id: 'user-1', role: 'fournisseur', token_version: 1, isVerified: true } as any);

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
        .post('/api/kyc/kyc-123/approve')
        .set('Cookie', ['token=valid-token']);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Accès interdit. Rôle insuffisant.');
    });

    it('devrait autoriser si l\'utilisateur est admin', async () => {
      vi.mocked(jwt.verify).mockReturnValue({ id: 'admin-1', role: 'admin', token_version: 1, isVerified: true } as any);

      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { token_version: 1, email: 'user@example.com', name: 'User' } }),
            update: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { company_id: 'comp-1', email: 'user@example.com' } })
          };
        }
        if (table === 'kyc_requests') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'kyc-123', user_id: 'user-2', name: 'User' } })
          };
        }
        if (table === 'companies') {
            return {
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis()
            };
        }
        if (table === 'kyc_documents') {
            return {
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis()
            };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      const mockSupabase = { from: fromMock };
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

      const res = await request(app)
        .post('/api/kyc/kyc-123/approve')
        .set('Cookie', ['token=valid-token']);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Entreprise approuvée et notifiée par email.');
    });
  });
});
