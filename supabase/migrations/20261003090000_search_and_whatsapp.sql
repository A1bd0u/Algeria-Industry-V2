-- ==============================================================================
-- MIGRATION : recherche plein texte insensible aux accents
-- ------------------------------------------------------------------------------
-- Les colonnes fts étaient indexées avec la configuration « french » alors que
-- l'API interrogeait avec la configuration par défaut de la base (english sur
-- Supabase) : les racines ne correspondaient pas. Une seule configuration,
-- public.fr_unaccent (français + suppression des accents), sert désormais à
-- l'indexation ET aux requêtes : « securite » trouve « sécurité ». Les mots
-- arabes sont indexés tels quels par le même analyseur.
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

DO $$
DECLARE
  dict TEXT;
BEGIN
  -- Le dictionnaire suit le schéma où l'extension est réellement installée.
  SELECT format('%I.%I', n.nspname, d.dictname) INTO dict
  FROM pg_ts_dict d JOIN pg_namespace n ON n.oid = d.dictnamespace
  WHERE d.dictname = 'unaccent'
  LIMIT 1;

  IF NOT EXISTS (
    SELECT 1 FROM pg_ts_config c JOIN pg_namespace n ON n.oid = c.cfgnamespace
    WHERE c.cfgname = 'fr_unaccent' AND n.nspname = 'public'
  ) THEN
    CREATE TEXT SEARCH CONFIGURATION public.fr_unaccent (COPY = pg_catalog.french);
    EXECUTE format(
      'ALTER TEXT SEARCH CONFIGURATION public.fr_unaccent ALTER MAPPING FOR hword, hword_part, word WITH %s, french_stem',
      dict
    );
  END IF;
END $$;

-- Colonnes générées recréées avec la nouvelle configuration.
ALTER TABLE public.companies DROP COLUMN IF EXISTS fts;
ALTER TABLE public.companies ADD COLUMN fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('public.fr_unaccent', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('public.fr_unaccent', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('public.fr_unaccent', coalesce(activity_sector, '')), 'C') ||
    setweight(to_tsvector('public.fr_unaccent', coalesce(wilaya, '')), 'D')
) STORED;

ALTER TABLE public.products DROP COLUMN IF EXISTS fts;
ALTER TABLE public.products ADD COLUMN fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('public.fr_unaccent', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('public.fr_unaccent', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('public.fr_unaccent', coalesce(category, '')), 'C')
) STORED;

CREATE INDEX IF NOT EXISTS idx_companies_fts ON public.companies USING GIN (fts);
CREATE INDEX IF NOT EXISTS idx_products_fts ON public.products USING GIN (fts);

-- ==============================================================================
-- Numéro WhatsApp de l'entreprise (format international sans « + »), saisi par
-- le titulaire et affiché publiquement une fois l'entreprise vérifiée.
-- ==============================================================================
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_whatsapp_format;
ALTER TABLE public.companies ADD CONSTRAINT companies_whatsapp_format
  CHECK (whatsapp IS NULL OR whatsapp ~ '^[0-9]{9,15}$');
