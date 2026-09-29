import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { createSupabaseMock, sessionRow, usersHandler, Handler } from './helpers/supabaseMock';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn(), sign: vi.fn(() => 'signed-token') },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

const COMPANY_ID = '55555555-5555-4555-8555-555555555555';

const setup = (favorites?: Handler) => {
  const mock = createSupabaseMock({ users: usersHandler(sessionRow({ role: 'acheteur' })), ...(favorites ? { favorites } : {}) });
  vi.mocked(getSupabase).mockReturnValue(mock.client as any);
  return mock;
};

describe('Favoris', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: 'u', token_version: 1 } as any);
  });

  it('refuse un type ou un identifiant invalide', async () => {
    const mock = setup();
    const bad = await request(app).post('/api/favorites').set('Cookie', ['token=t']).send({ item_type: 'user', item_id: COMPANY_ID });
    expect(bad.status).toBe(400);
    const badId = await request(app).post('/api/favorites').set('Cookie', ['token=t']).send({ item_type: 'company', item_id: '1 OR 1=1' });
    expect(badId.status).toBe(400);
    expect(mock.queries.some((q) => q.table === 'favorites' && q.op === 'insert')).toBe(false);
  });

  it('ne crée pas de doublon', async () => {
    const mock = setup((q) => {
      if (q.op === 'select') return { data: { id: 'f1', item_type: 'company', item_id: COMPANY_ID } };
    });
    const res = await request(app).post('/api/favorites').set('Cookie', ['token=t']).send({ item_type: 'company', item_id: COMPANY_ID });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('f1');
    expect(mock.queries.some((q) => q.table === 'favorites' && q.op === 'insert')).toBe(false);
  });

  it('suit une entreprise', async () => {
    const mock = setup((q) => {
      if (q.op === 'insert') return { data: { id: 'f2', ...q.payload[0] } };
    });
    const res = await request(app).post('/api/favorites').set('Cookie', ['token=t']).send({ item_type: 'company', item_id: COMPANY_ID });
    expect(res.status).toBe(200);
    const insert = mock.queries.find((q) => q.table === 'favorites' && q.op === 'insert');
    expect(insert?.payload[0]).toMatchObject({ item_type: 'company', item_id: COMPANY_ID });
  });

  it('refuse une suppression avec un identifiant invalide', async () => {
    setup();
    const res = await request(app).delete('/api/favorites/item/abc').set('Cookie', ['token=t']);
    expect(res.status).toBe(400);
  });
});
