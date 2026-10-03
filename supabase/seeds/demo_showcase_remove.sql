-- Retire la vitrine de démonstration (entreprises fictives et leurs produits).
BEGIN;
DELETE FROM public.products WHERE company_id IN (SELECT id FROM public.companies WHERE reference_id LIKE 'DEMO-%');
DELETE FROM public.companies WHERE reference_id LIKE 'DEMO-%';
COMMIT;
