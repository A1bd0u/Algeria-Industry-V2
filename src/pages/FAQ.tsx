import {
  ChevronDown,
  HelpCircle,
  Mail,
  Phone,
  Search
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

const FAQ = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [search, setSearch] = useState('');

  const faqs = [
    {
      category: 'Général',
      questions: [
        { 
          q: "Comment fonctionne le salon virtuel ?", 
          a: "Notre salon virtuel utilise une interface immersive 2.5D qui vous permet de naviguer entre différents halls thématiques. Vous pouvez cliquer sur un stand pour voir les machines en détail, télécharger des catalogues et discuter en direct avec les exposants." 
        },
        { 
          q: "Le site est-il gratuit pour les visiteurs ?", 
          a: "Oui, l'accès au catalogue et la visite du salon virtuel sont totalement gratuits pour tous les professionnels. Une inscription est toutefois nécessaire pour contacter les exposants ou sauvegarder des favoris." 
        }
      ]
    },
    {
      category: 'Exposants',
      questions: [
        { 
          q: "Comment ajouter mes produits au catalogue ?", 
          a: "Une fois votre abonnement Premium ou Business activé, rendez-vous dans votre Dashboard section 'Mes Produits'. Vous pourrez y importer vos fiches techniques et photos." 
        },
        { 
          q: "Quelles sont les options de paiement ?", 
          a: "Nous acceptons les virements bancaires, chèques et bientôt le paiement électronique par CIB/Edahabia pour une activation instantanée des packs." 
        }
      ]
    },
    {
      category: 'Sécurité',
      questions: [
        { 
          q: "Comment sont protégées mes données de devis ?", 
          a: "Toutes les communications entre acheteurs et vendeurs sont cryptées de bout en bout. Seul l'exposant concerné a accès aux détails de votre demande." 
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.q.toLowerCase().includes(search.toLowerCase()) || 
      q.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className={cn("min-h-screen bg-neutral-bg pt-32 pb-20", i18n.language === 'ar' && "font-arabic")}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-2 text-secondary mb-4"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Support Industriel</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-primary uppercase tracking-tighter mb-8 leading-none">
            Questions <span className="text-secondary">Fréquentes</span>
          </h1>
          
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute start-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher une solution..."
              className="w-full ps-16 pe-8 py-5 bg-white rounded-xl border border-gray-100 shadow-xl focus:outline-none focus:border-secondary transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-12">
          {filteredFaqs.map((cat, catIdx) => (
            <section key={catIdx}>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 px-4">{cat.category}</h2>
              <div className="space-y-4">
                {cat.questions.map((item, idx) => {
                  const globalIdx = catIdx * 10 + idx;
                  const isOpen = openIndex === globalIdx;
                  
                  return (
                    <motion.div 
                      key={idx}
                      className={cn(
                        "bg-white rounded-xl border transition-all overflow-hidden",
                        isOpen ? "border-secondary shadow-lg" : "border-gray-100"
                      )}
                    >
                      <button 
                        onClick={() => setOpenIndex(isOpen ? null : globalIdx)}
                        className="w-full px-8 py-6 flex items-center justify-between text-start group"
                      >
                        <span className={cn(
                          "text-base font-bold transition-colors uppercase tracking-tight",
                          isOpen ? "text-secondary" : "text-primary group-hover:text-secondary"
                        )}>
                          {item.q}
                        </span>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                          isOpen ? "bg-secondary text-white rotate-180" : "bg-gray-50 text-gray-400"
                        )}>
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-8 pb-6"
                          >
                            <p className="text-gray-500 font-medium leading-relaxed border-t border-gray-50 pt-6">
                              {item.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Support CTA */}
        <div className="mt-20 bg-primary rounded-2xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%, transparent 50%, #fff 50%, #fff 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10 text-center md:text-start">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Besoin d'aide personnalisée ?</h3>
            <p className="text-white/60 font-medium text-sm">Nos experts industriels sont à votre disposition.</p>
          </div>
          <div className="relative z-10 flex flex-wrap justify-center gap-4">
             <button className="flex items-center space-x-3 bg-secondary px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                <Phone className="h-4 w-4" />
                <span>Appel Expert</span>
             </button>
             <button className="flex items-center space-x-3 bg-white/10 border border-white/20 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all" onClick={(e) => { e.preventDefault(); alert("Fonctionnalité en cours de développement"); }}>
                <Mail className="h-4 w-4" />
                <span>Envoyer Ticket</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
