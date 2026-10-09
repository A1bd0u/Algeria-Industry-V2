import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import { absoluteUrl } from '../config/site';
import { generateSlugUrl } from '../lib/utils';
import { formatDate } from '../lib/format';

// Centre de ressources : sources officielles classées par démarche (les
// textes à jour restent chez les organismes publics), guides pratiques de la
// plateforme et dernières publications de l'équipe.

const OFFICIAL_GROUPS = [
  { key: 'company', links: [
    { key: 'cnrc', url: 'https://www.cnrc.dz' },
    { key: 'dgi', url: 'https://www.mfdgi.gov.dz' },
  ] },
  { key: 'invest', links: [
    { key: 'aapi', url: 'https://aapi.dz' },
    { key: 'industry', url: 'https://www.industrie.gov.dz' },
  ] },
  { key: 'trade', links: [
    { key: 'customs', url: 'https://www.douane.gov.dz' },
    { key: 'algex', url: 'https://www.algex.dz' },
    { key: 'caci', url: 'https://www.caci.dz' },
  ] },
  { key: 'standards', links: [
    { key: 'ianor', url: 'https://www.ianor.dz' },
    { key: 'ons', url: 'https://www.ons.dz' },
    { key: 'joradp', url: 'https://www.joradp.dz' },
  ] },
] as const;

// Guides de la plateforme : pages réelles du site.
const GUIDES = [
  { key: 'listing', to: '/register?role=fournisseur' },
  { key: 'verification', to: '/faq' },
  { key: 'pricing', to: '/tarifs' },
  { key: 'advertising', to: '/ads-request' },
] as const;

const domainOf = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

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
  const latest = (articles as any[]).slice(0, 5);

  return (
    <>
      <SEO title={t('resources.title')} description={t('resources.subtitle')} url={absoluteUrl('/resources')} />
      <div className="bg-white min-h-screen pb-24">
        <header className="border-b border-border-tech">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-sm font-bold text-secondary mb-3">{t('resources.kicker')}</p>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">{t('resources.title')}</h1>
              <p className="text-gray-600 max-w-md md:text-end">{t('resources.subtitle')}</p>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sources officielles, par démarche */}
          <section className="py-12 border-b border-border-tech" aria-labelledby="official-title">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
              <h2 id="official-title" className="lg:col-span-4 text-2xl font-extrabold text-primary">{t('resources.officialTitle')}</h2>
              <p className="lg:col-span-8 text-gray-600">{t('resources.officialText')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-10">
              {OFFICIAL_GROUPS.map((group, gi) => (
                <div key={group.key}>
                  <p className="text-sm font-bold text-gray-500 pb-3 mb-1 border-b-2 border-primary">
                    <span className="text-secondary me-2">{String(gi + 1).padStart(2, '0')}</span>
                    {t(`resources.groups.${group.key}`)}
                  </p>
                  <ul className="divide-y divide-border-tech">
                    {group.links.map((link) => (
                      <li key={link.key}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-3 py-4">
                          <span className="min-w-0">
                            <span className="block font-bold text-primary group-hover:text-secondary transition-colors">{t(`resources.links.${link.key}.name`)}</span>
                            <span className="block text-sm text-gray-600 mt-0.5">{t(`resources.links.${link.key}.text`)}</span>
                            <span className="block text-xs text-gray-400 mt-1" dir="ltr">{domainOf(link.url)}</span>
                          </span>
                          <ArrowUpRight className="h-4 w-4 mt-1 shrink-0 text-gray-400 group-hover:text-secondary rtl:-scale-x-100" aria-hidden="true" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-12">
            {/* Guides de la plateforme */}
            <section className="lg:col-span-5" aria-labelledby="guides-title">
              <h2 id="guides-title" className="text-2xl font-extrabold text-primary mb-6">{t('resources.guidesTitle')}</h2>
              <ol className="space-y-px bg-border-tech border border-border-tech rounded-lg overflow-hidden">
                {GUIDES.map((guide, i) => (
                  <li key={guide.key} className="bg-white">
                    <Link to={guide.to} className="group flex gap-5 p-5 hover:bg-neutral-bg transition-colors">
                      <span className="text-sm font-bold text-gray-300 tabular-nums pt-0.5">{String(i + 1).padStart(2, '0')}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-primary group-hover:text-secondary transition-colors">{t(`resources.guides.${guide.key}.title`)}</span>
                        <span className="block text-sm text-gray-600 mt-1">{t(`resources.guides.${guide.key}.text`)}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 mt-1 shrink-0 text-gray-400 group-hover:text-secondary rtl:rotate-180" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            {/* Dernières publications */}
            <section className="lg:col-span-7" aria-labelledby="latest-title">
              <div className="flex items-end justify-between gap-4 mb-6">
                <h2 id="latest-title" className="text-2xl font-extrabold text-primary">{t('resources.latest')}</h2>
                <Link to="/blog" className="text-sm font-bold text-primary hover:text-secondary inline-flex items-center gap-1">
                  {t('resources.seeAll')} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              </div>
              {isLoading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-neutral-bg rounded animate-pulse" />)}</div>
              ) : latest.length === 0 ? (
                <p className="text-gray-500 border-t border-border-tech pt-6">{t('resources.noArticles')}</p>
              ) : (
                <ul className="divide-y divide-border-tech border-t border-border-tech">
                  {latest.map((a: any) => (
                    <li key={a.id}>
                      <Link to={`/blog/${generateSlugUrl(a.title, a.id)}`} className="group grid grid-cols-[88px_1fr] gap-4 py-4">
                        <time dateTime={a.created_at} className="text-xs text-gray-500 pt-1">{formatDate(a.created_at)}</time>
                        <span className="min-w-0">
                          {a.category && <span className="block text-sm font-bold text-gray-500 mb-1">{a.category}</span>}
                          <span className="block font-bold text-primary group-hover:text-secondary transition-colors leading-snug">{a.title}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-10 rounded-lg bg-neutral-bg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-primary">{t('resources.customTitle')}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('resources.customText')}</p>
                </div>
                <Link to="/contact" className="btn-primary shrink-0">{t('resources.customButton')}</Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Resources;
