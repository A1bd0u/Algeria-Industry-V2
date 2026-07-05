-- 1. Create missing tables requested
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
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
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

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
ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.products ADD CONSTRAINT products_price_check CHECK (price >= 0);
ALTER TABLE public.users ADD CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');


-- 5. Add Indexes
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_tenders_company_id ON public.tenders(company_id);
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

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kyc_requests_updated_at BEFORE UPDATE ON public.kyc_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON public.kyc_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_catalogues_updated_at BEFORE UPDATE ON public.catalogues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_favorites_updated_at BEFORE UPDATE ON public.favorites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenders_updated_at BEFORE UPDATE ON public.tenders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfqs_updated_at BEFORE UPDATE ON public.rfqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Views
CREATE OR REPLACE VIEW public.vw_product_details AS
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

CREATE OR REPLACE VIEW public.vw_company_stats AS
SELECT 
    c.id,
    c.name,
    COUNT(DISTINCT p.id) as total_products,
    COUNT(DISTINCT t.id) as total_tenders
FROM public.companies c
LEFT JOIN public.products p ON c.id = p.company_id
LEFT JOIN public.tenders t ON c.id = t.company_id
GROUP BY c.id, c.name;

CREATE OR REPLACE VIEW public.vw_active_tenders AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.deadline,
    t.company_id,
    c.name as company_name
FROM public.tenders t
JOIN public.companies c ON t.company_id = c.id
WHERE t.status = 'open' AND t.deadline >= NOW();
