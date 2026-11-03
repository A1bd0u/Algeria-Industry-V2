-- Offre Starter (10 000 DA/an) : autorise le plan « starter » sur les abonnements.
-- Prix 2027 : Starter 10 000, Basic 19 000, Pro 35 000 DA par an. Pas d'offre gratuite
-- pour les fournisseurs (companies.plan = 'free' signifie « sans abonnement actif »).
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions
    ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('starter', 'basic', 'pro', 'founder'));
