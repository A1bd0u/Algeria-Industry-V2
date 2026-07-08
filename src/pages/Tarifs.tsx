import { Check, ShieldCheck, Zap, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const Tarifs = () => {
  const { t, i18n } = useTranslation();

  const exhibitorPlans = [
    {
      name: 'Free',
      price: '0 DA',
      originalPrice: '0 DA',
      discount: null,
      period: '/à vie',
      description: 'L\'essentiel pour découvrir la plateforme et créer votre profil.',
      features: [
        '5 produits inclus',
        '2 images par produit',
        'Support Standard',
        'Messagerie Gratuite',
        'Économie : -'
      ],
      popular: false,
      color: 'bg-white text-primary',
      buttonText: 'Commencer Gratuitement',
      buttonAction: '/register'
    },
    {
      name: 'Basic',
      price: '18 000 DA',
      originalPrice: '30 000 DA',
      discount: '-40%',
      period: '/an',
      description: 'Idéal pour les entreprises souhaitant une visibilité accrue à moindre coût.',
      features: [
        '15 produits inclus',
        '5 images par produit',
        'Statistiques Basiques',
        'Support sous 48h',
        'Messagerie Gratuite',
        'Économie : -40%'
      ],
      popular: false,
      color: 'bg-white text-primary',
      buttonText: 'Choisir Basic',
      buttonAction: '/contact'
    },
    {
      name: 'Pro',
      price: '29 900 DA',
      originalPrice: '55 000 DA',
      discount: '-46%',
      period: '/an',
      description: 'La solution complète ultime avec mise en avant et outils avancés.',
      features: [
        'Produits Illimités',
        '10 images par produit',
        '3 produits mis en avant',
        'Statistiques Avancées',
        'Support sous 24h',
        'Messagerie Gratuite',
        'Économie : -46%'
      ],
      popular: true,
      color: 'bg-primary text-white',
      buttonText: 'Choisir Pro',
      buttonAction: '/contact'
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
            <h2 className="text-3xl md:text-4xl font-black text-primary tracking-tighter uppercase mb-3 flex items-center justify-center space-x-3">
              <span>Tarifs Exposants</span>
              <span className="text-secondary opacity-50">/</span>
              <span className="text-gray-400">Fournisseurs</span>
            </h2>
            <p className="text-gray-500 font-medium max-w-xl mx-auto">Des solutions de visibilité stratégiques pour toucher et cibler directement les décideurs du secteur industriel.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {exhibitorPlans.map((plan, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.2 }}
                className={cn(
                  "relative p-10 rounded-2xl flex flex-col items-center justify-between transition-all duration-500 hover:-translate-y-2 border",
                  plan.color,
                  plan.popular 
                    ? "shadow-2xl scale-105 z-10 border-transparent" 
                    : "border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-200/80 hover:border-gray-200"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 bg-secondary text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center space-x-2">
                    <Zap className="h-3 w-3" />
                    <span>Le plus populaire</span>
                  </div>
                )}
                
                <div className="w-full text-center">
                  <h4 className="text-xl font-black tracking-tighter uppercase mb-6">{plan.name}</h4>
                  <div className="mb-6 flex flex-col items-center justify-center">
                    {plan.discount && (
                      <span className="inline-block bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg mb-3">
                        Économie {plan.discount}
                      </span>
                    )}
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl md:text-5xl font-black tracking-tighter leading-none">{plan.price}</span>
                      {plan.period && <span className="text-[10px] font-bold opacity-60 ms-1 uppercase tracking-widest block">{plan.period}</span>}
                    </div>
                    {plan.originalPrice && plan.originalPrice !== plan.price && (
                      <span className="text-xs text-gray-400 line-through mt-2 block">
                        Prix normal : {plan.originalPrice}/an
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-60 font-medium mb-8 border-b border-current/10 pb-8 min-h-[60px]">
                    {plan.description}
                  </p>
                  
                  <ul className="space-y-4 mb-12 text-start min-h-[220px]">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-3 text-[11px] font-bold">
                        <Check className={cn("h-4 w-4 shrink-0 mt-0.5", plan.popular ? "text-secondary" : "text-secondary")} />
                        <span className="leading-tight opacity-70 italic">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link 
                  to={plan.buttonAction} 
                  className={cn(
                    "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-center border-2",
                    plan.popular 
                      ? "bg-secondary border-secondary text-white hover:bg-white hover:text-secondary hover:border-white shadow-lg" 
                      : "bg-transparent border-gray-200 text-primary hover:bg-primary hover:text-white hover:border-primary"
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
            <h3 className="text-2xl font-black text-primary tracking-tighter uppercase mb-4">Tableau Comparatif détaillé</h3>
            <p className="text-gray-500 font-medium max-w-xl mx-auto">Comparez les fonctionnalités et choisissez l'offre la plus adaptée à vos besoins.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden max-w-5xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-start text-xs font-black text-gray-400 uppercase tracking-widest">Caractéristique</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-primary uppercase tracking-widest bg-gray-100/30">Free</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-primary uppercase tracking-widest bg-gray-100/10">Basic</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-secondary uppercase tracking-widest bg-secondary/5">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">Prix normal</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-primary bg-gray-100/30">0 DA</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-primary bg-gray-100/10">30 000 DA/an</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-primary bg-secondary/5">55 000 DA/an</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">Prix de lancement</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-primary bg-gray-100/30">0 DA</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-secondary bg-gray-100/10">18 000 DA/an</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-secondary bg-secondary/5 font-black">29 900 DA/an</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">Économie</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-gray-400 bg-gray-100/30">-</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-success bg-gray-100/10">-40%</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-success bg-secondary/5">-46%</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">Produits</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-gray-600 bg-gray-100/30">5 produits</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-gray-600 bg-gray-100/10">15 produits</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-secondary bg-secondary/5">Illimité</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">Images/produit</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-gray-600 bg-gray-100/30">2 images</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-gray-600 bg-gray-100/10">5 images</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-gray-600 bg-secondary/5">10 images</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">Mise en avant</td>
                    <td className="px-6 py-4 text-center text-xs text-red-500 bg-gray-100/30">❌</td>
                    <td className="px-6 py-4 text-center text-xs text-red-500 bg-gray-100/10">❌</td>
                    <td className="px-6 py-4 text-center text-xs font-black text-primary bg-secondary/5">3 produits</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">Statistiques</td>
                    <td className="px-6 py-4 text-center text-xs text-red-500 bg-gray-100/30">❌</td>
                    <td className="px-6 py-4 text-center text-xs text-success bg-gray-100/10">✅ Basiques</td>
                    <td className="px-6 py-4 text-center text-xs text-success bg-secondary/5 font-bold">✅ Avancées</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">Support</td>
                    <td className="px-6 py-4 text-center text-xs text-gray-500 bg-gray-100/30">Standard</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-gray-600 bg-gray-100/10">48h</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-gray-600 bg-secondary/5">24h</td>
                  </tr>
                  <tr className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">Messagerie</td>
                    <td className="px-6 py-4 text-center text-xs text-success bg-gray-100/30 font-bold">✅ Gratuite</td>
                    <td className="px-6 py-4 text-center text-xs text-success bg-gray-100/10 font-bold">✅ Gratuite</td>
                    <td className="px-6 py-4 text-center text-xs text-success bg-secondary/5 font-bold">✅ Gratuite</td>
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
