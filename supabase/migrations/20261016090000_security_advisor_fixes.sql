-- Corrige les alertes de sécurité du linter Supabase.
-- Le serveur accède à la base avec la clé service_role, qui ignore RLS :
-- ces restrictions ne visent que l'accès direct à l'API (rôles anon et authenticated).

-- 1. Codes d'inscription et jetons de réinitialisation : réservés au serveur.
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.password_reset_tokens FROM anon, authenticated;
REVOKE ALL ON public.email_verification_codes FROM anon, authenticated;

-- 2. Vues : celle des appels d'offres (fonctionnalité retirée) est supprimée ;
--    les deux autres appliquent désormais les droits de l'appelant.
-- En production (3 octobre 2026), la suppression n'a pas pu passer par l'outil
-- d'administration : la vue y est neutralisée (security_invoker, droits retirés)
-- et le DROP ci-dessous la retirera au prochain passage de la migration.
ALTER VIEW IF EXISTS public.vw_active_tenders SET (security_invoker = true);
DO $$ BEGIN
  IF to_regclass('public.vw_active_tenders') IS NOT NULL THEN
    REVOKE ALL ON public.vw_active_tenders FROM anon, authenticated;
  END IF;
END $$;
DROP VIEW IF EXISTS public.vw_active_tenders;
ALTER VIEW IF EXISTS public.vw_product_details SET (security_invoker = true);
ALTER VIEW IF EXISTS public.vw_company_stats SET (security_invoker = true);

-- 3. Fonctions SECURITY DEFINER : plus appelables directement via /rest/v1/rpc.
--    Les politiques RLS qui les utilisent refusent alors l'accès aux rôles publics.
REVOKE EXECUTE ON FUNCTION public.get_current_user_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM PUBLIC, anon, authenticated;

-- 4. search_path figé sur les fonctions signalées.
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('update_updated_at_column', 'get_admin_dashboard_stats', 'get_current_user_id',
                        'get_current_user_role', 'protect_user_privileged_columns', 'next_invoice_number')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', f.sig);
  END LOOP;
END $$;
