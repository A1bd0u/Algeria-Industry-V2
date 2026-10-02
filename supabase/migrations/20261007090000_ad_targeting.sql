-- Ciblage des annonces : groupes de pages (accueil, catalogue, fournisseurs,
-- contenus) et groupes de catégories produit (A à E). Tableau vide = partout.
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS placements TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}';

-- Les annonces existantes ont été prévues pour l'accueil seulement.
UPDATE public.ads SET placements = ARRAY['home'] WHERE placements = '{}';
