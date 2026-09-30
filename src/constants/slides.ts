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

// Le bandeau d'accueil n'affiche que les annonces publicitaires validées
// (/api/campaigns), chargées par HeroSlider.
