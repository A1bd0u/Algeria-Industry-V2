import crypto from 'crypto';
import express from 'express';
import { logger } from '../utils/logger';
import { expireSubscriptions } from '../services/billingService';
import { notifyExpired, sendExpiryReminders } from '../services/notificationService';

const router = express.Router();

// Comparaison en temps constant du secret partagé avec le planificateur.
const isAuthorized = (header: string | undefined, secret: string) => {
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header || '');
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
};

// POST /api/cron/daily - Tâche quotidienne, appelée par Cloud Scheduler avec
// l'en-tête « Authorization: Bearer <CRON_SECRET> » :
//   1. passe en « expiré » les abonnements échus (retour à l'offre gratuite) ;
//   2. prévient les titulaires des abonnements qui viennent d'expirer ;
//   3. envoie les rappels J-30 et J-7.
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
    const result = { expired, expiredNotices, ...reminders };
    logger.info('[Cron] Tâche quotidienne terminée', result);
    return res.json(result);
  } catch (err) {
    logger.error('[Cron] Tâche quotidienne en échec :', err);
    return res.status(500).json({ error: 'La tâche quotidienne a échoué.', code: 'CRON_FAILED' });
  }
});

export default router;
