import { ArrowRight, Building2, CheckCircle2, Clock, FileText, Package, Search, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton';
import { useCurrency } from '../context/CurrencyContext';
import { formatNumber } from '../lib/format';
import { cn, generateSlugUrl } from '../lib/utils';
import SEO from '../components/SEO';
import { SITE_NAME, absoluteUrl } from '../config/site';

interface PublicStats {
  verifiedCompanies: number;
  publishedProducts: number;
}

const Home = () => {
  const { t, i18n } = useTranslation();
  const { formatPrice } = useCurrency();
  const [visibleProducts, setVisibleProducts] = useState(4);
  const [products, setProducts] = useState<any[]>([]);
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
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        const [prodRes, statsRes] = await Promise.all([
          fetch('/api/products').catch(() => null),
          fetch('/api/stats/public').catch(() => null),
        ]);

        // Pas de produits fictifs : état vide si le catalogue est encore vide.
        let pData: any[] = [];
        if (prodRes && prodRes.ok) {
          try { const res = await prodRes.json(); pData = res.data || res; } catch { /* état vide */ }
        }
        setProducts(pData.slice(0, 8));

        if (statsRes && statsRes.ok) {
          try { setStats(await statsRes.json()); } catch { /* compteurs masqués */ }
        }
      } catch (e) {
        console.error("Home fetch error", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const showMore = () => {
    setVisibleProducts(prev => Math.min(prev + 4, products.length));
  };

  const promises = [
    { label: t('home.promise.verificationLabel'), title: t('home.promise.verificationTitle'), desc: t('home.promise.verificationText') },
    { label: t('home.promise.contactLabel'), title: t('home.promise.contactTitle'), desc: t('home.promise.contactText') },
    { label: t('home.promise.languagesLabel'), title: 'FR · AR · EN', desc: t('home.promise.languagesText') },
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
    <div className={cn("flex flex-col min-h-screen", i18n.language?.startsWith('ar') && "font-arabic")}>
      {/* Accueil : proposition de valeur, recherche et deux parcours */}
      <section className="bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-secondary text-[11px] font-black uppercase tracking-[0.3em] mb-6">
              <ShieldCheck className="h-4 w-4" />
              {t('home.hero.eyebrow')}
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.05] mb-6">
              {t('home.hero.title')}
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mb-10">{t('home.hero.subtitle')}</p>

            <form onSubmit={submitSearch} role="search" className="flex flex-col sm:flex-row gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 max-w-2xl">
              <label htmlFor="home-search" className="sr-only">{t('home.hero.searchLabel')}</label>
              <div className="flex items-center gap-3 flex-1 px-3">
                <Search className="h-5 w-5 text-white/40 shrink-0" aria-hidden="true" />
                <input
                  id="home-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('home.hero.searchPlaceholder')}
                  className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/40 outline-none"
                />
              </div>
              <button type="submit" className="bg-secondary text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-secondary/90 transition-colors">
                {t('common.search')}
              </button>
            </form>

            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-8 text-sm">
              <Link to="/directory" className="inline-flex items-center gap-2 font-bold hover:text-secondary transition-colors">
                {t('home.hero.browseSuppliers')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link to="/register?role=fournisseur" className="inline-flex items-center gap-2 font-bold text-secondary hover:text-white transition-colors">
                {t('home.hero.listCompany')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>

          <Link to="/tarifs" className="mt-12 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 max-w-2xl bg-white/5 border border-secondary/30 rounded-2xl px-5 py-4 hover:border-secondary transition-colors">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-secondary shrink-0">{t('pricing.founder.label')}</span>
            <span className="text-sm text-white/80">{t('home.hero.founder')}</span>
          </Link>
        </div>
      </section>

      {/* Promesse */}
      <section className="py-12 bg-white border-b border-border-tech">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border-tech divide-y md:divide-y-0 md:divide-x rtl:md:divide-x-reverse divide-border-tech">
            {promises.map((item) => (
              <div key={item.label} className="p-8 hover:bg-neutral-bg transition-colors">
                <span className="tech-label">{item.label}</span>
                <p className="text-2xl font-black text-primary">{item.title}</p>
                <p className="text-[11px] text-gray-500 mt-2 font-medium uppercase tracking-wider">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Produits récents */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-secondary mb-4">
                <div className="w-8 h-[2px] bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">{t('home.catalogLabel')}</span>
              </div>
              <h2 className="text-4xl font-black text-primary uppercase tracking-tighter leading-none mb-4">{t('home.trends')}</h2>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{t('home.trends_subtitle')}</p>
            </div>
            <Link to="/products" className="btn-primary flex items-center gap-3 group w-fit">
              <span>{t('home.fullCatalog')}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform rtl:rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-s border-border-tech">
            {isLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border-e border-b border-border-tech p-6 relative">
                  <div className="aspect-[4/3] mb-6 bg-neutral-bg border border-border-tech p-4 flex items-center justify-center">
                    <Skeleton className="w-2/3 h-2/3 opacity-20" />
                  </div>
                  <div className="space-y-4">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500 font-medium border-e border-b border-border-tech">
                <p className="mb-4">{t('home.noProducts')}</p>
                <Link to="/register?role=fournisseur" className="text-secondary font-bold hover:underline">{t('home.beFirst')}</Link>
              </div>
            ) : products.slice(0, visibleProducts).map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (i % 4) * 0.1 }}
                className="bg-white border-e border-b border-border-tech p-6 hover:bg-neutral-bg transition-all group relative"
              >
                <Link to={`/products/${generateSlugUrl(product.name, product.id)}`} className="block aspect-square overflow-hidden mb-6 bg-gray-50 border border-border-tech p-4 group-hover:border-secondary transition-colors">
                  {product.file_url || product.image ? (
                    <img
                      src={product.file_url || product.image}
                      loading="lazy"
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><img src="/favicon.svg" alt="" className="h-12 w-12 opacity-20" /></div>
                  )}
                </Link>
                <div className="space-y-4">
                  <div>
                    {product.company && <span className="tech-label">{product.company}</span>}
                    <Link to={`/products/${generateSlugUrl(product.name, product.id)}`}>
                      <h3 className="text-sm font-black text-primary uppercase tracking-tight line-clamp-2 min-h-[40px] group-hover:text-secondary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border-tech">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{t('home.price')}</span>
                      <span className="text-sm font-mono font-bold text-primary">{Number(product.price) > 0 ? formatPrice(Number(product.price)) : t('common.onQuote')}</span>
                    </div>
                    <Link to={`/products/${generateSlugUrl(product.name, product.id)}`} aria-label={product.name} className="bg-primary text-white p-2 hover:bg-secondary transition-colors">
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {visibleProducts < products.length && (
            <div className="mt-16 text-center">
              <button onClick={showMore} className="btn-primary">
                {t('home.read_more')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Pourquoi Algeria Industry */}
      <section className="py-16 bg-neutral-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-12">{t('home.whyTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[t('home.why.visibility'), t('home.why.sourcing'), t('home.why.kyc'), t('home.why.local')].map((text) => (
              <div key={text} className="flex items-center justify-center gap-2 bg-white p-4 rounded-lg shadow-sm border border-border-tech">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                <span className="font-medium text-gray-700">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Besoin d'aide */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute top-0 end-0 w-1/3 h-full bg-secondary/10 -skew-x-12 translate-x-1/2" />
        <div className="absolute top-0 start-0 w-full h-[1px] bg-white/10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-2 text-secondary mb-6">
                <div className="w-8 h-[2px] bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">{t('footer.support')}</span>
              </div>
              <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-8">
                {t('home.help.title')}
              </h2>
              <p className="text-lg text-gray-300 font-medium leading-relaxed mb-12 max-w-xl">
                {t('home.help.text')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-bold uppercase tracking-tight text-sm">{t('home.help.delayTitle')}</h4>
                    <p className="text-xs text-gray-400 font-medium">{t('home.help.delayText')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-bold uppercase tracking-tight text-sm">{t('home.help.guidesTitle')}</h4>
                    <p className="text-xs text-gray-400 font-medium">{t('home.help.guidesText')}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link to="/contact" className="btn-secondary px-10 py-5 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                  <span>{t('home.help.contact')}</span>
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <Link to="/faq" className="bg-white/5 border border-white/10 hover:bg-white/10 px-10 py-5 font-black uppercase tracking-widest text-sm transition-all">
                  {t('home.help.faq')}
                </Link>
              </div>
            </div>

            <div className="relative group lg:block hidden">
              <div className="absolute -inset-4 border border-secondary/30 rounded-2xl translate-x-4 translate-y-4 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500" />
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-2xl relative overflow-hidden">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-8">
                  {t('home.stats.title')}
                </h3>
                {/* Compteurs réels, calculés par l'API ; masqués si indisponibles. */}
                {stats && (
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { icon: Building2, value: stats.verifiedCompanies, label: t('home.stats.verifiedCompanies') },
                      { icon: Package, value: stats.publishedProducts, label: t('home.stats.publishedProducts') },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <stat.icon className="h-5 w-5 text-secondary mb-3" />
                        <p className="text-3xl font-black font-mono">{formatNumber(stat.value)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 font-medium mt-6">{t('home.stats.commitment')}</p>

                <div className="mt-10 p-6 bg-primary rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-white">{t('home.start.title')}</p>
                      <p className="text-[10px] text-gray-500 font-bold">{t('home.start.text')}</p>
                    </div>
                  </div>
                  <Link to="/register" className="w-full bg-white text-primary py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center hover:bg-secondary hover:text-white transition-all">
                    {t('home.start.button')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default Home;
