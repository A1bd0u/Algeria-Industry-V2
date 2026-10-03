import { AlertCircle, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { BlogCardSkeleton } from '../components/Skeleton';
import { cn, generateSlugUrl } from '../lib/utils';
import SEO from '../components/SEO';
import { absoluteUrl } from '../config/site';
import { currentLocale, formatDate } from '../lib/format';
import EmptyState from '../components/ui/EmptyState';

// Page Actualités, mise en page éditoriale : article à la une, liste des
// publications filtrable par rubrique, agenda des prochains événements.

const readMinutes = (content?: string) =>
  Math.max(1, Math.round((content || '').trim().split(/\s+/).filter(Boolean).length / 200));

// Visuel de repli : la rubrique en typographie sur fond neutre, pas d'icône.
const Cover = ({ post, className }: { post: any; className?: string }) =>
  post.image_url ? (
    <img src={post.image_url} alt="" loading="lazy" referrerPolicy="no-referrer"
      className={cn('h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]', className)} />
  ) : (
    <div className={cn('flex h-full w-full items-end bg-[#ececea] p-5', className)}>
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">{post.category || 'Industigo'}</span>
    </div>
  );

const Meta = ({ post, t }: { post: any; t: (k: string, o?: any) => string }) => (
  <p className="text-xs text-gray-500">
    <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
    <span className="mx-2 text-gray-300">/</span>
    {t('blog.readTime', { count: readMinutes(post.content) })}
    {post.author && (<><span className="mx-2 text-gray-300">/</span>{post.author}</>)}
  </p>
);

const Blog = () => {
  const { t, i18n } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/articles');
        if (!res.ok) throw new Error('load');
        setPosts(await res.json());
      } catch {
        setError(t('blog.loadError'));
      } finally {
        setIsLoading(false);
      }
    })();
    fetch('/api/events')
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        const now = Date.now();
        setEvents((Array.isArray(list) ? list : []).filter((e: any) => e.date && Date.parse(e.date) >= now - 86_400_000).slice(0, 4));
      })
      .catch(() => {});
  }, []);

  const categories = Array.from(new Set<string>(posts.map((p) => p.category).filter(Boolean)));
  const featured = !activeCategory ? (posts.find((p) => p.featured) || posts[0]) : null;
  const list = posts.filter((p) => p !== featured && (!activeCategory || p.category === activeCategory));
  const href = (p: any) => `/blog/${generateSlugUrl(p.title, p.id)}`;

  return (
    <PageTransition>
      <SEO title={t('nav.news', 'Actualités')} description={t('blog.subtitle')} url={absoluteUrl('/blog')} />
      <div className={cn('bg-white min-h-screen pb-24', i18n.language?.startsWith('ar') && 'font-arabic')}>
        {/* En-tête sobre */}
        <header className="border-b border-border-tech">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-3">{t('blog.kicker')}</p>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight">{t('nav.news')}</h1>
              <p className="text-gray-600 max-w-md md:text-end">{t('blog.subtitle')}</p>
            </div>
            {categories.length > 0 && (
              <nav className="-mb-px flex gap-6 overflow-x-auto no-scrollbar" aria-label={t('blog.rubrics')}>
                {['', ...categories].map((cat) => (
                  <button
                    key={cat || 'all'}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    aria-current={activeCategory === cat}
                    className={cn(
                      'whitespace-nowrap border-b-2 pb-3 text-sm font-bold transition-colors',
                      activeCategory === cat ? 'border-secondary text-primary' : 'border-transparent text-gray-500 hover:text-primary',
                    )}
                  >
                    {cat || t('blog.allRubrics')}
                  </button>
                ))}
              </nav>
            )}
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => <BlogCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="py-20 text-center text-red-600 flex flex-col items-center gap-3">
              <AlertCircle className="h-8 w-8" aria-hidden="true" />
              <p className="font-medium">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <EmptyState illustration="document" title={t('blog.emptyTitle')} text={t('blog.emptyText')}>
              <Link to="/directory" className="btn-primary">{t('blog.ctaButton')}</Link>
            </EmptyState>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8">
                {/* À la une */}
                {featured && (
                  <article className="group mb-12 pb-12 border-b border-border-tech">
                    <Link to={href(featured)} className="block aspect-[16/9] overflow-hidden rounded-lg mb-6" tabIndex={-1} aria-hidden="true">
                      <Cover post={featured} />
                    </Link>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-3">
                      {t('blog.featured')}{featured.category ? ` · ${featured.category}` : ''}
                    </p>
                    <h2 className="text-3xl md:text-4xl font-black text-primary leading-tight tracking-tight mb-4">
                      <Link to={href(featured)} className="hover:underline decoration-2 underline-offset-4">{featured.title}</Link>
                    </h2>
                    {featured.excerpt && <p className="text-lg text-gray-600 leading-relaxed mb-4 max-w-3xl">{featured.excerpt}</p>}
                    <Meta post={featured} t={t} />
                  </article>
                )}

                {/* Liste des publications */}
                {list.length === 0 ? (
                  <p className="text-gray-500 py-8">{t('blog.noneInRubric')}</p>
                ) : (
                  <ol className="divide-y divide-border-tech">
                    {list.map((post) => (
                      <li key={post.id} className="py-8 first:pt-0">
                        <article className="group grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-5">
                          <div className="min-w-0 sm:order-1">
                            {post.category && (
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">{post.category}</p>
                            )}
                            <h3 className="text-xl font-black text-primary leading-snug mb-2">
                              <Link to={href(post)} className="hover:underline decoration-2 underline-offset-4">{post.title}</Link>
                            </h3>
                            {post.excerpt && <p className="text-gray-600 line-clamp-2 mb-3">{post.excerpt}</p>}
                            <Meta post={post} t={t} />
                          </div>
                          <Link to={href(post)} className="block aspect-[4/3] overflow-hidden rounded-lg sm:order-2" tabIndex={-1} aria-hidden="true">
                            <Cover post={post} />
                          </Link>
                        </article>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* Colonne : agenda et annuaire */}
              <aside className="lg:col-span-4 space-y-10 lg:border-s lg:border-border-tech lg:ps-10">
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-4">{t('blog.agenda')}</h2>
                  {events.length === 0 ? (
                    <p className="text-sm text-gray-500">{t('blog.noEvents')}</p>
                  ) : (
                    <ul className="space-y-5">
                      {events.map((e) => {
                        const d = new Date(e.date);
                        return (
                          <li key={e.id} className="flex gap-4">
                            <div className="w-14 shrink-0 border border-border-tech rounded-md text-center py-1.5">
                              <p className="text-xl font-black text-primary leading-none">{d.getDate()}</p>
                              <p className="text-[11px] font-bold uppercase text-gray-500 mt-1">
                                {d.toLocaleDateString(currentLocale(), { month: 'short' }).replace('.', '')}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-primary leading-snug">{e.title}</p>
                              {e.location && <p className="text-sm text-gray-500">{e.location}</p>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <Link to="/events" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-secondary">
                    {t('blog.allEvents')} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                  </Link>
                </section>

                <section className="border-t border-border-tech pt-8">
                  <h2 className="text-lg font-black text-primary mb-2">{t('blog.ctaTitle')}</h2>
                  <p className="text-sm text-gray-600 mb-5">{t('blog.ctaText')}</p>
                  <Link to="/directory" className="btn-primary">{t('blog.ctaButton')}</Link>
                </section>
              </aside>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Blog;
