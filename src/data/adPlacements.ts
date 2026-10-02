// Emplacements du bandeau publicitaire, partagés par le site, la console et
// l'API. Une annonce sans emplacement ni catégorie est diffusée partout.
export const AD_PLACEMENTS = ['home', 'catalog', 'suppliers', 'content'] as const;
export type AdPlacement = typeof AD_PLACEMENTS[number];

export const AD_CATEGORY_GROUPS = ['A', 'B', 'C', 'D', 'E'] as const;

// Groupe de pages d'une URL du site ; null = pas de bandeau sur cette page.
export const adPlacementForPath = (pathname: string): AdPlacement | null => {
  if (pathname === '/') return 'home';
  if (/^\/(products(\/|$)|search$|compare$|secteurs\/)/.test(pathname)) return 'catalog';
  if (/^\/directory(\/|$)/.test(pathname)) return 'suppliers';
  if (/^\/(blog(\/|$)|events$|catalogues$|resources$)/.test(pathname)) return 'content';
  return null;
};

// Une annonce est servie si elle vise cet emplacement (ou tous) et, quand elle
// cible des catégories, si la page en affiche au moins une.
export const adMatches = (
  ad: { placements?: string[] | null; categories?: string[] | null },
  placement: AdPlacement,
  pageCategories: string[],
) => {
  const placements = ad.placements || [];
  const categories = ad.categories || [];
  if (placements.length > 0 && !placements.includes(placement)) return false;
  if (categories.length > 0 && !categories.some((c) => pageCategories.includes(c))) return false;
  return true;
};

// Bannière image : formats conseillés (largeur × hauteur) par emplacement.
// L'accueil a un grand bandeau, les autres pages un bandeau compact.
export const BANNER_FORMATS = {
  home: { desktop: [1920, 480], mobile: [1200, 800] },
  compact: { desktop: [1920, 240], mobile: [1200, 400] },
} as const;
