-- Relances d'accompagnement des fournisseurs (tâche quotidienne) : une ligne
-- par relance envoyée, pour qu'aucune ne parte deux fois. Migration rejouable.
CREATE TABLE IF NOT EXISTS public.onboarding_reminders (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, kind)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'onboarding_reminders_kind_check') THEN
    ALTER TABLE public.onboarding_reminders ADD CONSTRAINT onboarding_reminders_kind_check
      CHECK (kind IN ('kyc', 'first_product', 'profile'));
  END IF;
END $$;

-- Réservée au backend (service_role).
ALTER TABLE public.onboarding_reminders ENABLE ROW LEVEL SECURITY;
