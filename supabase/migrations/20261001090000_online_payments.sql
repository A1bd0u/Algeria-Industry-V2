-- ==============================================================================
-- MIGRATION : paiement côté client
-- ------------------------------------------------------------------------------
-- * Souscription en libre-service : le client génère sa facture, envoie son
--   justificatif de virement, ou paie en ligne (CIB / Edahabia via Chargily Pay).
-- * Journal des événements de paiement : un webhook rejoué n'active jamais
--   deux fois le même abonnement.
-- ==============================================================================

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS transfer_proof_path TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS transfer_proof_uploaded_at TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS checkout_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS checkout_created_at TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'admin';

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_source_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_source_check
  CHECK (source IN ('admin', 'self_service'));

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_payment_method_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_payment_method_check
  CHECK (payment_method IN ('virement', 'cheque', 'gratuit', 'cib_edahabia'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_checkout_id ON public.subscriptions(checkout_id) WHERE checkout_id IS NOT NULL;

-- Une seule facture en attente par entreprise et par offre (libre-service).
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_pending_per_plan
  ON public.subscriptions(company_id, plan) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.payment_events (
    id TEXT PRIMARY KEY,                 -- identifiant de l'événement chez le prestataire
    provider TEXT NOT NULL,
    type TEXT NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    payload JSONB NOT NULL,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin reads payment events" ON public.payment_events;
CREATE POLICY "Admin reads payment events" ON public.payment_events
  FOR SELECT USING (public.get_current_user_role() = 'admin');
