import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Scale,
  Trash2,
  X
} from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MAX_COMPARED, moreToCompareHref, useComparison } from '../context/ComparisonContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../lib/apiError';
import { cn, generateSlugUrl } from '../lib/utils';
import ProductImage from '../components/ui/ProductImage';
import { useAdCategories } from '../context/AdTargetingContext';
import { categoryGroupId } from '../data/productCategories';

const Compare = () => {
  const { comparedProducts: items, removeFromCompare, clearCompare } = useComparison();
  useAdCategories(items.map((p: any) => categoryGroupId(p.category)));
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const toast = useToast();
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  // Une demande de devis va aux fournisseurs des produits comparés, par la
  // messagerie de la plateforme : chacun reçoit la liste de ses produits.
  // Fermer : retour à la page précédente, ou au catalogue si on est arrivé directement.
  const closePage = () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate('/products');
  };

  const requestQuotes = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent('/compare')}`);
      return;
    }
    setSending(true);
    try {
      const res = await axios.post('/api/messages/quote-requests', {
        product_ids: items.map((p) => p.id),
        note: note.trim() || undefined,
      });
      toast.success(t('compare.quoteSent', { count: res.data.sent }));
      setNote('');
    } catch (err: any) {
      toast.error(err?.response ? apiErrorMessage(err.response.data, 'compare.quoteError') : t('common.networkError'));
    } finally {
      setSending(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-bg pt-40 pb-20 flex flex-col items-center justify-center text-center px-4">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-8">
          <Scale className="h-10 w-10 text-gray-200" />
        </div>
        <h2 className="text-3xl font-extrabold text-primary tracking-tight mb-4">{t('compare.emptyTitle')}</h2>
        <p className="text-gray-500 font-medium max-w-xs mb-8 text-xs tracking-widest">
          {t('compare.emptyText')}
        </p>
        <Link to="/products" className="btn-primary px-12 py-4 rounded-xl text-sm font-semibold">
          {t('compare.explore')}
        </Link>
      </div>
    );
  }

  const specKeys: string[] = Array.from(new Set(items.flatMap((p) => Object.keys(p.specs || {}))));
  const hasSeller = items.some((p) => p.sellerId);
  const hasFeatures = items.some((p) => p.features?.length);
  // Moins de 4 produits : une colonne pour en ajouter, depuis le secteur du premier.
  const canAdd = items.length < MAX_COMPARED;
  const moreHref = moreToCompareHref(items[0]?.category);

  return (
    <div className={cn("min-h-screen bg-neutral-bg pt-32 pb-20", i18n.language?.startsWith('ar') && "font-arabic")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-500 hover:text-primary mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              <span className="text-sm font-semibold">{t('compare.back')}</span>
            </button>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">
              {t('compare.title')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearCompare}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 font-semibold text-sm px-6 py-3 bg-red-50 rounded-xl transition-all"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t('compare.clear')}</span>
            </button>
            <button
              type="button"
              onClick={closePage}
              aria-label={t('compare.closePage')}
              title={t('compare.closePage')}
              className="h-11 w-11 shrink-0 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-primary hover:border-primary flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {items.length > 1 && (
          <p className="sm:hidden mb-3 text-xs font-bold text-gray-500">{t('compare.swipeHint', { count: items.length })}</p>
        )}
        <div className="bg-white border border-gray-100 shadow-2xl overflow-x-auto rounded-2xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="p-3 sm:p-8 text-start bg-gray-50 w-28 sm:w-64 sticky start-0 z-10">
                  <span className="text-xs sm:text-sm font-semibold text-primary break-words">{t('compare.specs')}</span>
                </th>
                {items.map((product) => (
                  <th key={product.id} className="p-4 sm:p-8 text-start relative min-w-[190px] sm:min-w-[260px] align-top">
                    <button
                      onClick={() => removeFromCompare(product.id)}
                      aria-label={t('compare.remove')}
                      className="absolute top-4 end-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 sm:mb-6 border border-gray-100 bg-gray-100">
                      <ProductImage src={product.image} alt={product.name} category={product.category} />
                    </div>
                    <p className="text-sm font-semibold text-secondary mb-1">{product.brand}</p>
                    <Link to={`/products/${generateSlugUrl(product.name, product.id)}`} className="block text-primary font-semibold tracking-tight leading-tight mb-4 hover:text-secondary">
                      {product.name}
                    </Link>
                    <span className="text-sm font-bold text-primary">
                      {product.priceValue ? formatPrice(product.priceValue) : t('common.onQuote')}
                    </span>
                  </th>
                ))}
                {canAdd && (
                  <th className="p-4 sm:p-8 align-top min-w-[150px] sm:min-w-[200px]">
                    <Link
                      to={moreHref}
                      className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-secondary hover:text-secondary transition-colors"
                    >
                      <Plus className="h-7 w-7" aria-hidden="true" />
                      <span className="text-sm font-semibold text-center px-2">{t('compare.addProduct')}</span>
                    </Link>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="text-sm">
              {hasFeatures && (
                <tr className="border-b border-gray-50">
                  <td className="p-3 sm:p-8 bg-gray-50 sticky start-0 z-10 font-semibold text-primary text-xs sm:text-sm break-words align-top">
                    {t('compare.features')}
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-4 sm:p-8 text-[12px] text-gray-600 align-top">
                      {product.features?.length ? (
                        <ul className="space-y-1.5">
                          {product.features.map((f) => (
                            <li key={f} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden="true" />{f}</li>
                          ))}
                        </ul>
                      ) : '—'}
                    </td>
                  ))}
                  {canAdd && <td aria-hidden="true" />}
                </tr>
              )}
              {specKeys.map((key) => (
                <tr key={key} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                  <td className="p-3 sm:p-8 bg-gray-50 sticky start-0 z-10 font-semibold text-primary text-xs sm:text-sm break-words">
                    {key}
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-4 sm:p-8 font-medium text-gray-600 text-[12px]">
                      {product.specs?.[key] || '—'}
                    </td>
                  ))}
                  {canAdd && <td aria-hidden="true" />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasSeller && (
          <div className="mt-20 bg-primary p-8 md:p-12 text-white rounded-2xl">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-center">{t('compare.quoteTitle')}</h2>
            <p className="text-white/60 text-sm mb-8 text-center max-w-2xl mx-auto">{t('compare.quoteText')}</p>
            <label htmlFor="compare-note" className="sr-only">{t('compare.notePlaceholder')}</label>
            <textarea
              id="compare-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              placeholder={t('compare.notePlaceholder')}
              className="w-full max-w-2xl mx-auto block bg-white/10 border border-white/20 rounded-2xl p-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-secondary resize-none h-28 mb-8"
            />
            <div className="text-center">
              <button
                type="button"
                disabled={sending}
                onClick={requestQuotes}
                className="inline-flex items-center gap-3 bg-secondary px-12 py-5 rounded-2xl text-sm font-bold tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100"
              >
                <MessageSquare className="h-5 w-5" />
                {sending ? t('compare.sending') : t('compare.sendQuote')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compare;
