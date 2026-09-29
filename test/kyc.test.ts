import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import express from 'express';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../server/db/supabaseClient';
import { sendTransactionalEmail } from '../server/services/emailService';
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

vi.mock('../server/utils/auditLogger', () => ({
  logAdminAction: vi.fn(),
}));

vi.mock('../server/services/emailService', () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue({ success: true }),
  getAppUrl: () => 'https://app.test',
}));

const KYC_ID = '66666666-6666-4666-8666-666666666666';

describe('KYC Routes', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: 'x', token_version: 1 } as any);
    vi.mocked(sendTransactionalEmail).mockClear();
  });

  describe('POST /api/kyc/submit', () => {
    const session = sessionRow({ kyc_status: 'none' });

    it('devrait permettre de soumettre un dossier KYC', async () => {
      const mock = createSupabaseMock({
        users: usersHandler(session, (q) => {
          if (q.op === 'select') return { data: { company_id: session.company_id, company: 'Test SARL', name: 'Test' } };
        }),
        kyc_requests: () => ({ data: { id: KYC_ID } }),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .post('/api/kyc/submit')
        .set('Cookie', ['token=valid-token'])
        .send({
          activity: 'Fabrication de pièces métalliques',
          files: [
            { type: 'RC', url: `${session.id}/rc.pdf` },
            { type: 'NIF', url: `${session.id}/nif.pdf` }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Votre demande KYC a bien été soumise.');
      const statusUpdate = mock.queries.find((q) => q.table === 'users' && q.op === 'update');
      expect(statusUpdate?.payload).toEqual({ kyc_status: 'pending' });
    });

    it('devrait refuser un document qui n\'appartient pas à l\'utilisateur', async () => {
      const mock = createSupabaseMock({ users: usersHandler(session) });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .post('/api/kyc/submit')
        .set('Cookie', ['token=valid-token'])
        .send({
          activity: 'Fabrication',
          files: [{ type: 'RC', url: 'autre-utilisateur/rc.pdf' }]
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('KYC_INVALID_DOCUMENT');
    });

    it('devrait refuser si l\'e-mail n\'est pas vérifié', async () => {
      const mock = createSupabaseMock({ users: usersHandler(sessionRow({ email_verified: false })) });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .post('/api/kyc/submit')
        .set('Cookie', ['token=valid-token'])
        .send({ activity: 'Fabrication', files: [{ type: 'RC', url: `${session.id}/rc.pdf` }] });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  describe('GET /api/kyc', () => {
    it('sert les documents via des URL signées de 5 minutes', async () => {
      const mock = createSupabaseMock({
        users: usersHandler(sessionRow({ role: 'admin' })),
        kyc_requests: () => ({ data: [{ id: KYC_ID, company_id: 'c1', user: { email: 'a@b.c', name: 'A' } }] }),
        kyc_documents: () => ({ data: [{ id: 'd1', document_type: 'RC', file_url: 'u1/rc.pdf' }] }),
        companies: () => ({ data: { name: 'ACME' } }),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app).get('/api/kyc').set('Cookie', ['token=valid-token']);

      expect(res.status).toBe(200);
      expect(res.body[0].docsList[0].file_url).toBe('https://signed.test/u1/rc.pdf?ttl=300');
      expect(mock.storageBucket.getPublicUrl).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/kyc/:id/approve', () => {
    it('devrait refuser si l\'utilisateur n\'est pas admin', async () => {
      const mock = createSupabaseMock({ users: usersHandler(sessionRow({ role: 'fournisseur' })) });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .post(`/api/kyc/${KYC_ID}/approve`)
        .set('Cookie', ['token=valid-token']);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Accès interdit. Rôle insuffisant.');
    });

    it('devrait approuver, passer kyc_status à approved et envoyer un vrai e-mail', async () => {
      const mock = createSupabaseMock({
        users: usersHandler(sessionRow({ role: 'admin' }), (q) => {
          if (q.op === 'update') return { data: { company_id: 'comp-1', email: 'user@example.com', name: 'User' } };
        }),
        kyc_requests: () => ({ data: { user_id: 'user-2', company_id: 'comp-1', name: 'User' } }),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .post(`/api/kyc/${KYC_ID}/approve`)
        .set('Cookie', ['token=valid-token']);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Entreprise approuvée et notifiée par email.');
      const userUpdate = mock.queries.find((q) => q.table === 'users' && q.op === 'update');
      expect(userUpdate?.payload).toEqual({ kyc_status: 'approved' });
      expect(sendTransactionalEmail).toHaveBeenCalledWith('user@example.com', 'kycApproved', expect.any(Object));
    });

    it('devrait rejeter avec motif et envoyer l\'e-mail de rejet', async () => {
      const mock = createSupabaseMock({
        users: usersHandler(sessionRow({ role: 'admin' }), (q) => {
          if (q.op === 'update') return { data: { company_id: 'comp-1', email: 'user@example.com', name: 'User' } };
        }),
        kyc_requests: () => ({ data: { user_id: 'user-2', company_id: 'comp-1', name: 'User' } }),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .post(`/api/kyc/${KYC_ID}/reject`)
        .set('Cookie', ['token=valid-token'])
        .send({ reason: 'Registre de commerce illisible' });

      expect(res.status).toBe(200);
      expect(sendTransactionalEmail).toHaveBeenCalledWith(
        'user@example.com',
        'kycRejected',
        expect.objectContaining({ reason: 'Registre de commerce illisible' })
      );
    });
  });
});
