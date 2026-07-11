import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  Filter,
  Globe,
  Inbox,
  Package,
  Search,
  ShieldCheck,
  Zap,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { cn, generateSlugUrl } from '../lib/utils';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [typeFilter, setTypeFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState('');
  
  const { t, i18n } = useTranslation();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['search', query, typeFilter, sectorFilter, wilayaFilter],
    initialPageParam: null,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor || null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (sectorFilter) params.append('sector', sectorFilter);
      if (wilayaFilter) params.append('wilaya', wilayaFilter);
      if (pageParam) params.append('cursor', pageParam as string);
      
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    }
  });

  const results = {
    companies: data?.pages.flatMap(p => p.results.companies) || [],
    products: data?.pages.flatMap(p => p.results.products) || [],
  };
  const totalResults = results.companies.length + results.products.length;

  return (
    <div className={cn("min-h-screen bg-neutral-bg pt-10 pb-20", i18n.language?.startsWith('ar') && "font-arabic")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
             <Search className="h-5 w-5 text-secondary" />
             <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">{t('search.results_for')} "{query || 'Toutes les données'}"</h1>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
            Nous avons trouvé {isLoading ? '...' : totalResults} résultats correspondant à votre requête.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Filters Sidebar */}
          <aside className="space-y-8">
            <div className="bg-white p-8 border border-gray-100 shadow-sm rounded-none">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center">
                <Filter className="h-4 w-4 me-2 text-secondary" />
                Filtrer par type
              </h3>
              <div className="space-y-3 mb-8">
                {[
                  { id: 'all', label: 'Tous les résultats' },
                  { id: 'products', label: 'Produits' },
                  { id: 'companies', label: 'Entreprises' }
                ].map((filter) => (
                  <label key={filter.id} className="flex items-center space-x-3 cursor-pointer group" onClick={() => setTypeFilter(filter.id)}>
                    <div className={cn(
                      "w-4 h-4 border-2 transition-all",
                      typeFilter === filter.id ? "border-secondary bg-secondary" : "border-gray-200 group-hover:border-secondary"
                    )} />
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      typeFilter === filter.id ? "text-primary" : "text-gray-400 group-hover:text-primary"
                    )}>{filter.label}</span>
                  </label>
                ))}
              </div>
              
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center">
                Filtres Avancés
              </h3>
              
              <div className="space-y-4">
                 <div>
                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">{t('search.sector_cat')}</label>
                   <input 
                     type="text" 
                     placeholder="Ex: Énergie, IT..." 
                     value={sectorFilter}
                     onChange={(e) => setSectorFilter(e.target.value)}
                     className="w-full bg-gray-50 border border-gray-100 p-3 text-xs focus:border-secondary outline-none transition-all"
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">{t('search.region')}</label>
                   <input 
                     type="text" 
                     placeholder="Ex: Alger, Oran..." 
                     value={wilayaFilter}
                     onChange={(e) => setWilayaFilter(e.target.value)}
                     className="w-full bg-gray-50 border border-gray-100 p-3 text-xs focus:border-secondary outline-none transition-all"
                   />
                 </div>
              </div>
            </div>
            
            <div className="bg-primary p-10 text-white rounded-none relative overflow-hidden">
               <div className="absolute -end-8 -bottom-8 opacity-10">
                 <Zap className="h-32 w-32" />
               </div>
               <h3 className="text-xl font-black uppercase tracking-tighter mb-4 relative z-10">{t('search.boost_vis')}</h3>
               <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest leading-relaxed mb-8 relative z-10">
                 Apparaissez en tête des résultats de recherche pour vos mots-clés stratégiques.
               </p>
               <Link to="/contact" className="w-full bg-secondary py-4 text-[10px] font-black uppercase tracking-widest hover:rotate-1 transition-all relative z-10 flex items-center justify-center text-white cursor-pointer">
                 Publicité Ciblée
               </Link>
            </div>
          </aside>

          {/* Results Area */}
          <div className="lg:col-span-3 space-y-12">
             {isLoading ? (
                <div className="flex justify-center items-center py-20">
                   <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                </div>
             ) : (
                <>
                   {/* Products Section */}
                   {(typeFilter === 'all' || typeFilter === 'products') && results.products.length > 0 && (
                     <section>
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                          <h2 className="text-xs font-black text-primary uppercase tracking-[0.3em]">{t('search.products_found')}</h2>
                          <span className="text-[10px] font-black text-secondary uppercase bg-secondary/5 px-3 py-1">{results.products.length} PRODUITS</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {results.products.map((product: any) => (
                            <Link 
                               key={product.id} 
                               to={`/products/${generateSlugUrl(product.name, String(product.id))}`}
                              className="bg-white group border border-gray-100 hover:border-secondary transition-all flex flex-col sm:flex-row"
                            >
                              <div className="w-full sm:w-48 aspect-[4/3] sm:aspect-square overflow-hidden bg-gray-50 shrink-0">
                                <img src={product.file_url || `https://picsum.photos/seed/${product.id}/400/300`} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                              </div>
                              <div className="p-6 flex flex-col justify-between flex-1">
                                <div>
                                  <p className="text-[9px] font-black text-secondary uppercase tracking-widest mb-1">{product.category || 'Général'}</p>
                                  <h4 className="text-lg font-black text-primary uppercase tracking-tighter group-hover:text-secondary transition-colors leading-tight mb-4">{product.name}</h4>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                  <span className="text-xs font-black text-primary">{product.price ? `${product.price} DA` : "Sur demande"}</span>
                                  <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-secondary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                     </section>
                   )}

                   {/* Companies Section */}
                   {(typeFilter === 'all' || typeFilter === 'companies') && results.companies.length > 0 && (
                     <section>
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                          <h2 className="text-xs font-black text-primary uppercase tracking-[0.3em]">{t('search.companies_found')}</h2>
                          <span className="text-[10px] font-black text-secondary uppercase bg-secondary/5 px-3 py-1">{results.companies.length} ENTREPRISES</span>
                        </div>
                        <div className="space-y-4">
                          {results.companies.map((company: any) => (
                            <Link 
                               key={company.id} 
                               to={`/directory/${generateSlugUrl(company.name, company.id)}`}
                              className="bg-white p-6 border border-gray-100 hover:border-secondary transition-all flex items-center justify-between group"
                            >
                              <div className="flex items-center space-x-6">
                                <div className="w-16 h-16 bg-gray-50 flex items-center justify-center rounded-none border border-gray-100 text-secondary font-black text-xl">
                                  {company.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="text-lg font-black text-primary uppercase tracking-tighter group-hover:text-secondary transition-colors">{company.name}</h4>
                                    {company.status === 'approved' && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                                  </div>
                                  <div className="flex items-center space-x-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                    <span className="flex items-center"><Globe className="h-3 w-3 me-1" /> {company.wilaya || company.address || 'Algérie'}</span>
                                    <span className="flex items-center"><Package className="h-3 w-3 me-1" /> {company.activity_sector || 'Général'}</span>
                                  </div>
                                </div>
                              </div>
                              <button className="hidden sm:flex items-center space-x-2 px-6 py-3 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-primary group-hover:bg-secondary group-hover:text-white transition-all">
                                <span>{t('search.view_profile')}</span>
                                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                              </button>
                            </Link>
                          ))}
                        </div>
                     </section>
                   )}

                   {/* Load More */}
                   {hasNextPage && (
                     <div className="flex justify-center mt-8">
                       <button
                         onClick={() => fetchNextPage()}
                         disabled={isFetchingNextPage}
                         className="px-8 py-4 bg-gray-50 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-gray-100 transition-colors disabled:opacity-50"
                       >
                         {isFetchingNextPage ? 'Chargement...' : 'Voir plus de résultats'}
                       </button>
                     </div>
                   )}

                   {/* Empty State / No more results */}
                   {totalResults === 0 && (
                     <div className="bg-white p-12 text-center border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                           <Inbox className="h-6 w-6 text-gray-300" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">{t('search.no_results')}</p>
                        <p className="text-xs text-gray-400 font-medium mt-2">{t('search.no_results_desc')} <Link to="/contact" className="text-secondary underline">{t('search.contact_support')}</Link></p>
                     </div>
                   )}
                </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
