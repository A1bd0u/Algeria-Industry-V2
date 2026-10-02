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

const COMPANY_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_COMPANY = '33333333-3333-4333-8333-333333333333';
const PRODUCT_ID = '44444444-4444-4444-8444-444444444444';
const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0';

const companiesHandler = (plan: string): Handler => (q) => {
  if (q.columns?.includes('plan_ends_at')) return { data: { plan, plan_ends_at: null } };
  if (q.columns?.includes('owner_id')) return { data: { owner_id: 'owner-1' } };
  return { data: { id: filterValue(q, 'eq', 'id')?.[1] } };
};

describe('Mesure d\'audience', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
  });

  it('enregistre une vue produit rattachée à l\'entreprise du produit', async () => {
    const mock = createSupabaseMock({
      products: () => ({ data: { id: PRODUCT_ID, company_id: COMPANY_ID } }),
      audience_events: () => ({ data: null }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).post('/api/stats/track').set('User-Agent', BROWSER).send({ type: 'product_view', id: PRODUCT_ID });
    expect(res.status).toBe(204);
    const insert = mock.queries.find((q) => q.table === 'audience_events' && q.op === 'insert');
    expect(insert?.payload[0]).toMatchObject({ type: 'product_view', company_id: COMPANY_ID, product_id: PRODUCT_ID });
    // Empreinte anonyme : ni IP ni user-agent en clair.
    expect(insert?.payload[0].visitor_hash).toMatch(/^[0-9a-f]{32}$/);
  });

  it('ignore les robots, les types inconnus et les doublons du jour', async () => {
    const mock = createSupabaseMock({
      companies: () => ({ data: { id: COMPANY_ID } }),
      audience_events: () => ({ error: { code: '23505' } }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const bot = await request(app).post('/api/stats/track').set('User-Agent', 'Googlebot/2.1').send({ type: 'company_view', id: COMPANY_ID });
    expect(bot.status).toBe(204);
    expect(mock.queries.some((q) => q.table === 'audience_events')).toBe(false);

    const bad = await request(app).post('/api/stats/track').set('User-Agent', BROWSER).send({ type: 'fake', id: COMPANY_ID });
    expect(bad.status).toBe(400);

    const dup = await request(app).post('/api/stats/track').set('User-Agent', BROWSER).send({ type: 'company_view', id: COMPANY_ID });
    expect(dup.status).toBe(204);
  });
});

describe('Statistiques fournisseur', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: 'u', token_version: 1 } as any);
  });

  const today = new Date().toISOString().slice(0, 10);
  const events = [
    { type: 'company_view', product_id: null, day: today },
    { type: 'company_view', product_id: null, day: today },
    { type: 'product_view', product_id: PRODUCT_ID, day: today },
    { type: 'whatsapp_click', product_id: null, day: today },
  ];

  it('ne renvoie rien de détaillé en offre gratuite', async () => {
    const mock = createSupabaseMock({ users: usersHandler(sessionRow()), companies: companiesHandler('free') });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).get('/api/stats/supplier').set('Cookie', ['token=t']);
    expect(res.status).toBe(200);
    expect(res.body.level).toBe('none');
    expect(res.body.totals).toBeUndefined();
    expect(mock.queries.some((q) => q.table === 'audience_events')).toBe(false);
  });

  it('limite l\'offre Basic aux vues', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow()),
      companies: companiesHandler('basic'),
      audience_events: () => ({ data: events }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).get('/api/stats/supplier?days=7').set('Cookie', ['token=t']);
    expect(res.status).toBe(200);
    expect(res.body.level).toBe('basic');
    expect(res.body.totals).toEqual({ companyViews: 2, productViews: 1 });
    expect(res.body.daily).toHaveLength(7);
    expect(res.body.topProducts).toBeUndefined();
    const query = mock.queries.find((q) => q.table === 'audience_events');
    expect(filterValue(query!, 'eq', 'company_id')?.[1]).toBe(COMPANY_ID);
  });

  it('donne le détail complet en Pro', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow()),
      companies: companiesHandler('pro'),
      audience_events: () => ({ data: events }),
      messages: () => ({ data: [{ sender_id: 'a' }, { sender_id: 'a' }, { sender_id: 'b' }] }),
      products: () => ({ data: [{ id: PRODUCT_ID, name: 'Pompe' }] }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    const res = await request(app).get('/api/stats/supplier').set('Cookie', ['token=t']);
    expect(res.body.level).toBe('advanced');
    expect(res.body.totals).toMatchObject({ companyViews: 2, productViews: 1, whatsappClicks: 1, contacts: 2 });
    expect(res.body.topProducts).toEqual([{ id: PRODUCT_ID, name: 'Pompe', views: 1 }]);
  });

  it('ne compte jamais une autre entreprise que celle du compte', async () => {
    const mock = createSupabaseMock({
      users: usersHandler(sessionRow({ company_id: OTHER_COMPANY })),
      companies: companiesHandler('pro'),
      audience_events: () => ({ data: [] }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    await request(app).get(`/api/stats/supplier?company=${COMPANY_ID}`).set('Cookie', ['token=t']);
    const query = mock.queries.find((q) => q.table === 'audience_events');
    expect(filterValue(query!, 'eq', 'company_id')?.[1]).toBe(OTHER_COMPANY);
  });
});
