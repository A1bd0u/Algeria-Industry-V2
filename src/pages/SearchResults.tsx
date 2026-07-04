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
  Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { cn, generateSlugUrl } from '../lib/utils';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { i18n } = useTranslation();

  // Mock results
  const results = {
    products: [
      { id: 1, name: "Unité de Filtration HP", category: "Équipement Industriel", company: "Global Filtration DZ", price: "Sur demande", image: "https://picsum.photos/seed/p1/400/300" },
      { id: 2, name: "Pompe Hydraulique V2", category: "Composants", company: "Mecanique Plus", price: "245,000 DA", image: "https://picsum.photos/seed/p2/400/300" },
    ],
    companies: [
      { id: 'sonatrach', name: "Sonatrach SPA", sector: "Énergie", location: "Alger", verified: true },
      { id: 'algeria-tech', name: "Algeria Tech Solutions", sector: "IT / Automation", location: "Oran", verified: true },
    ]
  };

  return (
    <div className={cn("min-h-screen bg-neutral-bg pt-10 pb-20", i18n.language === 'ar' && "font-arabic")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
             <Search className="h-5 w-5 text-secondary" />
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Résultats de recherche</span>
          </div>
          <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">
            Recherche : <span className="text-secondary">"{query}"</span>
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
            Nous avons trouvé 4 résultats correspondant à votre requête.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Filters Sidebar */}
          <aside className="space-y-8">
            <div className="bg-white p-8 border border-gray-100 shadow-sm rounded-none">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center">
                <Filter className="h-4 w-4 mr-2 text-secondary" />
                Filtrer par type
              </h3>
              <div className="space-y-3">
                {['Tous les types', 'Produits (12)', 'Entreprises (4)', 'Appels d\'offres (0)'].map((filter, i) => (
                  <label key={i} className="flex items-center space-x-3 cursor-pointer group">
                    <div className={cn(
                      "w-4 h-4 border-2 transition-all",
                      i === 0 ? "border-secondary bg-secondary" : "border-gray-200 group-hover:border-secondary"
                    )} />
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      i === 0 ? "text-primary" : "text-gray-400 group-hover:text-primary"
                    )}>{filter}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-primary p-10 text-white rounded-none relative overflow-hidden">
               <div className="absolute -right-8 -bottom-8 opacity-10">
                 <Zap className="h-32 w-32" />
               </div>
               <h3 className="text-xl font-black uppercase tracking-tighter mb-4 relative z-10">Booster votre visibilité ?</h3>
               <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest leading-relaxed mb-8 relative z-10">
                 Apparaissez en tête des résultats de recherche pour vos mots-clés stratégiques.
               </p>
               <Link to="/company-profile" className="w-full bg-secondary py-4 text-[10px] font-black uppercase tracking-widest hover:rotate-1 transition-all relative z-10 flex items-center justify-center text-white cursor-pointer">
                 Publicité Ciblée
               </Link>
            </div>
          </aside>

          {/* Results Area */}
          <div className="lg:col-span-3 space-y-12">
             {/* Products Section */}
             <section>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                  <h2 className="text-xs font-black text-primary uppercase tracking-[0.3em]">PRODUITS TROUVÉS</h2>
                  <span className="text-[10px] font-black text-secondary uppercase bg-secondary/5 px-3 py-1">2 PRODUITS</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.products.map((product) => (
                    <Link 
                      key={product.id} 
                      to={`/products/${generateSlugUrl(product.name, String(product.id))}`}
                      className="bg-white group border border-gray-100 hover:border-secondary transition-all flex flex-col sm:flex-row"
                    >
                      <div className="w-full sm:w-48 aspect-[4/3] sm:aspect-square overflow-hidden bg-gray-50 shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="p-6 flex flex-col justify-between flex-1">
                        <div>
                          <p className="text-[9px] font-black text-secondary uppercase tracking-widest mb-1">{product.category}</p>
                          <h4 className="text-lg font-black text-primary uppercase tracking-tighter group-hover:text-secondary transition-colors leading-tight mb-4">{product.name}</h4>
                          <div className="flex items-center space-x-2 text-[9px] font-bold text-gray-400 uppercase mb-4">
                            <Building2 className="h-3 w-3" />
                            <span>{product.company}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <span className="text-xs font-black text-primary">{product.price}</span>
                          <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-secondary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
             </section>

             {/* Companies Section */}
             <section>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                  <h2 className="text-xs font-black text-primary uppercase tracking-[0.3em]">ENTREPRISES TROUVÉES</h2>
                  <span className="text-[10px] font-black text-secondary uppercase bg-secondary/5 px-3 py-1">2 ENTREPRISES</span>
                </div>
                <div className="space-y-4">
                  {results.companies.map((company) => (
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
                            {company.verified && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                          </div>
                          <div className="flex items-center space-x-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            <span className="flex items-center"><Globe className="h-3 w-3 mr-1" /> {company.location}</span>
                            <span className="flex items-center"><Package className="h-3 w-3 mr-1" /> {company.sector}</span>
                          </div>
                        </div>
                      </div>
                      <button className="hidden sm:flex items-center space-x-2 px-6 py-3 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-primary group-hover:bg-secondary group-hover:text-white transition-all" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                        <span>Voir profil</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  ))}
                </div>
             </section>

             {/* Empty State / No more results */}
             <div className="bg-white p-12 text-center border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Inbox className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Fin des résultats</p>
                <p className="text-xs text-gray-400 font-medium mt-2">Vous n'avez pas trouvé ce que vous cherchiez ? <Link to="/contact" className="text-secondary underline">Contactez notre support</Link></p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
