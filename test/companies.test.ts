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

const COMPANY_ID = '33333333-3333-4333-8333-333333333333';
const OWNER_ID = '44444444-4444-4444-8444-444444444444';

const mockWith = (session: any) => {
  const mock = createSupabaseMock({
    users: usersHandler(session),
    companies: (q) => {
      if (q.op === 'select') return { data: { owner_id: OWNER_ID } };
      if (q.op === 'update') return { data: { id: COMPANY_ID, name: q.payload.name } };
    },
  });
  vi.mocked(getSupabase).mockReturnValue(mock.client as any);
  return mock;
};

describe('Companies Ownership', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: 'x', token_version: 1 } as any);
  });

  it('devrait refuser la modification si l\'utilisateur n\'est pas propriétaire', async () => {
    mockWith(sessionRow({ id: '55555555-5555-4555-8555-555555555555' }));

    const res = await request(app)
      .put(`/api/companies/${COMPANY_ID}`)
      .set('Cookie', ['token=valid-token'])
      .send({ name: 'Updated Company' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Non autorisé à modifier cette entreprise');
  });

  it('devrait autoriser la modification si l\'utilisateur est propriétaire', async () => {
    mockWith(sessionRow({ id: OWNER_ID }));

    const res = await request(app)
      .put(`/api/companies/${COMPANY_ID}`)
      .set('Cookie', ['token=valid-token'])
      .send({ name: 'Updated Company' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Company');
  });

  it('devrait autoriser la modification si l\'utilisateur est admin', async () => {
    mockWith(sessionRow({ role: 'admin' }));

    const res = await request(app)
      .put(`/api/companies/${COMPANY_ID}`)
      .set('Cookie', ['token=valid-token'])
      .send({ name: 'Updated Company' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Company');
  });

  it('accepte un logo déposé par le titulaire et refuse une image externe', async () => {
    process.env.SUPABASE_URL = 'https://proj.supabase.co';
    const mock = mockWith(sessionRow({ id: OWNER_ID, role: 'fournisseur' }));
    const own = `https://proj.supabase.co/storage/v1/object/public/product-images/${OWNER_ID}/logo.png`;

    const ok = await request(app).put(`/api/companies/${COMPANY_ID}`).set('Cookie', ['token=t'])
      .send({ name: 'Acme', logo_url: own, banner_url: '' });
    expect(ok.status).toBe(200);
    const update = mock.queries.find((q) => q.table === 'companies' && q.op === 'update');
    expect(update?.payload).toMatchObject({ logo_url: own, banner_url: null });

    for (const url of [
      'https://evil.example/logo.png',
      'https://proj.supabase.co/storage/v1/object/public/product-images/someone-else/logo.png',
      'https://proj.supabase.co/storage/v1/object/public/kyc-documents/' + OWNER_ID + '/rc.pdf',
    ]) {
      const bad = await request(app).put(`/api/companies/${COMPANY_ID}`).set('Cookie', ['token=t'])
        .send({ name: 'Acme', logo_url: url });
      expect(bad.status, url).toBe(400);
      expect(bad.body.code).toBe('COMPANY_IMAGE_INVALID');
    }
  });

  it('devrait rejeter un identifiant qui n\'est pas un UUID', async () => {
    mockWith(sessionRow({ role: 'admin' }));

    const res = await request(app)
      .put('/api/companies/comp-123')
      .set('Cookie', ['token=valid-token'])
      .send({ name: 'Updated Company' });

    expect(res.status).toBe(400);
  });
});
