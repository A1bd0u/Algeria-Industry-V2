import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { normalizeWhatsapp } from '../server/utils/phone';
import { createSupabaseMock, sessionRow, usersHandler, Handler } from './helpers/supabaseMock';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn(), sign: vi.fn(() => 'signed-token') },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

const OWNER = '11111111-1111-4111-8111-111111111111';
const COMPANY = '22222222-2222-4222-8222-222222222222';

describe('normalizeWhatsapp', () => {
  it('convertit un mobile algérien local au format international', () => {
    expect(normalizeWhatsapp('0550 12 34 56')).toBe('213550123456');
    expect(normalizeWhatsapp('+213 661-23-45-67')).toBe('213661234567');
    expect(normalizeWhatsapp('00213770123456')).toBe('213770123456');
    expect(normalizeWhatsapp('+33 6 12 34 56 78')).toBe('33612345678');
  });

  it('refuse les numéros invalides', () => {
    expect(normalizeWhatsapp('021 23 45 67')).toBeNull(); // fixe algérien
    expect(normalizeWhatsapp('+213 21 23 45 67')).toBeNull();
    expect(normalizeWhatsapp('abc')).toBeNull();
    expect(normalizeWhatsapp('12')).toBeNull();
  });
});

describe('Fiche entreprise', () => {
  let app: express.Express;

  const setup = (companies: Handler, session = sessionRow()) => {
    const mock = createSupabaseMock({ users: usersHandler(session), companies });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    return mock;
  };

  const companyRow = (status: string) => ({
    id: COMPANY, name: 'Test SARL', status, owner_id: OWNER, whatsapp: '213550123456',
    products: [{ id: 'p1', status: 'Actif' }, { id: 'p2', status: 'Rejeté' }],
  });

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: OWNER, token_version: 1 } as any);
  });

  it('masque le WhatsApp et les produits non publiés au public tant que l\'entreprise n\'est pas vérifiée', async () => {
    setup((q) => (q.op === 'select' ? { data: companyRow('pending') } : undefined));
    const res = await request(app).get(`/api/companies/${COMPANY}`);
    expect(res.status).toBe(200);
    expect(res.body.whatsapp).toBeUndefined();
    expect(res.body.products.map((p: any) => p.id)).toEqual(['p1']);
  });

  it('affiche le WhatsApp d\'une entreprise vérifiée', async () => {
    setup((q) => (q.op === 'select' ? { data: companyRow('approved') } : undefined));
    const res = await request(app).get(`/api/companies/${COMPANY}`);
    expect(res.body.whatsapp).toBe('213550123456');
  });

  it('montre tout au titulaire', async () => {
    setup((q) => (q.op === 'select' ? { data: companyRow('pending') } : undefined));
    const res = await request(app).get(`/api/companies/${COMPANY}`).set('Cookie', ['token=t']);
    expect(res.body.whatsapp).toBe('213550123456');
    expect(res.body.products).toHaveLength(2);
  });

  it('refuse un numéro invalide', async () => {
    setup(() => undefined);
    const res = await request(app).put(`/api/companies/${COMPANY}`).set('Cookie', ['token=t']).send({ name: 'Test SARL', whatsapp: '021234567' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('WHATSAPP_INVALID');
  });

  it('enregistre le numéro normalisé', async () => {
    const mock = setup((q) => {
      if (q.op === 'select') return { data: { owner_id: OWNER, status: 'approved', nif: '123', rc: '456' } };
      if (q.op === 'update') return { data: { id: COMPANY, ...q.payload } };
    });
    const res = await request(app).put(`/api/companies/${COMPANY}`).set('Cookie', ['token=t']).send({ name: 'Test SARL', whatsapp: '0550 12 34 56' });
    expect(res.status).toBe(200);
    const update = mock.queries.find((q) => q.table === 'companies' && q.op === 'update');
    expect(update?.payload.whatsapp).toBe('213550123456');
  });

  it('interdit de modifier le RC ou le NIF après vérification', async () => {
    const mock = setup((q) => (q.op === 'select' ? { data: { owner_id: OWNER, status: 'approved', nif: '123', rc: '456' } } : undefined));
    const res = await request(app).put(`/api/companies/${COMPANY}`).set('Cookie', ['token=t']).send({ name: 'Test SARL', nif: '999' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('COMPANY_LEGAL_LOCKED');
    expect(mock.queries.some((q) => q.table === 'companies' && q.op === 'update')).toBe(false);
  });
});
