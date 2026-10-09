import { getSupabase } from '../../db/supabaseClient';
import { logger } from '../../utils/logger';
import { safeRequest, SafeFetchError } from '../../utils/safeFetch';
import { parseCsv, rowsFromTable } from '../../../src/lib/productImport';
import { getCompanyPlan } from '../billingService';
import { entitlementsFor } from './entitlements';
import { MAX_SYNC_ROWS, syncProducts, type SyncReport } from './catalogSync';
import { emitEvent } from './webhooks';

// Flux catalogue : le fournisseur indique l'adresse d'un fichier que son ERP
// exporte (CSV, Excel ou JSON). La plateforme le relit chaque jour (Basic) ou
// chaque heure (Pro) et synchronise les produits par référence article.

export const MAX_FEED_BYTES = 5_000_000;

export type FeedFormat = 'auto' | 'csv' | 'xlsx' | 'json';

export class FeedError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const detectFormat = (format: FeedFormat, url: string, contentType: string, body: Buffer): Exclude<FeedFormat, 'auto'> => {
  if (format !== 'auto') return format;
  const path = new URL(url).pathname.toLowerCase();
  if (path.endsWith('.xlsx') || contentType.includes('spreadsheetml') || body.subarray(0, 2).toString() === 'PK') return 'xlsx';
  if (path.endsWith('.json') || contentType.includes('json')) return 'json';
  const start = body.subarray(0, 200).toString('utf8').replace(/^﻿/, '').trimStart();
  if (start.startsWith('[') || start.startsWith('{')) return 'json';
  return 'csv';
};

// JSON : tableau d'objets, ou objet { products: [...] } / { items: [...] }.
// Les clés sont reconnues comme les en-têtes d'un fichier CSV.
export const tableFromJson = (input: unknown): unknown[][] => {
  const list = Array.isArray(input) ? input
    : input && typeof input === 'object'
      ? ((input as any).products ?? (input as any).items ?? (input as any).data)
      : null;
  if (!Array.isArray(list)) throw new FeedError('FEED_JSON_SHAPE', 'JSON attendu : un tableau de produits, ou { "products": [...] }.');
  const headers = Array.from(new Set(list.flatMap((item) => (item && typeof item === 'object' ? Object.keys(item) : []))));
  return [headers, ...list.map((item: any) => headers.map((h) => (item && typeof item === 'object' ? item[h] : undefined)))];
};

export const parseFeedBody = async (format: Exclude<FeedFormat, 'auto'>, body: Buffer): Promise<unknown[][]> => {
  if (format === 'xlsx') {
    try {
      const { readSheet } = await import('read-excel-file/node');
      return (await readSheet(body)) as unknown[][];
    } catch {
      throw new FeedError('FEED_XLSX_INVALID', 'Fichier Excel illisible.');
    }
  }
  const text = body.toString('utf8');
  if (format === 'json') {
    try {
      return tableFromJson(JSON.parse(text.replace(/^﻿/, '')));
    } catch (err) {
      if (err instanceof FeedError) throw err;
      throw new FeedError('FEED_JSON_INVALID', 'JSON invalide.');
    }
  }
  return parseCsv(text);
};

export const rowsFromFeedTable = (table: unknown[][]) => {
  const parsed = rowsFromTable(table, MAX_SYNC_ROWS);
  if ('error' in parsed) {
    const messages: Record<string, string> = {
      EMPTY_FILE: 'Le fichier est vide.',
      NAME_COLUMN_MISSING: 'Colonne « nom » introuvable dans le fichier.',
      TOO_MANY_ROWS: `${MAX_SYNC_ROWS} produits au maximum par fichier.`,
    };
    throw new FeedError(`FEED_${parsed.error}`, messages[parsed.error]);
  }
  if (parsed.mapping.reference === undefined) {
    throw new FeedError('FEED_REFERENCE_COLUMN_MISSING', 'Colonne « référence » introuvable : elle sert à reconnaître chaque produit d\'une synchronisation à l\'autre.');
  }
  return parsed.results;
};

type FeedRow = {
  id: string; user_id: string; url: string; format: FeedFormat; frequency: 'daily' | 'hourly';
  deactivate_missing: boolean; active: boolean;
};

const nextRun = (frequency: 'daily' | 'hourly', from = new Date()) =>
  new Date(from.getTime() + (frequency === 'hourly' ? 60 : 24 * 60) * 60_000).toISOString();

/** Télécharge le flux, synchronise le catalogue et enregistre le compte rendu. */
export const runFeed = async (feed: FeedRow) => {
  const supabase = getSupabase();
  const startedAt = new Date();
  let report: (SyncReport & { error?: string; errorCode?: string }) | { error: string; errorCode: string };
  let status: 'success' | 'partial' | 'failed';
  let frequency = feed.frequency;

  try {
    const { data: owner } = await supabase
      .from('users')
      .select('id, role, company_id, email_verified, kyc_status')
      .eq('id', feed.user_id)
      .maybeSingle();
    if (!owner) throw new FeedError('FEED_OWNER_MISSING', 'Compte introuvable.');
    const rights = entitlementsFor(
      { role: owner.role, emailVerified: Boolean(owner.email_verified), kycStatus: owner.kyc_status || 'none' },
      await getCompanyPlan(owner.company_id),
    );
    if (!rights.feed) throw new FeedError('FEED_NOT_ALLOWED', 'Votre offre ne comprend plus la synchronisation du catalogue.');
    if (frequency === 'hourly' && !rights.feedHourly) frequency = 'daily';

    const res = await safeRequest(feed.url, { timeoutMs: 30_000, maxBytes: MAX_FEED_BYTES, headers: { Accept: 'text/csv, application/json, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, */*' } });
    if (res.status < 200 || res.status >= 300) throw new FeedError('FEED_HTTP', `Le serveur du fichier a répondu ${res.status}.`);
    const format = detectFormat(feed.format, feed.url, String(res.headers['content-type'] || ''), res.body);
    const rows = rowsFromFeedTable(await parseFeedBody(format, res.body));
    const sync = await syncProducts({ id: owner.id, role: owner.role, company_id: owner.company_id }, rows, { deactivateMissing: feed.deactivate_missing });
    report = sync;
    status = sync.rejected > 0 || sync.skippedPlanLimit > 0 ? 'partial' : 'success';
  } catch (err: any) {
    const known = err instanceof FeedError || err instanceof SafeFetchError;
    if (!known) logger.error('[Flux catalogue] Erreur inattendue :', err);
    report = { error: known ? err.message : 'La synchronisation a échoué.', errorCode: known ? err.code : 'FEED_FAILED' };
    status = 'failed';
  }

  await supabase.from('catalog_feeds').update({
    last_run_at: startedAt.toISOString(),
    last_status: status,
    last_report: report,
    next_run_at: nextRun(frequency, startedAt),
    frequency,
    updated_at: new Date().toISOString(),
  }).eq('id', feed.id);

  await emitEvent(feed.user_id, 'catalog.sync_completed', { status, ran_at: startedAt.toISOString(), report });
  return { status, report };
};

// Flux arrivés à échéance : appelé par la tâche planifiée.
export const runDueFeeds = async (limit = 20) => {
  const { data: due } = await getSupabase()
    .from('catalog_feeds')
    .select('id, user_id, url, format, frequency, deactivate_missing, active')
    .eq('active', true)
    .lte('next_run_at', new Date().toISOString())
    .order('next_run_at', { ascending: true })
    .limit(limit);
  const counts = { ran: 0, success: 0, partial: 0, failed: 0 };
  for (const feed of due || []) {
    const { status } = await runFeed(feed as FeedRow);
    counts.ran++;
    counts[status]++;
  }
  return counts;
};

