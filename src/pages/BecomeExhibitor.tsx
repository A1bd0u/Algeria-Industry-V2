import {
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle2,
  Globe,
  Layers, Megaphone,
  MessageSquare,
  ShieldCheck,
  Star,
  Target,
  Users,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const BecomeExhibitor = () => {
  const benefits = [
    { 
      icon: Users, 
      title: "Audience Ciblée", 
      desc: "Accédez à plus de 50,000 décideurs industriels et acheteurs qualifiés chaque mois." 
    },
    { 
      icon: Globe, 
      title: "Visibilité 24/7", 
      desc: "Votre stand est accessible partout en Algérie et à l'international, sans interruption." 
    },
    { 
      icon: BarChart3, 
      title: "Analytiques Précis", 
      desc: "Suivez en temps réel qui visite votre stand, quels produits les intéressent et collectez des leads." 
    },
    { 
      icon: MessageSquare, 
      title: "Interaction Directe", 
      desc: "Chattez en vidéo ou par texte avec vos prospects directement depuis votre interface." 
    }
  ];

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '0 DA',
      period: '/à vie',
      desc: 'L\'essentiel pour découvrir la plateforme et créer votre profil.',
      features: [
        'Profil entreprise basique',
        'Catalogue jusqu\'à 2 produits',
        'Messagerie limitée',
        'Accès visiteur prioritaire',
        'Badge "Nouveau Membre"'
      ],
      color: 'bg-white',
      textColor: 'text-primary'
    },
    {
      id: 'standard',
      name: 'Standard',
      price: '15,000 DA',
      period: '/événement',
      desc: 'Idéal pour les PME souhaitant une première présence virtuelle.',
      features: [
        'Stand virtuel personnalisable (2D)',
        'Catalogue jusqu\'à 10 produits',
        'Chat texte en direct',
        'Statistiques de base',
        '1 webinaire technique'
      ],
      color: 'bg-gray-50',
      textColor: 'text-primary'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '45,000 DA',
      period: '/événement',
      desc: 'Le choix le plus populaire pour maximiser votre impact.',
      features: [
        'Stand interactif 3D immersif',
        'Catalogue produits illimité',
        'Vidéo-conférence en direct',
        'Analyses comportementales avancées',
        '3 webinaires & Promotion réseaux sociaux',
        'Badge "Exposant Certifié"'
      ],
      color: 'bg-primary',
      textColor: 'text-white',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Sur Devis',
      period: '',
      desc: 'Solution sur mesure pour les grands groupes industriels.',
      features: [
        'Halle d\'exposition dédiée',
        'Intégration d\'outils CRM',
        'Support technique prioritaire 24/7',
        'Ateliers privés exclusifs',
        'Accès aux données Big Data sectorielles'
      ],
      color: 'bg-secondary',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="bg-neutral-bg min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden bg-primary text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 bg-secondary text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-8">
              Devenez Exposant Officiel
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight uppercase tracking-tight">
              Boostez votre visibilité <span className="text-secondary">industrielle</span>
            </h1>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Rejoignez le premier salon virtuel d'Algérie. Présentez vos innovations, connectez-vous avec des acheteurs et développez votre réseau sans limites géographiques.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto btn-secondary px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl"
              >
                Réserver mon stand
              </button>
              <button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                Voir la démo 3D
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-4">Pourquoi exposer ?</h2>
          <h3 className="text-3xl font-black text-primary uppercase tracking-tight">L'avantage du virtuel</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                <benefit.icon className="h-7 w-7" />
              </div>
              <h4 className="text-lg font-black text-primary uppercase mb-3">{benefit.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing / Plans */}
      <section id="plans" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-4">Nos Formules</h2>
            <h3 className="text-3xl font-black text-primary uppercase tracking-tight">Choisissez votre impact</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ y: -10 }}
                className={cn(
                  "relative p-10 rounded-2xl border flex flex-col",
                  plan.color,
                  plan.textColor,
                  plan.popular ? "shadow-2xl scale-105 z-10 border-transparent" : "border-gray-200"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 start-1/2 -translate-x-1/2 bg-secondary text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-current" />
                    <span>Recommandé</span>
                  </div>
                )}
                
                <div className="mb-8">
                  <h4 className="text-xl font-black uppercase tracking-widest mb-4">{plan.name}</h4>
                  <div className="flex items-baseline mb-2">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-xs opacity-60 ms-2">{plan.period}</span>
                  </div>
                  <p className="text-xs opacity-70 leading-relaxed">{plan.desc}</p>
                </div>
                
                <div className="flex-1 space-y-4 mb-10">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <CheckCircle2 className={cn("h-5 w-5 flex-shrink-0", plan.popular ? "text-secondary" : "text-secondary")} />
                      <span className="text-xs font-medium leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link 
                  to="/register?role=fournisseur&type=exhibitor"
                  className={cn(
                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-center transition-all",
                    plan.popular ? "bg-secondary text-white hover:bg-white hover:text-primary" : "bg-primary text-white hover:bg-secondary"
                  )}
                >
                  Choisir ce plan
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Steps */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-12 md:p-20 shadow-2xl border border-gray-100 overflow-hidden relative">
          
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-primary uppercase tracking-tight mb-12 text-center md:text-start">
              Comment ça marche ?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { step: "01", icon: Layers, title: "Configurez votre stand", desc: "Choisissez votre modèle de stand, uploadez votre logo et personnalisez les couleurs." },
                { step: "02", icon: Megaphone, title: "Importez vos produits", desc: "Remplissez votre catalogue avec photos, fiches techniques et vidéos." },
                { step: "03", icon: Target, title: "Interagissez & Vendez", desc: "Accueillez les visiteurs en direct et récoltez des leads qualifiés via votre tableau de bord." }
              ].map((step, i) => (
                <div key={i} className="relative">
                  <div className="flex items-center mb-6">
                    <span className="text-5xl font-black text-gray-100 absolute -top-4 -start-4">{step.step}</span>
                    <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center relative z-10">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 h-[1px] bg-gray-100 ms-4 hidden md:block" />
                  </div>
                  <h4 className="text-lg font-black text-primary uppercase mb-2">{step.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-24 bg-primary text-center">
        <div className="max-w-xl mx-auto px-4">
          <Award className="h-16 w-16 text-secondary mx-auto mb-8" />
          <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-6">
            Prenez votre place parmi les leaders
          </h2>
          <p className="text-gray-300 mb-10 leading-relaxed">
            Ne laissez pas vos concurrents prendre toute la place. L'industrie de demain se construit aujourd'hui, sur Algeria Industry.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-start">
              <ShieldCheck className="h-8 w-8 text-secondary mb-4" />
              <h4 className="text-sm font-black text-white uppercase mb-2">Exposition Certifiée</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Membre vérifié de la plateforme</p>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-start">
              <Zap className="h-8 w-8 text-secondary mb-4" />
              <h4 className="text-sm font-black text-white uppercase mb-2">Setup Express</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Mise en ligne en moins de 24h</p>
            </div>
          </div>
          <button className="w-full mt-12 btn-secondary py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center space-x-4" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
            <span>Démarrer mon inscription</span>
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default BecomeExhibitor;
