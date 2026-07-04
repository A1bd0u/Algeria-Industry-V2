export interface Slide {
  id: number;
  bgGradient: string;
  productImg: string;
  title: string;
  subtitle: string;
  description: string;
  brandLogo: string;
  brandName: string;
  brandTagline: string;
}

export const DEFAULT_SLIDES: Slide[] = [
  {
    id: 1,
    bgGradient: "from-[#004a99] to-[#0066cc]",
    productImg: "https://picsum.photos/seed/industrial-part/600/600",
    title: "DOOR HANDLE SYSTEM DHS",
    subtitle: "WITH SOLENOID INTERLOCK AZM40",
    description: "ERGONOMIC AND SEAMLESS INTEGRATION",
    brandLogo: "https://picsum.photos/seed/brand1/200/80",
    brandName: "SCHMERSAL",
    brandTagline: "THE DNA OF SAFETY"
  },
  {
    id: 2,
    bgGradient: "from-[#1a1a1a] to-[#333333]",
    productImg: "https://picsum.photos/seed/robot-arm/600/600",
    title: "ROBOTIC ARM SERIES X",
    subtitle: "HIGH PRECISION AUTOMATION",
    description: "REVOLUTIONIZING SMART MANUFACTURING",
    brandLogo: "https://picsum.photos/seed/brand2/200/80",
    brandName: "FANUC",
    brandTagline: "INTELLIGENT ROBOTICS"
  },
  {
    id: 3,
    bgGradient: "from-[#b91c1c] to-[#ef4444]",
    productImg: "https://picsum.photos/seed/engine/600/600",
    title: "V12 INDUSTRIAL ENGINE",
    subtitle: "MAXIMUM POWER OUTPUT",
    description: "RELIABLE ENERGY FOR HEAVY INDUSTRY",
    brandLogo: "https://picsum.photos/seed/brand3/200/80",
    brandName: "CATERPILLAR",
    brandTagline: "BUILT FOR IT"
  }
];

export const DIRECTORY_SLIDES: Slide[] = [
  {
    id: 1,
    bgGradient: "from-[#0f172a] to-[#334155]",
    productImg: "https://picsum.photos/seed/factory/600/600",
    title: "ANNUAIRE INDUSTRIEL",
    subtitle: "TROUVEZ VOS PARTENAIRES",
    description: "PLUS DE 5000 ENTREPRISES RÉFÉRENCÉES",
    brandLogo: "https://picsum.photos/seed/algeria/200/80",
    brandName: "ALGERIA INDUSTRY",
    brandTagline: "LE RÉSEAU N°1"
  }
];

export const PRODUCTS_SLIDES: Slide[] = [
  {
    id: 1,
    bgGradient: "from-[#064e3b] to-[#065f46]",
    productImg: "https://picsum.photos/seed/tools/600/600",
    title: "CATALOGUE PRODUITS",
    subtitle: "ÉQUIPEMENTS DE POINTE",
    description: "SOURCING DIRECT AUPRÈS DES FABRICANTS",
    brandLogo: "https://picsum.photos/seed/tools-logo/200/80",
    brandName: "EQUIP DZ",
    brandTagline: "QUALITÉ INDUSTRIELLE"
  }
];

export const TENDERS_SLIDES: Slide[] = [
  {
    id: 1,
    bgGradient: "from-[#431407] to-[#78350f]",
    productImg: "https://picsum.photos/seed/contract/600/600",
    title: "APPELS D'OFFRES",
    subtitle: "OPPORTUNITÉS D'AFFAIRES",
    description: "NE MANQUEZ AUCUN MARCHÉ PUBLIC OU PRIVÉ",
    brandLogo: "https://picsum.photos/seed/tender-logo/200/80",
    brandName: "DZ TENDERS",
    brandTagline: "VOTRE SUCCÈS COMMENCE ICI"
  }
];

export const SLIDES_BY_PATH: Record<string, Slide[]> = {
  "/": DEFAULT_SLIDES,
  "/directory": DIRECTORY_SLIDES,
  "/products": PRODUCTS_SLIDES,
  "/tenders": TENDERS_SLIDES,
  "/catalogues": PRODUCTS_SLIDES,
};
