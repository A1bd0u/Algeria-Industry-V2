import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { createSupabaseMock, filterValue, sessionRow, usersHandler, Handler } from './helpers/supabaseMock';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn(), sign: vi.fn(() => 'signed-token') },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

const USER_ID = '11111111-1111-4111-8111-111111111111';
const COMPANY_ID = '22222222-2222-4222-8222-222222222222';
const CATALOGUE_ID = '66666666-6666-4666-8666-666666666666';
const BASE = 'https://proj.supabase.co';
const ownPdf = `${BASE}/storage/v1/object/public/product-images/${USER_ID}/123-abc.pdf`;

const plan = (name: string): Handler => (q) => {
  if (q.columns?.includes('plan_ends_at')) return { data: { plan: name, plan_ends_at: null } };
};

describe('Catalogues PDF', () => {
  let app: express.Express;

  beforeEach(async () => {
    process.env.SUPABASE_URL = BASE;
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: USER_ID, token_version: 1 } as any);
  });

  it('publie un PDF déposé par le fournisseur', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow()),
      companies: plan('basic'),
      catalogues: (q) => {
        if (q.op === 'select') return { count: 2 };
        if (q.op === 'insert') return { data: { id: CATALOGUE_ID, ...q.payload[0] } };
      },
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).post('/api/catalogues').set('Cookie', ['token=t'])
      .send({ title: 'Catalogue pompes 2026', pdf_url: ownPdf, file_size: 2048 });
    expect(res.status).toBe(201);
    const insert = mock.queries.find((q) => q.table === 'catalogues' && q.op === 'insert');
    expect(insert?.payload[0]).toMatchObject({ company_id: COMPANY_ID, owner_id: USER_ID, pdf_url: ownPdf, status: 'published' });
  });

  it('refuse un fichier externe, une image ou le fichier d\'un autre compte', async () => {
    const mock = createSupabaseMock({ users: usersHandler(sessionRow()), companies: plan('pro') });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    for (const pdf_url of [
      'https://evil.example.com/c.pdf',
      ownPdf.replace('.pdf', '.png'),
      ownPdf.replace(USER_ID, '99999999-9999-4999-8999-999999999999'),
    ]) {
      const res = await request(app).post('/api/catalogues').set('Cookie', ['token=t']).send({ title: 'Catalogue', pdf_url });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CATALOGUE_FILE_INVALID');
    }
    expect(mock.queries.some((q) => q.table === 'catalogues' && q.op === 'insert')).toBe(false);
  });

  it('applique la limite de l\'offre gratuite (1 catalogue)', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow()),
      companies: plan('free'),
      catalogues: (q) => (q.op === 'select' ? { count: 1 } : undefined),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).post('/api/catalogues').set('Cookie', ['token=t']).send({ title: 'Catalogue', pdf_url: ownPdf });
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ code: 'CATALOGUE_LIMIT_REACHED', limit: 1 });
  });

  it('exige un KYC approuvé', async () => {
    const mock = createSupabaseMock({ users: usersHandler(sessionRow({ kyc_status: 'pending' })) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).post('/api/catalogues').set('Cookie', ['token=t']).send({ title: 'Catalogue', pdf_url: ownPdf });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('KYC_REQUIRED');
  });

  it('ne laisse pas retirer le catalogue d\'une autre entreprise', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow()),
      catalogues: (q) => (q.op === 'select' ? { data: { id: CATALOGUE_ID, company_id: 'other', pdf_url: ownPdf } } : undefined),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).delete(`/api/catalogues/${CATALOGUE_ID}`).set('Cookie', ['token=t']);
    expect(res.status).toBe(404);
    expect(mock.queries.some((q) => q.table === 'catalogues' && q.op === 'delete')).toBe(false);
  });

  it('retire son catalogue et le fichier', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow()),
      catalogues: (q) => (q.op === 'select' ? { data: { id: CATALOGUE_ID, company_id: COMPANY_ID, pdf_url: ownPdf } } : undefined),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).delete(`/api/catalogues/${CATALOGUE_ID}`).set('Cookie', ['token=t']);
    expect(res.status).toBe(204);
    expect(mock.storageBucket.remove).toHaveBeenCalledWith([`${USER_ID}/123-abc.pdf`]);
  });

  it('liste publique : uniquement les catalogues publiés', async () => {
    const mock = createSupabaseMock({ catalogues: () => ({ data: [] }) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).get(`/api/catalogues?company=${COMPANY_ID}`);
    expect(res.status).toBe(200);
    const q = mock.queries.find((x) => x.table === 'catalogues')!;
    expect(filterValue(q, 'eq', 'status')?.[1]).toBe('published');
    expect(filterValue(q, 'eq', 'company_id')?.[1]).toBe(COMPANY_ID);
    expect(q.columns).not.toContain('owner_id');
  });
});
