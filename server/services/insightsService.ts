import { Request } from 'express';
import { getSupabase } from '../db/supabaseClient';
import { logger } from '../utils/logger';

// Analytique détaillée (parcours des visiteurs) et journal d'activité serveur,
// consultables uniquement dans la console admin. Aucune adresse IP n'est
// enregistrée : seul le pays (en-tête Cloudflare) est conservé.

export const EVENT_TYPES = [
  'pageview', 'page_leave', 'click', 'search', 'form_submit', 'outbound', 'download', 'error', 'custom',
] as const;
export type EventType = typeof EVENT_TYPES[number];

// Durée de conservation : 13 mois.
export const RETENTION_DAYS = 395;

// ——— Navigateur, système, appareil (sans dépendance externe) ———
export interface ClientInfo { browser: string; browserVersion: string | null; os: string; device: string }

export const parseUserAgent = (ua: string | undefined | null): ClientInfo => {
  const s = String(ua || '');
  const pick = (re: RegExp) => s.match(re)?.[1] || null;
  let browser = 'Autre';
  let browserVersion: string | null = null;
  const rules: [string, RegExp][] = [
    ['Edge', /Edg(?:e|A|iOS)?\/([\d.]+)/],
    ['Opera', /(?:OPR|Opera)\/([\d.]+)/],
    ['Samsung Internet', /SamsungBrowser\/([\d.]+)/],
    ['Yandex', /YaBrowser\/([\d.]+)/],
    ['Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/],
    ['Chrome', /(?:Chrome|CriOS)\/([\d.]+)/],
    ['Safari', /Version\/([\d.]+).*Safari/],
  ];
  for (const [name, re] of rules) {
    const v = pick(re);
    if (v) { browser = name; browserVersion = v.split('.')[0]; break; }
  }

  let os = 'Autre';
  if (/Windows NT 10/.test(s)) os = 'Windows 10/11';
  else if (/Windows/.test(s)) os = 'Windows';
  else if (/Android/.test(s)) os = `Android ${pick(/Android ([\d]+)/) || ''}`.trim();
  else if (/iPhone|iPad|iPod/.test(s)) os = `iOS ${pick(/OS (\d+)_/) || ''}`.trim();
  else if (/Mac OS X/.test(s)) os = 'macOS';
  else if (/CrOS/.test(s)) os = 'ChromeOS';
  else if (/Linux/.test(s)) os = 'Linux';

  let device = 'Ordinateur';
  if (/iPad|Tablet|SM-T|Tab(?!le)/.test(s) || (/Android/.test(s) && !/Mobile/.test(s))) device = 'Tablette';
  else if (/Mobi|iPhone|iPod|Android/.test(s)) device = 'Mobile';

  return { browser, browserVersion, os, device };
};

export const countryOf = (req: Request): string | null => {
  const c = req.headers['cf-ipcountry'];
  return typeof c === 'string' && /^[A-Z]{2}$/.test(c) && c !== 'XX' ? c : null;
};

// ——— Nettoyage des données envoyées par le navigateur ———
const SENSITIVE_PARAMS = /^(token|code|otp|password|pass|pwd|secret|key|api_key|email|mail|phone|tel|session|signature|sig)$/i;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
const LONG_DIGITS = /\d{6,}/g;

export const cleanText = (value: unknown, max = 160): string | null => {
  if (typeof value !== 'string') return null;
  const s = value.replace(/\s+/g, ' ').trim().replace(EMAIL, '[e-mail]').replace(LONG_DIGITS, '[n°]');
  return s ? s.slice(0, max) : null;
};

// Chemin interne avec ses paramètres, sans les paramètres sensibles.
export const cleanPath = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.startsWith('/')) return null;
  try {
    const url = new URL(value, 'http://x');
    for (const k of [...url.searchParams.keys()]) {
      if (SENSITIVE_PARAMS.test(k)) url.searchParams.set(k, '•');
    }
    const qs = url.searchParams.toString();
    return (url.pathname + (qs ? `?${qs}` : '')).slice(0, 300);
  } catch {
    return null;
  }
};

// Référent : origine et chemin seulement (pas de paramètres).
export const cleanReferrer = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return null;
    return (url.host + url.pathname).slice(0, 200);
  } catch {
    return null;
  }
};

const cleanDim = (value: unknown) => (typeof value === 'string' && /^\d{2,5}x\d{2,5}$/.test(value) ? value : null);
const cleanId = (value: unknown) => (typeof value === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(value) ? value : null);
const cleanInt = (value: unknown, max: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.min(Math.round(n), max) : null;
};

const cleanMetadata = (value: unknown): Record<string, string | number | boolean> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 12)) {
    if (!/^[a-zA-Z0-9_]{1,40}$/.test(k)) continue;
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'string') out[k] = cleanText(v, 200) || '';
  }
  return out;
};

export interface IncomingBatch {
  sessionId?: unknown;
  visitorId?: unknown;
  consent?: unknown;
  screen?: unknown;
  viewport?: unknown;
  language?: unknown;
  events?: unknown;
}

// Transforme un lot envoyé par le navigateur en lignes prêtes à insérer.
// Sans consentement, ni identifiant de visiteur ni compte ne sont rattachés.
export const buildEventRows = (req: Request, body: IncomingBatch, userId: string | null) => {
  const sessionId = cleanId(body.sessionId);
  if (!sessionId || !Array.isArray(body.events)) return [];
  const consent = body.consent === true;
  const client = parseUserAgent(req.headers['user-agent']);
  const country = countryOf(req);
  const base = {
    session_id: sessionId,
    visitor_id: consent ? cleanId(body.visitorId) : null,
    user_id: consent ? userId : null,
    consent,
    browser: client.browser,
    browser_version: client.browserVersion,
    os: client.os,
    device: client.device,
    screen: cleanDim(body.screen),
    viewport: cleanDim(body.viewport),
    language: typeof body.language === 'string' ? body.language.slice(0, 12) : null,
    country,
  };
  const now = Date.now();
  const rows = [];
  for (const raw of body.events.slice(0, 50)) {
    if (!raw || typeof raw !== 'object') continue;
    const e = raw as Record<string, unknown>;
    if (!EVENT_TYPES.includes(e.type as EventType)) continue;
    const path = cleanPath(e.path);
    if (!path) continue;
    // Horodatage du navigateur accepté s'il date de moins d'une heure.
    const ts = Number(e.ts);
    const at = Number.isFinite(ts) && ts <= now + 60_000 && ts >= now - 3_600_000 ? new Date(ts) : new Date(now);
    rows.push({
      ...base,
      created_at: at.toISOString(),
      event_type: e.type as EventType,
      path,
      page_title: cleanText(e.title, 160),
      referrer: cleanReferrer(e.referrer),
      label: cleanText(e.label, 120),
      target: e.type === 'outbound' || e.type === 'download' ? cleanReferrer(e.target) : cleanPath(e.target) || cleanText(e.target, 120),
      duration_ms: cleanInt(e.duration, 24 * 3_600_000),
      scroll_depth: cleanInt(e.scroll, 100),
      metadata: cleanMetadata(e.meta),
    });
  }
  return rows;
};

// ——— Écriture groupée (un insert toutes les 3 s au plus) ———
class BufferedWriter {
  private rows: any[] = [];
  private timer: NodeJS.Timeout | null = null;
  constructor(private table: string, private max = 2000) {}

  push(items: any[]) {
    if (!items.length) return;
    // Base indisponible : on garde au plus `max` lignes en mémoire.
    this.rows.push(...items);
    if (this.rows.length > this.max) this.rows.splice(0, this.rows.length - this.max);
    if (process.env.NODE_ENV === 'test') return;
    if (!this.timer) {
      this.timer = setTimeout(() => { this.timer = null; void this.flush(); }, 3000);
      this.timer.unref?.();
    }
  }

  async flush() {
    if (!this.rows.length) return 0;
    const batch = this.rows.splice(0, 500);
    try {
      const { error } = await getSupabase().from(this.table).insert(batch);
      if (error) logger.warn(`[Insights] Écriture ${this.table} impossible : ${error.message}`);
    } catch (err: any) {
      logger.warn(`[Insights] Écriture ${this.table} impossible : ${err?.message || err}`);
    }
    if (this.rows.length) return batch.length + (await this.flush());
    return batch.length;
  }

  pending() { return this.rows.length; }
}

export const eventWriter = new BufferedWriter('analytics_events');
export const activityWriter = new BufferedWriter('activity_logs');

export const flushInsights = async () => {
  await Promise.all([eventWriter.flush(), activityWriter.flush()]);
};

// ——— Journal d'activité ———
export type ActivityLevel = 'info' | 'warn' | 'error';

export interface ActivityEntry {
  level?: ActivityLevel;
  category: string;
  action: string;
  userId?: string | null;
  userRole?: string | null;
  status?: number;
  durationMs?: number;
  details?: Record<string, unknown>;
}

export const logActivity = (req: Request | null, entry: ActivityEntry) => {
  const client = req ? parseUserAgent(req.headers['user-agent']) : null;
  const user = req ? (req as any).user : null;
  activityWriter.push([{
    created_at: new Date().toISOString(),
    level: entry.level || 'info',
    category: entry.category,
    action: entry.action,
    user_id: entry.userId ?? user?.id ?? null,
    user_role: entry.userRole ?? user?.role ?? null,
    method: req?.method || null,
    path: req ? cleanPath(req.originalUrl) : null,
    status: entry.status ?? null,
    duration_ms: entry.durationMs ?? null,
    browser: client?.browser || null,
    os: client?.os || null,
    device: client?.device || null,
    country: req ? countryOf(req) : null,
    request_id: req ? String(req.headers['x-request-id'] || '') || null : null,
    details: entry.details || {},
  }]);
};

// Purge des données plus anciennes que la durée de conservation.
export const purgeInsights = async () => {
  const supabase = getSupabase();
  const before = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString();
  const [events, logs] = await Promise.all([
    supabase.from('analytics_events').delete().lt('created_at', before),
    supabase.from('activity_logs').delete().lt('created_at', before),
  ]);
  if (events.error) throw events.error;
  if (logs.error) throw logs.error;
  return { before };
};
