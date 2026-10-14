import sharp from 'sharp';

// Photo publique en WebP : version pleine taille (1600 px max, orientation
// EXIF appliquée, métadonnées retirées) et version 480 px pour les cartes.
export const toWebpVariants = async (input: Buffer) => {
  const base = sharp(input, { failOn: 'error' }).rotate();
  const [full, small] = await Promise.all([
    base.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
    base.clone().resize({ width: 480, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer(),
  ]);
  return { full, small };
};
