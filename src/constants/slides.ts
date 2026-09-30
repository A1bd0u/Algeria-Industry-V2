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
  // Slides éditoriaux : textes lus dans les traductions (slides.<clé>.*).
  i18nKey?: string;
}

// Slides éditoriaux de la plateforme. Les emplacements publicitaires réels
// (/api/campaigns) sont ajoutés dynamiquement par HeroSlider.
export const DEFAULT_SLIDES: Slide[] = [
  {
    id: 1,
    bgGradient: "from-[#1a1a1a] to-[#333333]",
    productImg: "/placeholder.svg",
    title: "",
    subtitle: "",
    description: "",
    brandLogo: "/favicon.svg",
    brandName: "ALGERIA INDUSTRY",
    brandTagline: "",
    i18nKey: "suppliers"
  },
  {
    id: 2,
    bgGradient: "from-[#0f172a] to-[#334155]",
    productImg: "/placeholder.svg",
    title: "",
    subtitle: "",
    description: "",
    brandLogo: "/favicon.svg",
    brandName: "ALGERIA INDUSTRY",
    brandTagline: "",
    i18nKey: "founder"
  }
];

// Carrousel sur l'accueil uniquement (performance mobile, LCP).
export const SLIDES_BY_PATH: Record<string, Slide[]> = {
  "/": DEFAULT_SLIDES,
};
