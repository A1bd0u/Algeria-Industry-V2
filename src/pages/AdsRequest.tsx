import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Megaphone, Mail, Phone, Building, User, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { Turnstile } from '@marsidev/react-turnstile';
import { TURNSTILE_SITE_KEY } from '../config/site';

const AdsRequest = () => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<{
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    placement: string;
    message: string;
  }>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    placement: 'homepage_banner',
    message: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setErrorMessage(t('ads.captchaRequired'));
      setStatus('error');
      return;
    }
    setStatus('submitting');

    try {
      const res = await fetch('/api/campaigns/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, captchaToken })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '');
      }
      setStatus('success');
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        placement: 'homepage_banner',
        message: ''
      });
    } catch (err: any) {
      setErrorMessage(err.message || '');
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const adPlacements = [
    { id: 'homepage_banner', label: t('ads.placementHome'), price: t('common.onQuote') }
  ];

  return (
    <div className="bg-neutral-bg min-h-screen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-6">
            <Megaphone className="h-5 w-5" />
            <span className="font-bold text-sm tracking-widest">{t('ads.title')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter mb-6">
            {t('ads.heroTitle')}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t('ads.heroText')}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100"
        >
          {status === 'success' ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h3 className="text-2xl font-black text-primary mb-4">{t('ads.success')}</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {t('ads.successText')}
              </p>
              <button 
                onClick={() => setStatus('idle')}
                className="btn-primary py-4 px-8"
              >
                {t('ads.newRequest')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('ads.company_name')}</label>
                  <div className="relative">
                    <Building className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input 
                      type="text" 
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full ps-12 pe-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-primary focus:ring-0 transition-all outline-none"
                      placeholder={t('ads.companyPlaceholder')}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('ads.contact')}</label>
                  <div className="relative">
                    <User className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input 
                      type="text" 
                      name="contactName"
                      required
                      value={formData.contactName}
                      onChange={handleChange}
                      className="w-full ps-12 pe-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-primary focus:ring-0 transition-all outline-none"
                      placeholder={t('ads.contactPlaceholder')}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('ads.email')}</label>
                  <div className="relative">
                    <Mail className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input 
                      type="email" 
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full ps-12 pe-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-primary focus:ring-0 transition-all outline-none"
                      placeholder="email@entreprise.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('ads.phone')}</label>
                  <div className="relative">
                    <Phone className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full ps-12 pe-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-primary focus:ring-0 transition-all outline-none"
                      placeholder="+213 XX XX XX XX"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('ads.placement')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {adPlacements.map((placement) => (
                    <label 
                      key={placement.id}
                      className={cn(
                        "relative flex flex-col p-6 rounded-2xl border-2 cursor-pointer transition-all",
                        formData.placement === placement.id 
                          ? "border-secondary bg-secondary/5" 
                          : "border-gray-100 hover:border-gray-200 bg-white"
                      )}
                    >
                      <input 
                        type="radio" 
                        name="placement" 
                        value={placement.id}
                        checked={formData.placement === placement.id}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="font-bold text-primary mb-1">{placement.label}</span>
                      <span className="text-sm text-gray-500">{placement.price}</span>
                      
                      {formData.placement === placement.id && (
                        <div className="absolute top-4 end-4 text-secondary">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('ads.details')}</label>
                <textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-primary focus:ring-0 transition-all outline-none resize-none"
                  placeholder={t('ads.messagePlaceholder')}
                ></textarea>
              </div>

              <p className="text-xs text-gray-500">
                {t('ads.visualsNote')}
              </p>

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

              {status === 'error' && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start space-x-3 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>{errorMessage || t('ads.error_send')}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={status === 'submitting'}
                className="w-full btn-primary py-5 flex items-center justify-center space-x-3 disabled:opacity-70"
              >
                {status === 'submitting' ? (
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Megaphone className="h-5 w-5" />
                    <span>{t('ads.send_request')}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
        
        {/* Info Box */}
        <div className="mt-12 bg-white/50 border border-gray-200/50 p-6 rounded-2xl flex items-start space-x-4">
           <Info className="h-6 w-6 text-primary shrink-0 mt-1" />
           <div>
             <h4 className="font-bold text-primary mb-2">{t('ads.why_advertise')}</h4>
             <p className="text-sm text-gray-600 leading-relaxed">
               {t('ads.whyText')}
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdsRequest;
