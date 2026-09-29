import { Activity, ArrowRight, ArrowUpRight, Building2, CheckCircle2, FileText, Plus, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton';
import { useCurrency } from '../context/CurrencyContext';
import { cn, generateSlugUrl } from '../lib/utils';
import SEO from '../components/SEO';
import { SITE_NAME, absoluteUrl } from '../config/site';

const Home = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language?.startsWith('ar');
  const { formatPrice } = useCurrency();
  const [visibleProducts, setVisibleProducts] = useState(4);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        const [prodRes] = await Promise.all([
          fetch('/api/products').catch(() => null)
        ]);
        
        // Pas de produits fictifs : état vide si le catalogue est encore vide.
        let pData: any[] = [];

        if (prodRes && prodRes.ok) {
          try { const res = await prodRes.json(); pData = res.data || res; } catch(e){}
        }

        setProducts(pData.slice(0, 8));
      } catch (e) {
        console.error("Home fetch error", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const showMore = () => {
    setVisibleProducts(prev => Math.min(prev + 4, products.length));
  };
  
  return (
    <>
      <SEO 
        title={t('nav.home', 'Accueil')} 
        description="Trouvez un fournisseur industriel algérien vérifié et obtenez un devis en 48 h."
        url={absoluteUrl('/')}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": SITE_NAME,
          "url": absoluteUrl('/'),
          "potentialAction": {
            "@type": "SearchAction",
            "target": absoluteUrl('/search?q={search_term_string}'),
            "query-input": "required name=search_term_string"
          }
        }}
      />
    <div className={cn("flex flex-col min-h-screen", i18n.language?.startsWith('ar') && "font-arabic")}>
      {/* Promesse */}
      <section className="py-12 bg-white border-b border-border-tech">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-3 gap-0 border border-border-tech divide-y md:divide-y-0 md:divide-x divide-border-tech",
            isAr && "md:divide-x-reverse"
          )}>
            {[
              {
                label: isAr ? 'التحقق' : 'Vérification',
                title: isAr ? 'موردون موثقون' : 'Fournisseurs vérifiés',
                desc: isAr ? 'كل مؤسسة تحمل شارة "موثقة" بعد مراجعة السجل التجاري و NIF.' : 'Badge « entreprise vérifiée » après contrôle du RC et du NIF (KYC).'
              },
              {
                label: isAr ? 'عرض السعر' : 'Devis',
                title: isAr ? 'عرض سعر في 48 ساعة' : 'Un devis en 48 h',
                desc: isAr ? 'تواصل مباشرة مع المورد عبر الرسائل.' : 'Contactez directement le fournisseur via la messagerie intégrée.'
              },
              {
                label: isAr ? 'اللغات' : 'Langues',
                title: 'FR · AR · EN',
                desc: isAr ? 'منصة مصممة للصناعة الجزائرية.' : "Une plateforme pensée pour l'industrie algérienne."
              }
            ].map((item) => (
              <div key={item.title} className={cn("p-8 hover:bg-neutral-bg transition-colors", isAr && "text-end")}>
                <span className="tech-label">{item.label}</span>
                <p className="text-2xl font-black text-primary">{item.title}</p>
                <p className="text-[11px] text-gray-500 mt-2 font-medium uppercase tracking-wider">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn("flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6", i18n.language?.startsWith('ar') && "md:flex-row-reverse")}>
            <div className={cn("max-w-2xl", i18n.language?.startsWith('ar') && "text-end")}>
              <div className={cn("flex items-center space-x-2 text-secondary mb-4", i18n.language?.startsWith('ar') && "space-x-reverse justify-end")}>
                <div className="w-8 h-[2px] bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">{i18n.language?.startsWith('ar') ? 'المواصفات الفنية' : 'Spécifications Techniques'}</span>
              </div>
              <h2 className="text-4xl font-black text-primary uppercase tracking-tighter leading-none mb-4">{t('home.trends')}</h2>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{t('home.trends_subtitle')}</p>
            </div>
            <Link 
              to="/products"
              className={cn("btn-primary flex items-center space-x-3 group w-fit", i18n.language?.startsWith('ar') && "flex-row-reverse space-x-reverse")}
            >
              <span className={cn(i18n.language?.startsWith('ar') && "text-sm")}>{i18n.language?.startsWith('ar') ? 'الوصول إلى الكتالوج الكامل' : 'ACCÉDER AU CATALOGUE COMPLET'}</span>
              <ArrowRight className={cn("h-4 w-4 group-hover:translate-x-1 transition-transform", i18n.language?.startsWith('ar') && "rotate-180 group-hover:-translate-x-1")} />
            </Link>
          </div>

          <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-border-tech", i18n.language?.startsWith('ar') && "border-l-0 border-r")}>
            {isLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border-r border-b border-border-tech p-6 relative">
                  <div className="aspect-[4/3] mb-6 bg-neutral-bg border border-border-tech p-4 flex items-center justify-center">
                    <Skeleton className="w-2/3 h-2/3 opacity-20" />
                  </div>
                  <div className={cn("space-y-4", i18n.language?.startsWith('ar') && "text-end flex flex-col items-end")}>
                    <div className="space-y-2 w-full">
                      <Skeleton className={cn("h-3 w-1/3", i18n.language?.startsWith('ar') && "ms-auto")} />
                      <Skeleton className={cn("h-5 w-3/4", i18n.language?.startsWith('ar') && "ms-auto")} />
                    </div>
                    <div className={cn("flex justify-between items-center w-full pt-4 border-t border-border-tech", i18n.language?.startsWith('ar') && "flex-row-reverse")}>
                      <div className={cn("space-y-1 mt-2 flex flex-col", i18n.language?.startsWith('ar') && "items-end")}>
                        <Skeleton className="h-2 w-10" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500 font-medium">
                <p className="mb-4">Aucun produit publié pour le moment.</p>
                <Link to="/register?role=fournisseur" className="text-secondary font-bold hover:underline">Soyez le premier fournisseur à publier votre catalogue</Link>
              </div>
            ) : products.slice(0, visibleProducts).map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (i % 4) * 0.1 }}
                className="bg-white border-r border-b border-border-tech p-6 hover:bg-neutral-bg transition-all group relative"
              >
                <Link to={`/products/${generateSlugUrl(product.name, product.id)}`} className="block aspect-square overflow-hidden mb-6 bg-gray-50 border border-border-tech p-4 group-hover:border-secondary transition-colors">
                  <img 
                    src={product.file_url || product.image || '/placeholder.svg'} 
                    loading="lazy"
                    alt={product.name} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                <div className={cn("space-y-4", i18n.language?.startsWith('ar') && "text-end")}>
                  <div>
                    {product.company && <span className="tech-label">{product.company}</span>}
                    <Link to={`/products/${generateSlugUrl(product.name, product.id)}`}>
                      <h3 className={cn("text-sm font-black text-primary uppercase tracking-tight line-clamp-2 min-h-[40px] group-hover:text-secondary transition-colors", i18n.language?.startsWith('ar') && "text-base tracking-normal")}>
                        {product.name}
                      </h3>
                    </Link>
                  </div>
                  
                  <div className={cn("flex items-center justify-between pt-4 border-t border-border-tech", i18n.language?.startsWith('ar') && "flex-row-reverse")}>
                    <div className={cn("flex flex-col", i18n.language?.startsWith('ar') && "text-end")}>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{i18n.language?.startsWith('ar') ? 'السعر' : 'Cotation'}</span>
                      <span className="text-sm font-mono font-bold text-primary">{Number(product.price) > 0 ? formatPrice(Number(product.price)) : 'Sur devis'}</span>
                    </div>
                    <Link to={`/products/${generateSlugUrl(product.name, product.id)}`} className="bg-primary text-white p-2 hover:bg-secondary transition-colors">
                      <ArrowRight className={cn("h-4 w-4", i18n.language?.startsWith('ar') && "rotate-180")} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {visibleProducts < products.length && (
            <div className="mt-16 text-center">
              <button 
                onClick={showMore}
                className="btn-primary"
              >
                {t('home.read_more')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-neutral-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-12">
            {i18n.language?.startsWith('ar') ? 'لماذا تختار ألجيريا إنداستري؟' : 'Pourquoi choisir Algeria Industry ?'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              i18n.language?.startsWith('ar') ? 'زيادة الرؤية للموردين' : "Visibilité accrue pour les fournisseurs",
              i18n.language?.startsWith('ar') ? 'تبسيط عمليات التوريد للمشترين' : "Sourcing simplifié pour les acheteurs",
              i18n.language?.startsWith('ar') ? 'مؤسسات موثقة (KYC)' : "Entreprises vérifiées (KYC)",
              i18n.language?.startsWith('ar') ? 'دعم فني محلي' : "Support technique local"
            ].map((text, i) => (
              <div key={i} className={cn("flex items-center justify-center space-x-2 bg-white p-4 rounded-lg shadow-sm border border-border-tech", i18n.language?.startsWith('ar') && "flex-row-reverse space-x-reverse")}>
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="font-medium text-gray-700">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Besoin d'aide Section */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute top-0 end-0 w-1/3 h-full bg-secondary/10 -skew-x-12 translate-x-1/2" />
        <div className="absolute top-0 start-0 w-full h-[1px] bg-white/10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-16 items-center", i18n.language?.startsWith('ar') && "lg:flex lg:flex-row-reverse lg:justify-between")}>
            <div className={i18n.language?.startsWith('ar') ? "text-end" : ""}>
              <div className={cn("flex items-center space-x-2 text-secondary mb-6", i18n.language?.startsWith('ar') && "space-x-reverse justify-end")}>
                <div className="w-8 h-[2px] bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">{t('footer.support')}</span>
              </div>
              <h2 className={cn("text-5xl font-black uppercase tracking-tighter leading-none mb-8", i18n.language?.startsWith('ar') && "text-6xl")}>
                {i18n.language?.startsWith('ar') ? 'هل تحتاج إلى' : "Besoin d'un"} <span className="text-secondary">{i18n.language?.startsWith('ar') ? 'دعم' : 'Accompagnement'}</span> {i18n.language?.startsWith('ar') ? 'فني؟' : 'Technique ?'}
              </h2>
              <p className="text-lg text-gray-300 font-medium leading-relaxed mb-12 max-w-xl">
                {i18n.language?.startsWith('ar') ? 'خبراؤنا الصناعيون في خدمتكم لمساعدتكم في عمليات التوريد أو التسجيل أو لأي سؤال فني حول استخدام البوابة.' : 
                "Nos experts industriels sont à votre disposition pour vous aider dans votre sourcing, votre référencement ou pour toute question technique sur l'utilisation du portail."}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                <div className={cn("flex items-start space-x-4", i18n.language?.startsWith('ar') && "flex-row-reverse space-x-reverse")}>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <div className={i18n.language?.startsWith('ar') ? "text-end" : ""}>
                    <h4 className="font-bold uppercase tracking-tight text-sm">{i18n.language?.startsWith('ar') ? 'مساعدة مباشرة' : 'Assistance Live'}</h4>
                    <p className="text-xs text-gray-400 font-medium">{i18n.language?.startsWith('ar') ? 'استجابة فورية حسب التوافر' : 'Réponse immédiate selon disponibilité'}</p>
                  </div>
                </div>
                <div className={cn("flex items-start space-x-4", i18n.language?.startsWith('ar') && "flex-row-reverse space-x-reverse")}>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-secondary" />
                  </div>
                  <div className={i18n.language?.startsWith('ar') ? "text-end" : ""}>
                    <h4 className="font-bold uppercase tracking-tight text-sm">{i18n.language?.startsWith('ar') ? 'قاعدة المعرفة' : 'Base de connaissances'}</h4>
                    <p className="text-xs text-gray-400 font-medium">{i18n.language?.startsWith('ar') ? 'الوصول إلى الأدلة والدروس التعليمية' : 'Accédez aux guides et tutoriels'}</p>
                  </div>
                </div>
              </div>

              <div className={cn("flex flex-wrap gap-4", i18n.language?.startsWith('ar') && "justify-end")}>
                <Link to="/contact" className={cn("btn-secondary px-10 py-5 font-black uppercase tracking-widest text-sm flex items-center space-x-3", i18n.language?.startsWith('ar') && "flex-row-reverse space-x-reverse")}>
                  <span>{i18n.language?.startsWith('ar') ? 'اتصل بخبير' : 'Contactez un expert'}</span>
                  <ArrowRight className={cn("h-4 w-4", i18n.language?.startsWith('ar') && "rotate-180")} />
                </Link>
                <Link to="/faq" className="bg-white/5 border border-white/10 hover:bg-white/10 px-10 py-5 font-black uppercase tracking-widest text-sm transition-all">
                  {i18n.language?.startsWith('ar') ? 'الأسئلة الشائعة' : 'Consulter la F.A.Q'}
                </Link>
              </div>
            </div>

            <div className="relative group lg:block hidden">
              <div className="absolute -inset-4 border border-secondary/30 rounded-2xl translate-x-4 translate-y-4 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500" />
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-2xl relative overflow-hidden">
                <div className={cn("absolute top-0 p-8", i18n.language?.startsWith('ar') ? "start-0" : "end-0")}>
                  <div className={cn("flex items-center space-x-2", i18n.language?.startsWith('ar') && "flex-row-reverse space-x-reverse")}>
                    <span className="w-2 h-2 bg-success rounded-full animate-ping" />
                    <span className="text-[10px] font-black text-success uppercase tracking-widest">{i18n.language?.startsWith('ar') ? 'الدعم عبر الإنترنت' : 'Support en ligne'}</span>
                  </div>
                </div>
                
                <h3 className={cn("text-2xl font-black uppercase tracking-tight mb-8", i18n.language?.startsWith('ar') && "text-end")}>
                  {i18n.language?.startsWith('ar') ? 'إحصائيات الدعم' : 'Statistiques de support'}
                </h3>
                <div className="space-y-6">
                  {[
                    { label: i18n.language?.startsWith('ar') ? "متوسط وقت الاستجابة" : "Temps de réponse moyen", value: "< 15 min", color: "bg-secondary" },
                    { label: i18n.language?.startsWith('ar') ? "معدل الرضا" : "Taux de satisfaction", value: "98.4%", color: "bg-success" },
                    { label: i18n.language?.startsWith('ar') ? "الطلبات المحلولة / شهر" : "Tickets résolus / mois", value: "2,450+", color: "bg-blue-500" },
                  ].map((stat, i) => (
                    <div key={i} className="space-y-2">
                       <div className={cn("flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400", i18n.language?.startsWith('ar') && "flex-row-reverse")}>
                        <span>{stat.label}</span>
                        <span className="text-white">{stat.value}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: "100%" }}
                          transition={{ duration: 1.5, delay: i * 0.2 }}
                          className={cn("h-full", stat.color)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-6 bg-primary rounded-2xl border border-white/5">
                  <div className={cn("flex items-center space-x-4 mb-4", i18n.language?.startsWith('ar') && "flex-row-reverse space-x-reverse")}>
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className={i18n.language?.startsWith('ar') ? "text-end" : ""}>
                      <p className="text-xs font-black uppercase tracking-widest text-white">{i18n.language?.startsWith('ar') ? 'هل أنت مستعد للبدء؟' : 'Prêt à démarrer ?'}</p>
                      <p className="text-[10px] text-gray-500 font-bold">{i18n.language?.startsWith('ar') ? 'سجل شركتك في دقيقتين' : 'Inscrivez votre entreprise en 2 minutes'}</p>
                    </div>
                  </div>
                  <Link to="/register" className="w-full bg-white text-primary py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center hover:bg-secondary hover:text-white transition-all">
                    {i18n.language?.startsWith('ar') ? 'إنشاء ملف تعريفي للمورد' : 'Créer mon profil fournisseur'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};


export default Home;
