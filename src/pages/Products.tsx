import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Grid, List as ListIcon,
  Package,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Zap,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { productCategories } from '../data/productCategories';
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ProductSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { cn, generateSlugUrl } from '../lib/utils';
import AddProduct from './AddProduct';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activePage, setActivePage] = React.useState(1);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Toutes les wilayas');
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

  const [products, setProducts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const categories = ['Tous'];
  const regionsList = ["Toutes les wilayas", ...Array.from(new Set(products.map(p => p.region).filter(Boolean)))];

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/products');
        
        if (!res.ok) {
           throw new Error('Erreur lors du chargement des produits');
        }
        
        let data = await res.json();
        
        // Formatter les données pour le catalogue complet
        data = data.map((p: any) => ({ 
           id: p.id, 
           reference_id: p.reference_id, 
           name: p.name, 
           brand: p.company_name || 'Marque Standard',  // Si tu as une jointure
           price: p.price, 
           category: p.category || 'Non catégorisé', 
           region: p.region || 'Alger',  // À ajouter dans ta table si besoin
           image: p.file_url || p.image_url || `https://picsum.photos/seed/${p.id}/600/400`, 
           features: p.features || ['Produit de qualité'], 
           verified: p.verified || false, 
           owner_id: p.owner_id || p.company_id
        }));

        setProducts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
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
     if (activeCategory !== 'Tous' && product.category !== activeCategory) return false;
     if (selectedRegion !== 'Toutes les wilayas' && product.region !== selectedRegion) return false;
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

  return (
    <React.Fragment>
            <AddProduct 
         isOpen={showAddModal} 
         onClose={() => setShowAddModal(false)} 
         onSuccess={(prod) => {
            setProducts([prod, ...products]);
         }}
      />
      
    <div className={cn("min-h-screen bg-neutral-bg pt-32 pb-20", i18n.language === 'ar' && "font-arabic")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 text-secondary mb-4"
            >
              <Package className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('products.sourcing')}</span>
            </motion.div>
            {companyNameParam && (
              <button 
                onClick={() => {
                  setSearchParams({});
                }} 
                className="text-xs font-black text-secondary hover:underline uppercase tracking-wider block mb-4"
              >
                ← Voir tout le catalogue de Algiers Industry
              </button>
            )}
            <h1 className="text-4xl md:text-5xl font-black text-primary uppercase tracking-tighter leading-none mb-6">
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
              Explorez les meilleures technologies industrielles disponibles en Algérie. Comparez, demandez des devis et connectez-vous aux fournisseurs.
            </p>
          </div>

          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
            <button 
              onClick={() => setView('grid')}
              className={cn("p-3 rounded-xl transition-all", view === 'grid' ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-primary")}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn("p-3 rounded-xl transition-all", view === 'list' ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-primary")}
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
                <h3 className="text-sm font-black text-primary uppercase tracking-widest">{t('products.filters')}</h3>
                <SlidersHorizontal className="h-4 w-4 text-gray-400" />
              </div>
              
              <div className="space-y-6">
                <div className="relative" ref={categoryRef}>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">{t('products.category')}</label>
                  <button
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full flex items-center justify-between bg-gray-50 px-5 py-3 rounded-xl border border-transparent focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all cursor-pointer text-gray-800 hover:bg-gray-100 text-start"
                  >
                    <span className="text-xs font-black uppercase tracking-widest truncate">{activeCategory === 'Tous' ? 'Toutes les catégories' : activeCategory}</span>
                    <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform ms-4 shrink-0", isCategoryOpen && "rotate-180")} />
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
                          <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">{group.name}</div>
                          {group.subCategories.map(sub => (
                            <button
                              key={sub.id}
                              className={cn(
                                "w-full text-start px-4 py-2.5 text-[11px] font-bold tracking-wide hover:bg-gray-50 transition-colors flex items-center justify-between group",
                                activeCategory === sub.name ? "text-primary bg-primary/5" : "text-gray-600"
                              )}
                              onClick={() => {
                                setActiveCategory(sub.name);
                                setIsCategoryOpen(false);
                              }}
                            >
                              <span className={cn(activeCategory === sub.name ? "" : "group-hover:translate-x-1 transition-transform", "line-clamp-2 leading-tight pe-2")}>{sub.name}</span>
                              {activeCategory === sub.name && <Check className="w-3 h-3 text-primary shrink-0" />}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={regionRef}>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">{t('products.wilaya')}</label>
                  <button
                    onClick={() => setIsRegionOpen(!isRegionOpen)}
                    className="w-full flex items-center justify-between bg-gray-50 px-5 py-3 rounded-xl border border-transparent focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all cursor-pointer text-gray-800 hover:bg-gray-100 text-start"
                  >
                    <span className="text-xs font-black uppercase tracking-widest truncate">{selectedRegion === 'Toutes les wilayas' ? 'Toutes les wilayas' : selectedRegion}</span>
                    <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform ms-4 shrink-0", isRegionOpen && "rotate-180")} />
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
                          <span className={cn(selectedRegion === r ? "" : "group-hover:translate-x-1 transition-transform")}>{r === 'Toutes les wilayas' ? "Toutes les wilayas" : r}</span>
                          {selectedRegion === r && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">{t('products.sales_type')}</label>
                  <div className="space-y-2">
                    {['Neuf', 'Occasions Rénovées', 'Déstockage'].map(type => (
                      <label key={type} className="flex items-center space-x-3 cursor-pointer group">
                        <div className="w-5 h-5 rounded-md border-2 border-gray-100 group-hover:border-secondary transition-all" />
                        <span className="text-xs font-bold text-gray-600">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary rounded-2xl p-8 text-white relative overflow-hidden">
              <Zap className="absolute -end-4 -bottom-4 w-24 h-24 text-white/10" />
              <h4 className="text-xl font-black mb-4 leading-tight uppercase">{t('products.sell_machines')}</h4>
              <p className="text-white/60 text-[10px] font-medium mb-6 uppercase tracking-widest">Rejoignez 500+ fournisseurs en Algérie</p>
              <button onClick={() => setShowAddModal(true)} className="w-full py-4 bg-secondary rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all text-center block text-white">{t('products.add_product')}</button>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            <div className="mb-6 flex items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <Search className="h-5 w-5 text-gray-400 ms-3" />
              <input 
                type="text"
                placeholder="Rechercher une machine, une marque..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent px-4 py-3 text-sm font-medium focus:outline-none"
              />
              <button className="px-6 py-3 bg-primary rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-secondary transition-all" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                Rechercher
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
            ) : error ? (
              <div className="bg-red-50 text-red-500 p-8 border border-red-100 font-bold flex items-center mb-8">
                 <AlertCircle className="h-6 w-6 me-3" />
                 {error}
              </div>
            ) : filteredProducts.length === 0 ? (
               <div className="bg-white p-8 text-center border border-gray-200">
                  <p className="text-gray-500 font-bold uppercase">Aucun produit trouvé.</p>
               </div>
            ) : (
            <div className={cn(
              "grid gap-6",
              view === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              {filteredProducts.map(product => (
                <motion.div 
                  layout
                  key={product.id}
                  className={cn(
                    "bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group",
                    view === 'list' && "flex md:flex-row"
                  )}
                >
                  <div className={cn("relative overflow-hidden", view === 'grid' ? "aspect-[4/3]" : "md:w-72 aspect-square")}>
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 start-4 flex gap-2">
                      <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black uppercase text-primary border border-white/20">
                        {product.category}
                      </span>
                      {product.verified && (
                        <div className="bg-secondary p-1.5 rounded-full text-white shadow-lg">
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-secondary tracking-[0.2em] uppercase">{product.brand}</span>
                        <button 
                          className={cn(
                            "transition-colors hover:scale-110",
                            favorites.some(f => f.item_id === product.id)
                              ? "text-red-500" 
                              : "text-gray-300 hover:text-red-400"
                          )}
                          onClick={(e) => toggleFavorite(e, product.id)}
                        >
                          <Star className="h-4 w-4" fill={favorites.some(f => f.item_id === product.id) ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <h3 className="text-lg font-black text-primary leading-tight mb-2 group-hover:text-secondary transition-colors">
                        {product.name}
                      </h3>
                      {product.reference_id && (
                        <p className="text-[10px] font-mono text-gray-400 mb-4 tracking-wider">
                          REF: {product.reference_id}
                        </p>
                      )}
                      <div className="grid grid-cols-1 gap-2 mb-6">
                        {product.features.map((f, i) => (
                          <div key={i} className="flex items-center space-x-2 text-[10px] text-gray-400 font-bold uppercase italic">
                            <div className="w-1 h-1 rounded-full bg-gray-200" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-6">
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-400 flex items-center bg-gray-50 px-2 py-1 rounded-lg">
                          📍 {product.region}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('products.quotes')}</p>
                        <p className="text-lg font-black text-primary uppercase tracking-tighter">{product.price}</p>
                      </div>
                      <Link to={`/products/${generateSlugUrl(product.name, product.id)}`} className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-secondary transition-all shadow-lg">
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            )}

            {/* Pagination Placeholder */}
            <div className="mt-12 flex items-center justify-center space-x-2">
              {[1, 2, 3].map(page => (
                 <button 
                   key={page}
                   onClick={() => setActivePage(page)}
                   className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${activePage === page ? 'bg-primary text-white shadow-lg' : 'border border-gray-100 text-gray-400 hover:border-primary hover:text-primary'}`}
                 >
                   {page}
                 </button>
              ))}
              <span className="px-2 text-gray-300">...</span>
              <button 
                onClick={() => setActivePage(prev => prev + 1)}
                className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 hover:border-primary hover:text-primary transition-all"
              >
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
    </React.Fragment>
  );
};

export default Products;
