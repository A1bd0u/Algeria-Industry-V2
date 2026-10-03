// Nomenclature Industigo : huit grands secteurs pensés pour le tissu
// industriel algérien (agroalimentaire, BTP, hydrocarbures, mécanique,
// chimie et pharmacie, électrique, numérique, services). Les produits
// stockent le libellé français de la sous-catégorie.
export const productCategories = [
  {
    id: 'A',
    name: 'Agroalimentaire & Agriculture',
    subCategories: [
      { id: 'A1', name: 'Ingrédients & matières premières agricoles' },
      { id: 'A2', name: 'Machines agroalimentaires & lignes de conditionnement' },
      { id: 'A3', name: 'Matériel agricole, irrigation & serres' },
      { id: 'A4', name: 'Froid industriel & stockage' },
      { id: 'A5', name: 'Boissons, laiterie & minoterie' }
    ]
  },
  {
    id: 'B',
    name: 'BTP & Matériaux de construction',
    subCategories: [
      { id: 'B1', name: 'Ciment, granulats & béton' },
      { id: 'B2', name: 'Acier de construction, rond à béton & profilés' },
      { id: 'B3', name: 'Engins de chantier & levage' },
      { id: 'B4', name: 'Second œuvre : menuiserie, carrelage, isolation' },
      { id: 'B5', name: 'Plomberie, sanitaire & robinetterie' }
    ]
  },
  {
    id: 'C',
    name: 'Énergie, Mines & Hydrocarbures',
    subCategories: [
      { id: 'C1', name: 'Équipements pétroliers & gaziers' },
      { id: 'C2', name: 'Énergies renouvelables : solaire, éolien, stockage' },
      { id: 'C3', name: 'Production & distribution électrique' },
      { id: 'C4', name: 'Mines, carrières & forage' }
    ]
  },
  {
    id: 'D',
    name: 'Mécanique, Métallurgie & Machines',
    subCategories: [
      { id: 'D1', name: 'Machines-outils & usinage' },
      { id: 'D2', name: 'Pièces mécaniques, roulements & transmission' },
      { id: 'D3', name: 'Hydraulique & pneumatique' },
      { id: 'D4', name: 'Manutention, levage & stockage' },
      { id: 'D5', name: 'Pièces automobiles & poids lourds' },
      { id: 'D6', name: 'Fonderie, chaudronnerie & métaux' }
    ]
  },
  {
    id: 'E',
    name: 'Chimie, Plasturgie & Pharmacie',
    subCategories: [
      { id: 'E1', name: 'Chimie de base & produits industriels' },
      { id: 'E2', name: 'Plastiques, caoutchouc & polymères' },
      { id: 'E3', name: 'Industrie pharmaceutique & dispositifs médicaux' },
      { id: 'E4', name: 'Peintures, détergents & cosmétiques' }
    ]
  },
  {
    id: 'F',
    name: 'Électrique, Électronique & Automatisme',
    subCategories: [
      { id: 'F1', name: 'Composants électroniques & capteurs' },
      { id: 'F2', name: 'Automates, robotique & IoT industriel' },
      { id: 'F3', name: 'Matériel électrique, câbles & éclairage' },
      { id: 'F4', name: 'Électroménager, climatisation & froid' }
    ]
  },
  {
    id: 'G',
    name: 'Numérique & Technologies',
    subCategories: [
      { id: 'G1', name: 'Logiciels de gestion : ERP, CRM, paie' },
      { id: 'G2', name: 'Cloud, hébergement & centres de données' },
      { id: 'G3', name: 'Cybersécurité' },
      { id: 'G4', name: 'Intelligence artificielle & données' },
      { id: 'G5', name: 'Télécoms & réseaux' },
      { id: 'G6', name: 'Matériel informatique & bureautique' }
    ]
  },
  {
    id: 'H',
    name: 'Services, Logistique & Emballage',
    subCategories: [
      { id: 'H1', name: 'Transport, logistique & transit' },
      { id: 'H2', name: 'Emballage & conditionnement' },
      { id: 'H3', name: 'Maintenance industrielle' },
      { id: 'H4', name: 'Ingénierie, conseil & certification (ISO, HSE)' },
      { id: 'H5', name: 'EPI, hygiène & sécurité' },
      { id: 'H6', name: 'Textile, cuir & vêtements professionnels' }
    ]
  }
];

// Les produits stockent le libellé français de la sous-catégorie : on retrouve
// son identifiant pour l'afficher dans la langue de l'interface.
const idByName = new Map<string, string>(
  productCategories.flatMap((group) => [
    [group.name, group.id] as [string, string],
    ...group.subCategories.map((sub) => [sub.name, sub.id] as [string, string]),
  ])
);

export const categoryLabel = (t: (key: string, options?: any) => string, value?: string | null) => {
  if (!value || value === 'Non catégorisé') return t('productCategories.uncategorized');
  const id = idByName.get(value);
  return id ? t(`productCategories.${id}`) : value;
};

// Un filtre peut viser une sous-catégorie ou un groupe entier (menu
// « Produits ») : un groupe couvre toutes ses sous-catégories.
export const categoryMatches = (filter: string, value?: string | null) => {
  if (!value) return false;
  if (filter === value) return true;
  const group = productCategories.find((g) => g.name === filter);
  return Boolean(group && group.subCategories.some((sub) => sub.name === value));
};

// Groupe (A à H) d'une catégorie stockée en libellé : nom de groupe ou de
// sous-catégorie. Sert au ciblage des annonces par catégorie.
export const categoryGroupId = (value?: string | null): string | null => {
  if (!value) return null;
  const id = idByName.get(value) || (productCategories.some((g) => g.id === value) ? value : undefined);
  return id ? id.charAt(0) : null;
};

// Adresses lisibles des pages secteurs (/secteurs/:slug).
export const SECTOR_SLUGS: Record<string, string> = {
  A: 'agroalimentaire-agriculture',
  B: 'btp-materiaux',
  C: 'energie-mines-hydrocarbures',
  D: 'mecanique-metallurgie',
  E: 'chimie-plasturgie-pharmacie',
  F: 'electrique-electronique',
  G: 'numerique-technologies',
  H: 'services-logistique',
};

export const sectorPath = (groupId: string) => `/secteurs/${SECTOR_SLUGS[groupId]}`;

export const sectorBySlug = (slug?: string | null) =>
  productCategories.find((g) => SECTOR_SLUGS[g.id] === slug) || null;
