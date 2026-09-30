-- ==============================================================================
-- MIGRATION : rappels d'expiration des abonnements
-- ------------------------------------------------------------------------------
-- La tâche planifiée quotidienne (POST /api/cron/daily) prévient le titulaire
-- 30 jours puis 7 jours avant l'échéance, et à l'expiration. Ces horodatages
-- garantissent qu'un rappel n'est envoyé qu'une fois, même si la tâche est
-- relancée ou a manqué un jour.
-- ==============================================================================

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS reminder_30_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS reminder_7_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS expired_notice_sent_at TIMESTAMP WITH TIME ZONE;

-- Recherche des abonnements actifs proches de l'échéance.
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_ends_at
  ON public.subscriptions(ends_at)
  WHERE status = 'active';
