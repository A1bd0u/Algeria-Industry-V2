-- Modération des catalogues PDF depuis la console : motif et date du retrait,
-- affichés au fournisseur. Migration rejouable.
ALTER TABLE public.catalogues ADD COLUMN IF NOT EXISTS removal_reason TEXT;
ALTER TABLE public.catalogues ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS catalogues_status_created_idx ON public.catalogues (status, created_at DESC);
