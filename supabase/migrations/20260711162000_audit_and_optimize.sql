-- Migration for Schema Audit and Optimizations
-- Objectif: Assurer l'intégrité référentielle (règles ON DELETE), les contraintes UNIQUE/NOT NULL,
-- et fournir les index manquants pour les performances et la recherche avancée.

-- 1. FOREIGN KEYS & ON DELETE
-- Nous supprimons les contraintes existantes (si elles n'ont pas la bonne règle) 
-- et les recréons avec ON DELETE CASCADE ou SET NULL.

-- companies -> users
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_owner_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_owner_id_fkey') THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- kyc_requests -> companies & users
ALTER TABLE public.kyc_requests DROP CONSTRAINT IF EXISTS kyc_requests_company_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kyc_requests_company_id_fkey') THEN
    ALTER TABLE public.kyc_requests ADD CONSTRAINT kyc_requests_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.kyc_requests DROP CONSTRAINT IF EXISTS kyc_requests_user_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kyc_requests_user_id_fkey') THEN
    ALTER TABLE public.kyc_requests ADD CONSTRAINT kyc_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.kyc_requests DROP CONSTRAINT IF EXISTS kyc_requests_submitted_by_fkey;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kyc_requests_submitted_by_fkey') THEN
    ALTER TABLE public.kyc_requests ADD CONSTRAINT kyc_requests_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- kyc_documents -> companies
ALTER TABLE public.kyc_documents DROP CONSTRAINT IF EXISTS kyc_documents_company_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kyc_documents_company_id_fkey') THEN
    ALTER TABLE public.kyc_documents ADD CONSTRAINT kyc_documents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- catalogues -> companies
ALTER TABLE public.catalogues DROP CONSTRAINT IF EXISTS catalogues_company_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'catalogues_company_id_fkey') THEN
    ALTER TABLE public.catalogues ADD CONSTRAINT catalogues_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- products -> companies
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_company_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_company_id_fkey') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- favorites -> users & products
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'favorites_user_id_fkey') THEN
    ALTER TABLE public.favorites ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_product_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'favorites_product_id_fkey') THEN
    ALTER TABLE public.favorites ADD CONSTRAINT favorites_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- messages -> users
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_sender_id_fkey') THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_receiver_id_fkey') THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- transactions -> users
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_user_id_fkey') THEN
    ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;


-- 2. NOT NULL & UNIQUE CONSTRAINTS
-- S'assure que les colonnes critiques ne sont pas vides
ALTER TABLE public.users ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN name SET NOT NULL;

-- Contraintes d'unicité sur les references générées
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_reference_id_key;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_reference_id_key') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_reference_id_key UNIQUE (reference_id);
  END IF;
END $$;

ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_reference_id_key;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_reference_id_key') THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_reference_id_key UNIQUE (reference_id);
  END IF;
END $$;


-- 3. INDEX MANQUANTS
-- Index pour le tri et le filtrage fréquents
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_status ON public.kyc_requests(status);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_company_id ON public.kyc_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON public.kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);

-- Extension pg_trgm pour la recherche partielle (LIKE / ILIKE) sur les noms
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON public.users USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON public.users USING GIN (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON public.companies USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING GIN (name gin_trgm_ops);

