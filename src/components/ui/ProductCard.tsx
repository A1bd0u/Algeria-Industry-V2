import type React from 'react';
import { Check, Eye, GitCompare, Sparkles, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toCompareItem, useComparison } from '../../context/ComparisonContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';
import { categoryLabel } from '../../data/productCategories';
import { cn, generateSlugUrl, productCover } from '../../lib/utils';
import ProductImage from './ProductImage';

// Carte produit commune (accueil, secteurs, catalogue) : photo, badge
// « Nouveau », fournisseur, prix ou « Sur devis », bouton « Comparer » ; en
// option, favori et aperçu rapide. Pas de badge « Vérifié » : seules les entreprises vérifiées
// sont publiées.

const NEW_DAYS = 7;

export const isNewProduct = (createdAt?: string | null) =>
  Boolean(createdAt) && Date.now() - Date.parse(createdAt as string) < NEW_DAYS * 86_400_000;

export const companyNameOf = (p: any): string | null =>
  p.company_name || p.companyName || (typeof p.company === 'string' ? p.company : p.company?.name) || null;

interface ProductCardProps {
  product: any;
  layout?: 'grid' | 'list';
  onQuickView?: (product: any) => void;
  favorite?: { active: boolean; onToggle: (e: React.MouseEvent) => void };
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, layout = 'grid', onQuickView, favorite, className }) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { isCompared, toggleCompare } = useComparison();
  const toast = useToast();
  const compared = isCompared(String(product.id));
  const onCompare = () => {
    if (toggleCompare(toCompareItem(product)) === 'full') toast.info(t('products.detail.compareFull'));
  };
  const href = `/products/${generateSlugUrl(product.name, product.id)}`;
  const company = companyNameOf(product);
  const isNew = isNewProduct(product.created_at);
  const priced = Number(product.price) > 0;
  const list = layout === 'list';

  return (
    <article className={cn(
      'group flex rounded-2xl bg-white border border-border-tech hover:border-secondary hover:shadow-xl transition-all',
      list ? 'flex-row gap-4 p-3' : 'flex-col p-3',
      className,
    )}>
      <div className={cn('relative shrink-0', list ? 'w-28 sm:w-44' : 'mb-4')}>
        <Link to={href} className="block aspect-square overflow-hidden rounded-xl bg-gray-100" tabIndex={-1} aria-hidden="true">
          <ProductImage src={productCover(product)} alt="" category={product.category}
            imgClassName="group-hover:scale-105 transition-transform duration-500" />
        </Link>
        {isNew && (
          <span className="absolute top-2 start-2 inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-bold text-white">
            <Sparkles className="h-3 w-3" aria-hidden="true" /> {t('products.badges.new')}
          </span>
        )}
        {favorite && (
          <button
            type="button"
            onClick={favorite.onToggle}
            aria-label={t('products.detail.favorite')}
            aria-pressed={favorite.active}
            className={cn(
              'absolute top-2 end-2 h-8 w-8 rounded-full bg-white/95 shadow-md flex items-center justify-center',
              favorite.active ? 'text-secondary' : 'text-gray-500 hover:text-secondary',
            )}
          >
            <Star className="h-4 w-4" fill={favorite.active ? 'currentColor' : 'none'} />
          </button>
        )}
        {onQuickView && (
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 hidden lg:inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-primary shadow-md border border-border-tech opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:text-secondary"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" /> {t('products.quickView')}
          </button>
        )}
      </div>
      <div className={cn('flex flex-col flex-1 min-w-0', list ? 'py-1' : 'px-1')}>
        {company && (
          <p className="text-xs text-gray-500 truncate mb-1">
            {company}
          </p>
        )}
        <h3 className={cn('font-bold text-primary', list ? 'text-base line-clamp-2' : 'text-sm line-clamp-2 min-h-[2.5rem]')}>
          <Link to={href} className="hover:text-secondary transition-colors">{product.name}</Link>
        </h3>
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
          <button
            type="button"
            onClick={onCompare}
            aria-pressed={compared}
            title={compared ? t('products.detail.compared') : t('common.compare')}
            className={cn(
              'shrink-0 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors',
              compared ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border-tech text-gray-500 hover:border-secondary hover:text-secondary',
            )}
          >
            {compared ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />}
            <span className="hidden sm:inline">{compared ? t('products.detail.compared') : t('common.compare')}</span>
            <span className="sr-only sm:hidden">{compared ? t('products.detail.compared') : t('common.compare')}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
