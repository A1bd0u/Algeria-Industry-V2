import type React from 'react';
import { BadgeCheck, Eye, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';
import { categoryLabel } from '../../data/productCategories';
import { cn, generateSlugUrl } from '../../lib/utils';
import ProductImage from './ProductImage';

// Carte produit commune (accueil, secteurs, catalogue) : photo, badges
// « Nouveau » et « Vérifié », fournisseur, prix ou « Sur devis ».

const NEW_DAYS = 14;

export const isNewProduct = (createdAt?: string | null) =>
  Boolean(createdAt) && Date.now() - Date.parse(createdAt as string) < NEW_DAYS * 86_400_000;

export const companyNameOf = (p: any): string | null =>
  p.company_name || p.companyName || (typeof p.company === 'string' ? p.company : p.company?.name) || null;

interface ProductCardProps {
  product: any;
  layout?: 'grid' | 'list';
  onQuickView?: (product: any) => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, layout = 'grid', onQuickView, className }) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const href = `/products/${generateSlugUrl(product.name, product.id)}`;
  const company = companyNameOf(product);
  const verified = Boolean(product.company_verified ?? product.companyVerified);
  const isNew = isNewProduct(product.created_at);
  const priced = Number(product.price) > 0;
  const list = layout === 'list';

  return (
    <div className={cn(
      'group relative flex rounded-2xl bg-white border border-border-tech hover:border-secondary hover:shadow-xl transition-all',
      list ? 'flex-row gap-4 p-3' : 'flex-col p-3',
      className,
    )}>
      <Link to={href} className={cn('relative block overflow-hidden rounded-xl shrink-0', list ? 'w-28 sm:w-40 aspect-square' : 'aspect-square mb-4')}>
        <ProductImage src={product.file_url || product.image} alt={product.name} category={product.category}
          imgClassName="group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-2 start-2 flex flex-wrap gap-1">
          {isNew && (
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-bold text-white">
              <Sparkles className="h-3 w-3" aria-hidden="true" /> {t('products.badges.new')}
            </span>
          )}
        </div>
      </Link>
      {onQuickView && (
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className={cn(
            'absolute z-10 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-bold text-primary shadow-md border border-border-tech',
            'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 transition-opacity hover:text-secondary',
            list ? 'top-3 end-3' : 'top-5 end-5',
          )}
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" /> {t('products.quickView')}
        </button>
      )}
      <div className={cn('flex flex-col flex-1 min-w-0', list ? 'py-1' : 'px-1')}>
        {company && (
          <p className="text-xs text-gray-500 truncate mb-1 flex items-center gap-1">
            {verified && <BadgeCheck className="h-3.5 w-3.5 text-success shrink-0" aria-label={t('products.badges.verified')} />}
            {company}
          </p>
        )}
        <Link to={href}>
          <h3 className={cn('font-bold text-primary group-hover:text-secondary transition-colors', list ? 'text-base line-clamp-2' : 'text-sm line-clamp-2 min-h-[2.5rem]')}>
            {product.name}
          </h3>
        </Link>
        {list && (
          <>
            <p className="text-xs text-gray-500 mt-1">{categoryLabel(t, product.category)}{product.region ? ` · ${product.region}` : ''}</p>
            {product.description && <p className="hidden sm:block text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>}
          </>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <p className="text-sm font-black text-primary">
            {priced ? formatPrice(Number(product.price)) : <span className="text-secondary">{t('common.onQuote')}</span>}
          </p>
          {verified && !list && (
            <span className="text-[11px] font-bold text-success inline-flex items-center gap-0.5">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> {t('products.badges.verified')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
