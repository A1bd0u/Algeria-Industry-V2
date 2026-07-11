import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Clock,
  Share2,
  TrendingUp,
  User
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { BlogCardSkeleton } from '../components/Skeleton';
import { cn, generateSlugUrl } from '../lib/utils';
import SEO from '../components/SEO';

const Blog = () => {
  const { t, i18n } = useTranslation();
  const CATEGORIES = [t('categories.all'), t('categories.energy'), t('categories.electronic'), t('categories.automotive'), t('categories.agri'), t('categories.construction')];
  const [activeCategory, setActiveCategory] = useState(t('categories.all'));

  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/articles');
        if (!res.ok) throw new Error("Erreur de récupération des articles");
        const data = await res.json();
        setPosts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArticles();
  }, []);

  const filteredPosts = posts.filter(post => {
    // Note: Mock categories might not match translated ones perfectly, 
    // for a real app we'd use category IDs
    const matchesCategory = activeCategory === t('categories.all') || post.category === activeCategory;
    return matchesCategory;
  });

  const featuredPost = posts.find(p => p.featured);
  const regularPosts = filteredPosts.filter(p => !p.featured || activeCategory !== t('categories.all'));

  return (
    <PageTransition>
      <SEO 
        title={t('nav.news', 'Actualités')} 
        description="Les dernières actualités et tendances de l'industrie en Algérie."
        url="https://votre-domaine.dz/blog"
      />
      <div className={cn("bg-neutral-bg min-h-screen pb-20", i18n.language?.startsWith('ar') && "font-arabic")}>
        {/* Header */}
        <section className="bg-primary py-16 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-8", i18n.language?.startsWith('ar') && "md:flex-row-reverse text-end")}>
              <div>
                <h1 className="text-4xl font-extrabold mb-4">{t('blog.title').split(' ')[0]} <span className="text-secondary">{t('blog.title').split(' ')[1]}</span></h1>
                <p className="text-primary-foreground/80 text-lg max-w-xl">
                  {t('blog.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          {/* Categories */}
          <div className={cn("flex items-center space-x-2 overflow-x-auto pb-4 mb-12 no-scrollbar", i18n.language?.startsWith('ar') && "flex-row-reverse space-x-reverse")}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                  activeCategory === cat 
                    ? "bg-secondary text-white shadow-lg" 
                    : "bg-white text-gray-500 border border-gray-100 hover:border-primary/20 hover:text-primary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Blog Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => <BlogCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center">
               <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
               <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">{error}</p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {activeCategory === t('categories.all') && featuredPost && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16"
            >
              <div className={cn("bg-white rounded-[40px] overflow-hidden shadow-xl border border-gray-100 flex flex-col lg:flex-row group", i18n.language?.startsWith('ar') && "lg:flex-row-reverse text-end")}>
                <Link to={`/blog/${generateSlugUrl(featuredPost.title, featuredPost.id)}`} className="lg:w-3/5 h-64 lg:h-auto overflow-hidden">
                  <img 
                    src={featuredPost.image} 
                    alt={featuredPost.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                <div className="lg:w-2/5 p-8 md:p-12 flex flex-col justify-center">
                  <div className={cn("flex items-center space-x-2 mb-6", i18n.language?.startsWith('ar') && "flex-row-reverse space-x-reverse justify-start")}>
                    <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                      {featuredPost.category}
                    </span>
                    <span className="text-gray-300 text-xs font-bold uppercase flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{t('blog.featured')}</span>
                    </span>
                  </div>
                  <Link to={`/blog/${generateSlugUrl(featuredPost.title, featuredPost.id)}`}>
                    <h2 className="text-3xl font-black text-primary mb-6 leading-tight group-hover:text-secondary transition-colors">
                      {featuredPost.title}
                    </h2>
                  </Link>
                  <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className={cn("flex items-center justify-between mt-auto", i18n.language?.startsWith('ar') && "flex-row-reverse")}>
                    <div className={cn("flex items-center space-x-3", i18n.language?.startsWith('ar') && "flex-row-reverse space-x-reverse")}>
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-primary">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">{featuredPost.author}</p>
                        <p className="text-xs text-gray-400">{featuredPost.date}</p>
                      </div>
                    </div>
                    <Link to={`/blog/${generateSlugUrl(featuredPost.title, featuredPost.id)}`} className={cn("btn-primary p-3 rounded-xl", i18n.language?.startsWith('ar') && "rotate-180")}>
                      <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Regular Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post, i) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn("bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group flex flex-col", i18n.language?.startsWith('ar') && "text-end")}
              >
                <Link to={`/blog/${generateSlugUrl(post.title, post.id)}`} className="h-48 overflow-hidden relative block">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className={cn("absolute top-4", i18n.language?.startsWith('ar') ? "end-4" : "start-4")}>
                    <span className="bg-white/90 backdrop-blur-sm text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {post.category}
                    </span>
                  </div>
                </Link>
                <div className="p-6 flex flex-col flex-1">
                  <div className={cn("flex items-center space-x-3 text-[10px] font-bold text-gray-400 mb-3 uppercase", i18n.language?.startsWith('ar') && "flex-row-reverse space-x-reverse justify-start")}>
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{post.date}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{post.readTime}</span>
                    </span>
                  </div>
                  <Link to={`/blog/${generateSlugUrl(post.title, post.id)}`}>
                    <h3 className="text-lg font-bold text-primary mb-3 group-hover:text-secondary transition-colors leading-tight line-clamp-2">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1">
                    {post.excerpt}
                  </p>
                  <div className={cn("flex items-center justify-between pt-6 border-t border-gray-50", i18n.language?.startsWith('ar') && "flex-row-reverse")}>
                    <div className={cn("flex items-center space-x-2", i18n.language?.startsWith('ar') && "flex-row-reverse space-x-reverse")}>
                      <div className="w-6 h-6 bg-gray-50 rounded-full flex items-center justify-center text-primary">
                        <User className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-bold text-gray-600">{post.author}</span>
                    </div>
                    <button className="text-primary hover:text-secondary transition-colors" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
            </>
          )}

          {/* Newsletter CTA */}
          <section className="mt-24 bg-primary p-12 rounded-[40px] text-white relative overflow-hidden text-center">
            <div className="absolute top-0 start-0 w-full h-full opacity-5">
              <div className="absolute top-0 start-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 end-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
            </div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">{t('blog.newsletter_title')}</h2>
              <p className="text-primary-foreground/80 mb-8">
                {t('blog.newsletter_subtitle')}
              </p>
              <form className={cn("flex flex-col sm:flex-row gap-4", i18n.language?.startsWith('ar') && "sm:flex-row-reverse")}>
                <input 
                  type="email" 
                  placeholder="votre-email@entreprise.dz" 
                  className={cn("flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/40 outline-none focus:bg-white/20 transition-all", i18n.language?.startsWith('ar') && "text-end")}
                  required
                />
                <button className="bg-secondary text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl" onClick={(e) => { e.preventDefault(); window.scrollTo(0,0); }}>
                  {t('blog.subscribe')}
                </button>
              </form>
              <p className="text-[10px] text-white/40 mt-4">
                {t('blog.privacy_note')}
              </p>
            </div>
          </section>
        </div>
      </div>
    </PageTransition>
  );
};

export default Blog;
