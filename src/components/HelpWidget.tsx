import {
  ArrowRight,
  FileText,
  Headset,
  HelpCircle,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const HelpWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'support' | 'ai'>('support');
  const [aiMessage, setAiMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: "Bonjour ! Je suis l'assistant AI d'Algeria Industry. Comment puis-je vous aider dans votre recherche de partenaires industriels aujourd'hui ?" }
  ]);

  const handleAiSend = () => {
    if (!aiMessage.trim()) return;
    const newHistory = [...chatHistory, { role: 'user', text: aiMessage }];
    setChatHistory(newHistory);
    setAiMessage('');
    
    // Simulate AI response
    setTimeout(() => {
      setChatHistory([...newHistory, { role: 'ai', text: "Je recherche les meilleurs fournisseurs correspondants à votre demande dans notre base de données..." }]);
    }, 1000);
  };

  const contactOptions = [
    { icon: Phone, label: "Appeler le support", value: "+213 (0) 21 XX XX XX", href: "tel:+21321000000" },
    { icon: Mail, label: "Envoyer un email", value: "support@algeria-industry.dz", href: "mailto:support@algeria-industry.dz" },
    { icon: MessageCircle, label: "WhatsApp Business", value: "+213 (0) 770 XX XX XX", href: "#" },
  ];

  return (
    <div className="fixed bottom-8 end-8 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 end-0 w-[380px] bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-8 text-white relative overflow-hidden">
               <div className="relative z-10">
                 <div className="flex items-center space-x-2 text-secondary mb-2">
                    <span className="w-2 h-2 bg-success rounded-full animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Support en ligne</span>
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Besoin d'aide ?</h3>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1 opacity-80">
                   Experts techniques disponibles 08:30 - 16:30
                 </p>
               </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-50 p-2">
              <button 
                onClick={() => setActiveTab('support')}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl",
                  activeTab === 'support' ? "bg-white text-primary shadow-sm" : "text-gray-400"
                )}
              >
                Support Technique
              </button>
              <button 
                onClick={() => setActiveTab('ai')}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl flex items-center justify-center space-x-2",
                  activeTab === 'ai' ? "bg-white text-secondary shadow-sm" : "text-gray-400"
                )}
              >
                <Sparkles className="h-3 w-3" />
                <span>Assistant AI</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
              {activeTab === 'support' ? (
                <>
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link 
                      to="/faq" 
                      onClick={() => setIsOpen(false)}
                      className="bg-neutral-bg p-4 rounded-2xl border border-gray-100 hover:border-secondary hover:bg-white transition-all group"
                    >
                      <HelpCircle className="h-5 w-5 text-secondary mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">F.A.Q</p>
                    </Link>
                    <Link 
                      to="/resources" 
                      onClick={() => setIsOpen(false)}
                      className="bg-neutral-bg p-4 rounded-2xl border border-gray-100 hover:border-secondary hover:bg-white transition-all group"
                    >
                      <FileText className="h-5 w-5 text-secondary mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Guides</p>
                    </Link>
                  </div>

                  {/* Contact Options */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-2">Assistance Directe</p>
                    {contactOptions.map((option, i) => (
                      <a 
                        key={i}
                        href={option.href}
                        className="flex items-center space-x-4 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-all"
                      >
                        <div className="bg-primary/5 p-2.5 rounded-xl text-primary">
                           <option.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                            {option.label}
                          </p>
                          <p className="text-xs font-bold text-primary font-mono">{option.value}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300 rtl:rotate-180" />
                      </a>
                    ))}
                  </div>

                  {/* Specialized Support */}
                  <Link 
                    to="/contact" 
                    onClick={() => setIsOpen(false)}
                    className="block p-5 bg-secondary text-white rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-black uppercase tracking-tight text-sm">Assistance Premium</h4>
                        <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Pour les comptes entreprises</p>
                      </div>
                      <Headset className="h-6 w-6" />
                    </div>
                  </Link>
                </>
              ) : (
                <div className="flex flex-col h-full min-h-[400px]">
                  <div className="flex-1 space-y-4">
                    {chatHistory.map((msg, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: msg.role === 'ai' ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "p-4 rounded-2xl text-xs font-medium",
                          msg.role === 'ai' ? "bg-primary/5 text-primary self-start rounded-tl-none" : "bg-secondary text-white self-end rounded-tr-none ms-12"
                        )}
                      >
                        {msg.text}
                      </motion.div>
                    ))}
                  </div>
                  <div className="pt-6 relative">
                    <input 
                      type="text" 
                      placeholder="Comment trouver un fournisseur d'acier ?"
                      className="w-full ps-4 pe-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-bold outline-none focus:border-secondary transition-all"
                      value={aiMessage}
                      onChange={(e) => setAiMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAiSend()}
                    />
                    <button 
                      onClick={handleAiSend}
                      className="absolute end-4 top-1/2 -translate-y-1/2 text-secondary hover:scale-110 transition-all"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Algeria Industry Technical Support Registry
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 relative group",
          isOpen ? "bg-white text-primary rotate-90" : "bg-secondary text-white hover:scale-110 active:scale-95"
        )}
      >
        {isOpen ? (
          <X className="h-8 w-8" />
        ) : (
          <>
            <MessageSquare className="h-8 w-8" />
            <span className="absolute -top-1 -end-1 w-5 h-5 bg-error text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-neutral-bg animate-bounce">
              1
            </span>
          </>
        )}
        
        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute end-20 bg-primary px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Une question ? Chattez avec nous
          </div>
        )}
      </button>
    </div>
  );
};

export default HelpWidget;
