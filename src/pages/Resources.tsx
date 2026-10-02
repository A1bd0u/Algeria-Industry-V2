import { ChevronRight, Clock, ExternalLink, Gavel, Newspaper, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { generateSlugUrl } from '../lib/utils';
import { formatDate } from '../lib/format';

// Sources officielles : textes et démarches à jour, plutôt que des copies
// qui vieilliraient sur la plateforme.
const OFFICIAL_LINKS = [
  { key: 'joradp', url: 'https://www.joradp.dz' },
  { key: 'aapi', url: 'https://aapi.dz' },
  { key: 'industry', url: 'https://www.industrie.gov.dz' },
  { key: 'customs', url: 'https://www.douane.gov.dz' },
  { key: 'cnrc', url: 'https://www.cnrc.dz' },
];

const Resources = () => {
  const { t } = useTranslation();
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const res = await fetch('/api/articles');
      if (!res.ok) return [];
      return res.json();
    },
  });
  const latest = (articles as any[]).slice(0, 4);

  return (
    <div className="bg-neutral-bg min-h-screen pb-20">
      <div className="bg-primary py-16 text-white overflow-hidden relative">
        <div className="absolute top-0 end-0 w-1/3 h-full bg-white/5 -skew-x-12 transform translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold mb-4">{t('resources.title')}</h1>
            <p className="text-white/80 text-lg">{t('resources.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Newspaper className="h-6 w-6 text-secondary" />
                <span>{t('resources.latest')}</span>
              </h2>
              <Link to="/blog" className="text-sm font-bold text-secondary hover:underline flex items-center gap-1">
                <span>{t('resources.seeAll')}</span>
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2].map((i) => <div key={i} className="h-72 bg-white rounded-2xl animate-pulse" />)}
              </div>
            ) : latest.length === 0 ? (
              <p className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500">{t('resources.noArticles')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {latest.map((article: any, i: number) => {
                  const to = `/blog/${generateSlugUrl(article.title, article.id)}`;
                  return (
                    <motion.article
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group"
                    >
                      <Link to={to} className="block h-48 overflow-hidden relative">
                        <img src={article.image_url || '/placeholder.svg'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        {article.category && (
                          <span className="absolute top-4 start-4 bg-white/90 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{article.category}</span>
                        )}
                      </Link>
                      <div className="p-6">
                        <p className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 uppercase">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(article.created_at)}</span>
                        </p>
                        <h3 className="text-lg font-bold text-primary mb-3 group-hover:text-secondary transition-colors leading-tight">
                          <Link to={to}>{article.title}</Link>
                        </h3>
                        {article.excerpt && <p className="text-sm text-gray-600 line-clamp-2 mb-6">{article.excerpt}</p>}
                        <Link to={to} className="text-primary font-bold text-sm flex items-center gap-1">
                          <span>{t('resources.readMore')}</span>
                          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                        </Link>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="font-bold text-primary text-lg mb-2 flex items-center gap-2">
                <Gavel className="h-5 w-5 text-secondary" />
                <span>{t('resources.officialTitle')}</span>
              </h2>
              <p className="text-xs text-gray-500 mb-6">{t('resources.officialText')}</p>
              <ul className="space-y-3">
                {OFFICIAL_LINKS.map((link) => (
                  <li key={link.key}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 group"
                    >
                      <span>
                        <span className="block text-sm text-primary font-bold">{t(`resources.links.${link.key}.name`)}</span>
                        <span className="block text-xs text-gray-500">{t(`resources.links.${link.key}.text`)}</span>
                      </span>
                      <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-secondary shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 rounded-2xl border border-gray-200 border-dashed text-center">
              <Tag className="h-8 w-8 text-gray-300 mx-auto mb-4" />
              <h2 className="font-bold text-gray-600 mb-2">{t('resources.customTitle')}</h2>
              <p className="text-xs text-gray-500 mb-6">{t('resources.customText')}</p>
              <Link to="/contact" className="text-secondary font-bold text-sm inline-flex items-center gap-1">
                <span>{t('resources.customButton')}</span>
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Resources;
