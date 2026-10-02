-- Galerie produit : plusieurs images ordonnées (la première sert de vignette,
-- recopiée dans file_url pour la compatibilité). Quota par offre : 2, 5 ou 10.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.products
SET images = ARRAY[file_url]
WHERE file_url IS NOT NULL AND file_url <> '' AND images = '{}';
