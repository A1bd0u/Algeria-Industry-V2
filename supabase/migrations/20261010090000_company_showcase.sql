-- Fiche entreprise « vitrine » : chiffres clés, certifications, site web et
-- galerie (usine, ateliers, réalisations).
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS founded_year INTEGER;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS employees TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS certifications TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS gallery TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_employees_check') THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_employees_check
      CHECK (employees IS NULL OR employees IN ('1-9', '10-49', '50-249', '250+'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_founded_year_check') THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_founded_year_check
      CHECK (founded_year IS NULL OR founded_year BETWEEN 1900 AND 2100);
  END IF;
END $$;
