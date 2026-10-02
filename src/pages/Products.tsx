import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Search, ShieldCheck, SlidersHorizontal, Star, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ProductSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { categoryLabel, productCategories, categoryGroupId } from '../data/productCategories';
import { WILAYAS } from '../data/wilayas';
import { formatNumber } from '../lib/format';
import { cn, generateSlugUrl } from '../lib/utils';
import AddProduct from './AddProduct';
import SEO from '../components/SEO';
import { absoluteUrl } from '../config/site';
import ProductImage from '../components/ui/ProductImage';
import { useAdCategories } from '../context/AdTargetingContext';

const PAGE_SIZE = 12;
const SORTS = ['recent', 'price_asc', 'price_desc'] as const;

// Filtres du catalogue (catégorie, wilaya), partagés par le panneau latéral et
// le tiroir mobile. Les valeurs vivent dans l'URL : une recherche se partage.
const Filters = ({ category, region, onChange }: {
  category: string;
  region: string;
  onChange: (key: 'category' | 'region', value: string) => void;
}) => {
  const { t } = useTranslation();
  const [openGroup, setOpenGroup] = useState<string | null>(
    productCategories.find((g) => g.name === category || g.subCategories.some((s) => s.name === category))?.id || null
  );
  return (
    <div className="space-y-8">
      <div>
        <h3 className="tech-label mb-3">{t('products.category')}</h3>
        <button
          type="button"
          onClick={() => onChange('category', '')}
          className={cn('w-full text-start px-3 py-2 rounded-lg text-sm font-medium transition-colors', !category ? 'bg-primary text-white' : 'hover:bg-gray-50')}
        >
          {t('products.all_categories')}
        </button>
        <ul className="mt-1 space-y-1">
          {productCategories.map((group) => {
            const open = openGroup === group.id;
            return (
              <li key={group.id}>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => onChange('category', group.name)}
                    className={cn('flex-1 text-start px-3 py-2 rounded-lg text-sm font-bold transition-colors', category === group.name ? 'bg-primary text-white' : 'hover:bg-gray-50')}
                  >
                    {t(`productCategories.${group.id}`)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenGroup(open ? null : group.id)}
                    aria-expanded={open}
                    aria-label={t(`productCategories.${group.id}`)}
                    className="p-2 text-gray-500 hover:text-primary"
                  >
                    <ChevronRight className={cn('h-4 w-4 transition-transform rtl:rotate-180', open && 'rotate-90 rtl:rotate-90')} />
                  </button>
                </div>
                {open && (
                  <ul className="ms-3 border-s border-gray-100 ps-2 my-1 space-y-0.5">
                    {group.subCategories.map((sub) => (
                      <li key={sub.id}>
                        <button
                          type="button"
                          onClick={() => onChange('category', sub.name)}
                          className={cn('w-full text-start px-3 py-1.5 rounded-lg text-sm transition-colors', category === sub.name ? 'bg-secondary/10 text-secondary font-bold' : 'text-gray-600 hover:bg-gray-50')}
                        >
                          {t(`productCategories.${sub.id}`)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <label htmlFor="filter-region" className="tech-label mb-3">{t('products.wilaya')}</label>
        <select id="filter-region" value={region} onChange={(e) => onChange('region', e.target.value)} className="field">
          <option value="">{t('exhibitor.list.allWilayas')}</option>
          {WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>
    </div>
  );
};

const Products = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { formatPrice } = useCurrency();
  const toast = useToast();
  const navigate = useNavigate();

  const category = searchParams.get('category') || '';
  useAdCategories([categoryGroupId(category)]);
  const region = searchParams.get('region') || '';
  const search = searchParams.get('search') || '';
  const sort = (SORTS as readonly string[]).includes(searchParams.get('sort') || '') ? searchParams.get('sort')! : 'recent';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const companyId = searchParams.get('company_id') || searchParams.get('companyId') || '';
  const companyName = searchParams.get('companyName') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => setSearchInput(search), [search]);

  const update = (changes: Record<string, string>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value); else next.delete(key);
    }
    if (resetPage) next.delete('page');
    setSearchParams(next);
  };

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['products', { category, region, search, sort, page, companyId }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) });
      if (category) params.set('category', category);
      if (region) params.set('region', region);
      if (search) params.set('search', search);
      if (sort !== 'recent') params.set('sort', sort);
      if (companyId) params.set('company_id', companyId);
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('load');
      return res.json() as Promise<{ data: any[]; total: number; totalPages: number }>;
    },
  });
  const products = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, data?.totalPages || 1);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/favorites')
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => setFavorites(list.filter((f: any) => f.item_type === 'product')))
      .catch(() => {});
  }, [isAuthenticated]);

  const toggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent('/products')}`);
      return;
    }
    const existing = favorites.find((f) => f.item_id === productId);
    try {
      if (existing) {
        await fetch(`/api/favorites/${existing.id}`, { method: 'DELETE' });
        setFavorites((prev) => prev.filter((f) => f.item_id !== productId));
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_type: 'product', item_id: productId }),
        });
        if (!res.ok) throw new Error('favorite');
        const added = await res.json();
        setFavorites((prev) => [...prev, added]);
      }
    } catch {
      toast.error(t('products.detail.favoriteError'));
    }
  };

  const chips = [
    category && { key: 'category', label: categoryLabel(t, category) },
    region && { key: 'region', label: region },
    search && { key: 'search', label: `« ${search} »` },
    companyId && { key: 'company_id', label: companyName || t('products.oneSupplier') },
  ].filter(Boolean) as { key: string; label: string }[];

  const clearAll = () => setSearchParams(new URLSearchParams());
  const isSupplier = user?.role === 'fournisseur' || user?.role === 'exposant';

  return (
    <>
      <SEO
        title={companyName ? t('products.companyProducts', { name: companyName }) : t('products.equipment_catalog')}
        description={t('products.hero_desc')}
        url={absoluteUrl('/products')}
      />
      <AddProduct isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => refetch()} />

      <div className={cn('min-h-screen bg-neutral-bg pt-10 pb-20', i18n.language?.startsWith('ar') && 'font-arabic')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-8">
            <p className="tech-label text-secondary">{t('products.sourcing')}</p>
            <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tight mb-3">
              {companyName ? t('products.companyProducts', { name: companyName }) : t('products.equipment_catalog')}
            </h1>
            <p className="text-gray-500 max-w-2xl">{t('products.hero_desc')}</p>
          </header>

          {/* Recherche + tri */}
          <form
            onSubmit={(e) => { e.preventDefault(); update({ search: searchInput.trim() }); }}
            role="search"
            className="flex flex-col sm:flex-row gap-3 mb-4"
          >
            <div className="flex items-center gap-3 flex-1 bg-white border border-gray-200 rounded-lg px-4 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
              <Search className="h-5 w-5 text-gray-500 shrink-0" aria-hidden="true" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('products.searchPlaceholder')}
                aria-label={t('products.searchPlaceholder')}
                className="flex-1 min-w-0 py-3 bg-transparent text-sm outline-none"
              />
              <button type="submit" className="btn-primary !px-4 !py-2 my-1.5">{t('common.search')}</button>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDrawerOpen(true)} className="btn-ghost lg:hidden flex-1 sm:flex-none">
                <SlidersHorizontal className="h-4 w-4" />
                {t('products.filters')}
                {chips.length > 0 && <span className="bg-secondary text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">{chips.length}</span>}
              </button>
              <label htmlFor="sort" className="sr-only">{t('products.sort.label')}</label>
              <select id="sort" value={sort} onChange={(e) => update({ sort: e.target.value === 'recent' ? '' : e.target.value })} className="field !w-auto flex-1 sm:flex-none">
                {SORTS.map((s) => <option key={s} value={s}>{t(`products.sort.${s}`)}</option>)}
              </select>
            </div>
          </form>

          {/* Filtres actifs */}
          <div className="flex flex-wrap items-center gap-2 mb-8 min-h-8">
            <span className="text-sm text-gray-500 me-2" aria-live="polite">
              {isLoading ? '…' : t('products.results', { count: total, formatted: formatNumber(total) })}
            </span>
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => update({ [chip.key]: '', ...(chip.key === 'company_id' ? { companyName: '', companyId: '' } : {}) })}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full ps-3 pe-2 py-1 text-sm hover:border-primary"
                aria-label={t('products.removeFilter', { name: chip.label })}
              >
                {chip.label}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
            {chips.length > 1 && (
              <button type="button" onClick={clearAll} className="text-sm font-bold text-secondary hover:underline">{t('common.clear_filters')}</button>
            )}
          </div>

          <div className="flex gap-8">
            <aside className="hidden lg:block w-72 shrink-0 space-y-6">
              <div className="tech-card p-6">
                <Filters category={category} region={region} onChange={(key, value) => update({ [key]: value })} />
              </div>
              <div className="bg-primary rounded-2xl p-6 text-white">
                <h2 className="text-lg font-black mb-2">{t('products.sell_machines')}</h2>
                <p className="text-white/60 text-sm mb-5">{t('products.join_suppliers')}</p>
                {isSupplier ? (
                  <button type="button" onClick={() => setShowAddModal(true)} className="btn-secondary w-full">{t('products.add_product')}</button>
                ) : (
                  <Link to="/register?role=fournisseur" className="btn-secondary w-full">{t('nav.become_exposant')}</Link>
                )}
              </div>
            </aside>

            <section className="flex-1 min-w-0" aria-busy={isFetching}>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
                </div>
              ) : isError ? (
                <div className="tech-card p-10 text-center">
                  <h2 className="font-bold text-primary mb-2">{t('common.error')}</h2>
                  <p className="text-gray-500 text-sm mb-6">{t('common.error_desc')}</p>
                  <button type="button" onClick={() => refetch()} className="btn-primary">{t('common.retry')}</button>
                </div>
              ) : products.length === 0 ? (
                <div className="tech-card p-10 text-center">
                  <Search className="h-10 w-10 text-gray-300 mx-auto mb-4" aria-hidden="true" />
                  <h2 className="text-xl font-bold text-primary mb-2">{t('products.emptyTitle')}</h2>
                  <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">{t('products.emptyText')}</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {chips.length > 0 && <button type="button" onClick={clearAll} className="btn-primary">{t('common.clear_filters')}</button>}
                    <Link to="/directory" className="btn-ghost">{t('home.hero.browseSuppliers')}</Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className={cn('grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity', isFetching && 'opacity-60')}>
                    {products.map((product) => {
                      const url = `/products/${generateSlugUrl(product.name, product.id)}`;
                      const isFav = favorites.some((f) => f.item_id === product.id);
                      return (
                        <article key={product.id} className="tech-card overflow-hidden flex flex-col group">
                          <Link to={url} className="block aspect-[4/3] overflow-hidden relative">
                            <ProductImage src={product.file_url} alt={product.name} category={product.category} imgClassName="group-hover:scale-105 transition-transform duration-500" />
                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(e, product.id)}
                              aria-label={t('products.detail.favorite')}
                              aria-pressed={isFav}
                              className={cn('absolute top-3 end-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm', isFav ? 'text-secondary' : 'text-gray-500 hover:text-secondary')}
                            >
                              <Star className="h-4 w-4" fill={isFav ? 'currentColor' : 'none'} />
                            </button>
                          </Link>
                          <div className="p-5 flex flex-col flex-1">
                            <p className="text-xs text-gray-500 mb-1 line-clamp-1">{categoryLabel(t, product.category)}</p>
                            <h2 className="font-bold text-primary leading-snug mb-3 line-clamp-2">
                              <Link to={url} className="hover:text-secondary">{product.name}</Link>
                            </h2>
                            {product.company_name && (
                              <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-1">
                                <span className="truncate">{product.company_name}</span>
                                {product.company_verified && <ShieldCheck className="h-4 w-4 text-success shrink-0" aria-label={t('compare.verified')} />}
                              </p>
                            )}
                            {product.region && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mb-3"><MapPin className="h-3.5 w-3.5" />{product.region}</p>
                            )}
                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                              <span className="font-black text-primary">
                                {Number(product.price) > 0 ? formatPrice(Number(product.price)) : t('common.onQuote')}
                              </span>
                              <Link to={url} className="text-sm font-bold text-secondary inline-flex items-center gap-1 hover:underline">
                                {t('common.see_details')}
                                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <nav className="mt-10 flex items-center justify-center gap-2" aria-label={t('products.pagination')}>
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => { update({ page: String(page - 1) }, false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="btn-ghost !px-3"
                        aria-label={t('products.prev')}
                      >
                        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                      </button>
                      <span className="text-sm text-gray-600 px-3">{t('products.pageOf', { page, total: totalPages })}</span>
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => { update({ page: String(page + 1) }, false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="btn-ghost !px-3"
                        aria-label={t('products.next')}
                      >
                        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                      </button>
                    </nav>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Tiroir de filtres (mobile) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label={t('products.filters')}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 end-0 w-[88%] max-w-sm bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-black text-primary">{t('products.filters')}</h2>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label={t('common.close')} className="p-2"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <Filters category={category} region={region} onChange={(key, value) => update({ [key]: value })} />
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button type="button" onClick={clearAll} className="btn-ghost flex-1">{t('common.clear_filters')}</button>
              <button type="button" onClick={() => setDrawerOpen(false)} className="btn-primary flex-1">{t('products.showResults', { count: total })}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Products;
