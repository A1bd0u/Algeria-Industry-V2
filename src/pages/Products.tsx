import {
  AlertCircle,
  ArrowRight,
  ChevronDown, ChevronLeft, ChevronRight,
  Grid, List as ListIcon,
  Package, Box,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Zap,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { categoryLabel, categoryMatches, productCategories } from '../data/productCategories';
import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ProductSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { cn, generateSlugUrl } from '../lib/utils';
import AddProduct from './AddProduct';
import SEO from '../components/SEO';
import { absoluteUrl } from '../config/site';
import ProductImage from '../components/ui/ProductImage';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activePage = parseInt(searchParams.get('page') || '1');
  const [showAddModal, setShowAddModal] = React.useState(false);
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const activeCategory = searchParams.get('category') || 'Tous';
  const setActiveCategory = (c: string) => {
    const p = new URLSearchParams(searchParams);
    if (c === 'Tous') p.delete('category');
    else p.set('category', c);
    p.delete('page');
    setSearchParams(p);
  };
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const searchQuery = searchParams.get('search') || '';
  const setSearchQuery = (s: string) => {
    const p = new URLSearchParams(searchParams);
    if (!s) p.delete('search');
    else p.set('search', s);
    p.delete('page');
    setSearchParams(p);
  };
  // '' = toutes les wilayas.
  const [selectedRegion, setSelectedRegion] = useState('');
  const [isRegionOpen, setIsRegionOpen] = useState(false);

  const categoryRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (regionRef.current && !regionRef.current.contains(event.target as Node)) {
        setIsRegionOpen(false);
      }
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio < 1) {
          if (entry.target === categoryRef.current) setIsCategoryOpen(false);
          if (entry.target === regionRef.current) setIsRegionOpen(false);
        }
      });
    }, { threshold: 1 });

    const currentCategoryRef = categoryRef.current;
    const currentRegionRef = regionRef.current;

    if (currentCategoryRef) observer.observe(currentCategoryRef);
    if (currentRegionRef) observer.observe(currentRegionRef);

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      observer.disconnect();
    };
  }, []);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState<any[]>([]);

  const categories = ['Tous'];

  const fetchFavorites = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch('/api/favorites');
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.filter((f: any) => f.item_type === 'product'));
      }
    } catch (e) {
      console.error(e);
    }
  };



  const { data: productsData = { data: [], totalItems: 0, totalPages: 1 }, isLoading, isError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '1000');
      if (searchParams.get('companyId')) params.append('company_id', searchParams.get('companyId')!);
      
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('load');
      
      let result = await res.json();
      
      const formattedData = (result.data || []).map((p: any) => ({
          id: p.id,
          reference_id: p.reference_id,
          name: p.name,
          brand: p.company_name || '',
          price: p.price,
          category: p.category || '',
          region: p.region || '',
          image: p.file_url || p.image_url || null,
          features: p.features || [],
          verified: p.verified || false,
          owner_id: p.owner_id || p.company_id
      }));
      return {
        data: formattedData,
        totalItems: result.total || 0,
        totalPages: result.totalPages || 1
      };
    }
  });
  
  const products = productsData.data;
  const regionsList: string[] = ['', ...Array.from(new Set<string>(products.map((p: any) => p.region).filter(Boolean)))];
  const totalPages = productsData.totalPages;
  const totalItems = productsData.totalItems;


  useEffect(() => {
    fetchFavorites();
  }, [isAuthenticated]);

  const toggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const isFav = favorites.find(f => f.item_id === productId);
    try {
      if (isFav) {
        // Remove favorite
        await fetch(`/api/favorites/${isFav.id}`, { method: 'DELETE' });
        setFavorites(prev => prev.filter(f => f.item_id !== productId));
      } else {
        // Add favorite
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_type: 'product', item_id: productId })
        });
        if (res.ok) {
          const added = await res.json();
          setFavorites(prev => [...prev, added]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const companyIdParam = searchParams.get('company_id') || searchParams.get('companyId');
  const companyNameParam = searchParams.get('companyName');

  const filteredProducts = products.filter(product => {
     if (companyIdParam && product.owner_id !== companyIdParam && product.company_id !== companyIdParam) return false;
     if (activeCategory !== 'Tous' && !categoryMatches(activeCategory, product.category)) return false;
     if (selectedRegion && product.region !== selectedRegion) return false;
     if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return product.name?.toLowerCase().includes(query) ||
               product.brand?.toLowerCase().includes(query) ||
               product.category?.toLowerCase().includes(query) ||
               product.id?.toLowerCase().includes(query) ||
               product.reference_id?.toLowerCase().includes(query);
     }
     return true;
  });

  const itemsPerPage = 12;
  const totalFilteredItems = filteredProducts.length;
  const calculatedTotalPages = Math.ceil(totalFilteredItems / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  return (
    <React.Fragment>
      <SEO 
        title={companyNameParam ? `Produits de ${companyNameParam}` : t('products.equipment_catalog')} 
        description={t('products.hero_desc')}
        url={absoluteUrl('/products')}
      />
            <AddProduct 
         isOpen={showAddModal} 
         onClose={() => setShowAddModal(false)} 
         onSuccess={(prod) => {
            refetch();
         }}
      />
      
    <div className={cn("min-h-screen bg-neutral-bg pt-32 pb-20", i18n.language?.startsWith('ar') && "font-arabic")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 text-secondary mb-4"
            >
              <Box className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-wider">{t('products.sourcing')}</span>
            </motion.div>
            {companyNameParam && (
              <button 
                onClick={() => {
                  setSearchParams({});
                }} 
                className="text-xs font-black text-secondary hover:underline uppercase tracking-wider block mb-4"
              >
                ← Voir tout le catalogue Algeria Industry
              </button>
            )}
            <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter leading-none mb-6">
              {companyNameParam ? (
                <>
                  Tous les produits <span className="text-secondary">{companyNameParam}</span>
                </>
              ) : (
                <>
                  {t('products.equipment_catalog').split(' ')[0]} <span className="text-secondary">{t('products.equipment_catalog').split(' ').slice(1).join(' ')}</span>
                </>
              )}
            </h1>
            <p className="text-gray-500 font-medium max-w-lg">
              {t('products.hero_desc')}
            </p>
          </div>

          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
            <button 
              onClick={() => setView('grid')}
              className={cn("p-3 rounded-xl transition-all", view === 'grid' ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:text-primary")}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn("p-3 rounded-xl transition-all", view === 'list' ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:text-primary")}
            >
              <ListIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters & Categories */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-primary tracking-widest">{t('products.filters')}</h3>
                <SlidersHorizontal className="h-4 w-4 text-gray-500" />
              </div>
              
              <div className="space-y-6">
                <div className="relative" ref={categoryRef}>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">{t('products.category')}</label>
                  <button
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full flex items-center justify-between bg-gray-50 px-5 py-3 rounded-xl border border-transparent focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all cursor-pointer text-gray-800 hover:bg-gray-100 text-start"
                  >
                    <span className="text-xs font-black uppercase tracking-widest truncate">{activeCategory === 'Tous' ? t('products.all_categories') : categoryLabel(t, activeCategory)}</span>
                    <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform ms-4 shrink-0", isCategoryOpen && "rotate-180")} />
                  </button>
                  
                  {isCategoryOpen && (
                    <div className="absolute top-full start-0 z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 max-h-64 overflow-y-auto overflow-x-hidden transform origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        className={cn(
                          "w-full text-start px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-between group",
                          activeCategory === 'Tous' ? "text-primary bg-primary/5" : "text-gray-600"
                        )}
                        onClick={() => {
                          setActiveCategory('Tous');
                          setIsCategoryOpen(false);
                        }}
                      >
                        <span className={cn(activeCategory === 'Tous' ? "" : "group-hover:translate-x-1 transition-transform")}>{t('products.all_categories')}</span>
                        {activeCategory === 'Tous' && <Check className="w-4 h-4 text-primary" />}
                      </button>
                      
                      {productCategories.map(group => (
                        <div key={group.id} className="py-2">
                          <div className="px-4 py-2 text-xs font-black text-gray-500 uppercase tracking-widest bg-gray-50/50">{t(`productCategories.${group.id}`)}</div>
                          {group.subCategories.map(sub => (
                            <button
                              key={sub.id}
                              className={cn(
                                "w-full text-start px-4 py-2.5 text-xs font-bold tracking-wide hover:bg-gray-50 transition-colors flex items-center justify-between group",
                                activeCategory === sub.name ? "text-primary bg-primary/5" : "text-gray-600"
                              )}
                              onClick={() => {
                                setActiveCategory(sub.name);
                                setIsCategoryOpen(false);
                              }}
                            >
                              <span className={cn(activeCategory === sub.name ? "" : "group-hover:translate-x-1 transition-transform", "line-clamp-2 leading-tight pe-2")}>{t(`productCategories.${sub.id}`)}</span>
                              {activeCategory === sub.name && <Check className="w-3 h-3 text-primary shrink-0" />}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={regionRef}>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">{t('products.wilaya')}</label>
                  <button
                    onClick={() => setIsRegionOpen(!isRegionOpen)}
                    className="w-full flex items-center justify-between bg-gray-50 px-5 py-3 rounded-xl border border-transparent focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all cursor-pointer text-gray-800 hover:bg-gray-100 text-start"
                  >
                    <span className="text-xs font-black uppercase tracking-widest truncate">{selectedRegion || t('exhibitor.list.allWilayas')}</span>
                    <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform ms-4 shrink-0", isRegionOpen && "rotate-180")} />
                  </button>
                  
                  {isRegionOpen && (
                    <div className="absolute top-full start-0 z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 max-h-64 overflow-y-auto overflow-x-hidden transform origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                      {regionsList.map(r => (
                        <button
                          key={r}
                          className={cn(
                            "w-full text-start px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-between group",
                            selectedRegion === r ? "text-primary bg-primary/5" : "text-gray-600"
                          )}
                          onClick={() => {
                            setSelectedRegion(r);
                            setIsRegionOpen(false);
                          }}
                        >
                          <span className={cn(selectedRegion === r ? "" : "group-hover:translate-x-1 transition-transform")}>{r || t('exhibitor.list.allWilayas')}</span>
                          {selectedRegion === r && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-primary rounded-2xl p-8 text-white relative overflow-hidden">
              <Zap className="absolute -end-4 -bottom-4 w-24 h-24 text-white/10" />
              <h4 className="text-xl font-black mb-4 leading-tight">{t('products.sell_machines')}</h4>
              <p className="text-white/60 text-xs font-medium mb-6 tracking-widest">{t('products.join_suppliers')}</p>
              <button onClick={() => setShowAddModal(true)} className="w-full py-4 bg-secondary rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all text-center block text-white">{t('products.add_product')}</button>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            <div className="mb-6 flex items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <Search className="h-5 w-5 text-gray-500 ms-3 shrink-0" aria-hidden="true" />
              <input 
                type="search"
                aria-label={t('products.searchPlaceholder')}
                placeholder={t('products.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchInput);
                  }
                }}
                className="flex-1 min-w-0 bg-transparent px-3 sm:px-4 py-3 text-sm font-medium focus:outline-none"
              />
              <button className="shrink-0 px-4 sm:px-6 py-3 bg-primary rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-secondary transition-all" onClick={(e) => { e.preventDefault(); setSearchQuery(searchInput); }}>
                {t('common.search')}
              </button>
            </div>

            {isLoading ? (
              <div className={cn(
                "grid gap-6",
                view === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <ProductSkeleton key={i} view={view} />
                ))}
              </div>
            ) : isError ? (
              <div className="bg-red-50 text-red-500 p-8 border border-red-100 font-bold flex items-center mb-8">
                 <AlertCircle className="h-6 w-6 me-3" />
                 <div className="bg-red-50 p-8 border border-red-100 max-w-md mx-auto text-center flex flex-col items-center justify-center"><AlertCircle className="w-8 h-8 text-red-500 mb-4" /><h3 className="text-red-700 font-bold mb-2">{t('common.error')}</h3><p className="text-red-500 mb-4 text-sm">{t('common.error_desc')}</p><button onClick={() => refetch()} className="btn-primary py-2 px-4 flex items-center justify-center space-x-2"><RefreshCw className="w-4 h-4" /><span>{t('common.retry')}</span></button></div>
              </div>
            ) : filteredProducts.length === 0 ? (
               <div className="bg-white p-8 text-center border border-gray-200">
                  <div className="flex flex-col items-center"><Box className="w-12 h-12 text-gray-300 mb-4" /><p className="text-gray-500 font-bold uppercase">{t("products.no_results", "Aucun produit trouvé.")}</p></div>
               </div>
            ) : (
            <div className={cn(
              "grid gap-6",
              view === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              {paginatedProducts.map(product => (
                <motion.div 
                  layout
                  key={product.id}
                  className={cn(
                    "bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group",
                    view === 'list' && "flex md:flex-row"
                  )}
                >
                  <div className={cn("relative overflow-hidden", view === 'grid' ? "aspect-video" : "md:w-72 aspect-square")}>
                    <ProductImage src={product.image} alt={product.name} category={product.category} imgClassName="group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 start-4 flex gap-2">
                      <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black uppercase text-primary border border-white/20">
                        {categoryLabel(t, product.category)}
                      </span>
                      {product.verified && (
                        <div className="bg-secondary p-1.5 rounded-full text-white shadow-lg">
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base font-black text-primary leading-tight group-hover:text-secondary transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <button 
                          className={cn(
                            "transition-colors hover:scale-110 ms-3 shrink-0 mt-0.5",
                            favorites.some(f => f.item_id === product.id)
                              ? "text-red-500" 
                              : "text-gray-300 hover:text-red-400"
                          )}
                          onClick={(e) => toggleFavorite(e, product.id)}
                        >
                          <Star className="h-4 w-4" fill={favorites.some(f => f.item_id === product.id) ? "currentColor" : "none"} />
                        </button>
                      </div>
                      {product.reference_id && (
                        <p className="text-xs font-mono text-gray-500 tracking-wider">
                          REF: {product.reference_id}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-50">
                      <Link to={`/products/${generateSlugUrl(product.name, product.id)}`} className="w-full py-2.5 rounded-xl bg-primary/5 text-primary text-xs font-black uppercase tracking-widest flex items-center justify-center hover:bg-primary hover:text-white transition-all group-hover:bg-primary group-hover:text-white">
                        {t('common.see_details')}
                        <ArrowRight className="h-3.5 w-3.5 ms-2 rtl:rotate-180 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            )}
            
            {/* Pagination */}
            {calculatedTotalPages > 1 && (
              <div className="mt-12 flex justify-center items-center space-x-2">
                <button 
                  disabled={activePage === 1}
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set('page', String(Math.max(activePage - 1, 1)));
                    setSearchParams(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-3 bg-white text-primary border border-gray-100 rounded-xl hover:text-secondary hover:border-secondary/20 hover:shadow-md disabled:opacity-40 disabled:hover:text-primary disabled:hover:border-gray-100 disabled:hover:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                </button>
                
                {(() => {
                  const range = [];
                  const rangeWithDots = [];
                  let l;

                  for (let i = 1; i <= calculatedTotalPages; i++) {
                    if (i === 1 || i === calculatedTotalPages || (i >= activePage - 1 && i <= activePage + 1)) {
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
                        <span key={`dots-${index}`} className="px-3 py-2 text-gray-500 font-bold select-none">
                          .....
                        </span>
                      );
                    }
                    
                    return (
                      <button 
                        key={page}
                        onClick={() => {
                          const p = new URLSearchParams(searchParams);
                          p.set('page', String(page));
                          setSearchParams(p);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                          activePage === page 
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
                  disabled={activePage === calculatedTotalPages}
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set('page', String(Math.min(activePage + 1, calculatedTotalPages)));
                    setSearchParams(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-3 bg-white text-primary border border-gray-100 rounded-xl hover:text-secondary hover:border-secondary/20 hover:shadow-md disabled:opacity-40 disabled:hover:text-primary disabled:hover:border-gray-100 disabled:hover:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
    </React.Fragment>
  );
};

export default Products;