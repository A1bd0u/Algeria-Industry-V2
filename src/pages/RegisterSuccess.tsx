import { ArrowRight, Building2, CheckCircle2, LayoutDashboard, Search, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const RegisterSuccess = () => {
  const { i18n } = useTranslation();

  return (
    <div className={cn("min-h-screen bg-neutral-bg flex items-center justify-center px-4 py-20", i18n.language === 'ar' && "font-arabic")}>
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left side - Visual Success */}
            <div className="md:w-1/2 bg-primary p-12 text-white flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" 
                   style={{ backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
              
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-24 h-24 bg-secondary rounded-3xl flex items-center justify-center shadow-2xl mb-8 relative z-10"
              >
                <CheckCircle2 className="h-12 w-12 text-white" />
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-black uppercase tracking-tighter leading-none mb-6 relative z-10"
              >
                {i18n.language === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Compte Créé avec Succès'}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/60 text-sm font-medium leading-relaxed relative z-10"
              >
                {i18n.language === 'ar' 
                  ? 'مرحبًا بك في أكبر شبكة صناعية في الجزائر. حسابك جاهز الآن للاستخدام.'
                  : 'Bienvenue dans le plus grand réseau industriel d\'Algérie. Votre compte est maintenant prêt à l\'emploi.'}
              </motion.p>
            </div>

            {/* Right side - Next Steps */}
            <div className="md:w-1/2 p-12">
              <h2 className="text-xs font-black text-secondary uppercase tracking-[0.3em] mb-8">
                {i18n.language === 'ar' ? 'الخطوات التالية' : 'Prochaines étapes'}
              </h2>

              <div className="space-y-6">
                {[
                  {
                    icon: LayoutDashboard,
                    title: i18n.language === 'ar' ? 'إكمال ملفك الشخصي' : 'Compléter votre profil',
                    desc: i18n.language === 'ar' ? 'أضف المزيد من المعلومات لجذب العملاء.' : 'Ajoutez plus d\'informations pour attirer des clients.',
                    link: '/dashboard',
                    color: 'bg-blue-50 text-blue-600'
                  },
                  {
                    icon: Search,
                    title: i18n.language === 'ar' ? 'استكشاف المنتجات' : 'Explorer les produits',
                    desc: i18n.language === 'ar' ? 'تصفح الآلاف من المعدات الصناعية.' : 'Parcourez des milliers d\'équipements industriels.',
                    link: '/products',
                    color: 'bg-orange-50 text-orange-600'
                  },
                  {
                    icon: Building2,
                    title: i18n.language === 'ar' ? 'زيارة الصالون الافتراضي' : 'Visiter le salon virtuel',
                    desc: i18n.language === 'ar' ? 'تجربة فريدة من نوعها في عالم الصناعة.' : 'Une expérience unique dans le monde de l\'industrie.',
                    link: '/virtual-show',
                    color: 'bg-purple-50 text-purple-600'
                  }
                ].map((step, idx) => (
                  <Link 
                    key={idx}
                    to={step.link}
                    className="group block p-4 rounded-2xl hover:bg-neutral-bg border border-transparent hover:border-gray-100 transition-all"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", step.color)}>
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-black text-primary uppercase tracking-tight group-hover:text-secondary transition-colors">
                          {step.title}
                        </h3>
                        <p className="text-[11px] text-gray-500 font-medium leading-normal mt-1">
                          {step.desc}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-12 flex flex-col space-y-4">
                <Link to="/dashboard" className="w-full btn-secondary py-4 rounded-xl flex items-center justify-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-widest">
                    {i18n.language === 'ar' ? 'الانتقال إلى لوحة التحكم' : 'Aller au Tableau de Bord'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                
                <Link to="/" className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors">
                  {i18n.language === 'ar' ? 'العودة للرئيسية' : 'Retour à l\'accueil'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between text-gray-400 px-8">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Settings className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Besoin d'aide pour configurer votre compte ?</span>
          </div>
          <Link to="/contact" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-secondary border-b border-primary/20 pb-0.5">
            Contacter le support technique
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterSuccess;
