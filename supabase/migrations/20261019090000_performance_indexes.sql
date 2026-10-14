-- Index de performance : requêtes publiques les plus fréquentes et clés
-- étrangères sans index (signalées par l'analyseur Supabase). Aucune donnée
-- n'est modifiée ; chaque index est créé seulement s'il n'existe pas.

-- Catalogue : produits publiés, du plus récent au plus ancien, avec ou sans catégorie.
CREATE INDEX IF NOT EXISTS idx_products_status_created ON public.products (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_status_created ON public.products (category, status, created_at DESC);

-- Annuaire : entreprises vérifiées, de la plus récente à la plus ancienne.
CREATE INDEX IF NOT EXISTS idx_companies_status_created ON public.companies (status, created_at DESC);

-- Messagerie : fil d'une conversation dans l'ordre.
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages (conversation_id, created_at);

-- Clés étrangères consultées ou supprimées en cascade.
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_catalogues_owner_id ON public.catalogues (owner_id);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_user_id ON public.kyc_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_company_id ON public.kyc_documents (company_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_audience_events_product_id ON public.audience_events (product_id);
CREATE INDEX IF NOT EXISTS idx_audience_events_catalogue_id ON public.audience_events (catalogue_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_company_id ON public.api_keys (company_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_company_id ON public.webhooks (company_id);
CREATE INDEX IF NOT EXISTS idx_catalog_feeds_company_id ON public.catalog_feeds (company_id);
