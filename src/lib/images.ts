// Variantes WebP connues d'une image : photos de démonstration (public/demo,
// converties à la construction) et photos déposées après conversion serveur
// (« <horodatage>-<hex>.webp » + « -480.webp »). Une URL externe ou plus
// ancienne n'a pas de variante : elle est affichée telle quelle.
export interface ImageVariants {
  full: string; // WebP pleine taille
  small: string; // WebP 480 px de large
  width: number; // largeur de la version pleine taille
  fallback?: string; // original JPEG/PNG pour les navigateurs sans WebP
}

const DEMO = /^\/demo\/[^?#]+\.(jpe?g|png)$/i;
const UPLOAD = /\/storage\/v1\/object\/public\/product-images\/[^?#]+\/\d+-[0-9a-f]{16}\.webp$/;

export const imageVariants = (src?: string | null): ImageVariants | null => {
  if (!src) return null;
  if (DEMO.test(src)) {
    const base = src.replace(/\.(jpe?g|png)$/i, '');
    return { full: `${base}.webp`, small: `${base}-480.webp`, width: /\/banner\.\w+$/.test(src) ? 1600 : 800, fallback: src };
  }
  if (UPLOAD.test(src)) return { full: src, small: src.replace(/\.webp$/, '-480.webp'), width: 1600 };
  return null;
};
