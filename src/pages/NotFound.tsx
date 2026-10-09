import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const NotFound = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className={cn("min-h-[60vh] bg-neutral-bg flex items-center px-4 py-20", i18n.language?.startsWith('ar') && "font-arabic")}>
      <div className="max-w-xl w-full mx-auto">
        <p className="text-sm font-semibold text-gray-500 mb-2">404</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-3">
          {t('notFound.title')}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('notFound.text')}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/" className="btn-primary">{t('notFound.home')}</Link>
          <Link to="/products" className="btn-ghost">{t('notFound.catalog')}</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
