import { Check, ShieldCheck, Zap, Award, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const Tarifs = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  // Les offres payantes se souscrivent depuis l'espace abonnement du tableau de bord.
  const subscribeLink = user ? '/dashboard?tab=subscription' : '/register?role=fournisseur';

  const exhibitorPlans = [
    {
      id: 'free',
      name: 'Free',
      price: `0 ${t('common.dzd')}`,
      description: t('pricing.free.description'),
      features: [
        { text: t('pricing.features.products', { count: 5 }) },
        { text: t('pricing.features.images', { count: 2 }) },
        { text: t('pricing.features.messaging') },
        { text: t('pricing.features.supportStandard') }
      ],
      badge: null,
      bgClass: 'bg-[#F8F9FA] text-primary border-[#E0E0E0]',
      buttonText: t('pricing.start'),
      buttonAction: '/register',
      buttonClass: 'bg-neutral-200 text-neutral-800 border-transparent hover:bg-neutral-300'
    },
    {
      id: 'basic',
      name: 'Basic',
      price: `18 000 ${t('common.dzd')}`,
      description: t('pricing.basic.description'),
      features: [
        { text: t('pricing.features.products', { count: 15 }) },
        { text: t('pricing.features.images', { count: 5 }) },
        { text: t('pricing.features.messaging') },
        { text: t('pricing.features.statsBasic') },
        { text: t('pricing.features.support48') }
      ],
      badge: t('pricing.popular'),
      bgClass: 'bg-[#F8F9FA] text-primary border-[#E86A17] shadow-lg',
      buttonText: t('subscription.choose', { plan: 'Basic' }),
      buttonAction: subscribeLink,
      buttonClass: 'bg-[#E86A17] text-white border-transparent hover:bg-[#c8530b]'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: `29 900 ${t('common.dzd')}`,
      description: t('pricing.pro.description'),
      features: [
        { text: t('pricing.features.unlimitedProducts'), isBold: true },
        { text: t('pricing.features.images', { count: 10 }) },
        { text: t('pricing.features.featured') },
        { text: t('pricing.features.statsAdvanced') },
        { text: t('pricing.features.support24') },
        { text: t('pricing.features.messaging') }
      ],
      badge: t('pricing.recommended'),
      bgClass: 'bg-[#1A1A1A] text-white border-[#E86A17] shadow-xl',
      buttonText: t('subscription.choose', { plan: 'Pro' }),
      buttonAction: subscribeLink,
      buttonClass: 'bg-[#E86A17] text-white border-transparent hover:bg-[#c8530b]'
    }
  ];

  const no = 'no';
  const yes = 'yes';
  // Tableau comparatif : [libellé, Free, Basic, Pro] ; 'yes' / 'no' = icônes.
  const comparisonRows: [string, string, string, string][] = [
    [t('pricing.table.price'), `0 ${t('common.dzd')}`, `18 000 ${t('common.dzd')}${t('pricing.perYear')}`, `29 900 ${t('common.dzd')}${t('pricing.perYear')}`],
    [t('pricing.table.products'), '5', '15', t('subscription.unlimited')],
    [t('pricing.table.images'), '2', '5', '10'],
    [t('pricing.table.featured'), no, no, t('pricing.table.featuredPro')],
    [t('pricing.table.stats'), no, t('pricing.table.statsBasic'), t('pricing.table.statsAdvanced')],
    [t('pricing.table.support'), t('pricing.table.supportStandard'), t('pricing.table.support48'), t('pricing.table.support24')],
    [t('pricing.table.messaging'), yes, yes, yes],
    [t('pricing.table.catalogues'), '1', '5', t('subscription.unlimited')],
    [t('pricing.table.visibility'), t('pricing.table.supportStandard'), t('pricing.table.sectorHighlight'), t('pricing.table.sectorHighlight')],
  ];
  const cellClass = [
    'bg-gray-100/30 text-gray-800',
    'bg-[#E86A17]/15 text-neutral-900',
    'bg-neutral-950/10 text-neutral-950',
  ];

  return (
    <div className="pt-12 pb-20 bg-gray-50/50 min-h-screen relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-secondary"
          >
            <Award className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('pricing.eyebrow')}</span>
          </motion.div>
        </div>

        <div className="mb-10">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-6xl font-black text-primary tracking-tighter uppercase mb-4 flex items-center justify-center">
              <span>{t('pricing.title')}</span>
            </h2>
            <p className="text-gray-700 font-bold max-w-xl mx-auto text-base md:text-lg">{t('pricing.subtitle')}</p>
          </div>
          <div className="max-w-4xl mx-auto mb-12 bg-primary text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
            <ShieldCheck className="h-10 w-10 text-secondary shrink-0" />
            <div className="flex-1 text-center md:text-start">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-1">{t('pricing.founder.label')}</p>
              <p className="font-bold">
                {t('pricing.founder.text')}
              </p>
            </div>
            <Link to="/register?role=fournisseur" className="bg-secondary text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap">
              {t('pricing.founder.button')}
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {exhibitorPlans.map((plan, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.2 }}
                className={cn(
                  "relative p-6 md:p-8 rounded-2xl flex flex-col items-stretch justify-between transition-all duration-300 hover:-translate-y-2 border",
                  plan.bgClass,
                  plan.id === 'basic' && "hover:shadow-2xl hover:shadow-[#E86A17]/10",
                  plan.id === 'pro' && "hover:shadow-2xl hover:shadow-[#E86A17]/20"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#E86A17] text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg z-20">
                    <span>{plan.badge}</span>
                  </div>
                )}
                
                <div className="w-full">
                  <div className="text-center mb-6">
                    <h4 className={cn(
                      "text-2xl font-black tracking-tighter uppercase mb-2",
                      plan.id === 'pro' ? "text-white" : "text-neutral-900"
                    )}>{plan.name}</h4>
                    
                    <p className={cn(
                      "text-xs font-medium mb-4",
                      plan.id === 'pro' ? "text-neutral-400" : "text-neutral-500"
                    )}>
                      {plan.description}
                    </p>

                    <div className="mb-4 flex flex-col items-center justify-center">
                      <div className="flex items-baseline justify-center whitespace-nowrap">
                        <span className={cn(
                          "text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none",
                          plan.id === 'pro' ? "text-white" : "text-neutral-900"
                        )}>{plan.price}</span>
                        <span className={cn(
                          "text-xl sm:text-2xl md:text-3xl font-black ms-1 uppercase tracking-tighter",
                          plan.id === 'pro' ? "text-white" : "text-neutral-900"
                        )}>{t('pricing.perYear')}</span>
                      </div>
                      
                      <span className={cn(
                        "text-[11px] font-bold mt-2 uppercase tracking-wider",
                        plan.id === 'pro' ? "text-neutral-400" : "text-neutral-500"
                      )}>{t('pricing.vatIncluded')}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8 border-t border-current/10 pt-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-xs font-semibold">
                        <Check className="h-4 w-4 shrink-0 text-[#E86A17]" />
                        <span className={cn(
                          "leading-tight",
                          plan.id === 'pro' ? "text-neutral-200" : "text-neutral-700",
                          feature.isBold && "font-black text-[#E86A17]"
                        )}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link 
                  to={plan.buttonAction} 
                  className={cn(
                    "w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center border-2 block font-sans",
                    plan.buttonClass
                  )}
                >
                  {plan.buttonText}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tableau Comparatif */}
        <div className="mb-8 mt-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-5xl font-black text-primary tracking-tighter uppercase mb-4">{t('pricing.table.title')}</h3>
            <p className="text-gray-700 font-bold max-w-xl mx-auto text-base">{t('pricing.table.subtitle')}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden max-w-5xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-start text-sm font-black text-gray-700 uppercase tracking-widest">{t('pricing.table.feature')}</th>
                    <th className="px-6 py-4 text-center text-sm font-black text-primary uppercase tracking-widest bg-gray-100/30">Free</th>
                    <th className="px-6 py-4 text-center text-sm font-black text-white uppercase tracking-widest bg-[#E86A17]">Basic</th>
                    <th className="px-6 py-4 text-center text-sm font-black text-white uppercase tracking-widest bg-neutral-950">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comparisonRows.map(([label, ...cells]) => (
                    <tr key={label}>
                      <td className="px-6 py-4 text-sm font-extrabold text-gray-800">{label}</td>
                      {cells.map((cell, i) => (
                        <td key={i} className={cn("px-6 py-4 text-center text-sm font-extrabold", cellClass[i])}>
                          {cell === yes ? (
                            <Check className="h-5 w-5 text-green-600 mx-auto stroke-[3]" aria-label={t('pricing.included')} />
                          ) : cell === no ? (
                            <X className="h-5 w-5 text-red-500 mx-auto stroke-[3]" aria-label={t('pricing.notIncluded')} />
                          ) : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>



        <div className="mt-6 max-w-4xl mx-auto bg-white rounded-2xl p-10 text-center shadow-lg shadow-gray-200/50 border border-gray-100 relative">
          <div>
            <ShieldCheck className="h-16 w-16 text-secondary mx-auto mb-6 drop-shadow-md" />
            <h3 className="text-2xl font-black text-primary tracking-tighter uppercase mb-4">{t('pricing.payment.title')}</h3>
            <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed font-medium">
              {t('pricing.payment.text')}
            </p>
            <p className="text-xs text-gray-500 mt-4">
              {t('pricing.payment.termsBefore')} <Link to="/terms" className="font-bold text-primary hover:underline">{t('pricing.payment.termsLink')}</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tarifs;
