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
      period: '/à vie',
      description: 'L\'essentiel pour découvrir la plateforme et créer votre profil.',
      features: [
        'Profil entreprise basique',
        'Catalogue jusqu\'à 2 produits',
        'Messagerie limitée',
        'Accès visiteur prioritaire',
        'Badge "Nouveau Membre"'
      ],
      popular: false,
      color: 'bg-white text-primary',
      buttonText: 'Commencer Gratuitement',
      buttonAction: '/register'
    },
    {
      name: 'Standard',
      price: '15,000 DA',
      period: '/événement',
      description: 'Idéal pour les PME souhaitant une première présence virtuelle.',
      features: [
        'Stand virtuel personnalisable (2D)',
        'Catalogue jusqu\'à 20 produits',
        'Messagerie et prise de rendez-vous',
        'Accès aux appels d\'offres standard',
        'Support email prioritaire'
      ],
      popular: false,
      color: 'bg-white text-primary',
      buttonText: 'Choisir ce plan',
      buttonAction: '/contact'
    },
    {
      name: 'Premium Industriel',
      price: '45,000 DA',
      period: '/événement',
      description: 'La solution complète pour maximiser votre visibilité B2B.',
      features: [
        'Stand virtuel immersif (3D)',
        'Catalogue de produits illimité',
        'Visibilité sponsorisée dans les recherches',
        'Organisation de 3 webinaires',
        'Accès RFQ (Appels d\'offres exclusifs)',
        'Badge "Vendeur Vérifié"',
        'Account Manager dédié'
      ],
      popular: true,
      color: 'bg-primary text-white',
      buttonText: 'Contacter les ventes',
      buttonAction: '/contact'
    },
    {
      name: 'Enterprise',
      price: 'Sur Devis',
      period: '',
      description: 'Solutions sur-mesure pour les grandes entreprises et consortiums.',
      features: [
        'Pavillon complet multi-marques',
        'Intégration ERP & CRM sur-mesure',
        'Analytics avancés B2B',
        'Publicité ciblée sur toute la plateforme',
        'Modération prioritaire',
        'Support 24/7'
      ],
      popular: false,
      color: 'bg-white text-primary',
      buttonText: 'Parler à un expert',
      buttonAction: '/contact'
    }
  ];

  const buyerPlans = [
    {
      name: 'Visiteur Gratuit',
      price: '0 DA',
      period: '/à vie',
      description: 'Pour explorer le salon et consulter les catalogues.',
      features: [
        'Accès aux stands 2D et 3D',
        'Consultation des catalogues',
        'Favoris limités',
        'Prise de rendez-vous simple'
      ],
      popular: false,
      color: 'bg-white text-primary',
      buttonText: 'Créer un compte',
      buttonAction: '/register'
    },
    {
      name: 'Acheteur Pro',
      price: '10,000 DA',
      period: '/an',
      description: 'Pour les professionnels à la recherche de fournisseurs qualifiés.',
      features: [
        'Publication de RFQ limités (5/mois)',
        'Accès aux fiches fournisseurs',
        'Messagerie avancée',
        'Comparateur de produits B2B'
      ],
      popular: true,
      color: 'bg-primary text-white',
      buttonText: 'Devenir Acheteur Pro',
      buttonAction: '/register'
    },
    {
      name: 'Acheteur Premium',
      price: '25,000 DA',
      period: '/an',
      description: 'La meilleure solution pour les grandes équipes achats.',
      features: [
        'Publication de RFQ illimités',
        'Matching IA de fournisseurs',
        'Statistiques du marché',
        'Support dédié pour les achats',
        'Multi-comptes utilisateurs'
      ],
      popular: false,
      color: 'bg-white text-primary',
      buttonText: 'Accès Premium',
      buttonAction: '/contact'
    }
  ];

  return (
    <div className="pt-16 pb-20 bg-gray-50/50 min-h-screen relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full mb-8 border border-gray-100 shadow-sm"
          >
            <Award className="h-4 w-4 text-secondary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Tarification Transparente</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-primary tracking-tighter uppercase mb-6"
          >
            Nos Tarifs
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 font-medium max-w-2xl mx-auto text-lg"
          >
            Choisissez le plan qui correspond le mieux à vos objectifs de croissance et de visibilité sur le marché industriel algérien.
          </motion.p>
        </div>

        <div className="mb-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-primary tracking-tighter uppercase mb-4 flex items-center justify-center space-x-3">
              <span>Tarifs Exposants</span>
              <span className="text-secondary opacity-50">/</span>
              <span className="text-gray-400">Fournisseurs</span>
            </h2>
            <p className="text-gray-500 font-medium max-w-xl mx-auto">Solutions de visibilité premium pour présenter vos produits et services aux décideurs du secteur industriel.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                  <div className="mb-6">
                    <span className="text-4xl md:text-5xl font-black tracking-tighter leading-none">{plan.price}</span>
                    {plan.period && <span className="text-[10px] font-bold opacity-60 ms-2 uppercase tracking-widest block mt-2">{plan.period}</span>}
                  </div>
                  <p className="text-xs opacity-60 font-medium mb-8 border-b border-current/10 pb-8 min-h-[60px]">
                    {plan.description}
                  </p>
                  
                  <ul className="space-y-4 mb-12 text-start min-h-[280px]">
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

        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-primary tracking-tighter uppercase mb-4 flex items-center justify-center space-x-3">
              <span>Tarifs Acheteurs</span>
              <span className="text-secondary opacity-50">/</span>
              <span className="text-gray-400">Décideurs</span>
            </h2>
            <p className="text-gray-500 font-medium max-w-xl mx-auto">Des outils puissants pour explorer le marché, sourcer des fournisseurs qualifiés et lancer des appels d'offres.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {buyerPlans.map((plan, i) => (
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
                  <div className="mb-6">
                    <span className="text-4xl md:text-5xl font-black tracking-tighter leading-none">{plan.price}</span>
                    {plan.period && <span className="text-[10px] font-bold opacity-60 ms-2 uppercase tracking-widest block mt-2">{plan.period}</span>}
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
