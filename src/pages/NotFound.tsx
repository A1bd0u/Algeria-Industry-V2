import { AlertCircle, Home, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const NotFound = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className={cn("min-h-screen bg-neutral-bg flex items-center justify-center p-4", i18n.language?.startsWith('ar') && "font-arabic")}>
      <div className="max-w-xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 end-0 w-32 h-32 bg-secondary/5 rounded-full -translate-y-16 translate-x-16" />

          <div className="relative z-10">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-10">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>

            <h1 className="text-8xl font-black text-primary uppercase tracking-tighter mb-4 leading-none italic">
              404
            </h1>
            <h2 className="text-2xl font-black text-primary uppercase tracking-tighter mb-6">
              {t('notFound.title')}
            </h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-12 leading-relaxed">
              {t('notFound.text')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/"
                className="flex items-center justify-center gap-3 bg-primary py-4 px-8 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-secondary transition-all shadow-lg"
              >
                <Home className="h-4 w-4" />
                <span>{t('notFound.home')}</span>
              </Link>
              <Link
                to="/products"
                className="flex items-center justify-center gap-3 bg-gray-50 py-4 px-8 rounded-2xl text-[10px] font-black text-primary border border-gray-100 uppercase tracking-widest hover:border-secondary transition-all"
              >
                <Search className="h-4 w-4" />
                <span>{t('notFound.catalog')}</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
