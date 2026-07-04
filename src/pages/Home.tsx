import { Activity, ArrowRight, ArrowUpRight, Building2, CheckCircle2, FileText, Plus, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton';
import { useCurrency } from '../context/CurrencyContext';
import { cn, generateSlugUrl } from '../lib/utils';

const PARTNERS = [
  { name: "Sonatrach", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Sonatrach_Logo.svg/1200px-Sonatrach_Logo.svg.png" },
  { name: "Cevital", logo: "https://upload.wikimedia.org/wikipedia/fr/thumb/a/a3/Logo_Cevital.svg/1200px-Logo_Cevital.svg.png" },
  { name: "Condor", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Logo_Condor_Electronics.svg/1200px-Logo_Condor_Electronics.svg.png" },
  { name: "Ooredoo", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Ooredoo_logo.svg/1200px-Ooredoo_logo.svg.png" },
  { name: "Djezzy", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Djezzy_logo.svg/1200px-Djezzy_logo.svg.png" },
  { name: "Mobilis", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Logo_Mobilis.svg/1200px-Logo_Mobilis.svg.png" },
];

const Home = () => {
  const { t, i18n } = useTranslation();
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
        
        let pData = [
          { id: '1', name: "Pompe Hydraulique", company: "Mecanique Plus", price: "245000", image: "https://picsum.photos/seed/p1/400/400" },
          { id: '2', name: "Unité de Filtration", company: "Global Filtration", price: "Sur Devis", image: "https://picsum.photos/seed/p2/400/400" },
          { id: '3', name: "Alternateur Industriel", company: "Electric DZ", price: "120000", image: "https://picsum.photos/seed/p3/400/400" },
          { id: '4', name: "Compresseur d'air", company: "Air Tech", price: "850000", image: "https://picsum.photos/seed/p4/400/400" }
        ];

        if (prodRes && prodRes.ok) {
          try { pData = await prodRes.json(); } catch(e){}
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
    <div className={cn("flex flex-col min-h-screen", i18n.language === 'ar' && "font-arabic")}>
      {/* Stats Section (Technical Dashboard Style) */}
      <section className="py-12 bg-white border-b border-border-tech">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-3 gap-0 border border-border-tech divide-y md:divide-y-0 md:divide-x divide-border-tech",
            i18n.language === 'ar' && "md:divide-x-reverse"
          )}>
            <div className={cn("p-8 hover:bg-neutral-bg transition-colors group", i18n.language === 'ar' && "text-right")}>
              <span className="tech-label">{i18n.language === 'ar' ? 'قاعدة البيانات' : 'Base de données'}</span>
              <div className={cn("flex items-baseline space-x-2", i18n.language === 'ar' && "space-x-reverse justify-end")}>
                <span className="text-4xl font-black text-primary tech-mono">550,000+</span>
                <span className="text-xs font-bold text-secondary uppercase tracking-tighter">SKU</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-2 font-medium uppercase tracking-wider">
                {i18n.language === 'ar' ? 'المكونات والمعدات الصناعية المرجعية' : 'Composants et équipements industriels référencés'}
              </p>
            </div>
            <div className={cn("p-8 hover:bg-neutral-bg transition-colors group", i18n.language === 'ar' && "text-right")}>
              <span className="tech-label">{i18n.language === 'ar' ? 'حركة الشبكة' : 'Trafic Réseau'}</span>
              <div className={cn("flex items-baseline space-x-2", i18n.language === 'ar' && "space-x-reverse justify-end")}>
                <span className="text-4xl font-black text-primary tech-mono">2.7M</span>
                <span className="text-xs font-bold text-secondary uppercase tracking-tighter">REQ/MO</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-2 font-medium uppercase tracking-wider">
                {i18n.language === 'ar' ? 'صناع القرار والمهندسين المتصلين شهرياً' : 'Décideurs et ingénieurs connectés mensuellement'}
              </p>
            </div>
            <div className={cn("p-8 hover:bg-neutral-bg transition-colors group", i18n.language === 'ar' && "text-right")}>
              <span className="tech-label">{i18n.language === 'ar' ? 'الشهادات' : 'Certification'}</span>
              <div className={cn("flex items-baseline space-x-2", i18n.language === 'ar' && "space-x-reverse justify-end")}>
                <span className="text-4xl font-black text-primary tech-mono">5,000+</span>
                <span className="text-xs font-bold text-secondary uppercase tracking-tighter">ISO</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-2 font-medium uppercase tracking-wider">
                {i18n.language === 'ar' ? 'الشركات المحلية والدولية المعتمدة' : 'Entreprises locales et internationales certifiées'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Slider */}
      <section className="py-8 bg-neutral-bg border-b border-border-tech overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "flex items-center justify-between gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-700 overflow-x-auto no-scrollbar pb-2",
            i18n.language === 'ar' && "flex-row-reverse"
          )}>
            {PARTNERS.map((partner, i) => (
              <img 
                key={i} 
                src={partner.logo} 
                alt={partner.name} 
                className="h-6 md:h-10 w-auto object-contain flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn("flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6", i18n.language === 'ar' && "md:flex-row-reverse")}>
            <div className={cn("max-w-2xl", i18n.language === 'ar' && "text-right")}>
              <div className={cn("flex items-center space-x-2 text-secondary mb-4", i18n.language === 'ar' && "space-x-reverse justify-end")}>
                <div className="w-8 h-[2px] bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">{i18n.language === 'ar' ? 'المواصفات الفنية' : 'Spécifications Techniques'}</span>
              </div>
              <h2 className="text-4xl font-black text-primary uppercase tracking-tighter leading-none mb-4">{t('home.trends')}</h2>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{t('home.trends_subtitle')}</p>
            </div>
            <Link 
              to="/products"
              className={cn("btn-primary flex items-center space-x-3 group w-fit", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}
            >
              <span className={cn(i18n.language === 'ar' && "text-sm")}>{i18n.language === 'ar' ? 'الوصول إلى الكتالوج الكامل' : 'ACCÉDER AU CATALOGUE COMPLET'}</span>
              <ArrowRight className={cn("h-4 w-4 group-hover:translate-x-1 transition-transform", i18n.language === 'ar' && "rotate-180 group-hover:-translate-x-1")} />
            </Link>
          </div>

          <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-border-tech", i18n.language === 'ar' && "border-l-0 border-r")}>
            {isLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border-r border-b border-border-tech p-6 relative">
                  <div className="aspect-[4/3] mb-6 bg-neutral-bg border border-border-tech p-4 flex items-center justify-center">
                    <Skeleton className="w-2/3 h-2/3 opacity-20" />
                  </div>
                  <div className={cn("space-y-4", i18n.language === 'ar' && "text-right flex flex-col items-end")}>
                    <div className="space-y-2 w-full">
                      <Skeleton className={cn("h-3 w-1/3", i18n.language === 'ar' && "ml-auto")} />
                      <Skeleton className={cn("h-5 w-3/4", i18n.language === 'ar' && "ml-auto")} />
                    </div>
                    <div className={cn("flex justify-between items-center w-full pt-4 border-t border-border-tech", i18n.language === 'ar' && "flex-row-reverse")}>
                      <div className={cn("space-y-1 mt-2 flex flex-col", i18n.language === 'ar' && "items-end")}>
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
                Aucun produit publié pour le moment.
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
                    src={product.image || `https://picsum.photos/seed/${product.id}/400/400`} 
                    alt={product.name} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                <div className={cn("space-y-4", i18n.language === 'ar' && "text-right")}>
                  <div>
                    <span className="tech-label">{product.company || 'Entreprise ID: ' + (product.owner_id ? product.owner_id.substring(0, 8) : 'Inconnu')}</span>
                    <Link to={`/products/${generateSlugUrl(product.name, product.id)}`}>
                      <h3 className={cn("text-sm font-black text-primary uppercase tracking-tight line-clamp-2 min-h-[40px] group-hover:text-secondary transition-colors", i18n.language === 'ar' && "text-base tracking-normal")}>
                        {product.name}
                      </h3>
                    </Link>
                  </div>
                  
                  <div className={cn("flex items-center justify-between pt-4 border-t border-border-tech", i18n.language === 'ar' && "flex-row-reverse")}>
                    <div className={cn("flex flex-col", i18n.language === 'ar' && "text-right")}>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{i18n.language === 'ar' ? 'السعر' : 'Cotation'}</span>
                      <span className="text-sm font-mono font-bold text-primary">{formatPrice(product.price || 'Sur Devis')}</span>
                    </div>
                    <Link to={`/products/${generateSlugUrl(product.name, product.id)}`} className="bg-primary text-white p-2 hover:bg-secondary transition-colors">
                      <ArrowRight className={cn("h-4 w-4", i18n.language === 'ar' && "rotate-180")} />
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
            {i18n.language === 'ar' ? 'لماذا تختار ألجيريا إنداستري؟' : 'Pourquoi choisir Algeria Industry ?'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              i18n.language === 'ar' ? 'زيادة الرؤية للموردين' : "Visibilité accrue pour les fournisseurs",
              i18n.language === 'ar' ? 'تبسيط عمليات التوريد للمشترين' : "Sourcing simplifié pour les acheteurs",
              i18n.language === 'ar' ? 'منصة آمنة بنسبة ١٠٠٪' : "Plateforme 100% sécurisée",
              i18n.language === 'ar' ? 'دعم فني محلي' : "Support technique local"
            ].map((text, i) => (
              <div key={i} className={cn("flex items-center justify-center space-x-2 bg-white p-4 rounded-lg shadow-sm border border-border-tech", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}>
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="font-medium text-gray-700">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Besoin d'aide Section */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-secondary/10 -skew-x-12 translate-x-1/2" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-16 items-center", i18n.language === 'ar' && "lg:flex lg:flex-row-reverse lg:justify-between")}>
            <div className={i18n.language === 'ar' ? "text-right" : ""}>
              <div className={cn("flex items-center space-x-2 text-secondary mb-6", i18n.language === 'ar' && "space-x-reverse justify-end")}>
                <div className="w-8 h-[2px] bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">{t('footer.support')}</span>
              </div>
              <h2 className={cn("text-5xl font-black uppercase tracking-tighter leading-none mb-8", i18n.language === 'ar' && "text-6xl")}>
                {i18n.language === 'ar' ? 'هل تحتاج إلى' : "Besoin d'un"} <span className="text-secondary">{i18n.language === 'ar' ? 'دعم' : 'Accompagnement'}</span> {i18n.language === 'ar' ? 'فني؟' : 'Technique ?'}
              </h2>
              <p className="text-lg text-gray-300 font-medium leading-relaxed mb-12 max-w-xl">
                {i18n.language === 'ar' ? 'خبراؤنا الصناعيون في خدمتكم لمساعدتكم في عمليات التوريد أو التسجيل أو لأي سؤال فني حول استخدام البوابة.' : 
                "Nos experts industriels sont à votre disposition pour vous aider dans votre sourcing, votre référencement ou pour toute question technique sur l'utilisation du portail."}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                <div className={cn("flex items-start space-x-4", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <div className={i18n.language === 'ar' ? "text-right" : ""}>
                    <h4 className="font-bold uppercase tracking-tight text-sm">{i18n.language === 'ar' ? 'مساعدة مباشرة' : 'Assistance Live'}</h4>
                    <p className="text-xs text-gray-400 font-medium">{i18n.language === 'ar' ? 'استجابة فورية حسب التوافر' : 'Réponse immédiate selon disponibilité'}</p>
                  </div>
                </div>
                <div className={cn("flex items-start space-x-4", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-secondary" />
                  </div>
                  <div className={i18n.language === 'ar' ? "text-right" : ""}>
                    <h4 className="font-bold uppercase tracking-tight text-sm">{i18n.language === 'ar' ? 'قاعدة المعرفة' : 'Base de connaissances'}</h4>
                    <p className="text-xs text-gray-400 font-medium">{i18n.language === 'ar' ? 'الوصول إلى الأدلة والدروس التعليمية' : 'Accédez aux guides et tutoriels'}</p>
                  </div>
                </div>
              </div>

              <div className={cn("flex flex-wrap gap-4", i18n.language === 'ar' && "justify-end")}>
                <Link to="/contact" className={cn("btn-secondary px-10 py-5 font-black uppercase tracking-widest text-sm flex items-center space-x-3", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}>
                  <span>{i18n.language === 'ar' ? 'اتصل بخبير' : 'Contactez un expert'}</span>
                  <ArrowRight className={cn("h-4 w-4", i18n.language === 'ar' && "rotate-180")} />
                </Link>
                <Link to="/faq" className="bg-white/5 border border-white/10 hover:bg-white/10 px-10 py-5 font-black uppercase tracking-widest text-sm transition-all">
                  {i18n.language === 'ar' ? 'الأسئلة الشائعة' : 'Consulter la F.A.Q'}
                </Link>
              </div>
            </div>

            <div className="relative group lg:block hidden">
              <div className="absolute -inset-4 border border-secondary/30 rounded-[40px] translate-x-4 translate-y-4 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500" />
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-[40px] relative overflow-hidden">
                <div className={cn("absolute top-0 p-8", i18n.language === 'ar' ? "left-0" : "right-0")}>
                  <div className={cn("flex items-center space-x-2", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}>
                    <span className="w-2 h-2 bg-success rounded-full animate-ping" />
                    <span className="text-[10px] font-black text-success uppercase tracking-widest">{i18n.language === 'ar' ? 'الدعم عبر الإنترنت' : 'Support en ligne'}</span>
                  </div>
                </div>
                
                <h3 className={cn("text-2xl font-black uppercase tracking-tight mb-8", i18n.language === 'ar' && "text-right")}>
                  {i18n.language === 'ar' ? 'إحصائيات الدعم' : 'Statistiques de support'}
                </h3>
                <div className="space-y-6">
                  {[
                    { label: i18n.language === 'ar' ? "متوسط وقت الاستجابة" : "Temps de réponse moyen", value: "< 15 min", color: "bg-secondary" },
                    { label: i18n.language === 'ar' ? "معدل الرضا" : "Taux de satisfaction", value: "98.4%", color: "bg-success" },
                    { label: i18n.language === 'ar' ? "الطلبات المحلولة / شهر" : "Tickets résolus / mois", value: "2,450+", color: "bg-blue-500" },
                  ].map((stat, i) => (
                    <div key={i} className="space-y-2">
                       <div className={cn("flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400", i18n.language === 'ar' && "flex-row-reverse")}>
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
                  <div className={cn("flex items-center space-x-4 mb-4", i18n.language === 'ar' && "flex-row-reverse space-x-reverse")}>
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className={i18n.language === 'ar' ? "text-right" : ""}>
                      <p className="text-xs font-black uppercase tracking-widest text-white">{i18n.language === 'ar' ? 'هل أنت مستعد للبدء؟' : 'Prêt à démarrer ?'}</p>
                      <p className="text-[10px] text-gray-500 font-bold">{i18n.language === 'ar' ? 'سجل شركتك في دقيقتين' : 'Inscrivez votre entreprise en 2 minutes'}</p>
                    </div>
                  </div>
                  <Link to="/register" className="w-full bg-white text-primary py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center hover:bg-secondary hover:text-white transition-all">
                    {i18n.language === 'ar' ? 'إنشاء ملف تعريفي للمورد' : 'Créer mon profil fournisseur'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};


export default Home;
