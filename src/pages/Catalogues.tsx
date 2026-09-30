import { AlertCircle, Building2, Download, ExternalLink, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CatalogueSkeleton } from '../components/Skeleton';
import { formatDate } from '../lib/format';
import { cn } from '../lib/utils';

// Seuls les liens http(s) sont ouverts : une URL javascript: ou data:
// enregistrée en base ne doit jamais devenir un lien cliquable.
const safePdfUrl = (url: unknown): string | null =>
  typeof url === 'string' && /^https?:\/\//i.test(url) ? url : null;

const Catalogues = () => {
  const { t, i18n } = useTranslation();
  const [catalogues, setCatalogues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCatalogues = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/catalogues');
        if (!res.ok) throw new Error('load');
        setCatalogues(await res.json());
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalogues();
  }, []);

  return (
    <div className={cn("bg-neutral-bg min-h-screen pb-20", i18n.language?.startsWith('ar') && "font-arabic")}>
      <div className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-secondary mb-4">
            <div className="w-8 h-[2px] bg-secondary" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">{t('catalogues.tech_doc')}</span>
          </div>
          <h1 className="text-4xl font-black text-primary uppercase tracking-tighter leading-none">{t('catalogues.title')}</h1>
          <p className="text-gray-500 mt-4 max-w-2xl font-medium uppercase text-xs tracking-wider">
            {t('catalogues.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1, 2, 3, 4, 5, 6].map(i => <CatalogueSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="py-20 flex flex-col items-center justify-center">
             <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
             <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">{t('catalogues.loadError')}</p>
          </div>
        ) : catalogues.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-gray-300">
            <FileText className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-primary uppercase tracking-tighter">{t('catalogues.none_found')}</h3>
            <p className="text-xs text-gray-500 mt-2 font-medium uppercase tracking-widest">{t('catalogues.none_found_text')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {catalogues.map((cat, index) => {
              const pdfUrl = safePdfUrl(cat.pdf_url);
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 6) * 0.05 }}
                  className="bg-white border border-gray-200 hover:border-secondary transition-all flex flex-col p-6"
                >
                  <div className="flex items-center justify-center h-32 bg-gray-50 border border-gray-100 mb-6">
                    <FileText className="h-12 w-12 text-gray-300" />
                  </div>
                  {cat.companies?.name && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-secondary mb-2 font-bold uppercase">
                      <Building2 className="h-3 w-3" />
                      <span>{cat.companies.name}</span>
                    </div>
                  )}
                  <h3 className="text-lg font-black text-primary uppercase tracking-tighter leading-tight mb-2">
                    {cat.title}
                  </h3>
                  {cat.description && <p className="text-sm text-gray-500 mb-4 line-clamp-3">{cat.description}</p>}
                  <p className="mt-auto pt-4 border-t border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {t('catalogues.date')} : {formatDate(cat.created_at)}
                  </p>

                  {pdfUrl ? (
                    <div className="mt-6 flex items-center justify-between">
                      <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:text-secondary transition-colors">
                        <ExternalLink className="h-4 w-4" />
                        <span>{t('catalogues.view')}</span>
                      </a>
                      <a href={pdfUrl} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black text-secondary uppercase tracking-widest hover:underline">
                        <Download className="h-4 w-4" />
                        <span>{t('catalogues.download')}</span>
                      </a>
                    </div>
                  ) : (
                    <p className="mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('catalogues.noFile')}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalogues;
