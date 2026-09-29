-- ==============================================================================
-- MIGRATION : console admin — abonnements, facturation et support
-- ------------------------------------------------------------------------------
-- Au lancement, le paiement se fait par facture + virement bancaire, avec
-- activation manuelle par un admin (roadmap, section Paiement). Cette migration
-- ajoute :
--   * la table subscriptions (une ligne = une facture d'abonnement) ;
--   * une numérotation continue des factures (FA-AAAA-00001) ;
--   * le lien entre transactions et abonnements ;
--   * le suivi des messages du formulaire de contact.
-- ==============================================================================

CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS TEXT AS $$
  SELECT 'FA-' || to_char(NOW(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 5, '0');
$$ LANGUAGE sql VOLATILE;

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE DEFAULT public.next_invoice_number(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    plan TEXT NOT NULL CHECK (plan IN ('basic', 'pro', 'founder')),
    -- Montant TTC en dinars ; 0 pour l'offre membre fondateur.
    amount_dzd NUMERIC(12, 2) NOT NULL CHECK (amount_dzd >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_method TEXT CHECK (payment_method IN ('virement', 'cheque', 'gratuit')),
    payment_reference TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner reads own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admin manages subscriptions" ON public.subscriptions;
CREATE POLICY "Owner reads own subscriptions" ON public.subscriptions
  FOR SELECT USING (
    (public.get_current_user_id() IS NOT NULL AND user_id = public.get_current_user_id())
    OR public.get_current_user_role() = 'admin'
  );
CREATE POLICY "Admin manages subscriptions" ON public.subscriptions
  FOR ALL USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- Plan en cours, dénormalisé sur l'entreprise pour l'affichage (badge Premium).
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan_ends_at TIMESTAMPTZ;

-- Transactions rattachées à un abonnement (revenus de la console).
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reference TEXT;
CREATE INDEX IF NOT EXISTS idx_transactions_status_created ON public.transactions(status, created_at);

-- Messages de contact : suivi du traitement par l'équipe.
ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_status_check;
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_status_check
  CHECK (status IN ('new', 'in_progress', 'closed'));
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS handled_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status, created_at DESC);

-- Publicités : motif de refus.
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ------------------------------------------------------------------
-- Articles (blog) : colonnes attendues par l'API et le front
-- ------------------------------------------------------------------
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_status_check;
-- Statut absent : valeur par défaut historique (publié). Statut inconnu : brouillon,
-- pour ne rien publier par erreur.
UPDATE public.articles
SET status = CASE WHEN status IS NULL THEN 'published' ELSE 'draft' END
WHERE status IS NULL OR status NOT IN ('published', 'draft');
ALTER TABLE public.articles ADD CONSTRAINT articles_status_check CHECK (status IN ('published', 'draft'));
