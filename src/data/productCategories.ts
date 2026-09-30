export const productCategories = [
  {
    id: 'A',
    name: 'Matières Premières & Semi-produits',
    subCategories: [
      { id: 'A1', name: 'Métaux (acier, aluminium, cuivre, etc.)' },
      { id: 'A2', name: 'Chimie de base (acides, solvants, polymères)' },
      { id: 'A3', name: 'Matériaux de construction (ciment, briques, verre)' },
      { id: 'A4', name: 'Textiles bruts & cuirs' },
      { id: 'A5', name: 'Produits agricoles bruts' }
    ]
  },
  {
    id: 'B',
    name: 'Équipements & Machines Industrielles',
    subCategories: [
      { id: 'B1', name: 'Machines-outils : Tours, fraiseuses, presses.' },
      { id: 'B2', name: 'Équipements de production : Lignes de montage, robots industriels.' },
      { id: 'B3', name: 'Engins de chantier & BTP : Pelles, bulldozers, grues.' },
      { id: 'B4', name: 'Équipements agricoles : Tracteurs, moissonneuses.' },
      { id: 'B5', name: 'Matériel de manutention : Chariots élévateurs, convoyeurs.' }
    ]
  },
  {
    id: 'C',
    name: 'Composants & Pièces Détachées',
    subCategories: [
      { id: 'C1', name: 'Composants électroniques : Capteurs, microcontrôleurs, cartes.' },
      { id: 'C2', name: 'Pièces mécaniques : Engrenages, roulements, joints.' },
      { id: 'C3', name: 'Pièces automobiles : Moteurs, freins, systèmes électriques.' },
      { id: 'C4', name: 'Équipements hydrauliques & pneumatiques.' }
    ]
  },
  {
    id: 'D',
    name: 'Services aux Entreprises',
    subCategories: [
      { id: 'D1', name: 'Maintenance industrielle : Réparation, entretien préventif.' },
      { id: 'D2', name: 'Ingénierie & Bureau d\'études : Conception, prototypage.' },
      { id: 'D3', name: 'Logistique & Transport : Stockage, distribution, fret.' },
      { id: 'D4', name: 'Conseil & Formation : Management, certifications, sécurité.' },
      { id: 'D5', name: 'Sous-traitance industrielle : Traitement de surface, usinage, etc.' },
      { id: 'D6', name: 'Informatique industrielle : Logiciels, automatisation, IA.' }
    ]
  },
  {
    id: 'E',
    name: 'Consommables & Fournitures',
    subCategories: [
      { id: 'E1', name: 'Outillage : Outils à main, outillage électroportatif.' },
      { id: 'E2', name: 'Produits d\'entretien & hygiène : Nettoyants, lubrifiants.' },
      { id: 'E3', name: 'Équipements de protection (EPI) : Casques, gants, chaussures de sécurité.' },
      { id: 'E4', name: 'Emballages : Cartons, films, palettes.' },
      { id: 'E5', name: 'Fournitures de bureau.' }
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
