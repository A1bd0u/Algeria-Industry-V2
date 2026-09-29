import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { createSupabaseMock, sessionRow, usersHandler, filterValue } from './helpers/supabaseMock';

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

const SUB_ID = '88888888-8888-4888-8888-888888888888';
const COMPANY_ID = '99999999-9999-4999-8999-999999999999';
const OWNER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const admin = sessionRow({ role: 'admin' });

describe('Console admin', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: 'x', token_version: 1 } as any);
  });

  describe('Facturation', () => {
    it('refuse l\'accès à un non-admin', async () => {
      const mock = createSupabaseMock({ users: usersHandler(sessionRow({ role: 'fournisseur' })) });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app).get('/api/admin/billing').set('Cookie', ['token=t']);
      expect(res.status).toBe(403);
    });

    it('émet une facture au montant de l\'offre, facturée au titulaire de la fiche', async () => {
      const mock = createSupabaseMock({
        users: usersHandler(admin),
        companies: () => ({ data: { id: COMPANY_ID, name: 'ACME', owner_id: OWNER_ID, status: 'approved' } }),
        subscriptions: (q) => (q.op === 'insert' ? { data: { id: SUB_ID, invoice_number: 'FA-2026-00001', ...q.payload[0] } } : undefined),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .post('/api/admin/billing')
        .set('Cookie', ['token=t'])
        .send({ company_id: COMPANY_ID, plan: 'pro' });

      expect(res.status).toBe(201);
      const insert = mock.queries.find((q) => q.table === 'subscriptions' && q.op === 'insert');
      expect(insert?.payload[0]).toMatchObject({ plan: 'pro', amount_dzd: 29900, status: 'pending', user_id: OWNER_ID });
    });

    it('refuse de facturer une fiche non revendiquée', async () => {
      const mock = createSupabaseMock({
        users: usersHandler(admin),
        companies: () => ({ data: { id: COMPANY_ID, name: 'ACME', owner_id: null } }),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .post('/api/admin/billing')
        .set('Cookie', ['token=t'])
        .send({ company_id: COMPANY_ID, plan: 'basic' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('COMPANY_UNCLAIMED');
    });

    it('exige la référence du virement pour activer une facture payante', async () => {
      const mock = createSupabaseMock({
        users: usersHandler(admin),
        subscriptions: () => ({ data: { id: SUB_ID, status: 'pending', plan: 'basic', amount_dzd: 18000, company_id: COMPANY_ID, user_id: OWNER_ID } }),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .post(`/api/admin/billing/${SUB_ID}/activate`)
        .set('Cookie', ['token=t'])
        .send({ payment_method: 'virement' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PAYMENT_REFERENCE_REQUIRED');
    });

    it('refuse d\'activer gratuitement une facture payante', async () => {
      const mock = createSupabaseMock({
        users: usersHandler(admin),
        subscriptions: () => ({ data: { id: SUB_ID, status: 'pending', plan: 'pro', amount_dzd: 29900, company_id: COMPANY_ID, user_id: OWNER_ID } }),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .post(`/api/admin/billing/${SUB_ID}/activate`)
        .set('Cookie', ['token=t'])
        .send({ payment_method: 'gratuit' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PAYMENT_REQUIRED');
    });

    it('active pour 12 mois, met à jour l\'entreprise et enregistre la transaction', async () => {
      const mock = createSupabaseMock({
        users: usersHandler(admin),
        subscriptions: (q) => {
          if (q.op === 'select' && filterValue(q, 'eq', 'id')) {
            return { data: { id: SUB_ID, invoice_number: 'FA-2026-00001', status: 'pending', plan: 'basic', amount_dzd: 18000, company_id: COMPANY_ID, user_id: OWNER_ID } };
          }
          if (q.op === 'select') return { data: null }; // aucun abonnement actif en cours
          if (q.op === 'update') return { data: { id: SUB_ID, ...q.payload } };
        },
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .post(`/api/admin/billing/${SUB_ID}/activate`)
        .set('Cookie', ['token=t'])
        .send({ payment_method: 'virement', payment_reference: 'VIR-123' });

      expect(res.status).toBe(200);
      const update = mock.queries.find((q) => q.table === 'subscriptions' && q.op === 'update');
      const months = (new Date(update!.payload.ends_at).getTime() - new Date(update!.payload.starts_at).getTime()) / (1000 * 60 * 60 * 24 * 30.4);
      expect(Math.round(months)).toBe(12);
      const company = mock.queries.find((q) => q.table === 'companies' && q.op === 'update');
      expect(company?.payload.plan).toBe('basic');
      const tx = mock.queries.find((q) => q.table === 'transactions' && q.op === 'insert');
      expect(tx?.payload[0]).toMatchObject({ amount: 18000, status: 'completed', reference: 'VIR-123', subscription_id: SUB_ID });
    });

    it('échappe les données de l\'entreprise dans la facture imprimable', async () => {
      const mock = createSupabaseMock({
        users: usersHandler(admin),
        subscriptions: () => ({
          data: {
            id: SUB_ID, invoice_number: 'FA-2026-00002', plan: 'pro', amount_dzd: 29900, status: 'pending', created_at: new Date().toISOString(),
            company: { name: '<script>alert(1)</script>' }, user: { name: 'A', email: 'a@x.dz' },
          },
        }),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app).get(`/api/admin/billing/${SUB_ID}/invoice`).set('Cookie', ['token=t']);
      expect(res.status).toBe(200);
      expect(res.text).not.toContain('<script>alert(1)</script>');
      expect(res.text).toContain('FA-2026-00002');
      expect(res.text).toContain('TVA 19 %');
    });
  });

  describe('Publicités', () => {
    it('exige un motif pour refuser une demande', async () => {
      const mock = createSupabaseMock({ users: usersHandler(admin) });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .patch(`/api/admin/ads/${SUB_ID}/status`)
        .set('Cookie', ['token=t'])
        .send({ status: 'rejected' });

      expect(res.status).toBe(400);
      expect(mock.queries.some((q) => q.table === 'ads')).toBe(false);
    });

    it('publie une campagne en base', async () => {
      const mock = createSupabaseMock({
        users: usersHandler(admin),
        ads: (q) => (q.op === 'update' ? { data: { id: SUB_ID, title: 'Campagne', status: q.payload.status } } : undefined),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .patch(`/api/admin/ads/${SUB_ID}/status`)
        .set('Cookie', ['token=t'])
        .send({ status: 'published' });

      expect(res.status).toBe(200);
      const update = mock.queries.find((q) => q.table === 'ads' && q.op === 'update');
      expect(update?.payload).toMatchObject({ status: 'published', rejection_reason: null });
    });
  });

  describe('Support', () => {
    it('liste les messages du formulaire de contact filtrés par statut', async () => {
      const mock = createSupabaseMock({
        users: usersHandler(admin),
        contact_messages: () => ({ data: [{ id: SUB_ID, name: 'Ali', status: 'new' }] }),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app).get('/api/admin/support/messages?status=new').set('Cookie', ['token=t']);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      const select = mock.queries.find((q) => q.table === 'contact_messages');
      expect(filterValue(select!, 'eq', 'status')).toEqual(['status', 'new']);
    });

    it('marque un message comme traité', async () => {
      const mock = createSupabaseMock({
        users: usersHandler(admin),
        contact_messages: (q) => (q.op === 'update' ? { data: { id: SUB_ID, status: 'closed' } } : undefined),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .patch(`/api/admin/support/messages/${SUB_ID}`)
        .set('Cookie', ['token=t'])
        .send({ status: 'closed', admin_note: 'Rappelé par téléphone' });

      expect(res.status).toBe(200);
      const update = mock.queries.find((q) => q.table === 'contact_messages' && q.op === 'update');
      expect(update?.payload).toMatchObject({ status: 'closed', admin_note: 'Rappelé par téléphone', handled_by: admin.id });
    });
  });

  describe('Articles', () => {
    it('le blog public ne renvoie que les articles publiés', async () => {
      const mock = createSupabaseMock({ articles: () => ({ data: [] }) });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app).get('/api/articles');
      expect(res.status).toBe(200);
      const select = mock.queries.find((q) => q.table === 'articles');
      expect(filterValue(select!, 'eq', 'status')).toEqual(['status', 'published']);
    });

    it('un article est créé en brouillon par défaut', async () => {
      const mock = createSupabaseMock({
        users: usersHandler(admin),
        articles: (q) => (q.op === 'insert' ? { data: { id: SUB_ID, ...q.payload[0] } } : undefined),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .post('/api/articles')
        .set('Cookie', ['token=t'])
        .send({ title: 'Importer en Algérie', content: 'Un contenu suffisamment long pour être valide.' });

      expect(res.status).toBe(201);
      const insert = mock.queries.find((q) => q.table === 'articles' && q.op === 'insert');
      expect(insert?.payload[0]).toMatchObject({ status: 'draft', author: admin.name });
    });
  });
});
