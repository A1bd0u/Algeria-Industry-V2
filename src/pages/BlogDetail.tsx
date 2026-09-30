import {
  Calendar,
  Clock,
  Facebook,
  Linkedin,
  Newspaper,
  Share2,
  Twitter
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../lib/format';
import { cn, extractIdFromSlug, generateSlugUrl } from '../lib/utils';

// Temps de lecture estimé à 200 mots par minute.
const readingMinutes = (content: string) =>
  Math.max(1, Math.round((content || '').trim().split(/\s+/).filter(Boolean).length / 200));

const BlogDetail = () => {
  const { id: slugId } = useParams();
  const id = extractIdFromSlug(slugId);
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch('/api/articles');
        if (res.ok) {
           const data = await res.json();
           setRecentPosts(data.filter((p: any) => p.id !== id).slice(0, 3));
        }
      } catch (err) {}
    };
    fetchRecent();
  }, []);
  const [error, setError] = useState("");
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/articles/${id}`);
        if (!res.ok) throw new Error('notFound');
        const data = await res.json();
        
        // Uniquement les données de l'article : pas d'auteur, de rôle ni de
        // mots-clés inventés quand ils manquent.
        setPost({
           ...data,
           content: data.content || '',
           readTime: readingMinutes(data.content),
           excerpt: data.excerpt || (data.content ? data.content.substring(0, 150) + "…" : ""),
           image: data.image_url || null,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchArticle();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center flex-col">
         <p className="text-red-500 mb-4">{t('blog.notFound')}</p>
         <Link to="/blog" className="text-secondary hover:underline">{t('blog.back')}</Link>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-white pb-20", i18n.language?.startsWith('ar') && "font-arabic")}>
      {/* Article Header */}
      <div className="relative h-[60vh] min-h-[400px] bg-primary overflow-hidden">
        {post.image && (
          <img
            src={post.image}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            alt={post.title}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3">
                {post.category && (
                  <span className="bg-secondary px-4 py-1 text-[10px] font-black text-white uppercase tracking-widest">
                    {post.category}
                  </span>
                )}
                <div className="flex items-center space-x-2 text-white/60 text-xs font-bold uppercase tracking-widest">
                  <Clock className="h-4 w-4" />
                  <span>{t('blog.readTime', { count: post.readTime })}</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center space-x-6 border-t border-white/10 pt-6">
                 {post.author && (
                   <p className="text-xs font-black text-white uppercase">{post.author}</p>
                 )}
                 <div className="flex items-center gap-2 text-white/60">
                    <Calendar className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{formatDate(post.created_at)}</span>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
          {/* Sidebar / Social Share */}
          <aside className="lg:col-span-1">
             <div className="sticky top-32 space-y-12">
                <div>
                   <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 border-b border-gray-100 pb-4">{t('blog.share')}</h3>
                   <div className="flex flex-col space-y-4">
                      {[
                        { icon: Facebook, color: 'text-blue-600', label: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
                        { icon: Twitter, color: 'text-blue-400', label: 'Twitter', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}` },
                        { icon: Linkedin, color: 'text-blue-800', label: 'LinkedIn', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}` },
                        { icon: Share2, color: 'text-secondary', label: t('blog.copyLink'), isCopy: true },
                      ].map((social, i) => (
                        <button key={i} type="button" onClick={(e) => {
                          e.preventDefault();
                          if (social.url) {
                            window.open(social.url, '_blank', 'noopener,noreferrer');
                            return;
                          }
                          navigator.clipboard.writeText(window.location.href)
                            .then(() => toast.success(t('common.linkCopied')))
                            .catch(() => toast.error(t('common.networkError')));
                        }} className="w-full flex items-center space-x-4 group text-gray-400 hover:text-primary transition-all text-start">
                           <div className={cn("w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center transition-all group-hover:scale-110", social.color.replace('text', 'bg').concat('/10'), social.color)}>
                              <social.icon className="h-4 w-4" />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest">{social.label}</span>
                        </button>
                      ))}
                   </div>
                </div>

             </div>
          </aside>

          {/* Main Article Text */}
          <article className="lg:col-span-2">
            <div className="prose prose-lg prose-primary max-w-none">
              <div className="text-gray-600 font-medium text-lg leading-relaxed mb-12 italic border-l-4 border-secondary ps-8">
                {post.excerpt}
              </div>
              
              <div className="space-y-8 text-gray-700 leading-loose">
                {post.content.split('\n').map((line, i) => {
                  if (line.startsWith('###')) {
                    return <h3 key={i} className="text-2xl font-black text-primary uppercase tracking-tighter mt-12 mb-6 italic">{line.replace('###', '')}</h3>;
                  }
                  return <p key={i} className="font-medium">{line}</p>;
                })}
              </div>
            </div>


            <div className="mt-20 bg-primary p-10 text-white rounded-[40px] flex flex-col md:flex-row items-center gap-8">
               <div className="flex-1">
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{t('blog.ctaTitle')}</h3>
                  <p className="text-white/60 text-sm">{t('blog.ctaText')}</p>
               </div>
               <Link to="/directory" className="bg-secondary px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
                  {t('blog.ctaButton')}
               </Link>
            </div>
          </article>

          {/* Right: Related Posts */}
          <aside className="lg:col-span-1">
             <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-8 flex items-center">
                <Newspaper className="h-4 w-4 me-2 text-secondary" />
                {t('blog.latest')}
             </h3>
             <div className="space-y-8">
                {recentPosts.map((p: any, i: number) => (
                  <Link key={i} to={`/blog/${generateSlugUrl(p.title, p.id)}`} className="group block">
                    <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-4">
                       {p.image_url
                         ? <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" loading="lazy" />
                         : <div className="w-full h-full flex items-center justify-center"><img src="/favicon.svg" alt="" className="h-10 w-10 opacity-20" /></div>}
                    </div>
                    {p.category && <span className="text-[9px] font-black text-secondary tracking-widest uppercase mb-2 block">{p.category}</span>}
                    <h4 className="text-xs font-black text-primary uppercase tracking-tight group-hover:text-secondary transition-colors mb-2 line-clamp-2 italic leading-tight">
                      {p.title}
                    </h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{formatDate(p.created_at)} • {t('blog.readTime', { count: readingMinutes(p.content) })}</p>
                  </Link>
                ))}
             </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
