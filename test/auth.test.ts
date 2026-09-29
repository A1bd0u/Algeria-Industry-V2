import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import express from 'express';
import { getSupabase } from '../server/db/supabaseClient';
import { sendTransactionalEmail } from '../server/services/emailService';
import { createSupabaseMock } from './helpers/supabaseMock';

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

vi.mock('../server/services/emailService', () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue({ success: true }),
  getAppUrl: () => 'https://app.test',
}));

describe('Auth Routes Integration', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(sendTransactionalEmail).mockClear();
  });

  describe('POST /api/auth/register', () => {
    it('devrait rejeter un mot de passe faible', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'weak1',
          captchaToken: 'dummy-token'
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.details)).toContain('au moins 10 caractères');
    });

    it('devrait rejeter un email invalide', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'not-an-email',
          password: 'StrongPassword123',
          captchaToken: 'dummy-token'
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.details)).toContain('Email invalide');
    });

    it('répond de façon identique si le compte existe déjà (pas d\'énumération) et prévient par e-mail', async () => {
      const existing = createSupabaseMock({
        users: (q) => (q.op === 'select' ? { data: { id: 'u1', name: 'Existant' } } : undefined),
      });
      vi.mocked(getSupabase).mockReturnValue(existing.client as any);

      const payload = { name: 'Test User', email: 'Deja@Example.com', password: 'StrongPassword123', captchaToken: 't' };
      const resExisting = await request(app).post('/api/auth/register').send(payload);

      const fresh = createSupabaseMock({
        users: (q) => {
          if (q.op === 'select') return { data: null };
          if (q.op === 'insert') return { data: { id: 'u2' } };
        },
      });
      vi.mocked(getSupabase).mockReturnValue(fresh.client as any);
      const resNew = await request(app).post('/api/auth/register').send({ ...payload, email: 'nouveau@example.com' });

      expect(resExisting.status).toBe(200);
      expect(resNew.status).toBe(200);
      expect(resExisting.body).toEqual(resNew.body);
      // Aucune session n'est ouverte avant la vérification du code.
      expect(resExisting.headers['set-cookie']).toBeUndefined();
      expect(resNew.headers['set-cookie']).toBeUndefined();
      expect(sendTransactionalEmail).toHaveBeenCalledWith('deja@example.com', 'accountExists', expect.any(Object));
      // Nouveau compte : e-mail non vérifié, KYC à zéro, bcrypt coût 12.
      const insert = fresh.queries.find((q) => q.table === 'users' && q.op === 'insert');
      expect(insert?.payload[0]).toMatchObject({ email_verified: false, kyc_status: 'none', email: 'nouveau@example.com' });
      expect(insert?.payload[0].passwordHash).toMatch(/^\$2[aby]\$12\$/);
    });
  });

  describe('POST /api/auth/login', () => {
    it('devrait rejeter une requête sans captcha', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongPassword123'
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.details)).toMatch(/Captcha requis|expected string/);
    });
  });
});
