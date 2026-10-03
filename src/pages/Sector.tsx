import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronRight, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { Skeleton } from '../components/Skeleton';
import ProductCard, { companyNameOf } from '../components/ui/ProductCard';
import { absoluteUrl } from '../config/site';
import { useAdCategories } from '../context/AdTargetingContext';
import { SectorIcon } from '../components/ui/IndustryIcons';
import { productCategories, sectorBySlug, sectorPath } from '../data/productCategories';
import { cn, generateSlugUrl } from '../lib/utils';

// Page d'un secteur : présentation, sous-catégories, derniers produits et
// fournisseurs actifs du secteur (données réelles du catalogue).

const Sector = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const group = sectorBySlug(slug);
  useAdCategories([group?.id]);

  const { data, isLoading } = useQuery({
    queryKey: ['sector-products', group?.id],
    enabled: Boolean(group),
    queryFn: async () => {
      const res = await fetch(`/api/products?category=${encodeURIComponent(group!.name)}&limit=12&sort=recent`);
      if (!res.ok) return { data: [], total: 0 };
      const body = await res.json();
      return { data: Array.isArray(body?.data) ? body.data : [], total: Number(body?.total) || 0 };
    },
  });

  if (!group) return <Navigate to="/products" replace />;

  const products: any[] = data?.data || [];
  const latest = products.length >= 4 ? products.slice(0, products.length - (products.length % 4)).slice(0, 8) : products;

  // Fournisseurs présents dans les derniers produits du secteur.
  const suppliers = Array.from(
    new Map(
      products
        .filter((p) => p.company_id && companyNameOf(p))
        .map((p) => [p.company_id, { id: p.company_id, name: companyNameOf(p) as string, verified: Boolean(p.company_verified) }]),
    ).values(),
  ).slice(0, 8);

  const catalogUrl = `/products?category=${encodeURIComponent(group.name)}`;
  const name = t(`productCategories.${group.id}`);

  return (
    <>
      <SEO
        title={t('sector.seoTitle', { name })}
        description={t(`sector.${group.id}.intro`)}
        url={absoluteUrl(sectorPath(group.id))}
      />
      <div className="bg-neutral-bg">
        {/* Héros du secteur */}
        <section className="relative overflow-hidden bg-white border-b border-border-tech">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <nav aria-label={t('sector.breadcrumb')} className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
              <Link to="/" className="hover:text-secondary">{t('nav.home')}</Link>
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
              <Link to="/products" className="hover:text-secondary">{t('nav.products')}</Link>
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
              <span className="text-primary font-medium">{name}</span>
            </nav>
            <div className="flex items-start justify-between gap-10">
            <div className="max-w-2xl">
              <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-4">
                <span className="text-secondary">{t('sector.code', { code: group.id })}</span>
                <span className="h-px w-8 bg-gray-300" aria-hidden="true" />
                {t('sector.label')}
              </p>
              <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tight leading-tight mb-4">{name}</h1>
              <p className="text-lg text-gray-600 mb-8">{t(`sector.${group.id}.intro`)}</p>
              <div className="flex flex-wrap gap-3">
                <Link to={catalogUrl} className="btn-primary px-6 py-3 text-base">
                  {data?.total ? t('sector.seeProducts', { count: data.total }) : t('sector.seeCatalog')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
                <Link to="/register?role=fournisseur" className="inline-flex items-center gap-2 rounded-lg border border-border-tech bg-white px-6 py-3 font-bold text-primary hover:border-secondary hover:text-secondary transition-colors">
                  {t('sector.listCompany')}
                </Link>
              </div>
            </div>
            <div className="hidden md:flex h-44 w-44 shrink-0 items-center justify-center rounded-2xl border border-border-tech bg-neutral-bg">
              <SectorIcon id={group.id} className="h-24 w-24 text-primary" />
            </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
          {/* Sous-catégories */}
          <section>
            <h2 className="text-2xl font-black text-primary mb-5">{t('sector.subcategories')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.subCategories.map((sub) => {
                const [title, detail] = t(`productCategories.${sub.id}`).split(/\s*:\s*/);
                return (
                  <Link
                    key={sub.id}
                    to={`/products?category=${encodeURIComponent(sub.name)}`}
                    className="group flex items-center gap-4 rounded-xl bg-white border border-border-tech p-4 hover:border-secondary hover:shadow-md transition-all"
                  >
                    <span className="w-8 shrink-0 text-xs font-bold text-gray-400 tabular-nums tracking-wider">{sub.id}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-primary group-hover:text-secondary transition-colors">{title}</span>
                      {detail && <span className="block text-xs text-gray-500 truncate">{detail.replace(/\.$/, '')}</span>}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-secondary rtl:rotate-180" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Derniers produits */}
          <section>
            <div className="flex items-end justify-between gap-4 mb-5">
              <h2 className="text-2xl font-black text-primary">{t('sector.latest')}</h2>
              {latest.length > 0 && (
                <Link to={catalogUrl} className="text-sm font-bold text-secondary hover:underline inline-flex items-center gap-1">
                  {t('sector.seeAll')} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              )}
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
              </div>
            ) : latest.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center">
                <Package className="h-8 w-8 text-gray-400 mx-auto mb-3" aria-hidden="true" />
                <p className="text-gray-600 mb-4">{t('sector.empty')}</p>
                <Link to="/register?role=fournisseur" className="btn-primary">{t('home.beFirst')}</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                {latest.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </section>

          {/* Fournisseurs du secteur */}
          {suppliers.length > 0 && (
            <section>
              <h2 className="text-2xl font-black text-primary mb-5">{t('sector.suppliers')}</h2>
              <div className="flex flex-wrap gap-3">
                {suppliers.map((c) => (
                  <Link
                    key={c.id}
                    to={`/directory/${generateSlugUrl(c.name, c.id)}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white border border-border-tech px-4 py-2 text-sm font-bold text-primary hover:border-secondary hover:text-secondary transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Autres secteurs */}
          <section>
            <h2 className="text-lg font-black text-primary mb-4">{t('sector.others')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {productCategories.filter((g) => g.id !== group.id).map((g) => {
                return (
                  <Link key={g.id} to={sectorPath(g.id)}
                    className="flex items-center gap-3 rounded-lg bg-white border border-border-tech p-3 hover:border-secondary transition-colors">
                    <SectorIcon id={g.id} className="h-7 w-7 shrink-0 text-primary" />
                    <span className="text-sm font-bold text-primary leading-snug">{t(`productCategories.${g.id}`)}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default Sector;
