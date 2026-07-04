import { AlertCircle, Building2, Download, ExternalLink, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CatalogueSkeleton } from '../components/Skeleton';
import { cn } from '../lib/utils';

const Catalogues = () => {
  const { t, i18n } = useTranslation();
  
  const categories = [
    { key: 'all', label: t('categories.all') },
    { key: 'agrifood', label: t('categories.agrifood') },
    { key: 'btph', label: t('categories.btph') },
    { key: 'chemistry', label: t('categories.chemistry') },
    { key: 'energy', label: t('categories.energy') },
    { key: 'pharma', label: t('categories.pharma') },
    { key: 'metallurgy', label: t('categories.metallurgy') },
    { key: 'plastics', label: t('categories.plastics') },
    { key: 'textile', label: t('categories.textile') },
    { key: 'electronics', label: t('categories.electronics') },
    { key: 'auto', label: t('categories.auto') },
    { key: 'renewable', label: t('categories.renewable') }
  ];

  const [selectedCategoryKey, setSelectedCategoryKey] = useState('all');
  const [catalogues, setCatalogues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCatalogues = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/catalogues');
        if (!res.ok) throw new Error("Erreur de récupération des catalogues");
        const data = await res.json();
        setCatalogues(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCatalogues();
  }, []);

  const filteredCatalogues = catalogues.filter(cat => {
    const matchesCategory = selectedCategoryKey === 'all' || cat.categoryKey === selectedCategoryKey;
    return matchesCategory;
  });

  return (
    <div className={cn("bg-neutral-bg min-h-screen pb-20", i18n.language === 'ar' && "font-arabic")}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-8", i18n.language === 'ar' && "md:flex-row-reverse text-right")}>
            <div className={cn(i18n.language === 'ar' && "ml-auto")}>
              <div className={cn("flex items-center space-x-2 text-secondary mb-4", i18n.language === 'ar' && "flex-row-reverse space-x-reverse justify-end")}>
                <div className="w-8 h-[2px] bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">{t('catalogues.tech_doc')}</span>
              </div>
              <h1 className="text-4xl font-black text-primary uppercase tracking-tighter leading-none">{t('catalogues.title')}</h1>
              <p className="text-gray-500 mt-4 max-w-2xl font-medium uppercase text-xs tracking-wider">
                {t('catalogues.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories */}
        <div className={cn("flex flex-wrap gap-2 mb-12", i18n.language === 'ar' && "flex-row-reverse")}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategoryKey(cat.key)}
              className={cn(
                "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all border",
                selectedCategoryKey === cat.key 
                  ? "bg-primary border-primary text-white shadow-lg hover:bg-secondary hover:border-secondary transition-colors" 
                  : "bg-white border-gray-200 text-gray-500 hover:border-secondary hover:text-secondary"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Catalogues Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1, 2, 3, 4, 5, 6].map(i => <CatalogueSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="py-20 flex flex-col items-center justify-center">
             <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
             <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCatalogues.map((cat, index) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn("bg-white border border-gray-200 group hover:border-secondary transition-all flex flex-col", i18n.language === 'ar' && "text-right")}
                >
                  <div className="aspect-[4/5] relative overflow-hidden bg-gray-100 border-b border-gray-200">
                    <img 
                      src={cat.thumbnail} 
                      alt={cat.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="bg-secondary text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                        <Download className="h-6 w-6" />
                      </button>
                    </div>
                    <div className={cn("absolute top-4", i18n.language === 'ar' ? "right-4" : "left-4")}>
                      <span className="bg-primary text-white px-3 py-1 text-[9px] font-black uppercase tracking-tighter">
                        {t(`categories.${cat.categoryKey}`)}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col">
                    <div className={cn("flex items-center space-x-2 text-[10px] font-mono text-secondary mb-2 font-bold uppercase", i18n.language === 'ar' && "flex-row-reverse space-x-reverse justify-start")}>
                      <Building2 className="h-3 w-3" />
                      <span>{cat.company}</span>
                    </div>
                    <h3 className="text-lg font-black text-primary uppercase tracking-tighter leading-tight mb-4 group-hover:text-secondary transition-colors">
                      {cat.title}
                    </h3>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{t('catalogues.pages')}</span>
                        <span className="text-xs font-mono font-bold text-primary">{cat.pages}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{t('catalogues.size')}</span>
                        <span className="text-xs font-mono font-bold text-primary">{cat.size}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{t('catalogues.date')}</span>
                        <span className="text-xs font-mono font-bold text-primary">{cat.date}</span>
                      </div>
                    </div>

                    <div className={cn("mt-6 flex items-center justify-between", i18n.language === 'ar' && "flex-row-reverse")}>
                      <button className={cn("flex items-center space-x-2 text-[10px] font-black text-primary uppercase tracking-widest hover:text-secondary transition-colors", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")} onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                        <ExternalLink className="h-4 w-4" />
                        <span>{t('catalogues.view')}</span>
                      </button>
                      <button className={cn("flex items-center space-x-2 text-[10px] font-black text-secondary uppercase tracking-widest hover:underline", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")} onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                        <Download className="h-4 w-4" />
                        <span>{t('catalogues.download')}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredCatalogues.length === 0 && (
              <div className="text-center py-20 bg-white border border-dashed border-gray-300 mt-8">
                <FileText className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-black text-primary uppercase tracking-tighter">{t('catalogues.none_found')}</h3>
                <p className="text-xs text-gray-500 mt-2 font-medium uppercase tracking-widest">{t('catalogues.none_found_text')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Catalogues;
