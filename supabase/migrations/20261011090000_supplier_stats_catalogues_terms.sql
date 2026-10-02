-- Statistiques fournisseur, catalogues PDF déposés par les fournisseurs et
-- acceptation des CGV à la souscription. Migration rejouable.

-- 1. Mesure d'audience par fournisseur : vues de la fiche entreprise, vues
-- des produits, clics WhatsApp et téléchargements de catalogues. Un même
-- visiteur (empreinte anonyme, renouvelée chaque jour) ne compte qu'une fois
-- par jour et par élément. Aucune donnée personnelle : ni IP ni identifiant.
CREATE TABLE IF NOT EXISTS public.audience_events (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  catalogue_id UUID REFERENCES public.catalogues(id) ON DELETE SET NULL,
  visitor_hash TEXT NOT NULL,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audience_events_type_check') THEN
    ALTER TABLE public.audience_events ADD CONSTRAINT audience_events_type_check
      CHECK (type IN ('company_view', 'product_view', 'whatsapp_click', 'catalogue_download'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS audience_events_daily_unique ON public.audience_events (
  type,
  company_id,
  COALESCE(product_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(catalogue_id, '00000000-0000-0000-0000-000000000000'::uuid),
  visitor_hash,
  day
);
CREATE INDEX IF NOT EXISTS audience_events_company_day_idx ON public.audience_events (company_id, day);

-- Lecture et écriture réservées au backend (service_role).
ALTER TABLE public.audience_events ENABLE ROW LEVEL SECURITY;

-- 2. Catalogues PDF : rattachés au compte qui les dépose.
ALTER TABLE public.catalogues ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.catalogues ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE public.catalogues ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'catalogues_status_check') THEN
    ALTER TABLE public.catalogues ADD CONSTRAINT catalogues_status_check
      CHECK (status IN ('published', 'removed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS catalogues_company_id_idx ON public.catalogues (company_id);

-- 3. Acceptation des conditions générales de vente à la souscription.
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS terms_version TEXT;
