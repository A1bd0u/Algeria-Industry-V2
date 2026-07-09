import { Check, ShieldCheck, Zap, Award, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const Tarifs = () => {
  const { t, i18n } = useTranslation();

  const exhibitorPlans = [
    {
      id: 'free',
      name: 'Free',
      price: '0 DA',
      originalPrice: null,
      discount: null,
      period: '/ an',
      description: 'Pour découvrir la plateforme',
      features: [
        { text: '5 produits' },
        { text: '2 images/produit' },
        { text: 'Messagerie' },
        { text: 'Support standard' }
      ],
      badge: null,
      bgClass: 'bg-[#F8F9FA] text-primary border-[#E0E0E0]',
      buttonText: 'Commencer',
      buttonAction: '/register',
      buttonClass: 'bg-neutral-200 text-neutral-800 border-transparent hover:bg-neutral-300'
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '18 000 DA',
      originalPrice: '30 000 DA',
      discount: '-40%',
      period: '/ an',
      description: 'Le meilleur rapport qualité-prix',
      features: [
        { text: '15 produits' },
        { text: '5 images/produit' },
        { text: 'Messagerie' },
        { text: 'Statistiques de base' },
        { text: 'Support 48h' }
      ],
      badge: 'POPULAIRE',
      bgClass: 'bg-[#F8F9FA] text-primary border-[#E86A17] shadow-lg',
      buttonText: 'Choisir Basic',
      buttonAction: '/contact',
      buttonClass: 'bg-[#E86A17] text-white border-transparent hover:bg-[#d05c12]'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '29 900 DA',
      originalPrice: '55 000 DA',
      discount: '-46%',
      period: '/ an',
      description: 'Pour les entreprises ambitieuses',
      features: [
        { text: 'Produits ILLIMITÉS', isBold: true },
        { text: '10 images/produit' },
        { text: '3 mises en avant' },
        { text: 'Statistiques avancées' },
        { text: 'Support 24h' },
        { text: 'Messagerie' }
      ],
      badge: 'RECOMMANDÉ',
      bgClass: 'bg-[#1A1A1A] text-white border-[#E86A17] shadow-xl',
      buttonText: 'Choisir Pro',
      buttonAction: '/contact',
      buttonClass: 'bg-[#E86A17] text-white border-[#E86A17] hover:bg-transparent hover:text-[#E86A17]'
    }
  ];

  return (
    <div className="pt-12 pb-20 bg-gray-50/50 min-h-screen relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-2 text-secondary"
          >
            <Award className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Tarification Transparente</span>
          </motion.div>
        </div>

        <div className="mb-10">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-6xl font-black text-primary tracking-tighter uppercase mb-4 flex items-center justify-center">
              <span>Tarifs Exposants</span>
            </h2>
            <p className="text-gray-700 font-bold max-w-xl mx-auto text-base md:text-lg">Pour présenter vos produits et services</p>
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
                      <div className="flex items-baseline justify-center">
                        <span className={cn(
                          "text-4xl md:text-5xl font-black tracking-tighter leading-none",
                          plan.id === 'pro' ? "text-white" : "text-neutral-900"
                        )}>{plan.price}</span>
                        <span className={cn(
                          "text-3xl md:text-4xl font-black ms-2 uppercase tracking-tighter",
                          plan.id === 'pro' ? "text-white" : "text-neutral-900"
                        )}>{plan.period}</span>
                      </div>
                      
                      {plan.originalPrice && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn(
                            "text-sm line-through decoration-red-500 decoration-2 font-bold",
                            plan.id === 'pro' ? "text-neutral-400" : "text-neutral-500"
                          )}>
                            {plan.originalPrice} / an
                          </span>
                          {plan.discount && (
                            <span className="bg-[#E86A17] text-white text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                              {plan.discount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8 border-t border-current/10 pt-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-3 text-xs font-semibold">
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
        <div className="mb-24 mt-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-5xl font-black text-primary tracking-tighter uppercase mb-4">Tableau Comparatif détaillé</h3>
            <p className="text-gray-700 font-bold max-w-xl mx-auto text-base">Comparez les fonctionnalités et choisissez l'offre la plus adaptée à vos besoins.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden max-w-5xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-start text-sm font-black text-gray-700 uppercase tracking-widest">Caractéristique</th>
                    <th className="px-6 py-4 text-center text-sm font-black text-primary uppercase tracking-widest bg-gray-100/30">Free</th>
                    <th className="px-6 py-4 text-center text-sm font-black text-primary uppercase tracking-widest bg-gray-100/10">Basic</th>
                    <th className="px-6 py-4 text-center text-sm font-black text-secondary uppercase tracking-widest bg-secondary/5">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-sm font-extrabold text-gray-800">Prix normal</td>
                    <td className="px-6 py-4 text-center text-sm font-black text-primary bg-gray-100/30">0 DA</td>
                    <td className="px-6 py-4 text-center text-sm font-black text-primary bg-gray-100/10">30 000 DA/an</td>
                    <td className="px-6 py-4 text-center text-sm font-black text-primary bg-secondary/5">55 000 DA/an</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-sm font-extrabold text-gray-800">Prix de lancement</td>
                    <td className="px-6 py-4 text-center text-sm font-black text-primary bg-gray-100/30">0 DA</td>
                    <td className="px-6 py-4 text-center text-sm font-black text-secondary bg-gray-100/10">18 000 DA/an</td>
                    <td className="px-6 py-4 text-center text-sm font-black text-secondary bg-secondary/5">29 900 DA/an</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-sm font-extrabold text-gray-800">Économie</td>
                    <td className="px-6 py-4 text-center text-sm font-extrabold text-gray-500 bg-gray-100/30">-</td>
                    <td className="px-6 py-4 text-center text-sm font-black text-success bg-gray-100/10">-40%</td>
                    <td className="px-6 py-4 text-center text-sm font-black text-success bg-secondary/5">-46%</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-sm font-extrabold text-gray-800">Produits</td>
                    <td className="px-6 py-4 text-center text-sm font-extrabold text-gray-800 bg-gray-100/30">5</td>
                    <td className="px-6 py-4 text-center text-sm font-extrabold text-gray-800 bg-gray-100/10">15</td>
                    <td className="px-6 py-4 text-center text-sm font-black text-secondary bg-secondary/5">Illimité</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-sm font-extrabold text-gray-800">Images / produit</td>
                    <td className="px-6 py-4 text-center text-sm font-extrabold text-gray-800 bg-gray-100/30">2</td>
                    <td className="px-6 py-4 text-center text-sm font-extrabold text-gray-800 bg-gray-100/10">5</td>
                    <td className="px-6 py-4 text-center text-sm font-extrabold text-gray-800 bg-secondary/5">10</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-sm font-extrabold text-gray-800">Mise en avant</td>
                    <td className="px-6 py-4 text-center text-sm bg-gray-100/30">
                      <X className="h-5 w-5 text-red-500 mx-auto stroke-[3]" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm bg-gray-100/10">
                      <X className="h-5 w-5 text-red-500 mx-auto stroke-[3]" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-extrabold text-primary bg-secondary/5">3 produits (page d'accueil)</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-sm font-extrabold text-gray-800">Statistiques</td>
                    <td className="px-6 py-4 text-center text-sm bg-gray-100/30">
                      <X className="h-5 w-5 text-red-500 mx-auto stroke-[3]" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-extrabold text-neutral-800 bg-gray-100/10">Basiques (vues)</td>
                    <td className="px-6 py-4 text-center text-sm font-black text-neutral-900 bg-secondary/5">Avancées (vues, clics, leads)</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-sm font-extrabold text-gray-800">Support</td>
                    <td className="px-6 py-4 text-center text-sm font-extrabold text-gray-700 bg-gray-100/30">Standard</td>
                    <td className="px-6 py-4 text-center text-sm font-extrabold text-gray-700 bg-gray-100/10">48h</td>
                    <td className="px-6 py-4 text-center text-sm font-extrabold text-gray-700 bg-secondary/5">24h / Prioritaire</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-sm font-extrabold text-gray-800">Messagerie</td>
                    <td className="px-6 py-4 text-center text-sm bg-gray-100/30">
                      <Check className="h-5 w-5 text-green-500 mx-auto stroke-[3]" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm bg-gray-100/10">
                      <Check className="h-5 w-5 text-green-500 mx-auto stroke-[3]" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm bg-secondary/5">
                      <Check className="h-5 w-5 text-green-500 mx-auto stroke-[3]" />
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-sm font-extrabold text-gray-800">Catalogues PDF</td>
                    <td className="px-6 py-4 text-center text-sm text-neutral-800 bg-gray-100/30">1</td>
                    <td className="px-6 py-4 text-center text-sm text-neutral-800 bg-gray-100/10">5</td>
                    <td className="px-6 py-4 text-center text-sm font-black text-secondary bg-secondary/5">Illimité</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-sm font-extrabold text-gray-800">Visibilité</td>
                    <td className="px-6 py-4 text-center text-sm text-neutral-700 bg-gray-100/30">Standard</td>
                    <td className="px-6 py-4 text-center text-sm text-neutral-800 bg-gray-100/10">Mise en avant secteur</td>
                    <td className="px-6 py-4 text-center text-sm font-extrabold text-neutral-900 bg-secondary/5">Mise en avant secteur</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>



        <div className="mt-16 max-w-4xl mx-auto bg-white rounded-2xl p-12 text-center shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
          <div className="absolute inset-0 bg-secondary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
          <div className="relative z-10">
            <ShieldCheck className="h-16 w-16 text-secondary mx-auto mb-6 drop-shadow-md" />
            <h3 className="text-2xl font-black text-primary tracking-tighter uppercase mb-4">Paiement Sécurisé</h3>
            <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed font-medium">
              Tous nos abonnements sont facturés en Dinar Algérien (DZD). Nous acceptons les paiements par virement bancaire, chèque certifié et paiement électronique via CIB / Dahabia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tarifs;
