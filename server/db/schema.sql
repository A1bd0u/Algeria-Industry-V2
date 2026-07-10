-- ==============================================================================
-- SCHEMA POSTGRESQL POUR ALGIERS INDUSTRY (AUTHENTIFICATION ET KYC)
-- ==============================================================================

-- 1. Enumérations
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('acheteur', 'fournisseur', 'exposant', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'approved', 'rejected');
  END IF;
END $$;

-- 2. Table des Entreprises (Companies)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  trade_registry_number VARCHAR(100),
  tax_id VARCHAR(100),
  statistical_id VARCHAR(100),
  bank_account VARCHAR(255),
  address TEXT,
  phone VARCHAR(50),
  status verification_status DEFAULT 'unverified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des Utilisateurs (Users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'acheteur',
  company VARCHAR(255),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  "isVerified" BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- (Optionnel) Assignation propriétaire
ALTER TABLE companies ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 4. Table des Documents KYC (Kyc_Documents)
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status verification_status DEFAULT 'pending',
  admin_comments TEXT
);

-- 5. Table des "Demandes KYC" (Kyc_Requests)
CREATE TABLE IF NOT EXISTS kyc_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  activity VARCHAR(255),
  status verification_status DEFAULT 'pending',
  date VARCHAR(50),
  docs JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT
);

-- 6. Helper Functions for RLS
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
  -- 1. Try native Supabase auth.uid()
  IF auth.uid() IS NOT NULL THEN
    RETURN auth.uid();
  END IF;
  
  -- 2. Try custom JWT 'id' claim (passed by our backend's JWT)
  IF auth.jwt() ? 'id' THEN
    RETURN (auth.jwt() ->> 'id')::UUID;
  END IF;
  
  -- 3. Try standard 'sub' claim in JWT
  IF auth.jwt() ? 'sub' THEN
    RETURN (auth.jwt() ->> 'sub')::UUID;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  u_id UUID;
  u_role TEXT;
BEGIN
  -- 1. Try custom JWT 'role' claim
  IF auth.jwt() ? 'role' THEN
    RETURN auth.jwt() ->> 'role';
  END IF;

  -- 2. Try looking up in the public.users table using user ID
  u_id := public.get_current_user_id();
  IF u_id IS NOT NULL THEN
    SELECT role INTO u_role FROM public.users WHERE id = u_id;
    RETURN u_role;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Enablement
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_requests ENABLE ROW LEVEL SECURITY;

-- Drop legacy permissive policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Full access to backend" ON companies;
  DROP POLICY IF EXISTS "Full access to backend" ON users;
  DROP POLICY IF EXISTS "Full access to backend" ON kyc_documents;
  DROP POLICY IF EXISTS "Full access to backend" ON kyc_requests;
END $$;

-- Secure Policies
CREATE POLICY "Allow users to read own profile and admins all" ON users 
  FOR SELECT USING (id = public.get_current_user_id() OR public.get_current_user_role() = 'admin');

CREATE POLICY "Allow users to write own profile and admins all" ON users 
  FOR ALL USING (id = public.get_current_user_id() OR public.get_current_user_id() IS NULL OR public.get_current_user_role() = 'admin');

CREATE POLICY "Allow public read access to companies" ON companies 
  FOR SELECT USING (true);

CREATE POLICY "Allow owner and admin to write companies" ON companies 
  FOR ALL USING (owner_id = public.get_current_user_id() OR owner_id IS NULL OR public.get_current_user_role() = 'admin');

CREATE POLICY "Allow submitter, owner and admin to read kyc_requests" ON kyc_requests 
  FOR SELECT USING (user_id = public.get_current_user_id() OR company_id IN (SELECT id FROM public.companies WHERE owner_id = public.get_current_user_id()) OR public.get_current_user_role() = 'admin');

CREATE POLICY "Allow submitter and admin to write kyc_requests" ON kyc_requests 
  FOR ALL USING (user_id = public.get_current_user_id() OR public.get_current_user_role() = 'admin');

CREATE POLICY "Allow company owner and admin to read kyc_documents" ON kyc_documents 
  FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = public.get_current_user_id()) OR public.get_current_user_role() = 'admin');

CREATE POLICY "Allow company owner and admin to write kyc_documents" ON kyc_documents 
  FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = public.get_current_user_id()) OR public.get_current_user_role() = 'admin');

-- 7. Table des Logs d'Audit (Audit_Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_email VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50),
  details JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON audit_logs;
CREATE POLICY "Allow admin to read audit_logs" ON audit_logs 
  FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Allow admin to write audit_logs" ON audit_logs 
  FOR ALL USING (public.get_current_user_role() = 'admin');


