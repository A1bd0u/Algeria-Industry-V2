import {
  Bookmark,
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
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArticleSkeleton } from '../components/Skeleton';
import { cn, extractIdFromSlug } from '../lib/utils';

const BlogDetail = () => {
  const { id: slugId } = useParams();
  const id = extractIdFromSlug(slugId);
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [id]);

  // Mock post data
  const post = {
    id: 1,
    title: "L'Algérie accélère sa transition vers l'Industrie 4.0",
    excerpt: "Comment les PME algériennes adoptent les nouvelles technologies de fabrication numérique.",
    content: `
      L'industrie algérienne connaît une transformation sans précédent. Portée par des initiatives gouvernementales et une volonté de diversification économique, la transition numérique devient une priorité pour les entreprises du secteur manufacturier.

      ### L'impact de l'automatisation
      L'automatisation ne se limite plus aux grands groupes pétroliers. Aujourd'hui, des unités de production dans la plasturgie et l'agroalimentaire intègrent des solutions robotisées pour gagner en productivité.

      ### Les défis du Capital Humain
      Le principal frein reste la formation des équipes. Former les ingénieurs d'aujourd'hui aux outils de demain (Maintenance prédictive, IoT, IA) est le défi majeur de 2026.

      ### Conclusion
      Le chemin est encore long, mais les premiers résultats montrent une amélioration de 15% de l'efficacité opérationnelle pour les entreprises ayant franchi le pas.
    `,
    category: "Technologie",
    author: "Karim Benali",
    role: "Expert en Stratégie Industrielle",
    date: "24 Avril 2026",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2000&auto=format&fit=crop",
    tags: ["Digitalisation", "Algérie", "Performance", "PME"]
  };

  if (isLoading) {
    return <ArticleSkeleton />;
  }

  return (
    <div className={cn("min-h-screen bg-white pb-20", i18n.language === 'ar' && "font-arabic")}>
      {/* Article Header */}
      <div className="relative h-[60vh] min-h-[400px] bg-primary overflow-hidden">
        <img 
          src={post.image} 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          alt={post.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3">
                <span className="bg-secondary px-4 py-1 text-[10px] font-black text-white uppercase tracking-widest">
                  {post.category}
                </span>
                <div className="flex items-center space-x-2 text-white/60 text-xs font-bold uppercase tracking-widest">
                  <Clock className="h-4 w-4" />
                  <span>{post.readTime} de lecture</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center space-x-6 border-t border-white/10 pt-6">
                 <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-secondary">KB</div>
                    <div className="text-left">
                       <p className="text-xs font-black text-white uppercase">{post.author}</p>
                       <p className="text-[10px] text-white/40 uppercase font-bold">{post.role}</p>
                    </div>
                 </div>
                 <div className="hidden sm:flex items-center space-x-2 text-white/40">
                    <Calendar className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{post.date}</span>
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
                   <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 border-b border-gray-100 pb-4">Partager</h3>
                   <div className="flex flex-col space-y-4">
                      {[
                        { icon: Facebook, color: 'text-blue-600', label: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
                        { icon: Twitter, color: 'text-blue-400', label: 'Twitter', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}` },
                        { icon: Linkedin, color: 'text-blue-800', label: 'LinkedIn', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}` },
                        { icon: Share2, color: 'text-secondary', label: 'Copier le lien', isCopy: true },
                      ].map((social, i) => (
                        <button key={i} onClick={(e) => {
                          e.preventDefault();
                          alert("Partage non disponible");
                        }} className="w-full flex items-center space-x-4 group text-gray-400 hover:text-primary transition-all text-left">
                           <div className={cn("w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center transition-all group-hover:scale-110", social.color.replace('text', 'bg').concat('/10'), social.color)}>
                              <social.icon className="h-4 w-4" />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest">{social.label}</span>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="bg-neutral-bg p-8 rounded-[32px] border border-gray-100">
                   <Bookmark className="h-8 w-8 text-secondary mb-4" />
                   <h4 className="text-sm font-black text-primary uppercase tracking-tight mb-2">Sauvegarder cet article</h4>
                   <p className="text-[9px] font-medium text-gray-500 uppercase tracking-widest leading-relaxed mb-6">Retrouvez-le plus tard dans votre dashboard professionnel.</p>
                   <Link to="/subscriptions" className="w-full bg-white border border-gray-100 py-3 rounded-xl text-[10px] font-black uppercase text-primary hover:border-secondary transition-all flex items-center justify-center">Abonnez-vous</Link>
                </div>
             </div>
          </aside>

          {/* Main Article Text */}
          <article className="lg:col-span-2">
            <div className="prose prose-lg prose-primary max-w-none">
              <div className="text-gray-600 font-medium text-lg leading-relaxed mb-12 italic border-l-4 border-secondary pl-8">
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

            {/* Tags */}
            <div className="mt-16 flex flex-wrap gap-2">
               {post.tags.map(tag => (
                 <span key={tag} className="px-4 py-2 bg-gray-50 border border-gray-100 text-[9px] font-black uppercase tracking-widest text-primary hover:border-secondary transition-all cursor-pointer">
                    #{tag}
                 </span>
               ))}
            </div>

            {/* Newsletter Section */}
            <div className="mt-20 bg-primary p-12 text-white rounded-[40px] relative overflow-hidden">
               <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                     <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">Veille Industrielle</h3>
                     <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Recevez le condensé de l'actualité B2B chaque lundi matin.</p>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); alert("Inscription réussie"); (e.target as HTMLFormElement).reset(); }} className="flex-1 w-full flex bg-white/10 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
                     <input type="email" placeholder="VOTRE EMAIL..." className="flex-1 bg-transparent px-4 py-3 text-[10px] font-black outline-none placeholder:text-white/20" />
                     <button type="submit" className="bg-secondary px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">OK</button>
                  </form>
               </div>
            </div>
          </article>

          {/* Right: Related Posts */}
          <aside className="lg:col-span-1">
             <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-8 flex items-center">
                <Newspaper className="h-4 w-4 mr-2 text-secondary" />
                Derniers Articles
             </h3>
             <div className="space-y-8">
                {[1, 2, 3].map(i => (
                  <Link key={i} to="/blog/2" className="group block">
                    <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-4">
                       <img src={`https://picsum.photos/seed/blog${i}/600/400`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Post" />
                    </div>
                    <span className="text-[9px] font-black text-secondary tracking-widest uppercase mb-2 block">Secteur Énergie</span>
                    <h4 className="text-xs font-black text-primary uppercase tracking-tight group-hover:text-secondary transition-colors mb-2 line-clamp-2 italic leading-tight">
                      Le solaire thermique s'impose dans l'industrie laitière
                    </h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">2h00 • 5 min de lecture</p>
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
