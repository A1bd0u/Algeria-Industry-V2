import type React from 'react';
import { ArrowRight, BadgeCheck, FileText, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';
import { categoryLabel } from '../../data/productCategories';
import { cn, generateSlugUrl } from '../../lib/utils';
import { companyNameOf } from './ProductCard';
import ProductImage from './ProductImage';

// Aperçu d'un produit sans quitter la liste : photos, prix, fournisseur et
// accès direct à la fiche ou à la demande de devis.
const QuickView: React.FC<{ product: any; onClose: () => void }> = ({ product, onClose }) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const images: string[] = Array.isArray(product.images) && product.images.length ? product.images : [product.file_url].filter(Boolean);
  const [active, setActive] = useState(0);
  const href = `/products/${generateSlugUrl(product.name, product.id)}`;
  const company = companyNameOf(product);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="quick-view-title" onClick={onClose}>
      <div className="relative grid w-full max-w-3xl grid-cols-1 gap-6 overflow-hidden rounded-2xl bg-white p-5 shadow-2xl md:grid-cols-2 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label={t('common.close')} className="absolute top-3 end-3 z-10 rounded-full bg-white p-1.5 text-gray-500 shadow hover:text-primary">
          <X className="h-5 w-5" />
        </button>
        <div>
          <div className="aspect-square overflow-hidden rounded-xl border border-border-tech bg-white">
            {images.length > 0
              ? <img src={images[active]} alt={product.name} className="h-full w-full object-contain" />
              : <ProductImage alt={product.name} category={product.category} iconClassName="h-16 w-16" />}
          </div>
          {images.length > 1 && (
            <div className="mt-2 grid grid-cols-5 gap-2">
              {images.map((url, i) => (
                <button key={url} type="button" onClick={() => setActive(i)} aria-label={`${i + 1} / ${images.length}`}
                  className={cn('aspect-square overflow-hidden rounded-lg border-2', i === active ? 'border-secondary' : 'border-gray-100')}>
                  <img src={url} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-gray-500 mb-1">{categoryLabel(t, product.category)}</p>
          <h2 id="quick-view-title" className="text-xl font-black text-primary leading-tight mb-2">{product.name}</h2>
          {company && (
            <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-4">
              {product.company_verified && <BadgeCheck className="h-4 w-4 text-success" aria-label={t('products.badges.verified')} />}
              {company}{product.region ? ` · ${product.region}` : ''}
            </p>
          )}
          <p className="text-2xl font-black text-primary mb-4">
            {Number(product.price) > 0 ? formatPrice(Number(product.price)) : <span className="text-secondary">{t('common.onQuote')}</span>}
          </p>
          {product.description && <p className="text-sm text-gray-600 line-clamp-6 mb-6 whitespace-pre-line">{product.description}</p>}
          <div className="mt-auto flex flex-col gap-2">
            <Link to={href} onClick={onClose} className="btn-primary py-3">
              <FileText className="h-4 w-4" aria-hidden="true" /> {t('products.detail.requestQuoteShort')}
            </Link>
            <Link to={href} onClick={onClose} className="btn-ghost py-3">
              {t('products.quickViewOpen')} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickView;
