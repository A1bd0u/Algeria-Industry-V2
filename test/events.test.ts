import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { createSupabaseMock, sessionRow, usersHandler } from './helpers/supabaseMock';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn(), sign: vi.fn(() => 'signed-token') },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

const setup = (role: string) => {
  const mock = createSupabaseMock({
    users: usersHandler(sessionRow({ role })),
    events: (q) => {
      if (q.op === 'insert') return { data: { id: 'e1', ...q.payload[0] } };
      if (q.op === 'update') return { data: { id: 'e1', ...q.payload } };
    },
  });
  vi.mocked(getSupabase).mockReturnValue(mock.client as any);
  return mock;
};

describe('Événements (admin)', () => {
  let app: express.Express;
  const event = { title: 'Salon de l\'industrie', date: '2026-11-12T09:00:00.000Z', location: 'SAFEX, Alger', organizer: '', description: '' };

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: 'u', token_version: 1 } as any);
  });

  it('refuse la création à un non-admin', async () => {
    setup('fournisseur');
    const res = await request(app).post('/api/events').set('Cookie', ['token=t']).send(event);
    expect(res.status).toBe(403);
  });

  it('crée un événement et le journalise', async () => {
    const mock = setup('admin');
    const res = await request(app).post('/api/events').set('Cookie', ['token=t']).send(event);
    expect(res.status).toBe(201);
    const insert = mock.queries.find((q) => q.table === 'events' && q.op === 'insert');
    expect(insert?.payload[0]).toMatchObject({ title: event.title, location: 'SAFEX, Alger', organizer: null, description: null });
    expect(mock.queries.some((q) => q.table === 'audit_logs' && q.op === 'insert')).toBe(true);
  });

  it('refuse une date invalide', async () => {
    setup('admin');
    const res = await request(app).post('/api/events').set('Cookie', ['token=t']).send({ ...event, date: 'demain' });
    expect(res.status).toBe(400);
  });
});
