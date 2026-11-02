import express from 'express';
import rateLimit from 'express-rate-limit';
import { getSupabase } from '../db/supabaseClient';
import { getOptionalUser, verifyRole } from '../middlewares/authMiddleware';
import { isUuid } from '../middlewares/validateParams';
import { sharedStore } from '../utils/rateLimitStore';
import { getClientIp } from '../utils/clientIp';
import { logger } from '../utils/logger';
import { isBot } from '../services/audienceService';
import { EVENT_TYPES, buildEventRows, eventWriter } from '../services/insightsService';

// ——— Collecte (navigateur) : POST /api/analytics/collect ———
export const collectRouter = express.Router();

const collectLimiter = rateLimit({
  store: sharedStore('analytics-collect'),
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: (req) => getClientIp(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes.' },
});

collectRouter.post('/collect', collectLimiter, async (req, res) => {
  if (isBot(req)) return res.status(204).end();
  try {
    // Le compte n'est rattaché que si le visiteur a accepté les cookies de mesure.
    const user = req.body?.consent === true ? await getOptionalUser(req) : null;
    const rows = buildEventRows(req, req.body || {}, user?.id || null);
    eventWriter.push(rows);
    return res.status(204).end();
  } catch (err) {
    logger.warn('[Insights] Lot ignoré :', err);
    return res.status(204).end();
  }
});

// ——— Console admin : /api/admin/insights/* ———
export const adminInsightsRouter = express.Router();
adminInsightsRouter.use(verifyRole(['admin']));

const MAX_ROWS = 50_000;
const DAY = 86_400_000;

const sinceFrom = (q: any) => {
  const days = Math.min(Math.max(Number(q.days) || 7, 1), 395);
  return { days, since: new Date(Date.now() - days * DAY).toISOString() };
};

const top = (map: Map<string, number>, n = 10) =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, value]) => ({ name, value }));
const inc = (map: Map<string, number>, key: string | null | undefined, by = 1) => {
  const k = key || '—';
  map.set(k, (map.get(k) || 0) + by);
};
const median = (values: number[]) => {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const OVERVIEW_COLUMNS =
  'created_at, session_id, visitor_id, user_id, consent, event_type, path, referrer, label, target, browser, browser_version, os, device, screen, language, country, duration_ms, scroll_depth';

// GET /overview?days=7 : indicateurs, pages, parcours, technologies, clics.
adminInsightsRouter.get('/overview', async (req, res) => {
  const { days, since } = sinceFrom(req.query);
  try {
    const { data, error } = await getSupabase()
      .from('analytics_events')
      .select(OVERVIEW_COLUMNS)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(MAX_ROWS);
    if (error) throw error;
    const rows: any[] = data || [];

    const sessions = new Map<string, { first: number; last: number; pages: number; entry: string; exit: string; user: string | null }>();
    const visitors = new Set<string>();
    const users = new Set<string>();
    const pages = new Map<string, number>();
    const entries = new Map<string, number>();
    const exits = new Map<string, number>();
    const pageTime = new Map<string, number[]>();
    const scroll = new Map<string, number[]>();
    const clicks = new Map<string, number>();
    const searches = new Map<string, number>();
    const outbound = new Map<string, number>();
    const errors = new Map<string, number>();
    const referrers = new Map<string, number>();
    const browsers = new Map<string, number>();
    const browserVersions = new Map<string, number>();
    const oses = new Map<string, number>();
    const devices = new Map<string, number>();
    const screens = new Map<string, number>();
    const languages = new Map<string, number>();
    const countries = new Map<string, number>();
    const flows = new Map<string, number>();
    const perDay = new Map<string, { pageviews: number; sessions: Set<string>; clicks: number }>();
    const perHour = new Array(24).fill(0);
    const lastPageOfSession = new Map<string, string>();
    let pageviews = 0;
    let consented = 0;

    for (const r of rows) {
      const t = new Date(r.created_at).getTime();
      const day = r.created_at.slice(0, 10);
      if (!perDay.has(day)) perDay.set(day, { pageviews: 0, sessions: new Set(), clicks: 0 });
      const d = perDay.get(day)!;
      d.sessions.add(r.session_id);
      if (r.visitor_id) visitors.add(r.visitor_id);
      if (r.user_id) users.add(r.user_id);
      const pathOnly = String(r.path).split('?')[0];

      let s = sessions.get(r.session_id);
      if (!s) {
        s = { first: t, last: t, pages: 0, entry: pathOnly, exit: pathOnly, user: r.user_id };
        sessions.set(r.session_id, s);
        inc(browsers, r.browser);
        inc(browserVersions, r.browser ? `${r.browser} ${r.browser_version || ''}`.trim() : null);
        inc(oses, r.os);
        inc(devices, r.device);
        inc(screens, r.screen);
        inc(languages, r.language);
        inc(countries, r.country);
        if (r.consent) consented++;
      }
      s.last = Math.max(s.last, t);
      if (r.user_id) s.user = r.user_id;

      switch (r.event_type) {
        case 'pageview': {
          pageviews++;
          d.pageviews++;
          s.pages++;
          s.exit = pathOnly;
          inc(pages, pathOnly);
          perHour[new Date(t).getUTCHours()]++;
          if (r.referrer) inc(referrers, r.referrer.split('/')[0]);
          const prev = lastPageOfSession.get(r.session_id);
          if (prev && prev !== pathOnly) inc(flows, `${prev} → ${pathOnly}`);
          lastPageOfSession.set(r.session_id, pathOnly);
          break;
        }
        case 'page_leave':
          if (r.duration_ms != null) {
            if (!pageTime.has(pathOnly)) pageTime.set(pathOnly, []);
            pageTime.get(pathOnly)!.push(r.duration_ms);
          }
          if (r.scroll_depth != null) {
            if (!scroll.has(pathOnly)) scroll.set(pathOnly, []);
            scroll.get(pathOnly)!.push(r.scroll_depth);
          }
          break;
        case 'click':
          d.clicks++;
          inc(clicks, `${r.label || r.target || '—'} · ${pathOnly}`);
          break;
        case 'search':
          inc(searches, (r.label || '').toLowerCase());
          break;
        case 'outbound':
        case 'download':
          inc(outbound, r.target || r.label);
          break;
        case 'error':
          inc(errors, `${r.label || 'Erreur'} · ${pathOnly}`);
          break;
      }
    }

    for (const s of sessions.values()) {
      inc(entries, s.entry);
      inc(exits, s.exit);
    }
    const durations = [...sessions.values()].map((s) => s.last - s.first);
    const bounces = [...sessions.values()].filter((s) => s.pages <= 1).length;

    const timeOnPage = [...pageTime.entries()]
      .map(([name, v]) => ({ name, value: Math.round(median(v) / 1000), samples: v.length }))
      .sort((a, b) => b.samples - a.samples)
      .slice(0, 10);
    const scrollDepth = [...scroll.entries()]
      .map(([name, v]) => ({ name, value: Math.round(v.reduce((a, b) => a + b, 0) / v.length), samples: v.length }))
      .sort((a, b) => b.samples - a.samples)
      .slice(0, 10);

    return res.json({
      days,
      truncated: rows.length >= MAX_ROWS,
      totals: {
        events: rows.length,
        pageviews,
        sessions: sessions.size,
        visitors: visitors.size,
        users: users.size,
        consentRate: sessions.size ? Math.round((consented / sessions.size) * 100) : 0,
        avgSessionSeconds: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000) : 0,
        pagesPerSession: sessions.size ? Math.round((pageviews / sessions.size) * 10) / 10 : 0,
        bounceRate: sessions.size ? Math.round((bounces / sessions.size) * 100) : 0,
        errors: [...errors.values()].reduce((a, b) => a + b, 0),
      },
      daily: [...perDay.entries()].map(([day, v]) => ({ day, pageviews: v.pageviews, sessions: v.sessions.size, clicks: v.clicks })),
      hourly: perHour.map((value, hour) => ({ hour, value })),
      pages: top(pages, 15),
      entries: top(entries),
      exits: top(exits),
      flows: top(flows, 15),
      timeOnPage,
      scrollDepth,
      clicks: top(clicks, 15),
      searches: top(searches, 15),
      outbound: top(outbound),
      errors: top(errors),
      referrers: top(referrers),
      browsers: top(browsers),
      browserVersions: top(browserVersions),
      os: top(oses),
      devices: top(devices),
      screens: top(screens),
      languages: top(languages),
      countries: top(countries),
    });
  } catch (err) {
    logger.error('[Insights] GET /overview :', err);
    return res.status(500).json({ error: 'Analytique indisponible.' });
  }
});

// GET /events : flux brut filtrable (type, chemin, session, compte), paginé.
adminInsightsRouter.get('/events', async (req, res) => {
  const { since } = sinceFrom(req.query);
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000);
  const page = Math.max(Number(req.query.page) || 1, 1);
  try {
    let q = getSupabase()
      .from('analytics_events')
      .select('*', { count: 'exact' })
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    const type = String(req.query.type || '');
    if (EVENT_TYPES.includes(type as any)) q = q.eq('event_type', type);
    const path = String(req.query.path || '').trim();
    if (path) q = q.ilike('path', `%${path.replace(/[%_]/g, '')}%`);
    const sessionId = String(req.query.session || '');
    if (/^[A-Za-z0-9_-]{8,64}$/.test(sessionId)) q = q.eq('session_id', sessionId);
    const userId = String(req.query.user || '');
    if (isUuid(userId)) q = q.eq('user_id', userId);
    const { data, error, count } = await q;
    if (error) throw error;
    return res.json({ data: data || [], total: count || 0, page, limit });
  } catch (err) {
    logger.error('[Insights] GET /events :', err);
    return res.status(500).json({ error: 'Événements indisponibles.' });
  }
});

// GET /sessions : une ligne par visite (début, durée, pages, appareil, compte).
adminInsightsRouter.get('/sessions', async (req, res) => {
  const { since } = sinceFrom(req.query);
  try {
    let q = getSupabase()
      .from('analytics_events')
      .select('created_at, session_id, visitor_id, user_id, event_type, path, referrer, browser, browser_version, os, device, screen, country, language')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS);
    const userId = String(req.query.user || '');
    if (isUuid(userId)) q = q.eq('user_id', userId);
    const { data, error } = await q;
    if (error) throw error;

    const map = new Map<string, any>();
    for (const r of data || []) {
      let s = map.get(r.session_id);
      if (!s) {
        s = {
          sessionId: r.session_id, visitorId: r.visitor_id, userId: r.user_id,
          start: r.created_at, end: r.created_at, pageviews: 0, clicks: 0, events: 0,
          entry: null, exit: r.path, referrer: null,
          browser: r.browser ? `${r.browser} ${r.browser_version || ''}`.trim() : null,
          os: r.os, device: r.device, screen: r.screen, country: r.country, language: r.language,
        };
        map.set(r.session_id, s);
      }
      // Lignes triées de la plus récente à la plus ancienne.
      s.start = r.created_at;
      s.events++;
      if (r.user_id) s.userId = r.user_id;
      if (r.event_type === 'pageview') { s.pageviews++; s.entry = r.path; if (r.referrer) s.referrer = r.referrer; }
      if (r.event_type === 'click') s.clicks++;
    }
    const sessions = [...map.values()].slice(0, 500).map((s) => ({
      ...s,
      durationSeconds: Math.round((new Date(s.end).getTime() - new Date(s.start).getTime()) / 1000),
    }));

    // Comptes connus : nom et e-mail, pour l'admin uniquement.
    const ids = [...new Set(sessions.map((s) => s.userId).filter(Boolean))].slice(0, 200);
    const accounts: Record<string, any> = {};
    if (ids.length) {
      const { data: users } = await getSupabase().from('users').select('id, name, email, role, company').in('id', ids);
      for (const u of users || []) accounts[u.id] = u;
    }
    return res.json({ data: sessions.map((s) => ({ ...s, account: s.userId ? accounts[s.userId] || null : null })) });
  } catch (err) {
    logger.error('[Insights] GET /sessions :', err);
    return res.status(500).json({ error: 'Sessions indisponibles.' });
  }
});

// GET /sessions/:id : chronologie complète d'une visite.
adminInsightsRouter.get('/sessions/:id', async (req, res) => {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(req.params.id)) return res.status(400).json({ error: 'Session invalide.' });
  try {
    const { data, error } = await getSupabase()
      .from('analytics_events')
      .select('*')
      .eq('session_id', req.params.id)
      .order('created_at', { ascending: true })
      .limit(5000);
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    logger.error('[Insights] GET /sessions/:id :', err);
    return res.status(500).json({ error: 'Session indisponible.' });
  }
});

// GET /users/search?q= : retrouver un compte par nom, e-mail ou entreprise.
adminInsightsRouter.get('/users/search', async (req, res) => {
  const term = String(req.query.q || '').replace(/[%_,()]/g, '').trim().slice(0, 80);
  if (term.length < 2) return res.json({ data: [] });
  try {
    const { data, error } = await getSupabase()
      .from('users')
      .select('id, name, email, role, company')
      .or(`email.ilike.%${term}%,name.ilike.%${term}%,company.ilike.%${term}%`)
      .limit(20);
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    logger.error('[Insights] GET /users/search :', err);
    return res.status(500).json({ error: 'Recherche indisponible.' });
  }
});

// GET /users/:id : fiche détaillée d'un compte (profil, navigation, actions).
adminInsightsRouter.get('/users/:id', async (req, res) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Identifiant invalide', code: 'INVALID_ID' });
  const { since } = sinceFrom({ days: req.query.days || 90 });
  try {
    const supabase = getSupabase();
    const [user, events, logs] = await Promise.all([
      supabase.from('users').select('id, name, email, role, company, created_at, email_verified, kyc_status, mfa_enabled').eq('id', req.params.id).maybeSingle(),
      supabase.from('analytics_events').select('*').eq('user_id', req.params.id).gte('created_at', since)
        .order('created_at', { ascending: false }).limit(2000),
      supabase.from('activity_logs').select('*').eq('user_id', req.params.id).gte('created_at', since)
        .order('created_at', { ascending: false }).limit(1000),
    ]);
    if (user.error) throw user.error;
    if (!user.data) return res.status(404).json({ error: 'Compte introuvable.' });
    if (events.error) throw events.error;
    if (logs.error) throw logs.error;

    const pages = new Map<string, number>();
    const devices = new Map<string, number>();
    const sessions = new Set<string>();
    let lastSeen: string | null = null;
    for (const e of events.data || []) {
      sessions.add(e.session_id);
      if (!lastSeen) lastSeen = e.created_at;
      if (e.event_type === 'pageview') inc(pages, String(e.path).split('?')[0]);
      inc(devices, [e.device, e.os, e.browser].filter(Boolean).join(' · '));
    }
    return res.json({
      user: user.data,
      summary: {
        sessions: sessions.size,
        events: (events.data || []).length,
        actions: (logs.data || []).length,
        lastSeen,
        topPages: top(pages),
        devices: top(devices, 5),
      },
      events: events.data || [],
      activity: logs.data || [],
    });
  } catch (err) {
    logger.error('[Insights] GET /users/:id :', err);
    return res.status(500).json({ error: 'Fiche indisponible.' });
  }
});

// GET /activity : journal d'activité serveur filtrable.
adminInsightsRouter.get('/activity', async (req, res) => {
  const { since } = sinceFrom(req.query);
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000);
  const page = Math.max(Number(req.query.page) || 1, 1);
  try {
    let q = getSupabase()
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    const level = String(req.query.level || '');
    if (['info', 'warn', 'error'].includes(level)) q = q.eq('level', level);
    const category = String(req.query.category || '');
    if (/^[a-z0-9_-]{1,40}$/i.test(category)) q = q.eq('category', category);
    const userId = String(req.query.user || '');
    if (isUuid(userId)) q = q.eq('user_id', userId);
    const search = String(req.query.q || '').replace(/[%_,()]/g, '').trim().slice(0, 80);
    if (search) q = q.or(`action.ilike.%${search}%,path.ilike.%${search}%`);
    const { data, error, count } = await q;
    if (error) throw error;

    const ids = [...new Set((data || []).map((l: any) => l.user_id).filter(Boolean))];
    const accounts: Record<string, any> = {};
    if (ids.length) {
      const { data: users } = await getSupabase().from('users').select('id, name, email, role').in('id', ids);
      for (const u of users || []) accounts[u.id] = u;
    }
    return res.json({
      data: (data || []).map((l: any) => ({ ...l, account: l.user_id ? accounts[l.user_id] || null : null })),
      total: count || 0,
      page,
      limit,
    });
  } catch (err) {
    logger.error('[Insights] GET /activity :', err);
    return res.status(500).json({ error: "Journal d'activité indisponible." });
  }
});
