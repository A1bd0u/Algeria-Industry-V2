import express from 'express';
import { getSupabase } from '../db/supabaseClient';
import { logger } from '../utils/logger';
import { verifyWebhookSignature } from '../services/chargily';
import { activateSubscription } from '../services/billingService';

// Webhooks des prestataires de paiement. Monté AVANT express.json() dans
// server.ts : la signature se vérifie sur le corps brut.
const router = express.Router();

// POST /api/payments/chargily/webhook
router.post('/chargily/webhook', express.raw({ type: '*/*', limit: '256kb' }), async (req, res) => {
  const raw: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
  const signature = req.get('signature');

  if (!verifyWebhookSignature(raw, signature)) {
    logger.warn('Chargily webhook: signature invalide');
    return res.status(403).json({ error: 'Signature invalide' });
  }

  let event: any;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Corps invalide' });
  }

  const eventId = String(event?.id || '');
  const type = String(event?.type || '');
  const checkout = event?.data || {};
  if (!eventId || !type) {
    return res.status(400).json({ error: 'Événement incomplet' });
  }

  try {
    const supabase = getSupabase();

    // Idempotence : un événement déjà reçu n'est jamais retraité.
    const { error: insertError } = await supabase
      .from('payment_events')
      .insert([{ id: eventId, provider: 'chargily', type, payload: event }]);
    if (insertError) {
      if (insertError.code === '23505') {
        return res.json({ received: true, duplicate: true });
      }
      throw insertError;
    }

    if (type !== 'checkout.paid') {
      return res.json({ received: true });
    }

    // La facture est retrouvée par l'identifiant du checkout enregistré à sa
    // création, et non par les métadonnées envoyées par le client.
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, invoice_number')
      .eq('checkout_id', String(checkout.id || ''))
      .maybeSingle();

    if (!sub) {
      logger.error('Chargily webhook: aucune facture pour ce checkout', { checkoutId: checkout.id, eventId });
      return res.json({ received: true });
    }

    await supabase.from('payment_events').update({ subscription_id: sub.id }).eq('id', eventId);

    const result = await activateSubscription(sub.id, {
      method: 'cib_edahabia',
      reference: String(checkout.id),
      expectedAmount: Number(checkout.amount),
    });

    if (result.ok === false) {
      logger.error('Chargily webhook: activation refusée', { invoice: sub.invoice_number, code: result.code });
    } else {
      logger.info('Abonnement activé par paiement en ligne', { invoice: sub.invoice_number });
    }
    return res.json({ received: true });
  } catch (err) {
    // 500 : le prestataire renverra l'événement plus tard. On retire la trace
    // d'idempotence pour que ce nouvel envoi soit bien traité.
    logger.error('Chargily webhook error', err);
    try {
      await getSupabase().from('payment_events').delete().eq('id', eventId);
    } catch {
      // ignoré
    }
    return res.status(500).json({ error: 'Erreur de traitement' });
  }
});

export default router;
