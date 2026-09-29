-- ==============================================================================
-- MIGRATION : double authentification (TOTP)
-- ------------------------------------------------------------------------------
-- * users.mfa_enabled : lu à chaque requête par le middleware de session ; un
--   admin sans 2FA perd ses droits admin jusqu'à l'activation.
-- * user_mfa : secret TOTP chiffré (AES-256-GCM côté serveur), empreintes des
--   codes de secours, anti-rejeu et verrouillage. RLS activée sans politique :
--   seul le backend (service_role) y accède.
-- ==============================================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.user_mfa (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    secret_enc TEXT,
    pending_secret_enc TEXT,
    pending_created_at TIMESTAMPTZ,
    enabled_at TIMESTAMPTZ,
    last_used_step BIGINT,
    recovery_codes TEXT[] NOT NULL DEFAULT '{}',
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_mfa ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_mfa FROM anon, authenticated;

-- L'utilisateur peut lire son propre indicateur (colonne non sensible) ;
-- seul le backend peut le modifier (aucun GRANT UPDATE).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT SELECT (mfa_enabled) ON public.users TO authenticated;
  END IF;
END $$;
