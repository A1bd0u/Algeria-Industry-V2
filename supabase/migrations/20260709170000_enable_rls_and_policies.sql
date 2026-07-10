-- ==============================================================================
-- MIGRATION: ACTIVATE ROW LEVEL SECURITY (RLS) ON ALL SUPABASE TABLES WITH POLICIES
-- ==============================================================================

-- 1. Helper Function: Extract User ID from Supabase Auth JWT Context
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

-- 2. Helper Function: Extract User Role from JWT or Users Table
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

-- 3. Enable RLS and Setup Policies Table by Table

-- ==========================================
-- TABLE: users
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.users;
DROP POLICY IF EXISTS "Allow users to read own profile and admins all" ON public.users;
DROP POLICY IF EXISTS "Allow users to write own profile and admins all" ON public.users;

CREATE POLICY "Allow users to read own profile and admins all" ON public.users 
  FOR SELECT USING (id = public.get_current_user_id() OR public.get_current_user_role() = 'admin');

CREATE POLICY "Allow users to write own profile and admins all" ON public.users 
  FOR ALL USING (id = public.get_current_user_id() OR public.get_current_user_id() IS NULL OR public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: companies
-- ==========================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.companies;
DROP POLICY IF EXISTS "Allow public read access to companies" ON public.companies;
DROP POLICY IF EXISTS "Allow owner and admin to write companies" ON public.companies;

CREATE POLICY "Allow public read access to companies" ON public.companies 
  FOR SELECT USING (true);

CREATE POLICY "Allow owner and admin to write companies" ON public.companies 
  FOR ALL USING (owner_id = public.get_current_user_id() OR owner_id IS NULL OR public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: kyc_requests
-- ==========================================
ALTER TABLE public.kyc_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.kyc_requests;
DROP POLICY IF EXISTS "Allow submitter, owner and admin to read kyc_requests" ON public.kyc_requests;
DROP POLICY IF EXISTS "Allow submitter and admin to write kyc_requests" ON public.kyc_requests;

CREATE POLICY "Allow submitter, owner and admin to read kyc_requests" ON public.kyc_requests 
  FOR SELECT USING (user_id = public.get_current_user_id() OR company_id IN (SELECT id FROM public.companies WHERE owner_id = public.get_current_user_id()) OR public.get_current_user_role() = 'admin');

CREATE POLICY "Allow submitter and admin to write kyc_requests" ON public.kyc_requests 
  FOR ALL USING (user_id = public.get_current_user_id() OR public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: kyc_documents
-- ==========================================
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.kyc_documents;
DROP POLICY IF EXISTS "Allow company owner and admin to read kyc_documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Allow company owner and admin to write kyc_documents" ON public.kyc_documents;

CREATE POLICY "Allow company owner and admin to read kyc_documents" ON public.kyc_documents 
  FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = public.get_current_user_id()) OR public.get_current_user_role() = 'admin');

CREATE POLICY "Allow company owner and admin to write kyc_documents" ON public.kyc_documents 
  FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = public.get_current_user_id()) OR public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: ads
-- ==========================================
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.ads;
DROP POLICY IF EXISTS "Allow public read access to ads" ON public.ads;
DROP POLICY IF EXISTS "Allow admin to write ads" ON public.ads;

CREATE POLICY "Allow public read access to ads" ON public.ads 
  FOR SELECT USING (true);

CREATE POLICY "Allow admin to write ads" ON public.ads 
  FOR ALL USING (public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: articles
-- ==========================================
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.articles;
DROP POLICY IF EXISTS "Allow public read access to articles" ON public.articles;
DROP POLICY IF EXISTS "Allow admin to write articles" ON public.articles;

CREATE POLICY "Allow public read access to articles" ON public.articles 
  FOR SELECT USING (true);

CREATE POLICY "Allow admin to write articles" ON public.articles 
  FOR ALL USING (public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: catalogues
-- ==========================================
ALTER TABLE public.catalogues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.catalogues;
DROP POLICY IF EXISTS "Allow public read access to catalogues" ON public.catalogues;
DROP POLICY IF EXISTS "Allow owner and admin to write catalogues" ON public.catalogues;

CREATE POLICY "Allow public read access to catalogues" ON public.catalogues 
  FOR SELECT USING (true);

CREATE POLICY "Allow owner and admin to write catalogues" ON public.catalogues 
  FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = public.get_current_user_id()) OR public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: events
-- ==========================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.events;
DROP POLICY IF EXISTS "Allow public read access to events" ON public.events;
DROP POLICY IF EXISTS "Allow admin to write events" ON public.events;

CREATE POLICY "Allow public read access to events" ON public.events 
  FOR SELECT USING (true);

CREATE POLICY "Allow admin to write events" ON public.events 
  FOR ALL USING (public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: products
-- ==========================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.products;
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Allow owner and admin to write products" ON public.products;

CREATE POLICY "Allow public read access to products" ON public.products 
  FOR SELECT USING (true);

CREATE POLICY "Allow owner and admin to write products" ON public.products 
  FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = public.get_current_user_id()) OR public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: favorites
-- ==========================================
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.favorites;
DROP POLICY IF EXISTS "Allow user and admin to read favorites" ON public.favorites;
DROP POLICY IF EXISTS "Allow user and admin to write favorites" ON public.favorites;

CREATE POLICY "Allow user and admin to read favorites" ON public.favorites 
  FOR SELECT USING (user_id = public.get_current_user_id() OR public.get_current_user_role() = 'admin');

CREATE POLICY "Allow user and admin to write favorites" ON public.favorites 
  FOR ALL USING (user_id = public.get_current_user_id() OR public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: messages
-- ==========================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.messages;
DROP POLICY IF EXISTS "Allow sender, receiver and admin to read messages" ON public.messages;
DROP POLICY IF EXISTS "Allow sender and admin to write messages" ON public.messages;

CREATE POLICY "Allow sender, receiver and admin to read messages" ON public.messages 
  FOR SELECT USING (sender_id = public.get_current_user_id() OR receiver_id = public.get_current_user_id() OR public.get_current_user_role() = 'admin');

CREATE POLICY "Allow sender and admin to write messages" ON public.messages 
  FOR ALL USING (sender_id = public.get_current_user_id() OR public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: tenders
-- ==========================================
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.tenders;
DROP POLICY IF EXISTS "Allow public read access to tenders" ON public.tenders;
DROP POLICY IF EXISTS "Allow owner company and admin to write tenders" ON public.tenders;

CREATE POLICY "Allow public read access to tenders" ON public.tenders 
  FOR SELECT USING (true);

CREATE POLICY "Allow owner company and admin to write tenders" ON public.tenders 
  FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = public.get_current_user_id()) OR public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: rfqs
-- ==========================================
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.rfqs;
DROP POLICY IF EXISTS "Allow creator, receiver and admin to read rfqs" ON public.rfqs;
DROP POLICY IF EXISTS "Allow creator and admin to write rfqs" ON public.rfqs;

CREATE POLICY "Allow creator, receiver and admin to read rfqs" ON public.rfqs 
  FOR SELECT USING (user_id = public.get_current_user_id() OR tender_id IN (SELECT id FROM public.tenders WHERE company_id IN (SELECT id FROM public.companies WHERE owner_id = public.get_current_user_id())) OR public.get_current_user_role() = 'admin');

CREATE POLICY "Allow creator and admin to write rfqs" ON public.rfqs 
  FOR ALL USING (user_id = public.get_current_user_id() OR public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: reviews
-- ==========================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.reviews;
DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow user and admin to write reviews" ON public.reviews;

CREATE POLICY "Allow public read access to reviews" ON public.reviews 
  FOR SELECT USING (true);

CREATE POLICY "Allow user and admin to write reviews" ON public.reviews 
  FOR ALL USING (user_id = public.get_current_user_id() OR public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: notifications
-- ==========================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.notifications;
DROP POLICY IF EXISTS "Allow user and admin to read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow user and admin to write notifications" ON public.notifications;

CREATE POLICY "Allow user and admin to read notifications" ON public.notifications 
  FOR SELECT USING (user_id = public.get_current_user_id() OR public.get_current_user_role() = 'admin');

CREATE POLICY "Allow user and admin to write notifications" ON public.notifications 
  FOR ALL USING (user_id = public.get_current_user_id() OR public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: transactions
-- ==========================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.transactions;
DROP POLICY IF EXISTS "Allow transacting user and admin to read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow transacting user and admin to write transactions" ON public.transactions;

CREATE POLICY "Allow transacting user and admin to read transactions" ON public.transactions 
  FOR SELECT USING (user_id = public.get_current_user_id() OR public.get_current_user_role() = 'admin');

CREATE POLICY "Allow transacting user and admin to write transactions" ON public.transactions 
  FOR ALL USING (user_id = public.get_current_user_id() OR public.get_current_user_role() = 'admin');


-- ==========================================
-- TABLE: audit_logs
-- ==========================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow admin to read audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow admin to write audit_logs" ON public.audit_logs;

CREATE POLICY "Allow admin to read audit_logs" ON public.audit_logs 
  FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Allow admin to write audit_logs" ON public.audit_logs 
  FOR ALL USING (public.get_current_user_role() = 'admin');
