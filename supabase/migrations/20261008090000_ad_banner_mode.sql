-- Bannières image : l'annonce peut être un visuel complet (PNG/JPG conçu par
-- l'annonceur ou l'équipe marketing), affiché tel quel, avec une version mobile.
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS display_mode TEXT NOT NULL DEFAULT 'template';
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ads_display_mode_check') THEN
    ALTER TABLE public.ads ADD CONSTRAINT ads_display_mode_check CHECK (display_mode IN ('template', 'banner'));
  END IF;
END $$;
