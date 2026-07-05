import {
  CheckCircle2,
  ChevronDown, ChevronUp,
  Clock,
  Facebook,
  Globe,
  HelpCircle,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Twitter
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: "Comment inscrire mon entreprise sur l'annuaire ?",
      answer: "C'est très simple ! Cliquez sur 'S'inscrire', choisissez le profil 'Fournisseur' et remplissez les informations de votre entreprise. Après validation par nos modérateurs, votre fiche sera visible publiquement."
    },
    {
      question: "Quels sont les avantages du compte Premium ?",
      answer: "Le compte Premium vous offre une visibilité prioritaire, l'accès aux appels d'offres privés, des statistiques détaillées sur vos produits et un support prioritaire sous 24h."
    },
    {
      question: "Comment répondre à un appel d'offres ?",
      answer: "Une fois connecté, rendez-vous sur la page 'Appels d'offres', sélectionnez l'offre qui vous intéresse et cliquez sur 'Répondre'. Vous pourrez alors déposer votre devis au format PDF."
    },
    {
      question: "La plateforme est-elle disponible en dehors de l'Algérie ?",
      answer: "Oui, Algeria Industry a pour vocation de connecter l'industrie algérienne au monde entier. La plateforme est bilingue (Français/Anglais) pour faciliter les échanges internationaux."
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="bg-neutral-bg min-h-screen pb-20">
      {/* Hero Section */}
      <section className="bg-primary py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold mb-6"
          >
            Contactez <span className="text-secondary">l'équipe</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-primary-foreground/80 max-w-2xl mx-auto"
          >
            Une question ? Un besoin d'accompagnement ? Nous sommes là pour vous aider à développer votre activité industrielle.
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-primary mb-8 flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-secondary" />
                <span>Nos coordonnées</span>
              </h3>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/5 p-3 rounded-xl text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Adresse</p>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                      Cité des Affaires, Bab Ezzouar,<br />Alger, Algérie
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary/5 p-3 rounded-xl text-primary">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Téléphone</p>
                    <p className="text-sm text-gray-700 font-medium">+213 (0) 21 XX XX XX</p>
                    <p className="text-xs text-gray-400 mt-1">Lun - Jeu, 08:30 - 16:30</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary/5 p-3 rounded-xl text-primary">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email</p>
                    <p className="text-sm text-gray-700 font-medium">contact@algeria-industry.dz</p>
                    <p className="text-xs text-gray-400 mt-1">Réponse sous 48h maximum</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100">
                <p className="text-sm font-bold text-primary mb-4">Suivez-nous</p>
                <div className="flex space-x-4">
                  <a href="#" onClick={(e) => e.preventDefault()} className="bg-gray-50 p-3 rounded-xl text-gray-400 hover:bg-primary hover:text-white transition-all"><Linkedin className="h-5 w-5" /></a>
                  <a href="#" onClick={(e) => e.preventDefault()} className="bg-gray-50 p-3 rounded-xl text-gray-400 hover:bg-primary hover:text-white transition-all"><Facebook className="h-5 w-5" /></a>
                  <a href="#" onClick={(e) => e.preventDefault()} className="bg-gray-50 p-3 rounded-xl text-gray-400 hover:bg-primary hover:text-white transition-all"><Twitter className="h-5 w-5" /></a>
                </div>
              </div>
            </div>

            {/* Support SLA Card */}
            <div className="bg-secondary p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute -end-4 -bottom-4 opacity-10">
                <Clock className="h-32 w-32" />
              </div>
              <h3 className="text-xl font-bold mb-4">Support Premium</h3>
              <p className="text-white/80 text-sm mb-6 leading-relaxed">
                Les abonnés Premium bénéficient d'un support dédié avec une garantie de réponse en moins de 24 heures ouvrées.
              </p>
              <div className="flex items-center space-x-2 text-xs font-bold bg-white/10 p-3 rounded-xl">
                <Globe className="h-4 w-4" />
                <span>Support disponible en FR / EN / AR</span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-lg border border-gray-100 h-full">
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="bg-success/10 p-6 rounded-full text-success mb-6">
                    <CheckCircle2 className="h-16 w-16" />
                  </div>
                  <h2 className="text-3xl font-bold text-primary mb-4">Message envoyé !</h2>
                  <p className="text-gray-500 max-w-md mb-8">
                    Merci de nous avoir contactés. Notre équipe reviendra vers vous dans les plus brefs délais.
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="btn-primary py-3 px-8 rounded-xl"
                  >
                    Envoyer un autre message
                  </button>
                </motion.div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-primary mb-8">Envoyez-nous un message</h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nom complet</label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                          placeholder="Ex: Ahmed Benali"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email professionnel</label>
                        <input 
                          type="email" 
                          required
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                          placeholder="email@entreprise.dz"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sujet</label>
                      <select 
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      >
                        <option value="">Sélectionnez un sujet</option>
                        <option value="support">Support technique</option>
                        <option value="sales">Service commercial / Premium</option>
                        <option value="partnership">Partenariat</option>
                        <option value="other">Autre demande</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message</label>
                      <textarea 
                        required
                        rows={6}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all resize-none"
                        placeholder="Comment pouvons-nous vous aider ?"
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full btn-primary py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>Envoyer le message</span>
                          <Send className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-24 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4 flex items-center justify-center space-x-3">
              <HelpCircle className="h-8 w-8 text-secondary" />
              <span>Foire Aux Questions</span>
            </h2>
            <p className="text-gray-500">Trouvez des réponses rapides aux questions les plus fréquentes.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 text-start flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-primary">{faq.question}</span>
                  {openFaq === index ? <ChevronUp className="h-5 w-5 text-secondary" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;
