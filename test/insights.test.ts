import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createApp } from '../server';
import { getSupabase } from '../server/db/supabaseClient';
import { createSupabaseMock, sessionRow, usersHandler, filterValue } from './helpers/supabaseMock';
import {
  activityWriter, buildEventRows, cleanPath, eventWriter, parseUserAgent, purgeInsights,
} from '../server/services/insightsService';
import { describeRequest } from '../server/middlewares/activityLogger';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn(), sign: vi.fn(() => 'signed-token') },
}));

vi.mock('../server/db/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const SID = 'abcdef0123456789abcdef0123456789';
const VID = 'fedcba9876543210fedcba9876543210';

const fakeReq = (headers: Record<string, string> = {}) => ({ headers: { 'user-agent': CHROME, ...headers } }) as any;

const drain = async () => {
  // Vide les tampons sans écrire en base (le mock reçoit l'insert).
  await eventWriter.flush();
  await activityWriter.flush();
};

describe('Analytique détaillée', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await createApp();
    vi.mocked(jwt.verify).mockReturnValue({ id: 'x', token_version: 1 } as any);
    vi.mocked(getSupabase).mockReturnValue(createSupabaseMock().client as any);
    await drain();
  });

  describe('Navigateur et nettoyage', () => {
    it('reconnaît navigateur, système et appareil', () => {
      expect(parseUserAgent(CHROME)).toEqual({ browser: 'Chrome', browserVersion: '130', os: 'Windows 10/11', device: 'Ordinateur' });
      expect(parseUserAgent(IPHONE)).toMatchObject({ browser: 'Safari', os: 'iOS 17', device: 'Mobile' });
    });

    it('masque les paramètres sensibles des URL', () => {
      expect(cleanPath('/reset?token=abc&lang=fr')).toBe('/reset?token=%E2%80%A2&lang=fr');
      expect(cleanPath('https://evil.test/x')).toBeNull();
    });

    it('sans consentement : ni visiteur ni compte rattachés, e-mails masqués', () => {
      const rows = buildEventRows(fakeReq({ 'cf-ipcountry': 'DZ' }), {
        sessionId: SID,
        visitorId: VID,
        consent: false,
        screen: '1920x1080',
        events: [
          { type: 'click', path: '/products', ts: Date.now(), label: 'Écrire à contact@acme.dz' },
          { type: 'hack', path: '/x' },
          { type: 'pageview', path: 'javascript:alert(1)' },
        ],
      }, 'user-id');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        session_id: SID, visitor_id: null, user_id: null, consent: false,
        event_type: 'click', label: 'Écrire à [e-mail]', country: 'DZ', browser: 'Chrome', screen: '1920x1080',
      });
      expect(rows[0]).not.toHaveProperty('ip_address');
    });

    it('avec consentement : visiteur et compte rattachés', () => {
      const rows = buildEventRows(fakeReq(), {
        sessionId: SID, visitorId: VID, consent: true,
        events: [{ type: 'pageview', path: '/', ts: Date.now() }],
      }, 'user-id');
      expect(rows[0]).toMatchObject({ visitor_id: VID, user_id: 'user-id', consent: true });
    });
  });

  describe('Collecte', () => {
    it('enregistre un lot anonyme', async () => {
      const mock = createSupabaseMock();
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app)
        .post('/api/analytics/collect')
        .set('User-Agent', CHROME)
        .send({ sessionId: SID, consent: false, events: [{ type: 'pageview', path: '/companies', ts: Date.now() }] });
      expect(res.status).toBe(204);

      await drain();
      const insert = mock.queries.find((q) => q.table === 'analytics_events' && q.op === 'insert');
      expect(insert?.payload).toHaveLength(1);
      expect(insert?.payload[0]).toMatchObject({ path: '/companies', user_id: null, visitor_id: null });
    });

    it('ignore les robots', async () => {
      const mock = createSupabaseMock();
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);
      const res = await request(app)
        .post('/api/analytics/collect')
        .set('User-Agent', 'Googlebot/2.1')
        .send({ sessionId: SID, events: [{ type: 'pageview', path: '/', ts: Date.now() }] });
      expect(res.status).toBe(204);
      await drain();
      expect(mock.queries.some((q) => q.table === 'analytics_events')).toBe(false);
    });
  });

  describe('Console admin', () => {
    it('refuse un compte non admin', async () => {
      const mock = createSupabaseMock({ users: usersHandler(sessionRow({ role: 'acheteur' })) });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);
      const res = await request(app).get('/api/admin/insights/overview').set('Cookie', ['token=t']);
      expect(res.status).toBe(403);
    });

    it('calcule pages, parcours, navigateurs et temps passé', async () => {
      const t0 = Date.now() - 60_000;
      const at = (s: number) => new Date(t0 + s * 1000).toISOString();
      const base = { browser: 'Chrome', browser_version: '130', os: 'Windows 10/11', device: 'Ordinateur', country: 'DZ', consent: false };
      const events = [
        { ...base, session_id: 'a', created_at: at(0), event_type: 'pageview', path: '/' },
        { ...base, session_id: 'a', created_at: at(5), event_type: 'click', path: '/', label: 'Fournisseurs' },
        { ...base, session_id: 'a', created_at: at(6), event_type: 'page_leave', path: '/', duration_ms: 6000, scroll_depth: 80 },
        { ...base, session_id: 'a', created_at: at(6), event_type: 'pageview', path: '/companies?q=acier' },
        { ...base, session_id: 'b', created_at: at(10), event_type: 'pageview', path: '/', device: 'Mobile', browser: 'Safari' },
      ];
      const mock = createSupabaseMock({
        users: usersHandler(sessionRow({ role: 'admin' })),
        analytics_events: () => ({ data: events }),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app).get('/api/admin/insights/overview?days=7').set('Cookie', ['token=t']);
      expect(res.status).toBe(200);
      expect(res.body.totals).toMatchObject({ pageviews: 3, sessions: 2, bounceRate: 50, pagesPerSession: 1.5 });
      expect(res.body.pages[0]).toEqual({ name: '/', value: 2 });
      expect(res.body.flows).toEqual([{ name: '/ → /companies', value: 1 }]);
      expect(res.body.browsers).toEqual(expect.arrayContaining([{ name: 'Chrome', value: 1 }, { name: 'Safari', value: 1 }]));
      expect(res.body.timeOnPage[0]).toEqual({ name: '/', value: 6, samples: 1 });
      expect(res.body.clicks[0].name).toBe('Fournisseurs · /');
    });

    it('fiche par compte : profil, navigation et actions', async () => {
      const USER = '33333333-3333-4333-8333-333333333333';
      const mock = createSupabaseMock({
        users: usersHandler(sessionRow({ role: 'admin' }), () => ({ data: { id: USER, email: 'b@x.dz', role: 'acheteur' } })),
        analytics_events: () => ({ data: [{ id: 1, session_id: 's', created_at: new Date().toISOString(), event_type: 'pageview', path: '/products', device: 'Mobile' }] }),
        activity_logs: () => ({ data: [{ id: 1, action: 'Connexion' }] }),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);

      const res = await request(app).get(`/api/admin/insights/users/${USER}`).set('Cookie', ['token=t']);
      expect(res.status).toBe(200);
      expect(res.body.summary).toMatchObject({ sessions: 1, events: 1, actions: 1, topPages: [{ name: '/products', value: 1 }] });
      const q = mock.queries.find((x) => x.table === 'analytics_events');
      expect(filterValue(q!, 'eq', 'user_id')?.[1]).toBe(USER);
    });

    it("filtre le journal d'activité par niveau", async () => {
      const mock = createSupabaseMock({
        users: usersHandler(sessionRow({ role: 'admin' })),
        activity_logs: () => ({ data: [], count: 0 }),
      });
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);
      const res = await request(app).get('/api/admin/insights/activity?level=error').set('Cookie', ['token=t']);
      expect(res.status).toBe(200);
      const q = mock.queries.find((x) => x.table === 'activity_logs');
      expect(filterValue(q!, 'eq', 'level')?.[1]).toBe('error');
    });
  });

  describe("Journal d'activité", () => {
    it('nomme les actions connues', () => {
      expect(describeRequest('POST', '/api/auth/login')).toEqual({ category: 'auth', action: 'Connexion' });
      expect(describeRequest('PATCH', '/api/companies/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'))
        .toEqual({ category: 'companies', action: 'PATCH /api/companies/:id' });
    });

    it('enregistre une écriture en erreur sans corps de requête', async () => {
      const mock = createSupabaseMock();
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);
      await request(app).post('/api/favorites').set('User-Agent', IPHONE).send({ password: 'secret' });
      await drain();
      const insert = mock.queries.find((q) => q.table === 'activity_logs' && q.op === 'insert');
      expect(insert?.payload[0]).toMatchObject({ category: 'favorites', level: 'warn', status: 401, device: 'Mobile' });
      expect(JSON.stringify(insert?.payload)).not.toContain('secret');
    });

    it('purge au-delà de 13 mois', async () => {
      const mock = createSupabaseMock();
      vi.mocked(getSupabase).mockReturnValue(mock.client as any);
      await purgeInsights();
      const deletes = mock.queries.filter((q) => q.op === 'delete').map((q) => q.table).sort();
      expect(deletes).toEqual(['activity_logs', 'analytics_events']);
    });
  });
});
