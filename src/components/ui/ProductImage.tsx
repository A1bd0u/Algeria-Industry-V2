import type React from 'react';
import { Cpu, HardHat, ImageOff, Package, Truck, Wrench } from 'lucide-react';
import { useState } from 'react';
import { productCategories } from '../../data/productCategories';
import { cn } from '../../lib/utils';

// Visuel d'un produit. Sans photo (ou si elle ne charge pas), on affiche
// l'icône du groupe de la catégorie sur un fond doux plutôt qu'un logo géant.
const GROUP_STYLE: Record<string, { icon: React.ElementType; tint: string }> = {
  A: { icon: Package, tint: 'bg-amber-50 text-amber-600' },
  B: { icon: Wrench, tint: 'bg-orange-50 text-secondary' },
  C: { icon: Cpu, tint: 'bg-sky-50 text-sky-600' },
  D: { icon: Truck, tint: 'bg-emerald-50 text-emerald-600' },
  E: { icon: HardHat, tint: 'bg-violet-50 text-violet-600' },
};

const groupOf = (category?: string | null) =>
  productCategories.find((g) => g.name === category || g.subCategories.some((s) => s.name === category))?.id;

interface ProductImageProps {
  src?: string | null;
  alt: string;
  category?: string | null;
  className?: string;
  imgClassName?: string;
  iconClassName?: string;
}

const isUsable = (src?: string | null) => Boolean(src) && !/\/(placeholder|favicon)\.svg$/.test(src as string);

const ProductImage = ({ src, alt, category, className, imgClassName, iconClassName }: ProductImageProps) => {
  const [failed, setFailed] = useState(false);
  if (isUsable(src) && !failed) {
    return (
      <img
        src={src as string}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn('w-full h-full object-cover', className, imgClassName)}
      />
    );
  }
  const style = GROUP_STYLE[groupOf(category) || ''] || { icon: failed ? ImageOff : Package, tint: 'bg-gray-50 text-gray-400' };
  const Icon = style.icon;
  return (
    <div className={cn('w-full h-full flex items-center justify-center', style.tint, className)} role="img" aria-label={alt}>
      <Icon className={cn('h-10 w-10 opacity-70', iconClassName)} aria-hidden="true" />
    </div>
  );
};

export default ProductImage;

// Avatar d'entreprise : logo s'il existe, sinon initiales.
export const CompanyAvatar = ({ src, name, className }: { src?: string | null; name: string; className?: string }) => {
  const [failed, setFailed] = useState(false);
  if (isUsable(src) && !failed) {
    return <img src={src as string} alt={name} loading="lazy" onError={() => setFailed(true)} className={cn('object-contain bg-white', className)} />;
  }
  const initials = name.split(/\s+/).filter((w) => !/^(sarl|eurl|spa|snc|sa|ets|ste)$/i.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  return (
    <div className={cn('flex items-center justify-center bg-primary text-white font-black', className)} aria-hidden="true">
      {initials}
    </div>
  );
};
