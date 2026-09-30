import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { sendNotificationEmail } from '../server/services/emailService';
import { createSupabaseMock, filterValue, Handler } from './helpers/supabaseMock';

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

vi.mock('../server/services/emailService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/services/emailService')>();
  return { ...original, sendNotificationEmail: vi.fn().mockResolvedValue({ success: true }) };
});

const SECRET = 'cron-secret-for-tests';
const DAY = 24 * 60 * 60 * 1000;

const activeSub = (daysLeft: number) => ({
  id: 'sub-1',
  invoice_number: 'AI-2026-0001',
  plan: 'pro',
  amount_dzd: 29900,
  user_id: 'u1',
  ends_at: new Date(Date.now() + daysLeft * DAY).toISOString(),
  user: { email: 'client@example.com', name: 'Client' },
});

describe('Tâche quotidienne', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(sendNotificationEmail).mockClear();
    process.env.CRON_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  const setup = (subscriptions: Handler) => {
    const mock = createSupabaseMock({ subscriptions, companies: () => ({ data: [] }) });
    vi.mocked(getSupabase).mockReturnValue(mock.client as any);
    return mock;
  };

  it('est désactivée sans CRON_SECRET', async () => {
    delete process.env.CRON_SECRET;
    setup(() => undefined);
    const res = await request(app).post('/api/cron/daily');
    expect(res.status).toBe(503);
  });

  it('refuse un secret absent ou erroné', async () => {
    setup(() => undefined);
    expect((await request(app).post('/api/cron/daily')).status).toBe(401);
    const wrong = await request(app).post('/api/cron/daily').set('Authorization', 'Bearer autre-secret');
    expect(wrong.status).toBe(401);
  });

  it('envoie un seul rappel à J-7 et marque aussi l\'étape J-30', async () => {
    const mock = setup((q) => {
      if (q.op === 'update' && q.payload?.status === 'expired') return { data: [] };
      if (q.op === 'update') return { data: { id: 'sub-1' } };
      if (q.op === 'select' && filterValue(q, 'eq', 'status')?.[1] === 'expired') return { data: [] };
      if (q.op === 'select' && filterValue(q, 'is', 'reminder_7_sent_at')) return { data: [activeSub(5)] };
      if (q.op === 'select') return { data: [] };
    });

    const res = await request(app).post('/api/cron/daily').set('Authorization', `Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ expired: 0, expiredNotices: 0, reminder7: 1, reminder30: 0 });

    const claim = mock.queries.find((q) => q.table === 'subscriptions' && q.op === 'update' && q.payload?.reminder_7_sent_at);
    expect(claim?.payload).toHaveProperty('reminder_30_sent_at');
    expect(filterValue(claim!, 'is', 'reminder_7_sent_at')?.[1]).toBeNull();

    expect(sendNotificationEmail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendNotificationEmail).mock.calls[0][0]).toBe('client@example.com');
  });

  it('n\'envoie rien si une autre exécution a déjà réservé le rappel', async () => {
    setup((q) => {
      if (q.op === 'update' && q.payload?.status === 'expired') return { data: [] };
      if (q.op === 'update') return { data: null };
      if (q.op === 'select' && filterValue(q, 'is', 'reminder_30_sent_at')) return { data: [activeSub(20)] };
      if (q.op === 'select') return { data: [] };
    });
    const res = await request(app).post('/api/cron/daily').set('Authorization', `Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(res.body.reminder30).toBe(0);
    expect(sendNotificationEmail).not.toHaveBeenCalled();
  });

  it('prévient les titulaires des abonnements qui viennent d\'expirer', async () => {
    setup((q) => {
      if (q.op === 'update' && q.payload?.status === 'expired') return { data: [{ company_id: 'c1' }] };
      if (q.op === 'update') return { data: { id: 'sub-1' } };
      if (q.op === 'select' && filterValue(q, 'eq', 'status')?.[1] === 'expired') return { data: [activeSub(-1)] };
      if (q.op === 'select') return { data: [] };
    });
    const res = await request(app).post('/api/cron/daily').set('Authorization', `Bearer ${SECRET}`);
    expect(res.body).toMatchObject({ expired: 1, expiredNotices: 1 });
    expect(vi.mocked(sendNotificationEmail).mock.calls[0][1].subject).toContain('expiré');
  });
});
