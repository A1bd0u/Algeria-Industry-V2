import { ArrowRight, BadgeCheck, CheckCircle2, FileCheck2, Globe, MessageSquare, PackagePlus, Search, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { formatDzd } from '../lib/format';

// Offres identiques à /tarifs et au serveur (server/services/billingService.ts).
const PLANS = [
  { id: 'free', price: 0, products: 5 },
  { id: 'basic', price: 18000, products: 15, popular: true },
  { id: 'pro', price: 29900, products: null },
] as const;

const BENEFITS = [
  { key: 'directory', icon: Search },
  { key: 'verified', icon: BadgeCheck },
  { key: 'messages', icon: MessageSquare },
  { key: 'languages', icon: Globe },
];

const STEPS = [
  { key: 'register', icon: UserPlus },
  { key: 'kyc', icon: FileCheck2 },
  { key: 'publish', icon: PackagePlus },
];

const BecomeExhibitor = () => {
  const { t } = useTranslation();
  const registerLink = '/register?role=fournisseur';

  return (
    <div className="bg-neutral-bg min-h-screen">
      <section className="py-24 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 bg-secondary text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-8">
              {t('exhibitor.eyebrow')}
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight uppercase tracking-tight">
              {t('exhibitor.titleStart')} <span className="text-secondary">{t('exhibitor.titleHighlight')}</span>
            </h1>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">{t('exhibitor.subtitle')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={registerLink} className="w-full sm:w-auto btn-secondary px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm inline-flex items-center justify-center gap-2">
                {t('exhibitor.cta')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link to="/tarifs" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all text-center">
                {t('exhibitor.seePricing')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black text-primary uppercase tracking-tight text-center mb-16">{t('exhibitor.benefitsTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {BENEFITS.map(({ key, icon: Icon }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-6">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-black text-primary uppercase mb-3">{t(`exhibitor.benefits.${key}.title`)}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{t(`exhibitor.benefits.${key}.text`)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-primary uppercase tracking-tight text-center mb-16">{t('exhibitor.stepsTitle')}</h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {STEPS.map(({ key, icon: Icon }, i) => (
              <li key={key} className="text-center md:text-start">
                <span className="text-5xl font-black text-secondary/20">0{i + 1}</span>
                <Icon className="h-8 w-8 text-secondary my-4 mx-auto md:mx-0" />
                <h3 className="text-lg font-black text-primary uppercase mb-2">{t(`exhibitor.steps.${key}.title`)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(`exhibitor.steps.${key}.text`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="plans" className="py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black text-primary uppercase tracking-tight text-center mb-16">{t('exhibitor.plansTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative p-10 rounded-2xl border flex flex-col',
                'popular' in plan && plan.popular ? 'bg-primary text-white border-transparent shadow-2xl' : 'bg-white text-primary border-gray-200'
              )}
            >
              <h3 className="text-xl font-black uppercase tracking-widest mb-4">{t(`subscription.plans.${plan.id}`)}</h3>
              <p className="text-4xl font-black mb-1">{formatDzd(plan.price)}</p>
              <p className="text-xs opacity-70 mb-8">{t('subscription.perYearVat')}</p>
              <ul className="flex-1 space-y-3 mb-10 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-secondary shrink-0" />
                  <span>{plan.products === null ? t('exhibitor.unlimitedProducts') : t('exhibitor.productsCount', { count: plan.products })}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-secondary shrink-0" />
                  <span>{t(`exhibitor.planExtra.${plan.id}`)}</span>
                </li>
              </ul>
              <Link to={registerLink} className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-center bg-secondary text-white hover:opacity-90">
                {t('exhibitor.start')}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center mt-10">
          <Link to="/tarifs" className="text-secondary font-bold hover:underline">{t('exhibitor.comparePlans')}</Link>
        </p>
      </section>
    </div>
  );
};

export default BecomeExhibitor;
