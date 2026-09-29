import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { createSupabaseMock, filterValue, Handler } from './helpers/supabaseMock';

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

const setup = (handlers: Record<string, Handler>) => {
  const mock = createSupabaseMock(handlers);
  vi.mocked(getSupabase).mockReturnValue(mock.client as any);
  return mock;
};

describe('GET /api/search', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
  });

  it('interroge l\'index avec la configuration française sans accents', async () => {
    const mock = setup({});
    const res = await request(app).get('/api/search').query({ q: 'Sécurité & pompes!' });
    expect(res.status).toBe(200);

    const products = mock.queries.find((q) => q.table === 'products');
    expect(filterValue(products!, 'textSearch')).toEqual(['fts', 'Sécurité:* & pompes:*', { config: 'fr_unaccent' }]);
    const companies = mock.queries.find((q) => q.table === 'companies');
    expect(filterValue(companies!, 'textSearch')?.[2]).toEqual({ config: 'fr_unaccent' });
  });

  it('ne renvoie que les produits publiés', async () => {
    const mock = setup({});
    await request(app).get('/api/search').query({ q: 'pompe', type: 'products' });
    const products = mock.queries.find((q) => q.table === 'products');
    expect(filterValue(products!, 'in', 'status')?.[1]).toEqual(['Actif', 'active']);
  });

  it('se replie sur une recherche par nom si la recherche plein texte échoue', async () => {
    let calls = 0;
    const mock = setup({
      products: (q) => {
        calls++;
        if (filterValue(q, 'textSearch')) return { data: null, error: { code: '42704', message: 'text search configuration does not exist' } };
        return { data: [{ id: 'p1', name: 'Pompe', category: 'Pompes', created_at: '2026-01-01' }] };
      },
    });
    const res = await request(app).get('/api/search').query({ q: 'pompe', type: 'products' });
    expect(res.status).toBe(200);
    expect(calls).toBe(2);
    expect(res.body.results.products).toHaveLength(1);
    const fallback = mock.queries.filter((q) => q.table === 'products')[1];
    expect(filterValue(fallback, 'ilike', 'name')?.[1]).toBe('%pompe%');
    expect(filterValue(fallback, 'in', 'status')?.[1]).toEqual(['Actif', 'active']);
  });
});
