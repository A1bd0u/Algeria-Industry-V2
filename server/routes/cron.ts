import crypto from 'crypto';
import express from 'express';
import { logger } from '../utils/logger';
import { expireSubscriptions } from '../services/billingService';
import { notifyExpired, sendExpiryReminders } from '../services/notificationService';
import { sendOnboardingReminders } from '../services/onboardingReminders';
import { runDueFeeds } from '../services/integrations/feeds';
import { retryPendingDeliveries } from '../services/integrations/webhooks';

const router = express.Router();

// Comparaison en temps constant du secret partagé avec le planificateur.
const isAuthorized = (header: string | undefined, secret: string) => {
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header || '');
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
};

// Intégrations : flux catalogue arrivés à échéance et reprises des webhooks.
// Une étape en échec n'empêche pas l'autre.
const runIntegrations = async () => {
  const result: Record<string, unknown> = {};
  try {
    result.feeds = await runDueFeeds();
  } catch (err) {
    logger.error('[Cron] Flux catalogue en échec :', err);
    result.feeds = { error: true };
  }
  try {
    result.webhooks = await retryPendingDeliveries();
  } catch (err) {
    logger.error('[Cron] Reprises des webhooks en échec :', err);
    result.webhooks = { error: true };
  }
  return result;
};

// POST /api/cron/daily - Tâche quotidienne, appelée par Cloud Scheduler avec
// l'en-tête « Authorization: Bearer <CRON_SECRET> » :
//   1. passe en « expiré » les abonnements échus (retour à l'offre gratuite) ;
//   2. prévient les titulaires des abonnements qui viennent d'expirer ;
//   3. envoie les rappels J-30 et J-7 ;
//   4. envoie les relances d'accompagnement des fournisseurs (KYC, premier
//      produit, fiche incomplète).
// Chaque étape est idempotente : relancer la tâche ne renvoie aucun e-mail.
router.post('/daily', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ error: 'Tâche planifiée non configurée (CRON_SECRET).', code: 'CRON_DISABLED' });
  }
  if (!isAuthorized(req.get('authorization'), secret)) {
    return res.status(401).json({ error: 'Accès refusé.', code: 'CRON_UNAUTHORIZED' });
  }

  try {
    const expired = await expireSubscriptions();
    const expiredNotices = await notifyExpired();
    const reminders = await sendExpiryReminders();
    // Une relance en échec ne doit pas faire échouer la facturation.
    let onboarding: Record<string, number> | { error: true } = { error: true };
    try {
      onboarding = await sendOnboardingReminders();
    } catch (err) {
      logger.error('[Cron] Relances d\'accompagnement en échec :', err);
    }
    const integrations = await runIntegrations();
    const result = { expired, expiredNotices, ...reminders, onboarding, integrations };
    logger.info('[Cron] Tâche quotidienne terminée', result);
    return res.json(result);
  } catch (err) {
    logger.error('[Cron] Tâche quotidienne en échec :', err);
    return res.status(500).json({ error: 'La tâche quotidienne a échoué.', code: 'CRON_FAILED' });
  }
});

// POST /api/cron/integrations - Toutes les heures (même en-tête que la tâche
// quotidienne) : synchronisations horaires des flux et reprises des webhooks.
router.post('/integrations', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ error: 'Tâche planifiée non configurée (CRON_SECRET).', code: 'CRON_DISABLED' });
  }
  if (!isAuthorized(req.get('authorization'), secret)) {
    return res.status(401).json({ error: 'Accès refusé.', code: 'CRON_UNAUTHORIZED' });
  }
  const result = await runIntegrations();
  logger.info('[Cron] Intégrations traitées', result);
  return res.json(result);
});

export default router;
