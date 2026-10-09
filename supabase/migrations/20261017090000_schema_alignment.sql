-- Alignement du schéma sur le code : quatre écarts relevés en production,
-- tables encore vides au moment de la correction.
--   - messages : le code lit et écrit « text », la colonne s'appelait « content » ;
--   - products : « reference_id » (PRD-…) écrit à la création, absent ;
--   - favorites : favoris polymorphes (produit ou entreprise) via item_type / item_id ;
--   - login_attempts : journal des échecs de connexion (limitation par e-mail).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'content')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'text') THEN
    ALTER TABLE public.messages RENAME COLUMN content TO text;
  END IF;
END $$;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reference_id TEXT;

ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS item_type TEXT;
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS item_id UUID;
UPDATE public.favorites SET item_type = 'product', item_id = product_id WHERE item_id IS NULL AND product_id IS NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'favorites_item_type_check') THEN
    ALTER TABLE public.favorites ADD CONSTRAINT favorites_item_type_check CHECK (item_type IN ('product', 'company'));
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_item_key ON public.favorites (user_id, item_type, item_id);

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempt_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON public.login_attempts (email, attempt_time DESC);
-- Accès réservé au serveur (clé service_role) : RLS active, aucune politique.
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
