-- ==============================================================================
-- MIGRATION : identité visuelle des entreprises et date de vérification
-- ------------------------------------------------------------------------------
-- logo_url / banner_url : images publiques déposées par le titulaire dans le
-- bucket product-images (le serveur refuse toute autre origine).
-- verified_at : date de validation du dossier KYC, affichée avec le badge
-- « Entreprise vérifiée ».
-- ==============================================================================

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Entreprises déjà approuvées : date approximative (dernière mise à jour).
UPDATE public.companies
SET verified_at = COALESCE(updated_at, created_at)
WHERE status = 'approved' AND verified_at IS NULL;
