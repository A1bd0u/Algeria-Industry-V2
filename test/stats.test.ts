import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { resetPublicStatsCache } from '../server/routes/stats';
import { createSupabaseMock, filterValue } from './helpers/supabaseMock';

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

describe('Statistiques publiques', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    resetPublicStatsCache();
  });

  it('compte les entreprises approuvées et les produits publiés', async () => {
    const mock = createSupabaseMock({
      companies: () => ({ count: 7 }),
      products: () => ({ count: 42 }),
    });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);

    const res = await request(app).get('/api/stats/public');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ verifiedCompanies: 7, publishedProducts: 42 });

    const companies = mock.queries.find((q) => q.table === 'companies');
    expect(filterValue(companies!, 'eq', 'status')?.[1]).toBe('approved');
    const products = mock.queries.find((q) => q.table === 'products');
    expect(filterValue(products!, 'in', 'status')?.[1]).toEqual(['Actif', 'active']);
  });

  it('sert le cache sans refaire de requête', async () => {
    const mock = createSupabaseMock({ companies: () => ({ count: 1 }), products: () => ({ count: 2 }) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    await request(app).get('/api/stats/public');
    const before = mock.queries.length;
    const res = await request(app).get('/api/stats/public');
    expect(res.body.publishedProducts).toBe(2);
    expect(mock.queries.length).toBe(before);
  });
});
