import {
  Factory,
  Layout,
  MapPin,
  MessageSquare,
  Search, ShieldCheck, Star, ChevronDown, Check, ArrowRight,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn, generateSlugUrl } from '../lib/utils';
import { CompanySkeleton } from '../components/Skeleton';
import { formatNumber } from '../lib/format';

const Exhibitors = () => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  // '' = tous les secteurs / toutes les wilayas.
  const [activeSector, setActiveSector] = useState('');
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState('');
  const [stats, setStats] = useState<{ verifiedCompanies: number; publishedProducts: number } | null>(null);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [exhibitors, setExhibitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeSector, activeRegion, showVerifiedOnly]);

  const sectorRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectorRef.current && !sectorRef.current.contains(event.target as Node)) {
        setIsSectorOpen(false);
      }
      if (regionRef.current && !regionRef.current.contains(event.target as Node)) {
        setIsRegionOpen(false);
      }
    };

    const handleScroll = () => {
      setIsSectorOpen(false);
      setIsRegionOpen(false);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio < 1) {
          if (entry.target === sectorRef.current) setIsSectorOpen(false);
          if (entry.target === regionRef.current) setIsRegionOpen(false);
        }
      });
    }, { threshold: 1 });

    const currentSectorRef = sectorRef.current;
    const currentRegionRef = regionRef.current;

    if (currentSectorRef) observer.observe(currentSectorRef);
    if (currentRegionRef) observer.observe(currentRegionRef);

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  // Récupération des entreprises depuis l'API
  useEffect(() => {
    const fetchExhibitors = async () => {
      try {
        setIsLoading(true);
        fetch('/api/stats/public')
          .then((r) => (r.ok ? r.json() : null))
          .then((value) => value && setStats(value))
          .catch(() => {});
        const res = await fetch('/api/companies?limit=50');
        if (!res.ok) throw new Error('load');
        let data = await res.json();
        if (data && data.data) data = data.data;
        
        // Formatage des données pour correspondre à l'affichage attendu
        const formatted = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          sector: c.activity_sector || '',
          location: c.wilaya || '',
          description: c.description || '',
          logo: c.logo_url || '/favicon.svg',
          verified: c.status === 'approved',
          status: c.status
        }));
        
        setExhibitors(formatted);
      } catch (err: any) {
        setError(t('exhibitor.list.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExhibitors();
  }, []);

  // Filtrage des exposants
  const filteredExhibitors = exhibitors.filter((exhibitor: any) => {
    const matchesSearch = exhibitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exhibitor.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = !activeSector || exhibitor.sector === activeSector;
    const matchesRegion = !activeRegion || exhibitor.location === activeRegion;
    const matchesVerified = !showVerifiedOnly || exhibitor.verified;
    return matchesSearch && matchesSector && matchesRegion && matchesVerified;
  });

  const totalItems = filteredExhibitors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExhibitors = filteredExhibitors.slice(startIndex, endIndex);

  // Filtres construits à partir des entreprises réellement inscrites.
  const uniqueSorted = (values: string[]) => Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const sectors = ['', ...uniqueSorted(exhibitors.map((e: any) => e.sector))];
  const regions = ['', ...uniqueSorted(exhibitors.map((e: any) => e.location))];

  return (
    <div className={cn("min-h-screen bg-neutral-bg pt-8 pb-20", i18n.language?.startsWith('ar') && "font-arabic")}>
      <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-2">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 text-secondary mb-4"
            >
              <Factory className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('exhibitor.list.label')}</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-primary uppercase tracking-tighter leading-none mb-6">
              {t('exhibitor.list.title')}
            </h1>
            <p className="text-gray-500 font-medium text-lg leading-relaxed">
              {t('exhibitor.list.subtitle')}
            </p>
          </div>
          
          {stats && (
            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-end">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('home.stats.verifiedCompanies')}</p>
                <p className="text-2xl font-black text-secondary tracking-tighter">{formatNumber(stats.verifiedCompanies)}</p>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="text-end">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('home.stats.publishedProducts')}</p>
                <p className="text-2xl font-black text-secondary tracking-tighter">{formatNumber(stats.publishedProducts)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <div className="sticky top-[96px] z-30 bg-transparent py-4 -mt-4 mb-12">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <Search className="h-5 w-5 text-gray-400 ms-3" />
              <input 
                type="text" 
                placeholder={t('exhibitor.list.searchPlaceholder')}
                aria-label={t('exhibitor.list.searchPlaceholder')}
                className="flex-1 bg-transparent px-4 py-3 text-sm font-medium focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <div className="relative" ref={sectorRef}>
                <button
                  onClick={() => setIsSectorOpen(!isSectorOpen)}
                  className="w-full sm:w-auto flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer text-gray-800 hover:border-gray-300 min-w-[260px] text-start"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('exhibitor.list.sector')}</span>
                    <span className="text-xs font-black uppercase tracking-widest truncate">{activeSector || t('exhibitor.list.allSectors')}</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform ms-4 shrink-0", isSectorOpen && "rotate-180")} />
                </button>
                
                {isSectorOpen && (
                  <div className="absolute top-full start-0 z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden transform origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2">
                       <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t('exhibitor.list.sectors')}</span>
                    </div>
                    {sectors.map(s => (
                      <button
                        key={s}
                        className={cn(
                          "w-full text-start px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-between group",
                          activeSector === s ? "text-primary bg-primary/5" : "text-gray-600"
                        )}
                        onClick={() => {
                          setActiveSector(s);
                          setIsSectorOpen(false);
                        }}
                      >
                        <span className={cn(activeSector === s ? "" : "group-hover:translate-x-1 transition-transform")}>{s || t('exhibitor.list.allSectors')}</span>
                        {activeSector === s && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={regionRef}>
                <button
                  onClick={() => setIsRegionOpen(!isRegionOpen)}
                  className="w-full sm:w-auto flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer text-gray-800 hover:border-gray-300 min-w-[200px] text-start"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('exhibitor.list.wilaya')}</span>
                    <span className="text-xs font-black uppercase tracking-widest truncate">{activeRegion || t('exhibitor.list.allWilayas')}</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform ms-4 shrink-0", isRegionOpen && "rotate-180")} />
                </button>
                
                {isRegionOpen && (
                  <div className="absolute top-full start-0 z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden transform origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2">
                       <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t('exhibitor.list.wilayas')}</span>
                    </div>
                    {regions.map(r => (
                      <button
                        key={r}
                        className={cn(
                          "w-full text-start px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-between group",
                          activeRegion === r ? "text-primary bg-primary/5" : "text-gray-600"
                        )}
                        onClick={() => {
                          setActiveRegion(r);
                          setIsRegionOpen(false);
                        }}
                      >
                        <span className={cn(activeRegion === r ? "" : "group-hover:translate-x-1 transition-transform")}>{r || t('exhibitor.list.allWilayas')}</span>
                        {activeRegion === r && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>


            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <CompanySkeleton key={i} />
            ))
          ) : error ? (
            <div className="col-span-full text-center py-12">
              <p className="text-red-500 font-bold">{error}</p>
            </div>
          ) : filteredExhibitors.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl p-8 border border-gray-100">
              <p className="text-gray-400 font-bold">{t('exhibitor.list.none')}</p>
            </div>
          ) : (
            paginatedExhibitors.map((exhibitor: any, idx) => (
              <motion.div 
                key={exhibitor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-2xl hover:border-secondary/20 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 p-2 overflow-hidden group-hover:scale-105 transition-transform">
                      <img src={exhibitor.logo} alt={exhibitor.name} className="w-full h-full object-contain" />
                    </div>
                    {exhibitor.verified && (
                      <span className="flex items-center gap-1 text-success text-[9px] font-black uppercase tracking-widest">
                        <ShieldCheck className="h-4 w-4" />
                        {t('compare.verified')}
                      </span>
                    )}
                  </div>

                  <div className="mb-5">
                    {exhibitor.sector && <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1">{exhibitor.sector}</p>}
                    <h3 className="text-lg font-black text-primary uppercase tracking-tight group-hover:text-secondary transition-colors mb-2 line-clamp-1">
                      {exhibitor.name}
                    </h3>
                    {exhibitor.location && (
                      <div className="flex items-center text-gray-400 mb-1">
                        <MapPin className="h-3.5 w-3.5 me-2 shrink-0 text-secondary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest truncate">{exhibitor.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {exhibitor.description && (
                    <p className="mb-5 pt-4 border-t border-gray-50 text-xs text-gray-500 line-clamp-3">{exhibitor.description}</p>
                  )}

                  <div className="flex gap-3">
                    <Link to={`/directory/${generateSlugUrl(exhibitor.name, String(exhibitor.id))}`} className="flex-1 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all flex items-center justify-center space-x-2 shadow-lg group">
                      <span>{t('exhibitor.list.visit')}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform rtl:rotate-180" />
                    </Link>
                    <Link to={`/directory/${generateSlugUrl(exhibitor.name, String(exhibitor.id))}`} aria-label={t('common.contact_supplier')} className="w-12 h-12 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:text-secondary hover:bg-secondary/5 transition-all shrink-0">
                      <MessageSquare className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-3 bg-white text-primary border border-gray-100 rounded-xl hover:text-secondary hover:border-secondary/20 hover:shadow-md disabled:opacity-40 disabled:hover:text-primary disabled:hover:border-gray-100 disabled:hover:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </button>

            {(() => {
              const range = [];
              const rangeWithDots = [];
              let l;

              for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                  range.push(i);
                }
              }

              for (const i of range) {
                if (l) {
                  if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                  } else if (i - l > 2) {
                    rangeWithDots.push('...');
                  }
                }
                rangeWithDots.push(i);
                l = i;
              }

              return rangeWithDots.map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`dots-${index}`} className="px-3 py-2 text-gray-400 font-bold select-none">
                      .....
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page as number);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                      currentPage === page
                        ? "bg-secondary text-white"
                        : "bg-white text-primary border border-gray-100 hover:text-secondary hover:border-secondary/20 hover:shadow-md"
                    )}
                  >
                    {page}
                  </button>
                );
              });
            })()}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-3 bg-white text-primary border border-gray-100 rounded-xl hover:text-secondary hover:border-secondary/20 hover:shadow-md disabled:opacity-40 disabled:hover:text-primary disabled:hover:border-gray-100 disabled:hover:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        )}

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="mt-20 bg-primary rounded-2xl p-12 text-white relative overflow-hidden text-center"
        >
          <div className="absolute inset-0 opacity-5" 
               style={{ backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6">
              {t('exhibitor.list.ctaTitle')}
            </h2>
            <p className="text-white/60 font-medium mb-10 text-lg">
              {t('exhibitor.list.ctaText')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register?role=fournisseur" className="btn-secondary px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl">
                {t('exhibitor.list.ctaButton')}
              </Link>
              <Link to="/tarifs" className="bg-white/10 border border-white/20 px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center">
                {t('exhibitor.list.ctaPricing')}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Exhibitors;
