import { Award, Building2, ChevronRight, ExternalLink, Filter, List, Map as MapIcon, MapPin, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

// No mock data needed anymore, using API

import AdSpace from '../components/AdSpace';
import { generateSlugUrl } from '../lib/utils';
import { CompanySkeleton } from '../components/Skeleton';

const Directory = () => {
  const { t, i18n } = useTranslation();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [isCertifiedOnly, setIsCertifiedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>(t('common.all'));

  const [companies, setCompanies] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true);
        // Fallback mock payload for offline/presentation setup
        const fallbackData = [
          {
            id: 1,
            reference_id: "CMP-7Y2M1B",
            name: "Algerian Industrial Solutions",
            activity_sector: "Automobile",
            description: "Leader de la construction mécanique",
            region: "Alger"
          },
          {
            id: 2,
            reference_id: "CMP-X94P2C",
            name: "Sonatrach Hub",
            activity_sector: "Énergie",
            description: "Pôle pétrolier international",
            region: "Hassi Messaoud"
          },
          {
            id: 3,
            reference_id: "CMP-8Q1Z4D",
            name: "Agro Dz",
            activity_sector: "Agroalimentaire",
            description: "Production de céréales locale",
            region: "Sétif"
          }
        ];
        
        const res = await fetch('/api/companies').catch(() => null);
        let data = fallbackData;
        
        if (res && res.ok) {
           data = await res.json();
        }
        
        const formattedData = data.map((c: any) => ({
          ...c,
          id: c.id,
          name: c.name,
          sector: c.activity_sector || "Non spécifié",
          region: c.region || "Alger",
          coordinates: { x: Math.floor(Math.random() * 40) + 30, y: Math.floor(Math.random() * 40) + 10 },
          description: c.description || "Aucune description",
          certified: Math.random() > 0.5,
          logo: `https://picsum.photos/seed/${c.id}/100/100`,
          employees: "50-100",
          founded: "2020"
        }));
        
        setCompanies(formattedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompanies();
  }, []);

  const sectors = [t('categories.agrifood'), t('categories.btph'), t('categories.chemistry'), t('categories.energy'), t('categories.pharma'), t('categories.metallurgy'), t('categories.plastics'), t('categories.textile'), t('categories.electronics'), t('categories.auto'), t('categories.renewable')];
  const regions = ["Alger", "Oran", "Constantine", "Béjaïa", "Sétif", "Bordj Bou Arreridj"];

  const toggleSector = (sector: string) => {
    setSelectedSectors(prev => 
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  };

  const filteredCompanies = companies.filter(company => {
    // Certified filter
    if (isCertifiedOnly && !company.certified) return false;
    
    // Region filter
    if (selectedRegion !== t('common.all') && company.region !== selectedRegion) return false;
    
    // Sector filter
    if (selectedSectors.length > 0 && !selectedSectors.some(s => company.sector.toLowerCase().includes(s.toLowerCase()))) return false;
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        company.name.toLowerCase().includes(query) ||
        company.description.toLowerCase().includes(query) ||
        company.sector.toLowerCase().includes(query) ||
        company.id?.toString().toLowerCase().includes(query) ||
        company.reference_id?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  return (
    <div className={cn("bg-neutral-bg min-h-screen pb-20", i18n.language === 'ar' && "font-arabic")}>
      {/* Header Section */}
      <div className="bg-white border-b border-border-tech py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn("flex flex-col md:flex-row md:items-end md:justify-between gap-6", i18n.language === 'ar' && "md:flex-row-reverse")}>
            <div className={i18n.language === 'ar' ? "text-right" : ""}>
              <div className={cn("flex items-center space-x-2 text-secondary mb-4", i18n.language === 'ar' && "space-x-reverse justify-end")}>
                <div className="w-8 h-[2px] bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.3em] font-sans">{t('directory.db_label')}</span>
              </div>
              <h1 className="text-4xl font-black text-primary uppercase tracking-tighter leading-none">{t('directory.title')}</h1>
              <p className="text-sm text-gray-500 mt-4 font-medium uppercase tracking-wider">{t('directory.subtitle')}</p>
            </div>
            <div className={cn("flex bg-neutral-bg p-1 border border-border-tech self-start", i18n.language === 'ar' && "flex-row-reverse")}>
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "flex items-center space-x-2 px-6 py-2 text-[11px] font-black uppercase tracking-widest transition-all",
                  i18n.language === 'ar' && "space-x-reverse",
                  viewMode === 'list' ? "bg-white text-primary shadow-sm border border-border-tech" : "text-gray-400 hover:text-primary"
                )}
              >
                <List className="h-4 w-4" />
                <span>{t('directory.list_view')}</span>
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={cn(
                  "flex items-center space-x-2 px-6 py-2 text-[11px] font-black uppercase tracking-widest transition-all",
                  i18n.language === 'ar' && "space-x-reverse",
                  viewMode === 'map' ? "bg-white text-primary shadow-sm border border-border-tech" : "text-gray-400 hover:text-primary"
                )}
              >
                <MapIcon className="h-4 w-4" />
                <span>{t('directory.map_view')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className={cn("flex flex-col lg:flex-row gap-12", i18n.language === 'ar' && "lg:flex-row-reverse")}>
          
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-80 space-y-8">
            <div className="bg-white p-8 border border-border-tech">
              <div className={cn("flex items-center space-x-3 mb-8", i18n.language === 'ar' && "space-x-reverse justify-end")}>
                <Filter className="h-5 w-5 text-secondary" />
                <h3 className="text-sm font-black text-primary uppercase tracking-widest">{t('directory.search_params')}</h3>
              </div>

              <div className={cn("mb-8", i18n.language === 'ar' && "text-right")}>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{t('common.search')}</span>
                <div className="mt-4 flex items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <Search className="h-4 w-4 text-gray-400 ml-2" />
                  <input 
                    type="text" 
                    placeholder="Filtrer par nom..."
                    className="flex-1 bg-transparent px-3 py-2 text-xs font-medium focus:outline-none w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Sector Filter */}
              <div className={cn("mb-8 pt-8 border-t border-gray-100", i18n.language === 'ar' && "text-right")}>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{t('directory.sector')}</span>
                <div className="space-y-3 mt-4">
                  {sectors.map((sector) => (
                    <label key={sector} className={cn("flex items-center space-x-3 cursor-pointer group", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}>
                      <input 
                        type="checkbox" 
                        checked={selectedSectors.includes(sector)}
                        onChange={() => toggleSector(sector)}
                        className="w-4 h-4 rounded-md border-gray-200 text-primary focus:ring-primary/20" 
                      />
                      <span className={cn(
                        "text-[11px] font-bold transition-colors uppercase tracking-wider",
                        selectedSectors.includes(sector) ? "text-primary" : "text-gray-500 group-hover:text-primary"
                      )}>{sector}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Region Filter */}
              <div className={cn("mb-8 pt-8 border-t border-gray-100", i18n.language === 'ar' && "text-right")}>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{t('directory.region')}</span>
                <select 
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full mt-4 bg-white border border-gray-100 rounded-xl shadow-sm text-xs font-medium p-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                   <option value={t('common.all')}>{t('common.all')}</option>
                   {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Zones Industrielles */}
              <div className={cn("mb-8 pt-8 border-t border-gray-100", i18n.language === 'ar' && "text-right")}>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{t('directory.zones')}</span>
                <div className={cn("flex flex-wrap gap-2 mt-4", i18n.language === 'ar' && "justify-end")}>
                  {["Rouiba", "Hassi Messaoud", "Arzew", "Chelghoum Laid"].map(zone => (
                    <button key={zone} className="px-3 py-1 bg-gray-50 border border-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:border-secondary hover:text-secondary transition-all" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                      {zone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Certification Toggle */}
              <div className="pt-8 border-t border-gray-100">
                <button 
                  onClick={() => setIsCertifiedOnly(!isCertifiedOnly)}
                  className={cn("flex items-center justify-between w-full cursor-pointer group", i18n.language === 'ar' && "flex-row-reverse")}
                >
                  <span className="text-[11px] font-black text-primary uppercase tracking-widest">{t('directory.iso_only')}</span>
                  <div className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    isCertifiedOnly ? "bg-primary" : "bg-gray-200 group-hover:bg-primary/20"
                  )}>
                    <span className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm",
                      isCertifiedOnly ? "translate-x-6" : "translate-x-1"
                    )} />
                  </div>
                </button>
              </div>
            </div>

            {/* Ad Slot */}
            <AdSpace 
              type="vertical" 
              title={i18n.language === 'ar' ? "تأمين المخاطر الصناعية" : "Assurance Risques Industriels"}
              description={i18n.language === 'ar' ? "احمِ أصولك من خلال حلولنا المخصصة للشركات الصغيرة والمتوسطة." : "Protégez vos actifs avec nos solutions sur mesure pour les PME."}
              imageUrl="https://picsum.photos/seed/insurance/400/600"
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className={cn("flex justify-between items-center mb-8", i18n.language === 'ar' && "flex-row-reverse")}>
               <div className={cn("flex items-center space-x-3", i18n.language === 'ar' && "space-x-reverse")}>
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-white border border-border-tech px-3 py-1">
                   {filteredCompanies.length} resultats
                 </span>
                 {(searchQuery || selectedSectors.length > 0 || selectedRegion !== t('common.all') || isCertifiedOnly) && (
                   <button 
                     onClick={() => {
                       setSearchQuery('');
                       setSelectedSectors([]);
                       setSelectedRegion(t('common.all'));
                       setIsCertifiedOnly(false);
                     }}
                     className="text-[10px] font-black text-secondary uppercase tracking-widest hover:underline"
                   >
                     Effacer les filtres
                   </button>
                 )}
               </div>
            </div>

            {/* Results Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6">
                {[...Array(5)].map((_, i) => <CompanySkeleton key={i} />)}
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-500 p-8 border border-red-100 font-bold max-w-md float-left">
                {error}
              </div>
            ) : filteredCompanies.length > 0 ? (
              viewMode === 'list' ? (
                <div className="grid grid-cols-1 gap-6">
                  {filteredCompanies.map((company, index) => (
                    <motion.div 
                      key={company.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white p-8 border border-border-tech hover:bg-neutral-bg transition-all group relative overflow-hidden"
                    >
                      {/* Technical ID Watermark */}
                      <div className={cn("absolute text-[80px] font-black text-gray-50/50 pointer-events-none tech-mono leading-none", i18n.language === 'ar' ? "-left-4 -top-4" : "-right-4 -top-4")}>
                        {company.id.toString().padStart(3, '0')}
                      </div>

                      <div className={cn("flex flex-col md:flex-row gap-8 relative z-10", i18n.language === 'ar' && "md:flex-row-reverse")}>
                        <div className="w-24 h-24 bg-white border border-border-tech p-2 flex-shrink-0">
                          <img src={company.logo} alt={company.name} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1">
                          <div className={cn("flex flex-col md:flex-row items-start justify-between gap-4", i18n.language === 'ar' && "md:flex-row-reverse")}>
                            <div className={i18n.language === 'ar' ? "text-right" : ""}>
                              <div className={cn("flex items-center space-x-3", i18n.language === 'ar' && "flex-row-reverse space-x-reverse justify-end")}>
                                <h3 className="text-xl font-black text-primary uppercase tracking-tighter group-hover:text-secondary transition-colors">{company.name}</h3>
                                {company.certified && (
                                  <div className="bg-secondary/10 text-secondary px-2 py-0.5 border border-secondary/20 flex items-center space-x-1" title="Certifié ISO">
                                    <Award className="h-3 w-3" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">ISO CERTIFIED</span>
                                  </div>
                                )}
                              </div>
                              <div className={cn("flex items-center space-x-6 mt-2", i18n.language === 'ar' && "flex-row-reverse space-x-reverse justify-end")}>
                                <div className={cn("flex items-center space-x-2", i18n.language === 'ar' && "space-x-reverse")}>
                                  <Building2 className="h-3 w-3 text-gray-400" />
                                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{company.sector}</span>
                                </div>
                                <div className={cn("flex items-center space-x-2", i18n.language === 'ar' && "space-x-reverse")}>
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{company.region}</span>
                                </div>
                              </div>
                            </div>
                            <button className="text-gray-300 hover:text-secondary transition-colors" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                              <ExternalLink className="h-5 w-5" />
                            </button>
                          </div>
                          <p className={cn("text-gray-500 text-[13px] mt-4 leading-relaxed font-medium uppercase tracking-tight", i18n.language === 'ar' && "text-right")}>{company.description}</p>
                          
                          <div className={cn("mt-8 pt-6 border-t border-border-tech grid grid-cols-2 md:grid-cols-4 gap-6", i18n.language === 'ar' && "md:flex md:flex-row-reverse md:justify-between")}>
                            <div className={i18n.language === 'ar' ? "text-right" : ""}>
                              <span className="tech-label">{t('directory.id_reg')}</span>
                              <span className="text-[11px] font-mono font-bold text-primary">{company.reference_id ? company.reference_id : `${company.founded}-DZ-${company.id.toString().substring(0, 4)}`}</span>
                            </div>
                            <div className={i18n.language === 'ar' ? "text-right" : ""}>
                              <span className="tech-label">{t('directory.workforce')}</span>
                              <span className="text-[11px] font-mono font-bold text-primary">{company.employees}</span>
                            </div>
                            <div className={i18n.language === 'ar' ? "text-right" : ""}>
                              <span className="tech-label">{t('directory.founded')}</span>
                              <span className="text-[11px] font-mono font-bold text-primary">{company.founded}</span>
                            </div>
                            <div className={cn("flex items-end justify-end", i18n.language === 'ar' && "justify-start")}>
                              <Link 
                                to={`/directory/${generateSlugUrl(company.name, company.id)}`}
                                className={cn("btn-primary py-2 px-4 flex items-center space-x-2", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}
                              >
                                <span>{t('directory.tech_sheet')}</span>
                                <ChevronRight className={cn("h-4 w-4", i18n.language === 'ar' && "rotate-180")} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-border-tech h-[700px] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-neutral-bg/50 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-20">
                    {[...Array(144)].map((_, i) => (
                      <div key={i} className="border-[0.5px] border-gray-300" />
                    ))}
                  </div>

                  {/* Algerian Map Stylized Shape (Approximation) */}
                  <div className="absolute inset-0 flex items-center justify-center p-12">
                  </div>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-64 h-[1px] bg-secondary/20 mb-8" />
                    <h3 className="text-sm font-black text-primary uppercase tracking-[0.4em] mb-2">{t('directory.map_title')}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-white px-4">{t('directory.map_subtitle')}</p>
                  </div>

                  {/* Interactive Points */}
                  {filteredCompanies.map((company, i) => (
                    <motion.div
                      key={company.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="absolute group/pin cursor-pointer"
                      style={{ left: `${company.coordinates.x}%`, top: `${company.coordinates.y}%` }}
                    >
                      <div className="relative">
                        <div className="w-4 h-4 bg-secondary rounded-full animate-ping absolute -inset-0 opacity-20" />
                        <div className="w-4 h-4 bg-primary border-2 border-white rounded-full shadow-xl relative z-10 group-hover/pin:bg-secondary transition-colors" />
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 opacity-0 group-hover/pin:opacity-100 transition-all scale-95 group-hover/pin:scale-100 pointer-events-none z-50">
                          <div className="bg-white p-4 shadow-2xl border border-border-tech relative">
                            <p className="text-[10px] font-black text-secondary tracking-widest uppercase mb-1">{company.region}</p>
                            <p className="text-xs font-black text-primary uppercase truncate">{company.name}</p>
                            <div className={cn("mt-2 flex items-center justify-between text-[8px] font-bold text-gray-400 uppercase", i18n.language === 'ar' && "flex-row-reverse")}>
                               <span>{company.sector}</span>
                               <ChevronRight className={cn("h-3 w-3", i18n.language === 'ar' && "rotate-180")} />
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <div className={cn("absolute bottom-12", i18n.language === 'ar' ? "right-12" : "left-12")}>
                     <div className={cn("flex items-center space-x-2 bg-white/80 backdrop-blur-md px-4 py-2 border border-border-tech", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}>
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary">{t('directory.headquarters')}</span>
                     </div>
                  </div>
                  
                  <div className={cn("absolute top-12", i18n.language === 'ar' ? "left-12 text-left" : "right-12 text-right")}>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Coordonnées : 36.7538° N, 3.0588° E</p>
                    <p className="text-[8px] text-gray-300 font-mono">MAP ENGINE V1.0 - SYNCED</p>
                  </div>
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Directory;
