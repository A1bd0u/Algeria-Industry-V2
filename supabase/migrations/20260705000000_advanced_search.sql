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
