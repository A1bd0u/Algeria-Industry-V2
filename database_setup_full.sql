
-- Initial Migration

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    company TEXT,
    role TEXT DEFAULT 'acheteur',
    passwordHash TEXT,
    isVerified BOOLEAN DEFAULT false,
    company_id UUID,
    reference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id TEXT,
    name TEXT NOT NULL,
    nif TEXT,
    rc TEXT,
    description TEXT,
    activity_sector TEXT,
    owner_id UUID REFERENCES public.users(id),
    certified BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kyc_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id),
    user_id UUID REFERENCES public.users(id),
    name TEXT,
    activity TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    company_name TEXT,
    registration_number TEXT,
    submitted_by UUID REFERENCES public.users(id),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id),
    document_type TEXT,
    file_url TEXT,
    status TEXT DEFAULT 'pending',
    admin_comments TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    type TEXT,
    url TEXT,
    duration TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    content TEXT,
    author TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.catalogues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    description TEXT,
    pdf_url TEXT,
    company_id UUID REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    organizer TEXT,
    status TEXT DEFAULT 'upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    description TEXT,
    price NUMERIC,
    category TEXT,
    company_id UUID REFERENCES public.companies(id),
    status TEXT DEFAULT 'active',
    brand TEXT,
    region TEXT,
    file_url TEXT,
    features TEXT[],
    verified BOOLEAN DEFAULT false,
    owner_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    product_id UUID REFERENCES public.products(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.users(id),
    receiver_id UUID REFERENCES public.users(id),
    content TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);





-- Supabase Storage Bucket for KYC Documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', true) ON CONFLICT (id) DO NOTHING;
-- 1. Create missing tables requested
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add requested missing columns and updated_at
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.kyc_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.catalogues ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();


ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID;

-- 3. Add NOT NULL constraints
-- Note: Assuming data allows, otherwise it may fail on existing nulls. If it's a fresh DB it's fine.
-- Setting defaults for empty data if needed.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT;
UPDATE public.users SET name = 'Unknown' WHERE name IS NULL;
ALTER TABLE public.users ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name TEXT;
UPDATE public.products SET name = 'Unknown' WHERE name IS NULL;
ALTER TABLE public.products ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price NUMERIC;
UPDATE public.products SET price = 0 WHERE price IS NULL;
ALTER TABLE public.products ALTER COLUMN price SET NOT NULL;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content TEXT;
UPDATE public.messages SET content = '' WHERE content IS NULL;
ALTER TABLE public.messages ALTER COLUMN content SET NOT NULL;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_id UUID;
ALTER TABLE public.messages ALTER COLUMN sender_id SET NOT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS receiver_id UUID;
ALTER TABLE public.messages ALTER COLUMN receiver_id SET NOT NULL;


-- 4. Add CHECK constraints
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_rating_check; ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_price_check; ALTER TABLE public.products ADD CONSTRAINT products_price_check CHECK (price >= 0);
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_check; ALTER TABLE public.users ADD CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');


-- 5. Add Indexes
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);

-- 6. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_kyc_requests_updated_at ON public.kyc_requests;
CREATE TRIGGER update_kyc_requests_updated_at BEFORE UPDATE ON public.kyc_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_kyc_documents_updated_at ON public.kyc_documents;
CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON public.kyc_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_ads_updated_at ON public.ads;
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_catalogues_updated_at ON public.catalogues;
CREATE TRIGGER update_catalogues_updated_at BEFORE UPDATE ON public.catalogues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_favorites_updated_at ON public.favorites;
CREATE TRIGGER update_favorites_updated_at BEFORE UPDATE ON public.favorites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Views
DROP VIEW IF EXISTS public.vw_product_details CASCADE;
CREATE VIEW public.vw_product_details AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.category,
    p.company_id,
    c.name as company_name,
    c.certified as company_certified,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(r.id) as review_count
FROM public.products p
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN public.reviews r ON p.id = r.product_id
GROUP BY p.id, c.id, c.name, c.certified;

DROP VIEW IF EXISTS public.vw_company_stats CASCADE;
CREATE VIEW public.vw_company_stats AS
SELECT 
    c.id,
    c.name,
    COUNT(DISTINCT p.id) as total_products
    
FROM public.companies c
LEFT JOIN public.products p ON c.id = p.company_id

GROUP BY c.id, c.name;


CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP FUNCTION IF EXISTS get_admin_dashboard_stats CASCADE;
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    total_users INT;
    approved_companies INT;
    active_products INT;
    
    total_revenue NUMERIC;
    registrations JSON;
    revenue_chart JSON;
BEGIN
    SELECT COUNT(*) INTO total_users FROM public.users;
    SELECT COUNT(*) INTO approved_companies FROM public.companies WHERE status = 'approved';
    SELECT COUNT(*) INTO active_products FROM public.products WHERE status = 'active';
    
    
    -- handle transactions possibly missing or no completed transactions
    SELECT COALESCE(SUM(amount), 0) INTO total_revenue FROM public.transactions WHERE status = 'completed';

    -- Registrations last 30 days
    SELECT json_agg(row_to_json(t)) INTO registrations FROM (
        SELECT 
            TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') as date, 
            COUNT(*) as count
        FROM public.users 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at)
    ) t;

    -- Revenue last 30 days
    SELECT json_agg(row_to_json(t)) INTO revenue_chart FROM (
        SELECT 
            TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') as date, 
            SUM(amount) as revenue
        FROM public.transactions 
        WHERE created_at >= NOW() - INTERVAL '30 days' AND status = 'completed'
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at)
    ) t;

    RETURN json_build_object(
        'kpis', json_build_object(
            'total_users', total_users,
            'approved_companies', approved_companies,
            'active_products', active_products, 'total_revenue', total_revenue
        ),
        'charts', json_build_object(
            'registrations', COALESCE(registrations, '[]'::json),
            'revenue', COALESCE(revenue_chart, '[]'::json)
        )
    );
END;
$$ LANGUAGE plpgsql;
DROP FUNCTION IF EXISTS get_admin_dashboard_stats CASCADE;
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(interval_days INT DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    total_users INT;
    approved_companies INT;
    active_products INT;
    
    total_revenue NUMERIC;
    registrations JSON;
    revenue_chart JSON;
BEGIN
    SELECT COUNT(*) INTO total_users FROM public.users;
    SELECT COUNT(*) INTO approved_companies FROM public.companies WHERE status = 'approved';
    SELECT COUNT(*) INTO active_products FROM public.products WHERE status = 'active';
    
    
    -- handle transactions possibly missing or no completed transactions
    SELECT COALESCE(SUM(amount), 0) INTO total_revenue FROM public.transactions WHERE status = 'completed';

    -- Registrations
    SELECT json_agg(row_to_json(t)) INTO registrations FROM (
        SELECT 
            TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') as date, 
            COUNT(*) as count
        FROM public.users 
        WHERE created_at >= NOW() - (interval_days || ' days')::interval
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at)
    ) t;

    -- Revenue
    SELECT json_agg(row_to_json(t)) INTO revenue_chart FROM (
        SELECT 
            TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') as date, 
            SUM(amount) as revenue
        FROM public.transactions 
        WHERE created_at >= NOW() - (interval_days || ' days')::interval AND status = 'completed'
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at)
    ) t;

    RETURN json_build_object(
        'kpis', json_build_object(
            'total_users', total_users,
            'approved_companies', approved_companies,
            'active_products', active_products, 'total_revenue', total_revenue
        ),
        'charts', json_build_object(
            'registrations', COALESCE(registrations, '[]'::json),
            'revenue', COALESCE(revenue_chart, '[]'::json)
        )
    );
END;
$$ LANGUAGE plpgsql;
-- 1. Add wilaya column if not exists
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS wilaya TEXT;

-- 2. Add FTS columns
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(activity_sector, '')), 'C') ||
    setweight(to_tsvector('french', coalesce(wilaya, '')), 'D')
) STORED;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(category, '')), 'C')
) STORED;

-- 3. Create GIN indexes for FTS
CREATE INDEX IF NOT EXISTS idx_companies_fts ON public.companies USING GIN (fts);
CREATE INDEX IF NOT EXISTS idx_products_fts ON public.products USING GIN (fts);

-- 4. Create B-Tree indexes for frequently filtered columns
CREATE INDEX IF NOT EXISTS idx_companies_wilaya ON public.companies (wilaya);
CREATE INDEX IF NOT EXISTS idx_companies_activity_sector ON public.companies (activity_sector);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies (status);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.companies (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (status);
-- Migration: Seed test users
-- Description: Creates default test users for development/demo purposes
-- These users are seeded with the password 'admin123'

INSERT INTO public.users (name, email, role, passwordhash, isverified)
VALUES 
('Admin AIS', 'admin@ais.dz', 'admin', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true),
('Admin Algiers', 'admin@algiers-industry.com', 'admin', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true),
('Acheteur Demo', 'acheteur@example.com', 'acheteur', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true),
('Fournisseur Demo', 'fournisseur@example.com', 'fournisseur', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true),
('Exposant Demo', 'exposant@example.com', 'exposant', '$2b$10$37RWACUNQ4FJyUX.MriZ2ur.FoFrYVpzTdzwlOIXRf1O57tCMGT4.', true)
ON CONFLICT (email) DO UPDATE 
SET passwordhash = EXCLUDED.passwordhash;
-- Migration: Seed Companies, Catalogues, 

INSERT INTO public.companies (id, reference_id, name, nif, rc, description, activity_sector, certified, status)
VALUES
('09aa5c8c-aadf-44b6-a074-af34a9c33782', 'CMP-WA4QUR', 'Entreprise Chimie Hassi Messaoud 1', '00007986047264', '16/00-7917783B14', 'Acteur majeur dans le secteur Chimie, basé à Hassi Messaoud. Expertise reconnue depuis plusieurs années.', 'Chimie', true, 'approved'),
('ed6ef18f-bde1-4be1-b82f-fd31f7baa85f', 'CMP-P99Q6T', 'Entreprise Chimie Béjaïa 2', '00006432866220', '16/00-2345781B16', 'Acteur majeur dans le secteur Chimie, basé à Béjaïa. Expertise reconnue depuis plusieurs années.', 'Chimie', false, 'approved'),
('eae513aa-cb1d-4738-b1a3-972756e0d6d3', 'CMP-01KRO5', 'Entreprise BTPH Ouargla 3', '00004692498249', '16/00-6837305B13', 'Acteur majeur dans le secteur BTPH, basé à Ouargla. Expertise reconnue depuis plusieurs années.', 'BTPH', false, 'approved'),
('dbbd0e16-1057-44d5-8367-fc824e90edde', 'CMP-2LTFHS', 'Entreprise Textile Alger 4', '00006461349375', '16/00-1282201B19', 'Acteur majeur dans le secteur Textile, basé à Alger. Expertise reconnue depuis plusieurs années.', 'Textile', false, 'approved'),
('05f1cb09-811a-41e8-9507-63041b101801', 'CMP-GDR9HI', 'Entreprise Textile Annaba 5', '00006976375250', '16/00-7542628B18', 'Acteur majeur dans le secteur Textile, basé à Annaba. Expertise reconnue depuis plusieurs années.', 'Textile', true, 'approved'),
('399685c7-2d81-4a89-af87-85d9f283b8bf', 'CMP-CS050C', 'Entreprise Automobile Sétif 6', '00008098811381', '16/00-5583416B19', 'Acteur majeur dans le secteur Automobile, basé à Sétif. Expertise reconnue depuis plusieurs années.', 'Automobile', true, 'approved'),
('3a37f667-a80b-4d7e-b05b-1bfd3419dbad', 'CMP-8260EE', 'Entreprise Énergie Sétif 7', '00006482125142', '16/00-2811443B17', 'Acteur majeur dans le secteur Énergie, basé à Sétif. Expertise reconnue depuis plusieurs années.', 'Énergie', false, 'approved'),
('539f605c-b32f-4700-bb5b-bdb4aae06bf3', 'CMP-1WIUY5', 'Entreprise BTPH Blida 8', '00009173194473', '16/00-6924604B12', 'Acteur majeur dans le secteur BTPH, basé à Blida. Expertise reconnue depuis plusieurs années.', 'BTPH', false, 'approved'),
('e9c3f12d-2c06-4e22-82fa-69d20504604d', 'CMP-WN3GZX', 'Entreprise Électronique Annaba 9', '00005533627139', '16/00-5055797B18', 'Acteur majeur dans le secteur Électronique, basé à Annaba. Expertise reconnue depuis plusieurs années.', 'Électronique', true, 'approved'),
('7f137be0-45f8-432a-84d8-0dac5acab958', 'CMP-WW14S6', 'Entreprise Métallurgie Béjaïa 10', '00004497322572', '16/00-2706192B11', 'Acteur majeur dans le secteur Métallurgie, basé à Béjaïa. Expertise reconnue depuis plusieurs années.', 'Métallurgie', false, 'approved'),
('92879d8c-4772-43a8-a79b-b679d3eeff04', 'CMP-MY4DB1', 'Entreprise Agroalimentaire Sétif 11', '00003120561705', '16/00-1812114B19', 'Acteur majeur dans le secteur Agroalimentaire, basé à Sétif. Expertise reconnue depuis plusieurs années.', 'Agroalimentaire', true, 'approved'),
('6e2baefc-b13e-4ca5-88f4-e6072f0d599c', 'CMP-BUDAKM', 'Entreprise Automobile Tlemcen 12', '00007627616287', '16/00-2549100B18', 'Acteur majeur dans le secteur Automobile, basé à Tlemcen. Expertise reconnue depuis plusieurs années.', 'Automobile', false, 'approved'),
('7f63e1f5-1799-4f0d-a3e3-c8ee6f82aef7', 'CMP-GDMAZ5', 'Entreprise Plasturgie Constantine 13', '00008913457326', '16/00-4535431B18', 'Acteur majeur dans le secteur Plasturgie, basé à Constantine. Expertise reconnue depuis plusieurs années.', 'Plasturgie', false, 'approved'),
('9f5f62a0-4511-40d4-b3f7-fff2b5ba0440', 'CMP-P80I4N', 'Entreprise Automobile Tlemcen 14', '00008562619811', '16/00-3980902B14', 'Acteur majeur dans le secteur Automobile, basé à Tlemcen. Expertise reconnue depuis plusieurs années.', 'Automobile', true, 'approved'),
('7adfa352-365c-4751-a150-60e9bed9fc4b', 'CMP-9077EL', 'Entreprise Métallurgie Annaba 15', '00007359864459', '16/00-2767929B10', 'Acteur majeur dans le secteur Métallurgie, basé à Annaba. Expertise reconnue depuis plusieurs années.', 'Métallurgie', false, 'approved'),
('4fa7979e-f5f6-447c-a96f-df7f0118032f', 'CMP-QG95JW', 'Entreprise BTPH Ouargla 16', '00007775019355', '16/00-4923305B10', 'Acteur majeur dans le secteur BTPH, basé à Ouargla. Expertise reconnue depuis plusieurs années.', 'BTPH', true, 'approved'),
('9bd6a643-7462-4a9d-a4b1-4ea22d1ec1e9', 'CMP-6QWTZZ', 'Entreprise Plasturgie Constantine 17', '00005808473957', '16/00-3844499B11', 'Acteur majeur dans le secteur Plasturgie, basé à Constantine. Expertise reconnue depuis plusieurs années.', 'Plasturgie', false, 'approved'),
('225f79e3-3921-4f01-8bec-42b5ac80bb80', 'CMP-07MZPZ', 'Entreprise BTPH Annaba 18', '00001240614171', '16/00-8400081B18', 'Acteur majeur dans le secteur BTPH, basé à Annaba. Expertise reconnue depuis plusieurs années.', 'BTPH', true, 'approved'),
('c4b7e59c-9ccd-44ed-9ab8-ccf77782fba8', 'CMP-LSOBEM', 'Entreprise Textile Tlemcen 19', '00005083555705', '16/00-5186634B19', 'Acteur majeur dans le secteur Textile, basé à Tlemcen. Expertise reconnue depuis plusieurs années.', 'Textile', false, 'approved'),
('7c15061f-3332-4f40-bd69-4bf55298bdf7', 'CMP-LYGMFX', 'Entreprise Énergie Blida 20', '00001549193092', '16/00-4793711B15', 'Acteur majeur dans le secteur Énergie, basé à Blida. Expertise reconnue depuis plusieurs années.', 'Énergie', true, 'approved'),
('35cdb846-6034-445c-9548-4661cff0ad28', 'CMP-UPXK0W', 'Entreprise BTPH Tlemcen 21', '00001454854546', '16/00-9477296B17', 'Acteur majeur dans le secteur BTPH, basé à Tlemcen. Expertise reconnue depuis plusieurs années.', 'BTPH', true, 'approved'),
('66512566-6307-44dc-b0c2-435a3f726a36', 'CMP-PVNM8F', 'Entreprise Métallurgie Hassi Messaoud 22', '00007787554908', '16/00-3932538B18', 'Acteur majeur dans le secteur Métallurgie, basé à Hassi Messaoud. Expertise reconnue depuis plusieurs années.', 'Métallurgie', true, 'approved'),
('58d006ab-1f55-4810-aafd-70146416245e', 'CMP-W4PC8T', 'Entreprise Métallurgie Oran 23', '00002826667981', '16/00-4548454B19', 'Acteur majeur dans le secteur Métallurgie, basé à Oran. Expertise reconnue depuis plusieurs années.', 'Métallurgie', false, 'approved'),
('858f7418-2cc4-456b-9af1-8c9712c9b4fb', 'CMP-LYJR4P', 'Entreprise BTPH Alger 24', '00008188910517', '16/00-6252550B13', 'Acteur majeur dans le secteur BTPH, basé à Alger. Expertise reconnue depuis plusieurs années.', 'BTPH', false, 'approved'),
('235d6285-0493-4080-9fd0-6debef4a7030', 'CMP-CCBU89', 'Entreprise Automobile Tlemcen 25', '00001053083755', '16/00-3357153B16', 'Acteur majeur dans le secteur Automobile, basé à Tlemcen. Expertise reconnue depuis plusieurs années.', 'Automobile', false, 'approved'),
('de4d781f-a848-40ce-a71e-a98b8d5f8a29', 'CMP-8RHAI1', 'Entreprise Électronique Alger 26', '00009608175233', '16/00-2760132B15', 'Acteur majeur dans le secteur Électronique, basé à Alger. Expertise reconnue depuis plusieurs années.', 'Électronique', true, 'approved'),
('9e33b395-69a0-4fd5-b7af-ea03d36bf5e3', 'CMP-R2CCUY', 'Entreprise Agroalimentaire Annaba 27', '00003173838493', '16/00-6232811B10', 'Acteur majeur dans le secteur Agroalimentaire, basé à Annaba. Expertise reconnue depuis plusieurs années.', 'Agroalimentaire', true, 'approved'),
('fdd1796c-5abd-484b-9e3e-8ec92f3df0b7', 'CMP-RSU2IG', 'Entreprise Agroalimentaire Sétif 28', '00009000165765', '16/00-2433949B18', 'Acteur majeur dans le secteur Agroalimentaire, basé à Sétif. Expertise reconnue depuis plusieurs années.', 'Agroalimentaire', true, 'approved'),
('a0d86e9a-63f8-44c4-be31-16128116be0f', 'CMP-FOUGAH', 'Entreprise Énergie Sétif 29', '00007149418688', '16/00-5024053B19', 'Acteur majeur dans le secteur Énergie, basé à Sétif. Expertise reconnue depuis plusieurs années.', 'Énergie', false, 'approved'),
('2936a52d-724b-4350-b2ea-77dc28a50d37', 'CMP-S98WEC', 'Entreprise Énergie Annaba 30', '00004543748510', '16/00-5064612B17', 'Acteur majeur dans le secteur Énergie, basé à Annaba. Expertise reconnue depuis plusieurs années.', 'Énergie', true, 'approved'),
('33f95555-9868-47ff-a785-6dc2dab8edfb', 'CMP-4CPGHH', 'Entreprise Agroalimentaire Constantine 31', '00004767406424', '16/00-5458639B15', 'Acteur majeur dans le secteur Agroalimentaire, basé à Constantine. Expertise reconnue depuis plusieurs années.', 'Agroalimentaire', true, 'approved'),
('62b04434-0bcd-4c32-99b3-e550700149dc', 'CMP-H0ECMU', 'Entreprise Textile Ouargla 32', '00005966080161', '16/00-4494662B17', 'Acteur majeur dans le secteur Textile, basé à Ouargla. Expertise reconnue depuis plusieurs années.', 'Textile', true, 'approved'),
('65390834-baa2-4327-aff9-a8306088abbd', 'CMP-LCUATT', 'Entreprise Textile Annaba 33', '00009290950320', '16/00-4785094B17', 'Acteur majeur dans le secteur Textile, basé à Annaba. Expertise reconnue depuis plusieurs années.', 'Textile', false, 'approved'),
('569e1a40-5c30-48e0-817d-e52a1c5caae1', 'CMP-XU5ADE', 'Entreprise Énergie Oran 34', '00003245837024', '16/00-4327957B19', 'Acteur majeur dans le secteur Énergie, basé à Oran. Expertise reconnue depuis plusieurs années.', 'Énergie', false, 'approved'),
('9567b535-4c60-401e-85d7-8d9675e36b80', 'CMP-IEK112', 'Entreprise Automobile Sétif 35', '00002874168801', '16/00-8994989B15', 'Acteur majeur dans le secteur Automobile, basé à Sétif. Expertise reconnue depuis plusieurs années.', 'Automobile', true, 'approved'),
('562441a1-08c1-4489-a22f-aaf6613717b6', 'CMP-9WKDIG', 'Entreprise Agroalimentaire Blida 36', '00009346182754', '16/00-1983950B12', 'Acteur majeur dans le secteur Agroalimentaire, basé à Blida. Expertise reconnue depuis plusieurs années.', 'Agroalimentaire', true, 'approved'),
('409fea92-5686-4917-9963-0c908afdf276', 'CMP-MTGBJX', 'Entreprise Électronique Sétif 37', '00002349594091', '16/00-7771428B18', 'Acteur majeur dans le secteur Électronique, basé à Sétif. Expertise reconnue depuis plusieurs années.', 'Électronique', false, 'approved'),
('418dcb5f-69a7-48ff-9d2c-3c5d4af43d49', 'CMP-H74WHP', 'Entreprise Énergie Oran 38', '00001781285960', '16/00-1755270B18', 'Acteur majeur dans le secteur Énergie, basé à Oran. Expertise reconnue depuis plusieurs années.', 'Énergie', true, 'approved'),
('551e65ca-1954-4669-9c13-2d2bbd21f5d3', 'CMP-59U9TO', 'Entreprise Agroalimentaire Hassi Messaoud 39', '00001041034532', '16/00-5434027B19', 'Acteur majeur dans le secteur Agroalimentaire, basé à Hassi Messaoud. Expertise reconnue depuis plusieurs années.', 'Agroalimentaire', false, 'approved'),
('163c6384-3d74-4d25-8a6d-349afa76e90b', 'CMP-SF4T54', 'Entreprise Électronique Hassi Messaoud 40', '00001747179820', '16/00-8465156B19', 'Acteur majeur dans le secteur Électronique, basé à Hassi Messaoud. Expertise reconnue depuis plusieurs années.', 'Électronique', true, 'approved'),
('0d66bee5-17c2-4882-b9b6-31b8fb8c1559', 'CMP-PSEJHJ', 'Entreprise Automobile Annaba 41', '00004171527896', '16/00-8686145B16', 'Acteur majeur dans le secteur Automobile, basé à Annaba. Expertise reconnue depuis plusieurs années.', 'Automobile', false, 'approved'),
('cde07c2e-72d4-463d-9eb9-b741bc38a053', 'CMP-JHAU7Q', 'Entreprise Énergie Oran 42', '00001719833778', '16/00-4422491B18', 'Acteur majeur dans le secteur Énergie, basé à Oran. Expertise reconnue depuis plusieurs années.', 'Énergie', false, 'approved'),
('e81b6335-4fcc-4fca-9e2e-065884286393', 'CMP-2XSDNK', 'Entreprise Plasturgie Ouargla 43', '00007162149314', '16/00-5734776B16', 'Acteur majeur dans le secteur Plasturgie, basé à Ouargla. Expertise reconnue depuis plusieurs années.', 'Plasturgie', false, 'approved'),
('4ca3e6b6-f311-4d20-b404-125d875df22b', 'CMP-2KBIJ4', 'Entreprise Électronique Alger 44', '00002768578014', '16/00-5201897B10', 'Acteur majeur dans le secteur Électronique, basé à Alger. Expertise reconnue depuis plusieurs années.', 'Électronique', true, 'approved'),
('a6883ee1-dae8-4eab-9254-6bc348bcfa73', 'CMP-3GT6CW', 'Entreprise BTPH Hassi Messaoud 45', '00007018033117', '16/00-6885580B19', 'Acteur majeur dans le secteur BTPH, basé à Hassi Messaoud. Expertise reconnue depuis plusieurs années.', 'BTPH', true, 'approved'),
('7ecdb100-a56b-4057-83b6-580abd73ebcd', 'CMP-MQTBO7', 'Entreprise Chimie Tlemcen 46', '00007308424591', '16/00-6695327B11', 'Acteur majeur dans le secteur Chimie, basé à Tlemcen. Expertise reconnue depuis plusieurs années.', 'Chimie', false, 'approved'),
('87c5e931-8aa8-4bc1-8011-3e952a95d18b', 'CMP-MOZ1DU', 'Entreprise Électronique Annaba 47', '00002732243798', '16/00-3852632B10', 'Acteur majeur dans le secteur Électronique, basé à Annaba. Expertise reconnue depuis plusieurs années.', 'Électronique', true, 'approved'),
('af7f613f-3648-44fa-8d20-92e8cdc97d04', 'CMP-X68WC0', 'Entreprise Agroalimentaire Blida 48', '00002613820039', '16/00-7153122B13', 'Acteur majeur dans le secteur Agroalimentaire, basé à Blida. Expertise reconnue depuis plusieurs années.', 'Agroalimentaire', true, 'approved'),
('6c8cee05-913c-475f-ac2b-c12751df1ab4', 'CMP-ZKYVS8', 'Entreprise Textile Hassi Messaoud 49', '00009112222883', '16/00-3274517B19', 'Acteur majeur dans le secteur Textile, basé à Hassi Messaoud. Expertise reconnue depuis plusieurs années.', 'Textile', true, 'approved'),
('88510d4f-2f25-474a-bcc7-8259afe3cea0', 'CMP-JJXE4T', 'Entreprise Textile Ouargla 50', '00008368169710', '16/00-9970162B13', 'Acteur majeur dans le secteur Textile, basé à Ouargla. Expertise reconnue depuis plusieurs années.', 'Textile', false, 'approved'),
('e0925171-06c6-46e2-a6d2-16b5d0cdde52', 'CMP-61P2HK', 'Entreprise Automobile Sétif 51', '00004203066378', '16/00-2129583B18', 'Acteur majeur dans le secteur Automobile, basé à Sétif. Expertise reconnue depuis plusieurs années.', 'Automobile', false, 'approved'),
('3c2f8bf1-945f-4b59-84d7-174bc55ebbc7', 'CMP-TU1PN6', 'Entreprise Énergie Annaba 52', '00004353849258', '16/00-8200305B15', 'Acteur majeur dans le secteur Énergie, basé à Annaba. Expertise reconnue depuis plusieurs années.', 'Énergie', false, 'approved'),
('ae4aba81-04f4-4982-8a9e-c5e929706a8a', 'CMP-7EIR91', 'Entreprise Agroalimentaire Oran 53', '00002529359319', '16/00-8538337B12', 'Acteur majeur dans le secteur Agroalimentaire, basé à Oran. Expertise reconnue depuis plusieurs années.', 'Agroalimentaire', false, 'approved'),
('adbcffa8-f8c7-4f59-a408-ce15c6d04866', 'CMP-SJSLF8', 'Entreprise Électronique Béjaïa 54', '00004517067859', '16/00-9493782B10', 'Acteur majeur dans le secteur Électronique, basé à Béjaïa. Expertise reconnue depuis plusieurs années.', 'Électronique', false, 'approved'),
('180c3c75-0c62-4492-8549-01a1cf5f5b39', 'CMP-QWKQ74', 'Entreprise BTPH Hassi Messaoud 55', '00003283720931', '16/00-3899190B13', 'Acteur majeur dans le secteur BTPH, basé à Hassi Messaoud. Expertise reconnue depuis plusieurs années.', 'BTPH', false, 'approved'),
('05c126f6-bfa9-4f89-b2f9-779e6004f149', 'CMP-1SO1V3', 'Entreprise Automobile Annaba 56', '00002293228734', '16/00-1404529B17', 'Acteur majeur dans le secteur Automobile, basé à Annaba. Expertise reconnue depuis plusieurs années.', 'Automobile', true, 'approved'),
('52b880fc-42ee-47a0-8f76-cc1fdc9aa0a3', 'CMP-NE0YG1', 'Entreprise Chimie Oran 57', '00008375491488', '16/00-6893727B14', 'Acteur majeur dans le secteur Chimie, basé à Oran. Expertise reconnue depuis plusieurs années.', 'Chimie', false, 'approved'),
('6dcd5c41-896d-460d-b810-1a912f43a279', 'CMP-C19EOH', 'Entreprise Textile Sétif 58', '00005058428439', '16/00-8609465B11', 'Acteur majeur dans le secteur Textile, basé à Sétif. Expertise reconnue depuis plusieurs années.', 'Textile', false, 'approved'),
('d73e1387-e295-40a9-a29e-b1ee665dadae', 'CMP-6K6QTB', 'Entreprise Textile Oran 59', '00003982940780', '16/00-8578785B13', 'Acteur majeur dans le secteur Textile, basé à Oran. Expertise reconnue depuis plusieurs années.', 'Textile', false, 'approved'),
('04073959-d667-4afd-865a-5260ec99520f', 'CMP-QRRETS', 'Entreprise BTPH Blida 60', '00005669820001', '16/00-6725212B12', 'Acteur majeur dans le secteur BTPH, basé à Blida. Expertise reconnue depuis plusieurs années.', 'BTPH', false, 'approved');

INSERT INTO public.catalogues (id, title, description, pdf_url, company_id)
VALUES
('269b313b-ab5c-48f5-8a4c-d026fffe39a2', 'Catalogue BTPH 2026', 'Découvrez nos derniers produits et services pour l''industrie BTPH.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '04073959-d667-4afd-865a-5260ec99520f'),
('541b260e-fe5f-442a-affa-a70fc65e925d', 'Catalogue Automobile 2026', 'Découvrez nos derniers produits et services pour l''industrie Automobile.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '9567b535-4c60-401e-85d7-8d9675e36b80'),
('eaf5d7ff-1125-4f24-b6d6-86ab649d1abe', 'Catalogue Énergie 2026', 'Découvrez nos derniers produits et services pour l''industrie Énergie.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '7c15061f-3332-4f40-bd69-4bf55298bdf7'),
('37d3c914-c7b4-45cf-8630-2ce9b906f1c1', 'Catalogue Plasturgie 2026', 'Découvrez nos derniers produits et services pour l''industrie Plasturgie.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '7f63e1f5-1799-4f0d-a3e3-c8ee6f82aef7'),
('cd495931-56cd-4172-8e94-104e031d9c3f', 'Catalogue BTPH 2026', 'Découvrez nos derniers produits et services pour l''industrie BTPH.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '04073959-d667-4afd-865a-5260ec99520f'),
('e16282e3-1e62-434e-abc2-c67397907271', 'Catalogue Plasturgie 2026', 'Découvrez nos derniers produits et services pour l''industrie Plasturgie.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'e81b6335-4fcc-4fca-9e2e-065884286393'),
('5678eb13-a42a-4fa3-bbe0-91f4e809111c', 'Catalogue Textile 2026', 'Découvrez nos derniers produits et services pour l''industrie Textile.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '62b04434-0bcd-4c32-99b3-e550700149dc'),
('1b12338d-aea5-4a30-893a-791e6aee8072', 'Catalogue Textile 2026', 'Découvrez nos derniers produits et services pour l''industrie Textile.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '65390834-baa2-4327-aff9-a8306088abbd'),
('5ed50b26-e0c1-4acd-9ec2-5349337af526', 'Catalogue Agroalimentaire 2026', 'Découvrez nos derniers produits et services pour l''industrie Agroalimentaire.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '9e33b395-69a0-4fd5-b7af-ea03d36bf5e3'),
('0b17acf2-2802-41a5-b91f-4debf001daeb', 'Catalogue Électronique 2026', 'Découvrez nos derniers produits et services pour l''industrie Électronique.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '409fea92-5686-4917-9963-0c908afdf276'),
('09a6a1f4-bb3e-4e81-9fa8-3bc054487fb4', 'Catalogue Textile 2026', 'Découvrez nos derniers produits et services pour l''industrie Textile.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '65390834-baa2-4327-aff9-a8306088abbd'),
('e142f6a6-1117-41b7-9ead-b235f6ccede0', 'Catalogue Textile 2026', 'Découvrez nos derniers produits et services pour l''industrie Textile.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'c4b7e59c-9ccd-44ed-9ab8-ccf77782fba8'),
('67b01c5d-3a9a-4d26-9449-d3aee5e8acae', 'Catalogue Plasturgie 2026', 'Découvrez nos derniers produits et services pour l''industrie Plasturgie.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '7f63e1f5-1799-4f0d-a3e3-c8ee6f82aef7'),
('ea41b694-c913-490b-970b-e0515c8a5d2c', 'Catalogue Chimie 2026', 'Découvrez nos derniers produits et services pour l''industrie Chimie.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '52b880fc-42ee-47a0-8f76-cc1fdc9aa0a3'),
('6efb7c50-d74c-455c-b472-b2121c18fb9d', 'Catalogue Énergie 2026', 'Découvrez nos derniers produits et services pour l''industrie Énergie.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'cde07c2e-72d4-463d-9eb9-b741bc38a053'),
('0b8ffc67-9ab3-4ef3-af02-dce8f1d28b6a', 'Catalogue Plasturgie 2026', 'Découvrez nos derniers produits et services pour l''industrie Plasturgie.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '9bd6a643-7462-4a9d-a4b1-4ea22d1ec1e9'),
('f7a3e061-ba47-4f4a-8435-b868f9189db2', 'Catalogue Énergie 2026', 'Découvrez nos derniers produits et services pour l''industrie Énergie.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '3c2f8bf1-945f-4b59-84d7-174bc55ebbc7'),
('4bdf8ead-9695-4d89-87e3-b4b70546c5d3', 'Catalogue Textile 2026', 'Découvrez nos derniers produits et services pour l''industrie Textile.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '88510d4f-2f25-474a-bcc7-8259afe3cea0'),
('04e28b5f-79cf-47bd-a037-6c0458f71a7d', 'Catalogue Métallurgie 2026', 'Découvrez nos derniers produits et services pour l''industrie Métallurgie.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '7f137be0-45f8-432a-84d8-0dac5acab958'),
('2e828f35-7a1c-48c4-bd77-196a4512373d', 'Catalogue Énergie 2026', 'Découvrez nos derniers produits et services pour l''industrie Énergie.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'cde07c2e-72d4-463d-9eb9-b741bc38a053'),
('fae7036f-2196-41ab-803a-1e301b393eec', 'Catalogue Électronique 2026', 'Découvrez nos derniers produits et services pour l''industrie Électronique.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'e9c3f12d-2c06-4e22-82fa-69d20504604d'),
('3b9e90e9-67f4-4832-b4c5-b33916017f6a', 'Catalogue Textile 2026', 'Découvrez nos derniers produits et services pour l''industrie Textile.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '88510d4f-2f25-474a-bcc7-8259afe3cea0'),
('08b3912f-f70b-47e0-bb47-94e760078f37', 'Catalogue Chimie 2026', 'Découvrez nos derniers produits et services pour l''industrie Chimie.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '7ecdb100-a56b-4057-83b6-580abd73ebcd'),
('cd262f95-418a-48ae-8e53-5c858e05a1fb', 'Catalogue Automobile 2026', 'Découvrez nos derniers produits et services pour l''industrie Automobile.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'e0925171-06c6-46e2-a6d2-16b5d0cdde52'),
('9a4a7095-1570-41d9-8932-deea8774d7cc', 'Catalogue Automobile 2026', 'Découvrez nos derniers produits et services pour l''industrie Automobile.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '0d66bee5-17c2-4882-b9b6-31b8fb8c1559'),
('917ce79a-e05e-4eb5-9512-1f0c2c0ce375', 'Catalogue BTPH 2026', 'Découvrez nos derniers produits et services pour l''industrie BTPH.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '4fa7979e-f5f6-447c-a96f-df7f0118032f'),
('1b900134-3b42-445f-9a03-e24b473cb1cf', 'Catalogue Automobile 2026', 'Découvrez nos derniers produits et services pour l''industrie Automobile.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '9f5f62a0-4511-40d4-b3f7-fff2b5ba0440'),
('6abecee7-50bd-44d8-94c3-d5c7c2b10e80', 'Catalogue Textile 2026', 'Découvrez nos derniers produits et services pour l''industrie Textile.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'dbbd0e16-1057-44d5-8367-fc824e90edde'),
('0dbd837c-3be4-491f-a7c2-ca2753a10217', 'Catalogue Électronique 2026', 'Découvrez nos derniers produits et services pour l''industrie Électronique.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '4ca3e6b6-f311-4d20-b404-125d875df22b'),
('e3cae6ee-433a-4302-a505-8812d494b69c', 'Catalogue Plasturgie 2026', 'Découvrez nos derniers produits et services pour l''industrie Plasturgie.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '7f63e1f5-1799-4f0d-a3e3-c8ee6f82aef7');


-- Create audit_logs table for administrative logging
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_email TEXT,
    action TEXT NOT NULL,
    ip_address TEXT,
    details JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create policy
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access to backend" ON public.audit_logs;
CREATE POLICY "Full access to backend" ON public.audit_logs FOR ALL USING (true);


