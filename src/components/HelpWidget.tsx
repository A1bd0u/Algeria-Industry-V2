import {
  ArrowRight,
  FileText,
  Headset,
  HelpCircle,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { SUPPORT, telHref, whatsappHref } from '../config/site';
import { useTranslation } from 'react-i18next';

// Assistance : FAQ, guides et coordonnées réelles (configurées par variables
// d'environnement). L'assistant IA est retiré du v1.
const HelpWidget = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const contactOptions = [
    SUPPORT.phone && { icon: Phone, label: t('help.call'), value: SUPPORT.phone, href: telHref(SUPPORT.phone) },
    SUPPORT.email && { icon: Mail, label: t('help.email'), value: SUPPORT.email, href: `mailto:${SUPPORT.email}` },
    SUPPORT.whatsapp && { icon: MessageCircle, label: t('help.whatsapp'), value: SUPPORT.whatsapp, href: whatsappHref(SUPPORT.whatsapp) },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string }[];

  return (
    <div className="hidden lg:block fixed bottom-8 end-8 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            role="dialog"
            aria-label={t('help.dialog')}
            className="absolute bottom-20 end-0 w-[calc(100vw-2rem)] max-w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="bg-primary p-8 text-white">
              <h3 className="text-2xl font-extrabold tracking-tight">{t('help.title')}</h3>
              <p className="text-sm text-gray-300 font-bold mt-1">
                {t('help.hours')}
              </p>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/faq"
                  onClick={() => setIsOpen(false)}
                  className="bg-neutral-bg p-4 rounded-2xl border border-gray-100 hover:border-secondary hover:bg-white transition-all"
                >
                  <HelpCircle className="h-5 w-5 text-secondary mb-2" />
                  <p className="text-sm font-semibold text-primary">{t('help.faq')}</p>
                </Link>
                <Link
                  to="/resources"
                  onClick={() => setIsOpen(false)}
                  className="bg-neutral-bg p-4 rounded-2xl border border-gray-100 hover:border-secondary hover:bg-white transition-all"
                >
                  <FileText className="h-5 w-5 text-secondary mb-2" />
                  <p className="text-sm font-semibold text-primary">{t('help.guides')}</p>
                </Link>
              </div>

              {contactOptions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-500 px-2">{t('help.direct')}</p>
                  {contactOptions.map((option) => (
                    <a
                      key={option.label}
                      href={option.href}
                      target={option.href.startsWith('https://') ? '_blank' : undefined}
                      rel={option.href.startsWith('https://') ? 'noopener noreferrer' : undefined}
                      className="flex items-center space-x-4 rtl:space-x-reverse p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-all"
                    >
                      <div className="bg-primary/5 p-2.5 rounded-xl text-primary">
                        <option.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-500 leading-none mb-1">{option.label}</p>
                        <p className="text-xs font-bold text-primary font-mono">{option.value}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 rtl:rotate-180" />
                    </a>
                  ))}
                </div>
              )}

              <Link
                to="/contact"
                onClick={() => setIsOpen(false)}
                className="block p-5 bg-secondary text-white rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold tracking-tight text-sm">{t('help.write')}</h4>
                    <p className="text-sm opacity-90 font-bold">{t('help.responseTime')}</p>
                  </div>
                  <Headset className="h-6 w-6" />
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? t('help.close') : t('help.open')}
        className={cn(
          "w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 relative group",
          isOpen ? "bg-white text-primary rotate-90" : "bg-secondary text-white hover:scale-110 active:scale-95"
        )}
      >
        {isOpen ? <X className="h-8 w-8" /> : <MessageSquare className="h-7 w-7 sm:h-8 sm:w-8" />}
      </button>
    </div>
  );
};

export default HelpWidget;
