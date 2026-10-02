import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, RefreshCw, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { Turnstile } from '@marsidev/react-turnstile';
import { useTranslation } from 'react-i18next';

export default function VerifyAccountModal() {
  const { t } = useTranslation();
  const { user, verifyCode, resendCode, logout } = useAuth();
  const [code, setCode] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  if (!user || user.emailVerified) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyCode(user.email, code);
    } catch (err: any) {
      setError(err.message || t('auth.verify.invalid'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!captchaToken) {
      setError(t('auth.verify.captchaResend'));
      return;
    }
    setResendMessage('');
    setError('');
    setResendLoading(true);
    try {
      await resendCode(user.email, captchaToken);
      setResendMessage(t('auth.verify.resent'));
    } catch (err: any) {
      setError(err.message || t('auth.verify.resendError'));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('auth.verify.dialogLabel')}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white max-w-lg w-full rounded-lg shadow-2xl overflow-hidden"
      >
        <div className="bg-secondary p-8 text-center relative overflow-hidden">
           <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
             <Smartphone className="h-8 w-8 text-white" />
           </div>
           <h2 className="text-2xl font-black text-white tracking-tighter mb-2">{t('auth.verify.title')}</h2>
           <p className="text-white/80 text-xs font-bold leading-relaxed tracking-widest">
              {t('auth.verify.subtitle')}
           </p>
        </div>

        <div className="p-8 space-y-6">
           <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-xs font-bold flex items-center border border-emerald-100 uppercase tracking-widest text-center justify-center">
             <Mail className="h-4 w-4 me-2" />
             {t('auth.verify.sentTo', { email: user.email })}
           </div>

           {error && (
             <div className="bg-red-50 text-red-500 p-4 text-xs font-bold border border-red-100 text-center uppercase">
                {error}
             </div>
           )}

           {resendMessage && (
             <div className="bg-blue-50 text-blue-500 p-4 text-xs font-bold border border-blue-100 text-center uppercase">
                {resendMessage}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-2">
                <label htmlFor="code_input" className="text-xs font-black text-gray-500 uppercase tracking-widest">{t('auth.verify.code')}</label>
                <input 
                  id="code_input"
                  type="text" 
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-gray-50 border border-gray-100 px-6 py-4 text-2xl tracking-wider font-mono text-center outline-none focus:border-secondary transition-all"
                  placeholder="000000"
                  required
                />
             </div>

             <div className="flex flex-col gap-4">
                <button 
                  type="submit" 
                  disabled={loading || code.length !== 6}
                  className="w-full bg-primary text-white py-5 flex items-center justify-center space-x-3 hover:bg-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="text-xs font-black uppercase tracking-widest flex items-center">
                    {loading ? t('auth.verify.submitting') : t('auth.verify.submit')}
                  </span>
                  {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform rtl:rotate-180" />}
                </button>
             </div>
           </form>

           <div className="flex flex-col space-y-4 pt-6 border-t border-gray-100">
             <div className="flex justify-center">
                {turnstileSiteKey ? (
                  <Turnstile
                    siteKey={turnstileSiteKey}
                    onSuccess={(token) => setCaptchaToken(token)}
                    onError={() => setCaptchaToken(null)}
                    onExpire={() => setCaptchaToken(null)}
                  />
                ) : (
                  <p className="text-red-500 text-xs font-bold">{t('auth.captchaMissingConfig')}</p>
                )}
             </div>

             <div className="flex items-center justify-between">
               <button 
                 onClick={handleResend} 
                 disabled={resendLoading}
                 className="text-xs font-black text-secondary hover:text-primary uppercase tracking-widest flex items-center transition-colors disabled:opacity-50"
               >
                 <RefreshCw className={`h-3 w-3 me-2 ${resendLoading ? 'animate-spin' : ''}`} />
                 {resendLoading ? t('auth.verify.resending') : t('auth.verify.resend')}
               </button>

               <button 
                 onClick={logout} 
                 className="text-xs font-black text-gray-500 hover:text-primary uppercase tracking-widest transition-colors"
               >
                 {t('auth.verify.logout')}
               </button>
             </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
