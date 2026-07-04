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

-- RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_requests ENABLE ROW LEVEL SECURITY;

-- Autoriser tout pour le rôle de service (il faut d'abord supprimer la politique si elle existe)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Full access to backend" ON companies;
  DROP POLICY IF EXISTS "Full access to backend" ON users;
  DROP POLICY IF EXISTS "Full access to backend" ON kyc_documents;
  DROP POLICY IF EXISTS "Full access to backend" ON kyc_requests;
END $$;

CREATE POLICY "Full access to backend" ON companies FOR ALL USING (true);
CREATE POLICY "Full access to backend" ON users FOR ALL USING (true);
CREATE POLICY "Full access to backend" ON kyc_documents FOR ALL USING (true);
CREATE POLICY "Full access to backend" ON kyc_requests FOR ALL USING (true);

