import crypto from 'crypto';
import { getSupabase } from '../../db/supabaseClient';
import { logger } from '../../utils/logger';
import { decryptSecret } from '../../utils/totp';
import { safeRequest, SafeFetchError } from '../../utils/safeFetch';
import { signPayload } from './signature';
import type { WebhookEvent } from './entitlements';

// Envoi des webhooks : un enregistrement par envoi (journal visible par le
// client), première tentative immédiate, puis reprises espacées par la tâche
// planifiée. Au-delà de 6 tentatives l'envoi est abandonné ; après 20 échecs
// consécutifs le webhook est désactivé et son titulaire doit le réactiver.

export const RETRY_DELAYS_MINUTES = [1, 5, 30, 120, 360, 1440];
export const MAX_ATTEMPTS = RETRY_DELAYS_MINUTES.length;
const DISABLE_AFTER_FAILURES = 20;

type DeliveryRow = { id: string; webhook_id: string; event: string; payload: any; attempts: number };
type WebhookRow = { id: string; url: string; secret_enc: string; active: boolean; consecutive_failures: number };

export const buildEnvelope = (event: string, data: unknown, deliveryId: string) => ({
  id: deliveryId,
  event,
  created_at: new Date().toISOString(),
  data,
});

const attemptDelivery = async (delivery: DeliveryRow, webhook: WebhookRow) => {
  const supabase = getSupabase();
  const body = JSON.stringify(delivery.payload);
  const attempts = delivery.attempts + 1;
  let status = 0;
  let error: string | null = null;
  try {
    const secret = decryptSecret(webhook.secret_enc);
    const res = await safeRequest(webhook.url, {
      method: 'POST',
      body,
      timeoutMs: 10_000,
      maxBytes: 64_000,
      headers: {
        'Content-Type': 'application/json',
        'X-Industigo-Event': delivery.event,
        'X-Industigo-Delivery': delivery.id,
        'X-Industigo-Signature': signPayload(secret, body),
      },
    });
    status = res.status;
    if (status < 200 || status >= 300) error = `Réponse HTTP ${status}`;
  } catch (err: any) {
    error = err instanceof SafeFetchError ? err.message : 'Erreur réseau.';
  }

  const now = new Date();
  if (!error) {
    await supabase.from('webhook_deliveries')
      .update({ status: 'success', attempts, response_status: status, error: null, delivered_at: now.toISOString(), next_attempt_at: null })
      .eq('id', delivery.id);
    await supabase.from('webhooks')
      .update({ consecutive_failures: 0, last_delivery_at: now.toISOString(), last_status: status, updated_at: now.toISOString() })
      .eq('id', webhook.id);
    return true;
  }

  const giveUp = attempts >= MAX_ATTEMPTS;
  const next = giveUp ? null : new Date(now.getTime() + RETRY_DELAYS_MINUTES[attempts - 1] * 60_000).toISOString();
  await supabase.from('webhook_deliveries')
    .update({ status: giveUp ? 'failed' : 'pending', attempts, response_status: status || null, error: error.slice(0, 300), next_attempt_at: next })
    .eq('id', delivery.id);
  const failures = webhook.consecutive_failures + 1;
  const disable = failures >= DISABLE_AFTER_FAILURES;
  await supabase.from('webhooks')
    .update({
      consecutive_failures: failures,
      last_delivery_at: now.toISOString(),
      last_status: status || null,
      updated_at: now.toISOString(),
      ...(disable ? { active: false, disabled_reason: 'Désactivé après 20 échecs consécutifs.' } : {}),
    })
    .eq('id', webhook.id);
  return false;
};

// Crée l'envoi et tente une première livraison sans bloquer l'appelant.
const queue = async (webhook: WebhookRow, event: string, data: unknown) => {
  const supabase = getSupabase();
  const id = crypto.randomUUID();
  const payload = buildEnvelope(event, data, id);
  const { data: row, error } = await supabase
    .from('webhook_deliveries')
    // Reprise prévue dans une minute : la tâche planifiée ne doit pas doubler
    // la première tentative, faite tout de suite ci-dessous.
    .insert({ id, webhook_id: webhook.id, event, payload, status: 'pending', attempts: 0, next_attempt_at: new Date(Date.now() + 60_000).toISOString() })
    .select('id, webhook_id, event, payload, attempts')
    .single();
  if (error || !row) throw error || new Error('delivery');
  return { delivery: row as DeliveryRow, done: attemptDelivery(row as DeliveryRow, webhook) };
};

/**
 * Publie un événement vers les webhooks actifs d'un utilisateur abonnés à
 * cet événement. Ne lève jamais : une intégration en échec ne doit pas faire
 * échouer l'action d'origine (envoi d'un message, synchronisation…).
 */
export const emitEvent = async (userId: string, event: WebhookEvent, data: unknown) => {
  try {
    const supabase = getSupabase();
    const { data: hooks } = await supabase
      .from('webhooks')
      .select('id, url, secret_enc, active, consecutive_failures, events')
      .eq('user_id', userId)
      .eq('active', true);
    for (const hook of (hooks || []).filter((h: any) => Array.isArray(h.events) && h.events.includes(event))) {
      const { done } = await queue(hook as WebhookRow, event, data);
      done.catch((err) => logger.error('[Webhooks] Envoi en échec :', err));
    }
  } catch (err) {
    logger.error(`[Webhooks] Événement ${event} non publié :`, err);
  }
};

// Envoi de test depuis le tableau de bord : attend le résultat.
export const sendTestEvent = async (webhook: WebhookRow) => {
  const { delivery, done } = await queue(webhook, 'ping', { message: 'Test de votre webhook Industigo.' });
  const ok = await done;
  const { data } = await getSupabase()
    .from('webhook_deliveries')
    .select('id, status, response_status, error')
    .eq('id', delivery.id)
    .maybeSingle();
  return { ok, delivery: data };
};

// Reprises : appelé par la tâche planifiée.
export const retryPendingDeliveries = async (limit = 100) => {
  const supabase = getSupabase();
  const { data: due } = await supabase
    .from('webhook_deliveries')
    .select('id, webhook_id, event, payload, attempts, webhook:webhooks(id, url, secret_enc, active, consecutive_failures)')
    .eq('status', 'pending')
    .lte('next_attempt_at', new Date().toISOString())
    .order('next_attempt_at', { ascending: true })
    .limit(limit);
  let delivered = 0;
  let failed = 0;
  for (const row of due || []) {
    const webhook = (row as any).webhook as WebhookRow | null;
    if (!webhook || !webhook.active) {
      await supabase.from('webhook_deliveries').update({ status: 'failed', error: 'Webhook désactivé.', next_attempt_at: null }).eq('id', row.id);
      failed++;
      continue;
    }
    if (await attemptDelivery(row as DeliveryRow, webhook)) delivered++;
    else failed++;
  }
  return { retried: (due || []).length, delivered, failed };
};
