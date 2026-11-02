-- Analytique détaillée et journaux d'activité, réservés à la console admin.
-- Migration rejouable.
--
-- 1. analytics_events : parcours des visiteurs sur le site (pages vues, clics,
--    recherches, temps passé, défilement, erreurs JavaScript).
--    Sans consentement (bandeau cookies) : anonyme, aucun identifiant stocké
--    sur l'appareil, session limitée à l'onglet ouvert, ni compte ni IP.
--    Avec consentement : identifiant de visiteur et compte connecté rattachés.
--    L'adresse IP n'est jamais enregistrée, seul le pays l'est.
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT NOT NULL,
  visitor_id TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  event_type TEXT NOT NULL,
  path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  label TEXT,
  target TEXT,
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  device TEXT,
  screen TEXT,
  viewport TEXT,
  language TEXT,
  country TEXT,
  duration_ms INTEGER,
  scroll_depth SMALLINT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analytics_events_type_check') THEN
    ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_type_check
      CHECK (event_type IN ('pageview', 'page_leave', 'click', 'search', 'form_submit', 'outbound', 'download', 'error', 'custom'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_session_idx ON public.analytics_events (session_id, created_at);
CREATE INDEX IF NOT EXISTS analytics_events_user_idx ON public.analytics_events (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_events_type_idx ON public.analytics_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_path_idx ON public.analytics_events (path);

-- 2. activity_logs : journal serveur des actions (connexion, inscription,
--    écritures via l'API) et des erreurs. Sans adresse IP.
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL DEFAULT 'info',
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_role TEXT,
  method TEXT,
  path TEXT,
  status INTEGER,
  duration_ms INTEGER,
  browser TEXT,
  os TEXT,
  device TEXT,
  country TEXT,
  request_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_level_check') THEN
    ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_level_check
      CHECK (level IN ('info', 'warn', 'error'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_user_idx ON public.activity_logs (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS activity_logs_level_idx ON public.activity_logs (level, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_category_idx ON public.activity_logs (category, created_at DESC);

-- Lecture et écriture réservées au backend (service_role) : aucune politique.
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
