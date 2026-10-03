-- Coordonnées publiques de l'entreprise affichées sur sa fiche : e-mail et
-- téléphone de contact commercial (distincts de l'e-mail du compte).
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Produits « sur devis » : le formulaire et l'import envoient un prix vide
-- (NULL), refusé jusqu'ici par la contrainte NOT NULL posée en juillet.
ALTER TABLE public.products ALTER COLUMN price DROP NOT NULL;

NOTIFY pgrst, 'reload schema';
