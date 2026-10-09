import express from 'express';
import { z } from 'zod';
import { getSupabase } from '../db/supabaseClient';
import { logger } from '../utils/logger';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireUuidParams } from '../middlewares/validateParams';
import { validate } from '../middlewares/validateMiddleware';
import { formLimiter } from '../middlewares/rateLimiter';
import { encryptSecret } from '../utils/totp';
import { SafeFetchError, validateOutboundUrl } from '../utils/safeFetch';
import { API_SCOPES, WEBHOOK_EVENTS, getEntitlements, type Entitlements } from '../services/integrations/entitlements';
import { generateApiKey, generateWebhookSecret } from '../services/integrations/signature';
import { sendTestEvent } from '../services/integrations/webhooks';
import { runFeed } from '../services/integrations/feeds';

// Tableau de bord « Intégrations » : flux catalogue, webhooks et clés d'API
// du compte connecté. Les secrets (clé d'API, secret de signature) ne sont
// affichés qu'une fois, à la création.

const router = express.Router();
router.use(requireAuth);

const MAX_WEBHOOKS = 5;
const MAX_API_KEYS = 5;
const MANUAL_RUN_COOLDOWN_MS = 5 * 60_000;

const forbidden = (res: express.Response, code: string, error: string) => res.status(403).json({ error, code });

const checkUrl = (res: express.Response, url: string) => {
  try {
    validateOutboundUrl(url);
    return true;
  } catch (err) {
    const e = err as SafeFetchError;
    res.status(400).json({ error: e.message, code: e.code || 'URL_INVALID' });
    return false;
  }
};

const rightsOf = async (req: express.Request): Promise<Entitlements> => {
  const cached = (req as any).entitlements as Entitlements | undefined;
  if (cached) return cached;
  const rights = await getEntitlements((req as any).user);
  (req as any).entitlements = rights;
  return rights;
};

// GET /api/integrations - État complet de la page Intégrations.
router.get('/', async (req, res, next) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    const rights = await rightsOf(req);
    const [{ data: feed }, { data: hooks }, { data: keys }] = await Promise.all([
      supabase.from('catalog_feeds')
        .select('id, url, format, frequency, deactivate_missing, active, last_run_at, last_status, last_report, next_run_at')
        .eq('user_id', user.id).maybeSingle(),
      supabase.from('webhooks')
        .select('id, url, events, active, consecutive_failures, disabled_reason, last_delivery_at, last_status, created_at')
        .eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('api_keys')
        .select('id, name, prefix, scopes, last_used_at, created_at')
        .eq('user_id', user.id).is('revoked_at', null).order('created_at', { ascending: true }),
    ]);
    return res.json({ rights, feed: feed || null, webhooks: hooks || [], apiKeys: keys || [] });
  } catch (err) {
    logger.error('Erreur GET /integrations :', err);
    next(err);
  }
});

// --- Flux catalogue -----------------------------------------------------------

const feedSchema = z.object({
  url: z.string().trim().url('Adresse invalide').max(1000),
  format: z.enum(['auto', 'csv', 'xlsx', 'json']).default('auto'),
  frequency: z.enum(['daily', 'hourly']).default('daily'),
  deactivate_missing: z.boolean().default(false),
  active: z.boolean().default(true),
});

// PUT /api/integrations/feed - Crée ou modifie le flux (un seul par compte).
router.put('/feed', validate(feedSchema), async (req, res, next) => {
  const user = (req as any).user;
  const body = req.body as z.infer<typeof feedSchema>;
  try {
    const rights = await rightsOf(req);
    if (!rights.feed) return forbidden(res, 'FEED_NOT_ALLOWED', "La synchronisation du catalogue est incluse dans les offres Basic et Pro, après vérification de l'entreprise.");
    if (body.frequency === 'hourly' && !rights.feedHourly) return forbidden(res, 'FEED_HOURLY_NOT_ALLOWED', 'La synchronisation toutes les heures est réservée à l\'offre Pro.');
    if (!checkUrl(res, body.url)) return;

    const supabase = getSupabase();
    const { data: current } = await supabase.from('catalog_feeds').select('id, url').eq('user_id', user.id).maybeSingle();
    const now = new Date().toISOString();
    const values = {
      url: body.url,
      format: body.format,
      frequency: body.frequency,
      deactivate_missing: body.deactivate_missing,
      active: body.active,
      company_id: user.company_id || null,
      updated_at: now,
      // Nouvelle adresse ou réactivation : première synchro au prochain passage.
      ...(!current || current.url !== body.url ? { next_run_at: now } : {}),
    };
    const query = current
      ? supabase.from('catalog_feeds').update(values).eq('id', current.id)
      : supabase.from('catalog_feeds').insert({ ...values, user_id: user.id, next_run_at: now });
    const { data, error } = await query
      .select('id, url, format, frequency, deactivate_missing, active, last_run_at, last_status, last_report, next_run_at')
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    logger.error('Erreur PUT /integrations/feed :', err);
    next(err);
  }
});

// DELETE /api/integrations/feed - Arrête la synchronisation (les produits restent).
router.delete('/feed', async (req, res, next) => {
  const user = (req as any).user;
  try {
    const { error } = await getSupabase().from('catalog_feeds').delete().eq('user_id', user.id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/integrations/feed/run - Synchronise maintenant (une fois toutes les 5 minutes).
router.post('/feed/run', async (req, res, next) => {
  const user = (req as any).user;
  try {
    const rights = await rightsOf(req);
    if (!rights.feed) return forbidden(res, 'FEED_NOT_ALLOWED', 'La synchronisation du catalogue n\'est pas incluse dans votre offre.');
    const supabase = getSupabase();
    const { data: feed } = await supabase
      .from('catalog_feeds')
      .select('id, user_id, url, format, frequency, deactivate_missing, active, last_run_at')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!feed) return res.status(404).json({ error: 'Aucun flux configuré.', code: 'FEED_NOT_FOUND' });
    if (feed.last_run_at && Date.now() - new Date(feed.last_run_at).getTime() < MANUAL_RUN_COOLDOWN_MS) {
      return res.status(429).json({ error: 'Une synchronisation vient d\'avoir lieu : réessayez dans quelques minutes.', code: 'FEED_COOLDOWN' });
    }
    const result = await runFeed(feed as any);
    return res.json(result);
  } catch (err) {
    logger.error('Erreur POST /integrations/feed/run :', err);
    next(err);
  }
});

// --- Webhooks -----------------------------------------------------------------

const webhookSchema = z.object({
  url: z.string().trim().url('Adresse invalide').max(1000),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1, 'Choisissez au moins un événement.'),
});

const webhookPatchSchema = z.object({
  url: z.string().trim().url('Adresse invalide').max(1000).optional(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).optional(),
  active: z.boolean().optional(),
});

const WEBHOOK_COLUMNS = 'id, url, events, active, consecutive_failures, disabled_reason, last_delivery_at, last_status, created_at';

// POST /api/integrations/webhooks - Ajoute un webhook ; renvoie son secret une seule fois.
router.post('/webhooks', formLimiter, validate(webhookSchema), async (req, res, next) => {
  const user = (req as any).user;
  const { url, events } = req.body as z.infer<typeof webhookSchema>;
  try {
    const rights = await rightsOf(req);
    if (!rights.webhooks) return forbidden(res, 'WEBHOOKS_NOT_ALLOWED', 'Les webhooks sont inclus dans l\'offre Pro.');
    if (events.some((e) => !rights.events.includes(e))) return res.status(400).json({ error: 'Événement non disponible pour votre compte.', code: 'WEBHOOK_EVENT_NOT_ALLOWED' });
    if (!checkUrl(res, url)) return;
    const supabase = getSupabase();
    const { count } = await supabase.from('webhooks').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    if ((count || 0) >= MAX_WEBHOOKS) return res.status(400).json({ error: `${MAX_WEBHOOKS} webhooks au maximum.`, code: 'WEBHOOK_LIMIT' });

    const secret = generateWebhookSecret();
    const { data, error } = await supabase
      .from('webhooks')
      .insert({ user_id: user.id, company_id: user.company_id || null, url, events, secret_enc: encryptSecret(secret) })
      .select(WEBHOOK_COLUMNS)
      .single();
    if (error) throw error;
    return res.status(201).json({ ...data, secret });
  } catch (err) {
    logger.error('Erreur POST /integrations/webhooks :', err);
    next(err);
  }
});

// PATCH /api/integrations/webhooks/:id - Modifie, active ou désactive.
router.patch('/webhooks/:id', requireUuidParams('id'), validate(webhookPatchSchema), async (req, res, next) => {
  const user = (req as any).user;
  const body = req.body as z.infer<typeof webhookPatchSchema>;
  try {
    const rights = await rightsOf(req);
    if (body.active && !rights.webhooks) return forbidden(res, 'WEBHOOKS_NOT_ALLOWED', 'Les webhooks sont inclus dans l\'offre Pro.');
    if (body.events?.some((e) => !rights.events.includes(e))) return res.status(400).json({ error: 'Événement non disponible pour votre compte.', code: 'WEBHOOK_EVENT_NOT_ALLOWED' });
    if (body.url && !checkUrl(res, body.url)) return;
    const changes: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() };
    if (body.active) Object.assign(changes, { consecutive_failures: 0, disabled_reason: null });
    const { data, error } = await getSupabase()
      .from('webhooks')
      .update(changes)
      .eq('id', req.params.id)
      .eq('user_id', user.id)
      .select(WEBHOOK_COLUMNS)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Webhook introuvable.', code: 'WEBHOOK_NOT_FOUND' });
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/integrations/webhooks/:id
router.delete('/webhooks/:id', requireUuidParams('id'), async (req, res, next) => {
  const user = (req as any).user;
  try {
    const { error } = await getSupabase().from('webhooks').delete().eq('id', req.params.id).eq('user_id', user.id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/integrations/webhooks/:id/test - Envoie un événement « ping ».
router.post('/webhooks/:id/test', requireUuidParams('id'), formLimiter, async (req, res, next) => {
  const user = (req as any).user;
  try {
    const { data: hook } = await getSupabase()
      .from('webhooks')
      .select('id, url, secret_enc, active, consecutive_failures')
      .eq('id', req.params.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!hook) return res.status(404).json({ error: 'Webhook introuvable.', code: 'WEBHOOK_NOT_FOUND' });
    return res.json(await sendTestEvent(hook as any));
  } catch (err) {
    logger.error('Erreur POST /integrations/webhooks/:id/test :', err);
    next(err);
  }
});

// GET /api/integrations/webhooks/:id/deliveries - 20 derniers envois.
router.get('/webhooks/:id/deliveries', requireUuidParams('id'), async (req, res, next) => {
  const user = (req as any).user;
  try {
    const supabase = getSupabase();
    const { data: hook } = await supabase.from('webhooks').select('id').eq('id', req.params.id).eq('user_id', user.id).maybeSingle();
    if (!hook) return res.status(404).json({ error: 'Webhook introuvable.', code: 'WEBHOOK_NOT_FOUND' });
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('id, event, status, attempts, response_status, error, created_at, delivered_at, next_attempt_at')
      .eq('webhook_id', hook.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// --- Clés d'API ---------------------------------------------------------------

const apiKeySchema = z.object({
  name: z.string().trim().min(2, 'Nom trop court').max(60),
  scopes: z.array(z.enum(API_SCOPES)).min(1, 'Choisissez au moins une permission.'),
});

// POST /api/integrations/api-keys - Crée une clé ; renvoyée en clair une seule fois.
router.post('/api-keys', formLimiter, validate(apiKeySchema), async (req, res, next) => {
  const user = (req as any).user;
  const { name, scopes } = req.body as z.infer<typeof apiKeySchema>;
  try {
    const rights = await rightsOf(req);
    if (!rights.apiKeys) return forbidden(res, 'API_KEYS_NOT_ALLOWED', 'L\'API est incluse dans l\'offre Pro.');
    if (scopes.some((s) => !rights.scopes.includes(s))) return res.status(400).json({ error: 'Permission non disponible pour votre compte.', code: 'API_SCOPE_NOT_ALLOWED' });
    const supabase = getSupabase();
    const { count } = await supabase.from('api_keys').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('revoked_at', null);
    if ((count || 0) >= MAX_API_KEYS) return res.status(400).json({ error: `${MAX_API_KEYS} clés actives au maximum.`, code: 'API_KEY_LIMIT' });

    const { key, prefix, hash } = generateApiKey();
    const { data, error } = await supabase
      .from('api_keys')
      .insert({ user_id: user.id, company_id: user.company_id || null, name, prefix, key_hash: hash, scopes })
      .select('id, name, prefix, scopes, last_used_at, created_at')
      .single();
    if (error) throw error;
    return res.status(201).json({ ...data, key });
  } catch (err) {
    logger.error('Erreur POST /integrations/api-keys :', err);
    next(err);
  }
});

// DELETE /api/integrations/api-keys/:id - Révoque une clé (immédiat).
router.delete('/api-keys/:id', requireUuidParams('id'), async (req, res, next) => {
  const user = (req as any).user;
  try {
    const { error } = await getSupabase()
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', user.id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
