import {
  CheckCircle2,
  ChevronDown, ChevronUp,
  Clock,
  Globe,
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
  Send
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { SUPPORT, TURNSTILE_SITE_KEY, telHref } from '../config/site';
import { ApiError } from '../lib/apiError';
import { useTranslation } from 'react-i18next';

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Réponses alignées sur le fonctionnement réel de la plateforme.
  const faqs = [1, 2, 3, 4].map((n) => ({ question: t(`contact.faq.q${n}`), answer: t(`contact.faq.a${n}`) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError(t('contact.captcha'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, captchaToken })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(data, 'contact.sendError');
      }
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
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
            {t('contact.titleStart')} <span className="text-secondary">{t('contact.titleHighlight')}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-primary-foreground/80 max-w-2xl mx-auto"
          >
            {t('contact.subtitle')}
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-primary mb-8 flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-secondary" />
                <span>{t('contact.details')}</span>
              </h3>
              
              <div className="space-y-8">
                {SUPPORT.phone && (
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/5 p-3 rounded-xl text-primary">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500 mb-1">{t('contact.phone')}</p>
                      <a href={telHref(SUPPORT.phone)} className="text-sm text-gray-700 font-medium hover:text-secondary">{SUPPORT.phone}</a>
                      <p className="text-xs text-gray-500 mt-1">{t('contact.phoneHours')}</p>
                    </div>
                  </div>
                )}

                {SUPPORT.email && (
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/5 p-3 rounded-xl text-primary">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500 mb-1">{t('contact.email')}</p>
                      <a href={`mailto:${SUPPORT.email}`} className="text-sm text-gray-700 font-medium hover:text-secondary">{SUPPORT.email}</a>
                      <p className="text-xs text-gray-500 mt-1">{t('contact.emailDelay')}</p>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-600 leading-relaxed">
                  {t('contact.fastest')}
                </p>
              </div>
            </div>

            {/* Support SLA Card */}
            <div className="bg-secondary p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute -end-4 -bottom-4 opacity-10">
                <Clock className="h-32 w-32" />
              </div>
              <h3 className="text-xl font-bold mb-4">{t('contact.priorityTitle')}</h3>
              <p className="text-white/80 text-sm mb-6 leading-relaxed">
                {t('contact.priorityText')}
              </p>
              <div className="flex items-center space-x-2 text-xs font-bold bg-white/10 p-3 rounded-xl">
                <Globe className="h-4 w-4" />
                <span>{t('contact.languages')}</span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg border border-gray-100 h-full">
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="bg-success/10 p-6 rounded-full text-success mb-6">
                    <CheckCircle2 className="h-16 w-16" />
                  </div>
                  <h2 className="text-3xl font-bold text-primary mb-4">{t('contact.sentTitle')}</h2>
                  <p className="text-gray-500 max-w-md mb-8">
                    {t('contact.sentText')}
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="btn-primary py-3 px-8 rounded-xl"
                  >
                    {t('contact.sendAnother')}
                  </button>
                </motion.div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-primary mb-8">{t('contact.formTitle')}</h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl">{error}</div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-bold text-gray-500 mb-2">{t('contact.name')}</label>
                        <input 
                          id="name"
                          type="text" 
                          required
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                          placeholder={t('contact.namePlaceholder')}
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-bold text-gray-500 mb-2">{t('contact.proEmail')}</label>
                        <input 
                          id="email"
                          type="email" 
                          required
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                          placeholder={t('auth.emailPlaceholder')}
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-bold text-gray-500 mb-2">{t('contact.subject')}</label>
                      <select 
                        id="subject"
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      >
                        <option value="">{t('contact.subjectSelect')}</option>
                        <option value="support">{t('contact.subjectSupport')}</option>
                        <option value="sales">{t('contact.subjectSales')}</option>
                        <option value="partnership">{t('contact.subjectPartnership')}</option>
                        <option value="other">{t('contact.subjectOther')}</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-bold text-gray-500 mb-2">{t('contact.message')}</label>
                      <textarea 
                        id="message"
                        required
                        minLength={10}
                        rows={6}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all resize-none"
                        placeholder={t('contact.messagePlaceholder')}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                      ></textarea>
                    </div>
                    {TURNSTILE_SITE_KEY && (
                      <div className="flex justify-center">
                        <Turnstile
                          siteKey={TURNSTILE_SITE_KEY}
                          onSuccess={(token) => setCaptchaToken(token)}
                          onError={() => setCaptchaToken(null)}
                          onExpire={() => setCaptchaToken(null)}
                        />
                      </div>
                    )}
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full btn-primary py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>{t('contact.submit')}</span>
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
              <span>{t('contact.faqTitle')}</span>
            </h2>
            <p className="text-gray-500">{t('contact.faqSubtitle')}</p>
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
                  {openFaq === index ? <ChevronUp className="h-5 w-5 text-secondary" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
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
