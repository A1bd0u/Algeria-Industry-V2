-- Bandeau publicitaire de l'accueil : contenu visuel des annonces,
-- période de diffusion, ordre d'affichage et clics mesurés.
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS brand_name TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS cta_label TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS clicks INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_ads_status_order ON public.ads(status, sort_order);
