import type React from 'react';
import { imageVariants } from '../../lib/images';

type ImgProps = React.ImgHTMLAttributes<HTMLImageElement> & { src?: string | null };

// <img> qui sert la variante WebP adaptée à la largeur d'affichage (« sizes »)
// quand elle existe ; sinon l'image d'origine, sans changement.
const Img = ({ src, sizes = '100vw', ...rest }: ImgProps) => {
  const variants = imageVariants(src);
  if (!variants) return <img src={src || undefined} {...rest} />;
  const srcSet = `${variants.small} 480w, ${variants.full} ${variants.width}w`;
  if (!variants.fallback) return <img src={src as string} srcSet={srcSet} sizes={sizes} {...rest} />;
  return (
    <picture className="contents">
      <source type="image/webp" srcSet={srcSet} sizes={sizes} />
      <img src={src as string} {...rest} />
    </picture>
  );
};

export default Img;
