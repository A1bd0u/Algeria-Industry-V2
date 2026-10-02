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

  it('enregistre la vitrine : année, effectif, certifications, site et galerie', async () => {
    process.env.SUPABASE_URL = 'https://proj.supabase.co';
    const mock = mockWith(sessionRow({ id: OWNER_ID, role: 'fournisseur' }));
    const photo = `https://proj.supabase.co/storage/v1/object/public/product-images/${OWNER_ID}/usine.jpg`;

    const ok = await request(app).put(`/api/companies/${COMPANY_ID}`).set('Cookie', ['token=t']).send({
      name: 'Acme', founded_year: '1998', employees: '50-249', website: 'www.acme.dz',
      certifications: ['ISO 9001', 'ISO 9001', 'CE'], gallery: [photo],
    });
    expect(ok.status).toBe(200);
    const update = mock.queries.find((q) => q.table === 'companies' && q.op === 'update');
    expect(update?.payload).toMatchObject({
      founded_year: 1998, employees: '50-249', website: 'https://www.acme.dz',
      certifications: ['ISO 9001', 'CE'], gallery: [photo],
    });

    const badSite = await request(app).put(`/api/companies/${COMPANY_ID}`).set('Cookie', ['token=t'])
      .send({ name: 'Acme', website: 'javascript:alert(1)' });
    expect(badSite.status).toBe(400);

    const badGallery = await request(app).put(`/api/companies/${COMPANY_ID}`).set('Cookie', ['token=t'])
      .send({ name: 'Acme', gallery: ['https://evil.example/x.jpg'] });
    expect(badGallery.body.code).toBe('COMPANY_IMAGE_INVALID');
  });

  it('met en avant des avis réels : 4 ou 5 étoiles, entreprise vérifiée, auteur abrégé', async () => {
    const long = 'Livraison rapide et matériel conforme, je recommande ce fournisseur.';
    const mock = createSupabaseMock({
      reviews: () => ({
        data: [
          { id: 'r1', rating: 5, comment: long, users: { name: 'Karim Benali' }, company: { id: 'c1', name: 'Acme', status: 'approved' } },
          { id: 'r2', rating: 5, comment: long, users: { name: 'Sara' }, company: { id: 'c1', name: 'Acme', status: 'approved' } },
          { id: 'r3', rating: 4, comment: 'Trop court', users: { name: 'Ali' }, company: { id: 'c2', name: 'Beta', status: 'approved' } },
          { id: 'r4', rating: 5, comment: long, users: { name: 'Nadia' }, company: { id: 'c3', name: 'Gamma', status: 'unverified' } },
        ],
      }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).get('/api/companies/reviews/featured');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: 'r1', author: 'Karim B.', company: { id: 'c1', name: 'Acme' } });
    const q = mock.queries.find((x) => x.table === 'reviews');
    expect(q?.columns).not.toContain('email');
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
