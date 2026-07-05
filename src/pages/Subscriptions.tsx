import {
  ArrowRight,
  Award,
  Building2,
  Calendar,
  Check,
  CreditCard,
  Download,
  History,
  Package,
  ShieldCheck,
  TrendingUp,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const Subscriptions = () => {
  const { i18n } = useTranslation();

  const plans = [
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
      current: false,
      color: 'bg-white text-primary border-gray-100'
    },
    {
      name: 'Standard',
      price: '15,000 DA',
      period: '/événement',
      description: 'Idéal pour les PME souhaitant une première présence virtuelle.',
      features: [
        'Stand virtuel personnalisable (2D)',
        'Catalogue jusqu\'à 10 produits',
        'Chat texte en direct',
        'Statistiques de base',
        '1 webinaire technique'
      ],
      current: false,
      color: 'bg-white text-primary border-gray-100'
    },
    {
      name: 'Premium',
      price: '45,000 DA',
      period: '/événement',
      description: 'Le choix le plus populaire pour maximiser votre impact.',
      features: [
        'Stand interactif 3D immersif',
        'Catalogue produits illimité',
        'Vidéo-conférence en direct',
        'Analyses comportementales avancées',
        '3 webinaires & Promotion réseaux sociaux',
        'Badge "Exposant Certifié"'
      ],
      current: true,
      color: 'bg-primary text-white border-primary shadow-2xl'
    },
    {
      name: 'Enterprise',
      price: 'Sur Devis',
      period: '',
      description: 'Solution sur mesure pour les grands groupes industriels.',
      features: [
        'Halle d\'exposition dédiée',
        'Intégration d\'outils CRM',
        'Support technique prioritaire 24/7',
        'Ateliers privés exclusifs',
        'Accès aux données Big Data sectorielles'
      ],
      current: false,
      color: 'bg-secondary text-white border-secondary'
    }
  ];

  const transactions = [
    { id: 'INV-2024-001', date: '15 Jan 2024', plan: 'Premium', amount: '45,000 DA', status: 'Payé' },
    { id: 'INV-2023-008', date: '12 Déc 2023', plan: 'Option 3D+', amount: '12,500 DA', status: 'Payé' },
    { id: 'INV-2023-002', date: '10 Nov 2023', plan: 'Acompte Salon', amount: '20,000 DA', status: 'Payé' },
  ];

  return (
    <div className={cn("min-h-screen bg-neutral-bg pb-20 pt-32", i18n.language === 'ar' && "font-arabic")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2 text-secondary mb-2"
              >
                <Award className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] font-sans">Espace Facturation</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-black text-primary uppercase tracking-tighter"
              >
                {i18n.language === 'ar' ? 'إدارة الاشتراكات' : 'Gestion des Abonnements'}
              </motion.h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-end hidden md:block">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Statut du compte</p>
                <div className="flex items-center space-x-2 justify-end">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-black text-primary uppercase">Premium Certifié</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-primary shadow-sm">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Current Plan Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-primary rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 end-0 p-12 opacity-10">
              <ShieldCheck className="w-64 h-64 -me-20 -mt-20" />
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl mb-8 border border-white/10 backdrop-blur-sm">
                <Zap className="h-4 w-4 text-secondary" />
                <span className="text-[10px] font-black uppercase tracking-widest tracking-tighter">Plan Actuel : Premium Industriel</span>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                  <h2 className="text-5xl font-black mb-4">45,000 DA</h2>
                  <p className="text-white/60 text-sm font-medium">Prochaine facturation : 15 Juillet 2024</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={(e) => { e.preventDefault(); window.scrollTo({top: window.innerHeight, behavior: 'smooth'}); }} className="px-8 py-4 bg-secondary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 transition-all text-center">
                    Changer de plan
                  </button>
                  <button onClick={(e) => { e.preventDefault(); alert("Êtes-vous sûr de vouloir annuler ? Cette action sera effective à la fin de votre cycle de facturation."); }} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs border border-white/20 hover:bg-white/20 transition-all text-center">
                    Annuler
                  </button>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-white/5">
                {[
                  { label: 'Stand 3D', value: 'Activé', icon: TrendingUp },
                  { label: 'Produits', value: 'Illimités', icon: Package },
                  { label: 'Webinaires', value: '3/3 Restants', icon: Calendar },
                  { label: 'Support', value: 'Priority', icon: ShieldCheck },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-bold text-white/40 uppercase mb-1">{item.label}</p>
                    <p className="text-xs font-black uppercase tracking-widest">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Payment Method */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl flex flex-col justify-between"
          >
            <div>
              <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">Mode de Règlement</h3>
              <div className="flex items-center space-x-4 mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-200">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black text-primary uppercase">CIB / Dahabia</p>
                  <p className="text-xs font-bold text-gray-400 mt-0.5">**** **** **** 4592</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Le prélèvement automatique sera effectué 24h avant la date d'expiration de votre événement.
              </p>
            </div>
            
            <button onClick={(e) => { e.preventDefault(); alert("Lancement de la passerelle de paiement..."); }} className="w-full mt-8 py-4 border-2 border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all text-center block">
              Modifier le mode de paiement
            </button>
          </motion.div>
        </div>

        {/* Available Plans */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-4">Mettre à niveau</h2>
            <h3 className="text-3xl font-black text-primary uppercase tracking-tighter">Plans Disponibles</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, i) => (
              <div 
                key={i} 
                className={cn(
                  "relative p-8 rounded-[40px] border flex flex-col items-center justify-between transition-all",
                  plan.color,
                  plan.current && "ring-4"
                )}
              >
                {plan.current && (
                  <div className="absolute -top-4 bg-secondary text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                    Plan Actuel
                  </div>
                )}
                
                <div className="w-full text-center">
                  <h4 className="text-xl font-black tracking-tighter uppercase mb-6">{plan.name}</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-black tracking-tighter leading-none">{plan.price}</span>
                    <span className="text-[10px] font-bold opacity-60 ms-2 uppercase tracking-widest">{plan.period}</span>
                  </div>
                  <p className="text-xs opacity-60 font-medium mb-8 border-b border-gray-100/10 pb-8 min-h-[60px]">
                    {plan.description}
                  </p>
                  
                  <ul className="space-y-4 mb-10 text-start">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-3 text-[11px] font-bold">
                        <Check className="h-4 w-4 text-secondary shrink-0" />
                        <span className="leading-tight opacity-70 italic">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button 
                  onClick={(e) => { e.preventDefault(); alert(plan.name === 'Enterprise' ? "Ouverture du formulaire de contact commercial..." : "Redirection vers le paiement..."); }}
                  disabled={plan.current}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all text-center block",
                    plan.current 
                      ? "bg-white/10 text-white/40 border border-white/10 cursor-not-allowed" 
                      : i === 0 
                        ? "bg-primary text-white" 
                        : i === 2 
                          ? "bg-white text-primary"
                          : "bg-secondary text-white"
                  )}
                >
                  {plan.current ? 'Déjà Actif' : plan.name === 'Enterprise' ? 'Contacter Commercial' : 'Sélectionner'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-8 md:p-12 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                <History className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-primary uppercase tracking-tight">Historique des Factures</h3>
            </div>
            <button onClick={(e) => { e.preventDefault(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['Factures'], {type: 'application/pdf'})); a.download = 'factures_all.pdf'; a.click(); }} className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] border-b-2 border-secondary/20 pb-1 hover:border-secondary transition-all">
              Télécharger Tout (ZIP)
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Facture #</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Montant</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                  <th className="px-8 py-6 text-end"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((t, i) => (
                  <tr key={i} className="hover:bg-neutral-bg transition-colors">
                    <td className="px-8 py-6 text-sm font-black text-primary">{t.id}</td>
                    <td className="px-8 py-6 text-xs font-bold text-gray-500">{t.date}</td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-tighter">{t.plan}</span>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-primary">{t.amount}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span className="text-[10px] font-black text-success uppercase">{t.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-end">
                      <button onClick={(e) => { e.preventDefault(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['Facture'], {type: 'application/pdf'})); a.download = 'facture.pdf'; a.click(); }} className="text-primary hover:text-secondary p-2 hover:bg-primary/5 rounded-lg transition-all inline-block">
                        <Download className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Need Help? */}
        <div className="mt-20 text-center">
          <div className="inline-flex flex-col items-center">
            <p className="text-xs font-bold text-gray-400 mb-4 italic">Vous avez une question sur votre facturation ?</p>
            <Link to="/contact" className="btn-secondary py-4 px-10 rounded-2xl flex items-center space-x-3">
              <span className="text-xs font-black uppercase tracking-widest">Contacter le Support PAIERIE</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
