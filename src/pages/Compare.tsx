import {
  ArrowLeft,
  MessageSquare,
  Scale,
  ShieldCheck,
  Trash2,
  X
} from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useComparison } from '../context/ComparisonContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../lib/apiError';
import { cn, generateSlugUrl } from '../lib/utils';

const Compare = () => {
  const { comparedProducts: items, removeFromCompare, clearCompare } = useComparison();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const toast = useToast();
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  // Une demande de devis va aux fournisseurs des produits comparés, par la
  // messagerie de la plateforme : chacun reçoit la liste de ses produits.
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
        <h2 className="text-3xl font-black text-primary uppercase tracking-tighter mb-4">{t('compare.emptyTitle')}</h2>
        <p className="text-gray-400 font-medium max-w-xs mb-8 uppercase text-[10px] tracking-widest">
          {t('compare.emptyText')}
        </p>
        <Link to="/products" className="btn-primary px-12 py-4 rounded-xl text-xs font-black uppercase tracking-widest">
          {t('compare.explore')}
        </Link>
      </div>
    );
  }

  const specKeys: string[] = Array.from(new Set(items.flatMap((p) => Object.keys(p.specs || {}))));
  const hasSeller = items.some((p) => p.sellerId);

  return (
    <div className={cn("min-h-screen bg-neutral-bg pt-32 pb-20", i18n.language?.startsWith('ar') && "font-arabic")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-primary mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              <span className="text-[10px] font-black uppercase tracking-widest">{t('compare.back')}</span>
            </button>
            <h1 className="text-4xl font-black text-primary uppercase tracking-tighter italic">
              {t('compare.title')}
            </h1>
          </div>
          <button
            onClick={clearCompare}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 font-black text-[10px] uppercase tracking-widest px-6 py-3 bg-red-50 rounded-xl transition-all"
          >
            <Trash2 className="h-4 w-4" />
            <span>{t('compare.clear')}</span>
          </button>
        </div>

        <div className="bg-white border border-gray-100 shadow-2xl overflow-x-auto no-scrollbar rounded-[32px]">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="p-8 text-start bg-gray-50/50 w-64 shrink-0">
                  <span className="text-xs font-black text-primary uppercase tracking-[0.3em]">{t('compare.specs')}</span>
                </th>
                {items.map((product) => (
                  <th key={product.id} className="p-8 text-start relative min-w-[280px] align-top">
                    <button
                      onClick={() => removeFromCompare(product.id)}
                      aria-label={t('compare.remove')}
                      className="absolute top-4 end-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 mb-6 border border-gray-100 flex items-center justify-center">
                      {product.image
                        ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        : <img src="/favicon.svg" alt="" className="h-12 w-12 opacity-20" />}
                    </div>
                    <p className="text-[10px] font-black text-secondary tracking-widest uppercase mb-1">{product.brand}</p>
                    <Link to={`/products/${generateSlugUrl(product.name, product.id)}`} className="block text-primary font-black uppercase tracking-tighter leading-tight mb-4 hover:text-secondary">
                      {product.name}
                    </Link>
                    <span className="text-sm font-black text-primary">
                      {product.priceValue ? formatPrice(product.priceValue) : t('common.onQuote')}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-50">
                <td className="p-8 bg-gray-50/30 font-black text-primary text-[10px] uppercase tracking-widest">
                  {t('compare.verification')}
                </td>
                {items.map((product) => (
                  <td key={product.id} className="p-8 text-[11px] font-black uppercase tracking-wider">
                    {product.companyVerified ? (
                      <span className="flex items-center text-emerald-600">
                        <ShieldCheck className="h-4 w-4 me-2" />
                        {t('compare.verified')}
                      </span>
                    ) : (
                      <span className="text-gray-400">{t('compare.notVerified')}</span>
                    )}
                  </td>
                ))}
              </tr>
              {specKeys.map((key) => (
                <tr key={key} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                  <td className="p-8 bg-gray-50/30 font-black text-primary text-[10px] uppercase tracking-widest">
                    {key}
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-8 font-medium text-gray-600 text-[12px]">
                      {product.specs?.[key] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasSeller && (
          <div className="mt-20 bg-primary p-8 md:p-12 text-white rounded-[48px]">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 text-center">{t('compare.quoteTitle')}</h2>
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
                className="inline-flex items-center gap-3 bg-secondary px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100"
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
