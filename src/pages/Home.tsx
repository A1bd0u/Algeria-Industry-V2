import {
  ArrowRight, BadgeCheck, Building2, CheckCircle2, Globe2, Megaphone, MessageSquare, Package, Search,
  ShieldCheck, Star, Sparkles, MapPin,
} from 'lucide-react';
import { motion } from 'motion/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton';
import { formatNumber } from '../lib/format';
import { cn, generateSlugUrl } from '../lib/utils';
import SEO from '../components/SEO';
import { SITE_NAME, absoluteUrl } from '../config/site';
import { CompanyAvatar, GROUP_STYLE } from '../components/ui/ProductImage';
import { productCategories, sectorPath } from '../data/productCategories';
import ProductCard from '../components/ui/ProductCard';
import SectorArt from '../components/ui/SectorArt';

interface PublicStats {
  verifiedCompanies: number;
  publishedProducts: number;
}

const CHIPS = ['c1', 'c2', 'c3', 'c4', 'c5'] as const;

const OUTLINE_LINK = 'inline-flex w-fit items-center gap-2 rounded-lg border border-border-tech bg-white px-5 py-2.5 text-sm font-bold text-primary hover:border-secondary hover:text-secondary transition-colors';

// Apparition douce du héros au chargement (désactivée si l'utilisateur demande
// moins d'animations, via MotionConfig). Le reste du contenu est toujours
// visible, y compris pour les robots d'indexation.
const reveal = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const SectionHeader = ({ label, title, subtitle, action }: {
  label: string; title: string; subtitle?: string; action?: React.ReactNode;
}) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
    <div className="max-w-2xl">
      <p className="text-xs font-black uppercase tracking-wider text-secondary mb-3">{label}</p>
      <h2 className="text-3xl md:text-4xl font-black text-primary tracking-tight leading-tight">{title}</h2>
      {subtitle && <p className="mt-3 text-gray-600">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const Home = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/products');
  };

  useEffect(() => {
    const json = async (url: string) => {
      try {
        const res = await fetch(url);
        return res.ok ? await res.json() : null;
      } catch {
        return null;
      }
    };
    (async () => {
      setIsLoading(true);
      // Uniquement des données réelles : chaque bloc se masque ou affiche un
      // état vide si l'API ne renvoie rien.
      const [prod, comp, st, rev] = await Promise.all([
        json('/api/products?limit=8'),
        json('/api/companies?certified=true&limit=8'),
        json('/api/stats/public'),
        json('/api/companies/reviews/featured'),
      ]);
      setReviews(Array.isArray(rev) ? rev.slice(0, 3) : []);
      const list = (v: any) => (Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : []);
      // Rangées complètes : 4, puis 8 produits.
      const latest = list(prod).slice(0, 8);
      setProducts(latest.length >= 4 ? latest.slice(0, latest.length - (latest.length % 4)) : latest);
      setCompanies(list(comp).filter((c: any) => c.status === 'approved').slice(0, 8));
      if (st && typeof st.verifiedCompanies === 'number') setStats(st);
      setIsLoading(false);
    })();
  }, []);

  const trust = [
    stats && stats.verifiedCompanies > 0
      ? { icon: ShieldCheck, value: formatNumber(stats.verifiedCompanies), label: t('home.stats.verifiedCompanies') }
      : { icon: ShieldCheck, value: 'KYC', label: t('home.promise.verificationTitle') },
    stats && stats.publishedProducts > 0
      ? { icon: Package, value: formatNumber(stats.publishedProducts), label: t('home.stats.publishedProducts') }
      : { icon: CheckCircle2, value: t('home.trust.free'), label: t('home.trust.freeText') },
    { icon: MapPin, value: t('home.trust.wilayas'), label: t('home.trust.wilayasText') },
    { icon: Globe2, value: t('home.trust.languages'), label: t('home.trust.languagesText') },
  ];

  return (
    <>
      <SEO
        title={t('nav.home', 'Accueil')}
        description={t('home.seoDescription')}
        url={absoluteUrl('/')}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": SITE_NAME,
          "url": absoluteUrl('/'),
          "potentialAction": {
            "@type": "SearchAction",
            "target": absoluteUrl('/search?q={search_term_string}'),
            "query-input": "required name=search_term_string"
          }
        }}
      />
    <div className={cn('flex flex-col', i18n.language?.startsWith('ar') && 'font-arabic')}>

      {/* 1. Héros : recherche acheteur à gauche, appel aux fournisseurs à droite */}
      <section className="relative overflow-hidden bg-neutral-bg border-b border-border-tech">
        <div className="absolute -top-32 -end-32 h-96 w-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -start-40 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <motion.div {...reveal} className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-border-tech px-3 py-1.5 text-xs font-bold text-primary shadow-sm mb-6">
              <BadgeCheck className="h-4 w-4 text-success" aria-hidden="true" />
              {t('home.hero.eyebrow')}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-[1.05] mb-5">
              {t('home.hero.title')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mb-8">{t('home.hero.subtitle')}</p>

            <form onSubmit={submitSearch} role="search" className="flex flex-col sm:flex-row gap-2 bg-white border border-border-tech rounded-2xl p-2 shadow-xl shadow-primary/5 max-w-2xl">
              <label htmlFor="home-search" className="sr-only">{t('home.hero.searchLabel')}</label>
              <div className="flex items-center gap-3 flex-1 px-3">
                <Search className="h-5 w-5 text-gray-400 shrink-0" aria-hidden="true" />
                <input
                  id="home-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('home.hero.searchPlaceholder')}
                  className="w-full bg-transparent py-3 text-base text-primary placeholder:text-gray-400 outline-none"
                />
              </div>
              <button type="submit" className="btn-primary bg-secondary hover:bg-primary px-7 py-3 text-base">
                {t('common.search')}
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2 mt-5 max-w-2xl">
              <span className="text-sm text-gray-500 me-1">{t('home.hero.popular')} :</span>
              {CHIPS.map((c) => (
                <Link
                  key={c}
                  to={`/search?q=${encodeURIComponent(t(`home.hero.chips.${c}`))}`}
                  className="rounded-full bg-white border border-border-tech px-3 py-1 text-sm font-medium text-gray-700 hover:border-secondary hover:text-secondary transition-colors"
                >
                  {t(`home.hero.chips.${c}`)}
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.aside {...reveal} transition={{ duration: 0.5, delay: 0.1 }} className="lg:col-span-5">
            <div className="relative rounded-3xl bg-primary text-white p-7 md:p-8 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
              <div className="absolute -top-20 -end-20 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />
              <div className="relative">
                <p className="text-xs font-black uppercase tracking-wider text-secondary mb-3">{t('home.supplierCard.label')}</p>
                <h2 className="text-2xl md:text-3xl font-black leading-tight mb-6">{t('home.supplierCard.title')}</h2>
                <ul className="space-y-3 mb-7">
                  {(['p1', 'p2', 'p3'] as const).map((p) => (
                    <li key={p} className="flex items-start gap-3 text-white/85">
                      <CheckCircle2 className="h-5 w-5 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{t(`home.supplierCard.${p}`)}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register?role=fournisseur" className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3.5 font-bold hover:bg-white hover:text-primary transition-colors">
                  {t('home.supplierCard.cta')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
                <Link to="/tarifs" className="mt-4 flex items-start gap-3 rounded-xl border border-secondary/40 bg-white/5 px-4 py-3 text-sm hover:border-secondary transition-colors">
                  <Sparkles className="h-4 w-4 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                  <span><span className="font-bold text-secondary">{t('pricing.founder.label')} · </span>{t('home.hero.founder')}</span>
                </Link>
              </div>
            </div>
          </motion.aside>
        </div>

        {/* Bande de confiance : chiffres réels si disponibles, sinon engagements */}
        <div className="relative border-t border-border-tech bg-white">
          <dl className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-px bg-border-tech">
            {trust.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white py-5 px-4 md:px-6">
                <span className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="sr-only">{item.label}</dt>
                  <dd className="text-lg md:text-xl font-black text-primary leading-tight truncate">{item.value}</dd>
                  <dd className="text-xs text-gray-500 truncate">{item.label}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 2. Secteurs */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label={t('home.categories.label')}
            title={t('home.categories.title')}
            subtitle={t('home.categories.subtitle')}
            action={
              <Link to="/products" className={OUTLINE_LINK}>
                {t('home.categories.all')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            {productCategories.map((group) => {
              const style = GROUP_STYLE[group.id];
              const Icon = style.icon;
              return (
                <Link
                  key={group.id}
                  to={sectorPath(group.id)}
                  className="group relative overflow-hidden flex h-full flex-col rounded-2xl border border-border-tech bg-white p-4 md:p-6 hover:border-secondary hover:shadow-xl hover:-translate-y-0.5 transition-all max-lg:last:col-span-2"
                >
                  <SectorArt group={group.id} className={cn('absolute -end-6 -bottom-4 w-32 md:w-36 opacity-[0.13] group-hover:opacity-25 transition-opacity', style.tint.split(' ').find((c) => c.startsWith('text-')))} />
                  <span className={cn('flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl mb-3 md:mb-5', style.tint)}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm md:text-base font-black text-primary leading-snug mb-2 group-hover:text-secondary transition-colors">
                    {t(`productCategories.${group.id}`)}
                  </h3>
                  <p className="max-sm:hidden text-sm text-gray-500 line-clamp-2 mb-4">
                    {group.subCategories.slice(0, 3).map((s) => t(`productCategories.${s.id}`).split(/[:(]/)[0].trim()).join(' · ')}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 group-hover:text-secondary">
                    {t('home.categories.count', { count: group.subCategories.length })}
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Derniers produits */}
      <section className="py-16 md:py-20 bg-neutral-bg border-y border-border-tech">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label={t('home.latest.label')}
            title={t('home.trends')}
            subtitle={t('home.trends_subtitle')}
            action={
              <Link to="/products" className="btn-primary w-fit">
                {t('home.fullCatalog')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl bg-white border border-border-tech p-3">
                  <Skeleton className="aspect-square w-full rounded-xl mb-4" />
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center">
                <Package className="h-8 w-8 text-gray-400 mx-auto mb-3" aria-hidden="true" />
                <p className="text-gray-600 mb-4">{t('home.noProducts')}</p>
                <Link to="/register?role=fournisseur" className="btn-primary">{t('home.beFirst')}</Link>
              </div>
            ) : products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      {/* 4. Fournisseurs vérifiés (masqué tant qu'il n'y en a pas) */}
      {companies.length > 0 && (
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              label={t('home.suppliers.label')}
              title={t('home.suppliers.title')}
              subtitle={t('home.suppliers.subtitle')}
              action={
                <Link to="/directory" className={OUTLINE_LINK}>
                  {t('home.suppliers.cta')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {companies.map((c) => (
                <Link
                  key={c.id}
                  to={`/directory/${generateSlugUrl(c.name, c.id)}`}
                  className="group flex items-center gap-4 rounded-2xl border border-border-tech p-4 hover:border-secondary hover:shadow-lg transition-all"
                >
                  <CompanyAvatar src={c.logo_url} name={c.name} className="h-14 w-14 shrink-0 rounded-xl border border-border-tech" />
                  <div className="min-w-0">
                    <p className="font-bold text-primary truncate group-hover:text-secondary transition-colors">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">{[c.activity_sector, c.wilaya].filter(Boolean).join(' · ')}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-success">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> {t('home.suppliers.verified')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Comment ça marche */}
      <section className={cn('py-16 md:py-20', companies.length > 0 ? 'bg-neutral-bg border-t border-border-tech' : 'bg-white')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-primary tracking-tight mb-3">{t('home.how.title')}</h2>
            <p className="text-gray-600">{t('home.how.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(['buyer', 'supplier'] as const).map((role) => (
              <div key={role} className={cn('rounded-3xl p-8 md:p-10 border', role === 'buyer' ? 'bg-white border-border-tech' : 'bg-primary text-white border-primary')}>
                <div className="flex items-center gap-3 mb-8">
                  <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', role === 'buyer' ? 'bg-accent/10 text-accent' : 'bg-secondary/20 text-secondary')}>
                    {role === 'buyer' ? <Search className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                  </span>
                  <h3 className="text-xl font-black">{t(`home.how.${role}.title`)}</h3>
                </div>
                <ol className="relative space-y-7 ps-1">
                  {[1, 2, 3].map((n) => (
                    <li key={n} className="flex gap-4">
                      <span className="w-9 h-9 shrink-0 rounded-full bg-secondary text-white font-black flex items-center justify-center">{n}</span>
                      <div>
                        <p className="font-bold">{t(`home.how.${role}.step${n}`)}</p>
                        <p className={cn('text-sm mt-1', role === 'buyer' ? 'text-gray-600' : 'text-white/70')}>{t(`home.how.${role}.step${n}Text`)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link
                  to={role === 'buyer' ? '/products' : '/register?role=fournisseur'}
                  className={cn('mt-9', role === 'buyer' ? 'btn-primary' : 'btn-primary bg-secondary hover:bg-white hover:text-primary')}
                >
                  {t(`home.how.${role}.cta`)}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avis réels d'acheteurs (masqué tant qu'il n'y en a pas) */}
      {reviews.length > 0 && (
        <section className="py-16 md:py-20 bg-white border-t border-border-tech">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader label={t('home.reviews.label')} title={t('home.reviews.title')} subtitle={t('home.reviews.subtitle')} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {reviews.map((r) => (
                <figure key={r.id} className="flex flex-col rounded-2xl border border-border-tech bg-neutral-bg p-6">
                  <div className="flex gap-0.5 text-amber-500 mb-4" aria-label={t('home.reviews.rating', { rating: r.rating })}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4" fill={i < r.rating ? 'currentColor' : 'none'} aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 leading-relaxed flex-1">« {r.comment} »</blockquote>
                  <figcaption className="mt-5 pt-4 border-t border-border-tech text-sm">
                    {r.author && <span className="font-bold text-primary">{r.author}</span>}
                    <span className="text-gray-500"> {t('home.reviews.about')} </span>
                    <Link to={`/directory/${generateSlugUrl(r.company.name, r.company.id)}`} className="font-bold text-secondary hover:underline">{r.company.name}</Link>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Fournisseurs : bénéfices et appel à l'action */}
      <section className="relative overflow-hidden bg-primary text-white py-16 md:py-20">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute -bottom-32 -end-24 h-80 w-80 rounded-full bg-secondary/25 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-5">{t('home.supplierBand.title')}</h2>
            <p className="text-lg text-white/70 mb-8 max-w-xl">{t('home.supplierBand.text')}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register?role=fournisseur" className="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3.5 font-bold hover:bg-white hover:text-primary transition-colors">
                {t('home.supplierBand.cta')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
              <Link to="/tarifs" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 font-bold hover:bg-white/10 transition-colors">
                {t('home.supplierBand.pricing')}
              </Link>
            </div>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            {[
              { icon: CheckCircle2, key: 's1' },
              { icon: BadgeCheck, key: 's2' },
              { icon: MessageSquare, key: 's3' },
            ].map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-start gap-4 rounded-2xl bg-white/5 border border-white/10 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-secondary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold">{t(`home.supplierBand.${key}`)}</p>
                  <p className="text-sm text-white/65 mt-0.5">{t(`home.supplierBand.${key}Text`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. Publicité */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6 rounded-3xl border border-border-tech bg-gradient-to-r rtl:bg-gradient-to-l from-secondary/10 via-white to-white p-7 md:p-10">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-white">
              <Megaphone className="h-7 w-7" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-secondary mb-1">{t('home.advertise.label')}</p>
              <h2 className="text-2xl font-black text-primary">{t('home.advertise.title')}</h2>
              <p className="text-gray-600 mt-1">{t('home.advertise.text')}</p>
            </div>
            <Link to="/ads-request" className="btn-primary w-fit shrink-0">
              {t('home.advertise.cta')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Dernier appel à l'action */}
      <section className="pb-20 pt-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-primary tracking-tight mb-4">{t('home.final.title')}</h2>
          <p className="text-lg text-gray-600 mb-8">{t('home.final.text')}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/products" className="btn-primary px-7 py-3.5 text-base">
              {t('home.final.buyer')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
            <Link to="/register?role=fournisseur" className="btn-secondary px-7 py-3.5 text-base">
              {t('home.final.supplier')}
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            <Link to="/faq" className="hover:text-secondary underline-offset-4 hover:underline">{t('home.final.help')}</Link>
          </p>
        </div>
      </section>
    </div>
    </>
  );
};

export default Home;
