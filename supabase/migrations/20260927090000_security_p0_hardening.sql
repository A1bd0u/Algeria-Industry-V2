-- ==============================================================================
-- MIGRATION : correctifs de sécurité P0 (roadmap de lancement, semaine 1)
-- ------------------------------------------------------------------------------
-- 1. Politiques RLS users / companies : suppression des clauses "IS NULL" qui
--    ouvraient la lecture et l'écriture à toute requête portant la clé anon.
-- 2. Colonne du hash de mot de passe inaccessible aux rôles anon/authenticated.
-- 3. Séparation e-mail vérifié / KYC : colonnes email_verified et kyc_status.
-- 4. token_version (révocation des JWT) garanti présent.
-- 5. Table reports : les signalements ne modifient plus le contenu signalé.
-- 6. Avis entreprise : colonne company_id indexée (plus de JSON dans comment).
-- 7. Annuaire : colonne wilaya indexée pour le filtre par région.
-- 8. Bucket kyc-documents privé.
-- 9. Colonnes utilisées par /api/campaigns (ads.user_id, ads.objective).
-- ==============================================================================

-- ------------------------------------------------------------------
-- 3/4. Colonnes utilisateur
-- ------------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'none';

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_kyc_status_check;
ALTER TABLE public.users ADD CONSTRAINT users_kyc_status_check
  CHECK (kyc_status IN ('none', 'pending', 'approved', 'rejected'));

-- Reprise des données existantes : l'ancien drapeau isVerified servait aux deux usages.
-- On considère l'e-mail vérifié s'il était à true, et le KYC approuvé seulement si
-- l'entreprise liée est effectivement approuvée.
DO $$
DECLARE
  legacy_col TEXT;
BEGIN
  SELECT column_name INTO legacy_col
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users'
    AND column_name IN ('isverified', 'isVerified')
  LIMIT 1;

  IF legacy_col IS NOT NULL THEN
    EXECUTE format('UPDATE public.users SET email_verified = true WHERE %I = true AND email_verified = false', legacy_col);
  END IF;
END $$;

UPDATE public.users u
SET kyc_status = CASE c.status
    WHEN 'approved' THEN 'approved'
    WHEN 'pending' THEN 'pending'
    WHEN 'rejected' THEN 'rejected'
    ELSE 'none'
  END
FROM public.companies c
WHERE c.id = u.company_id AND u.kyc_status = 'none';

-- ------------------------------------------------------------------
-- 1. RLS users : lecture/écriture limitées au propriétaire et aux admins
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow users to read own profile and admins all" ON public.users;
DROP POLICY IF EXISTS "Allow users to write own profile and admins all" ON public.users;
DROP POLICY IF EXISTS "Users read own row or admin" ON public.users;
DROP POLICY IF EXISTS "Users update own row or admin" ON public.users;
DROP POLICY IF EXISTS "Admins insert or delete users" ON public.users;

CREATE POLICY "Users read own row or admin" ON public.users
  FOR SELECT USING (
    (public.get_current_user_id() IS NOT NULL AND id = public.get_current_user_id())
    OR public.get_current_user_role() = 'admin'
  );

-- Un utilisateur peut modifier sa ligne, mais ni son rôle ni ses statuts de
-- vérification (contrôlés par le trigger ci-dessous).
CREATE POLICY "Users update own row or admin" ON public.users
  FOR UPDATE USING (
    (public.get_current_user_id() IS NOT NULL AND id = public.get_current_user_id())
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Admins insert or delete users" ON public.users
  FOR ALL USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

CREATE OR REPLACE FUNCTION public.protect_user_privileged_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Le backend (service_role) et les admins peuvent tout modifier.
  -- Fonction volontairement SECURITY INVOKER : current_user est le rôle appelant.
  IF current_user IN ('service_role', 'postgres', 'supabase_admin')
     OR auth.role() = 'service_role'
     OR public.get_current_user_role() = 'admin' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.email_verified IS DISTINCT FROM OLD.email_verified
     OR NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
     OR NEW.token_version IS DISTINCT FROM OLD.token_version THEN
    RAISE EXCEPTION 'Modification de colonnes protégées interdite';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_user_privileged_columns ON public.users;
CREATE TRIGGER trg_protect_user_privileged_columns
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_privileged_columns();

-- ------------------------------------------------------------------
-- 2. Hash du mot de passe : aucun accès pour anon / authenticated
-- ------------------------------------------------------------------
DO $$
DECLARE
  hash_col TEXT;
BEGIN
  SELECT column_name INTO hash_col
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users'
    AND column_name IN ('passwordhash', 'passwordHash')
  LIMIT 1;

  IF hash_col IS NOT NULL THEN
    -- Les privilèges de colonne ne peuvent restreindre un GRANT de table :
    -- on retire le SELECT de table puis on le redonne colonne par colonne.
    REVOKE SELECT, INSERT, UPDATE ON public.users FROM anon, authenticated;
    EXECUTE (
      SELECT 'GRANT SELECT (' || string_agg(quote_ident(column_name), ', ') || ') ON public.users TO authenticated'
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
        AND column_name NOT IN (hash_col, 'failed_login_attempts', 'account_locked_until', 'last_failed_login_at')
    );
    GRANT UPDATE (name, company) ON public.users TO authenticated;
  END IF;
END $$;

-- ------------------------------------------------------------------
-- 1 bis. RLS companies : plus de "owner_id IS NULL"
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow owner and admin to write companies" ON public.companies;
DROP POLICY IF EXISTS "Owner or admin write companies" ON public.companies;

CREATE POLICY "Owner or admin write companies" ON public.companies
  FOR ALL USING (
    (public.get_current_user_id() IS NOT NULL AND owner_id = public.get_current_user_id())
    OR public.get_current_user_role() = 'admin'
  )
  WITH CHECK (
    (public.get_current_user_id() IS NOT NULL AND owner_id = public.get_current_user_id())
    OR public.get_current_user_role() = 'admin'
  );

-- ------------------------------------------------------------------
-- 5. Signalements
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL CHECK (target_type IN ('product', 'tender', 'company')),
    target_id UUID NOT NULL,
    reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'action_taken')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (target_type, target_id, reporter_id)
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin manages reports" ON public.reports;
CREATE POLICY "Admin manages reports" ON public.reports
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- ------------------------------------------------------------------
-- 6. Avis entreprise : company_id indexé
-- ------------------------------------------------------------------
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_reviews_company_id ON public.reviews(company_id);

-- Reprise des avis stockés en JSON dans comment : {"company_id": "...", "text": "..."}
UPDATE public.reviews
SET company_id = (comment::jsonb ->> 'company_id')::uuid,
    comment = comment::jsonb ->> 'text'
WHERE company_id IS NULL
  AND product_id IS NULL
  AND comment LIKE '{%'
  AND comment::jsonb ? 'company_id'
  AND (comment::jsonb ->> 'company_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (SELECT 1 FROM public.companies c WHERE c.id = (comment::jsonb ->> 'company_id')::uuid);

-- ------------------------------------------------------------------
-- 7. Annuaire : wilaya indexée
-- ------------------------------------------------------------------
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS wilaya TEXT;
CREATE INDEX IF NOT EXISTS idx_companies_wilaya ON public.companies(wilaya);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);

-- ------------------------------------------------------------------
-- Produits : owner_id toujours renseigné, company_id déduit du propriétaire
-- ------------------------------------------------------------------
UPDATE public.products p
SET company_id = u.company_id
FROM public.users u
WHERE p.owner_id = u.id AND p.company_id IS NULL AND u.company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_owner_id ON public.products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);

-- ------------------------------------------------------------------
-- 8. Bucket KYC privé (lecture par URL signée uniquement)
-- ------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------
-- 9. Campagnes publicitaires
-- ------------------------------------------------------------------
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS objective TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS budget TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS message TEXT;

DROP POLICY IF EXISTS "Allow public read access to ads" ON public.ads;
DROP POLICY IF EXISTS "Public reads published ads" ON public.ads;
CREATE POLICY "Public reads published ads" ON public.ads
  FOR SELECT USING (status = 'published' OR public.get_current_user_role() = 'admin');

-- ------------------------------------------------------------------
-- Formulaire de contact
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin reads contact messages" ON public.contact_messages;
CREATE POLICY "Admin reads contact messages" ON public.contact_messages
  FOR ALL USING (public.get_current_user_role() = 'admin');
