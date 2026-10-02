import { Eye, EyeOff, Building2, Lock, Mail, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Turnstile } from '@marsidev/react-turnstile';
import { useTranslation } from 'react-i18next';

const loginSchema = z.object({
  email: z.string().email('auth.validation.emailInvalid'),
  password: z.string().min(1, 'auth.validation.passwordRequired'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { login, verifyMfa } = useAuth();
  // Deuxième étape : code de l'application d'authentification ou code de secours.
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Redirection interne uniquement (pas d'URL absolue ni protocol-relative).
  const rawRedirect = searchParams.get('redirect');
  const redirectUrl = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.startsWith('/\\') ? rawRedirect : null;

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const goToSpace = (loggedUser: { role: string }) => {
    if (loggedUser.role === 'admin') {
      navigate('/extranet');
    } else {
      navigate(redirectUrl || '/dashboard');
    }
  };

  const onSubmitMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    try {
      goToSpace(await verifyMfa(mfaCode.trim()));
    } catch (err: any) {
      if (err.code === 'MFA_CHALLENGE_EXPIRED') {
        setMfaStep(false);
        setMfaCode('');
      }
      setAuthError(err.message || t('auth.mfa.invalid'));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    if (!captchaToken) {
      setAuthError(t('auth.captchaRequired'));
      return;
    }
    setIsLoading(true);
    setAuthError('');
    
    try {
      const loggedUser = await login(data.email, data.password, captchaToken);
      if (!loggedUser) {
        setMfaStep(true);
        return;
      }
      goToSpace(loggedUser);
    } catch (err: any) {
      setAuthError(err.message || t('auth.login.invalid'));
    } finally {
      setIsLoading(false);
    }
  };

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-neutral-bg px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-primary">{t('auth.login.title')}</h2>
            <p className="text-gray-500 mt-2">{t('auth.login.subtitle')}</p>
          </div>

          {mfaStep ? (
            <form onSubmit={onSubmitMfa} className="space-y-6">
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl" role="alert">
                  {authError}
                </div>
              )}
              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl">
                <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                <p className="text-sm text-gray-600">
                  {useRecovery ? t('auth.mfa.introRecovery') : t('auth.mfa.intro')}
                </p>
              </div>
              <div>
                <label htmlFor="mfa-code" className="block text-sm font-semibold text-gray-700 mb-2">
                  {useRecovery ? t('auth.mfa.recoveryCode') : t('auth.mfa.code')}
                </label>
                <input
                  id="mfa-code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  inputMode={useRecovery ? 'text' : 'numeric'}
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={useRecovery ? 9 : 6}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl font-mono tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder={useRecovery ? 'xxxx-xxxx' : '000000'}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || mfaCode.trim().length < 6}
                className="w-full btn-primary py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>{t('auth.mfa.submit')}</span>}
              </button>
              <div className="flex justify-between text-xs font-bold">
                <button type="button" className="text-secondary hover:underline" onClick={() => { setUseRecovery(!useRecovery); setMfaCode(''); setAuthError(''); }}>
                  {useRecovery ? t('auth.mfa.useApp') : t('auth.mfa.useRecovery')}
                </button>
                <button type="button" className="text-gray-500 hover:underline" onClick={() => { setMfaStep(false); setMfaCode(''); setAuthError(''); }}>
                  {t('auth.mfa.back')}
                </button>
              </div>
            </form>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl animate-in fade-in zoom-in duration-300">
                {authError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                <input 
                  id="email"
                  type="text"
                  {...register('email')}
                  className={`w-full ps-10 pe-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{t(errors.email.message || '')}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700">{t('auth.password')}</label>
                <Link to="/forgot-password" className="text-xs font-bold text-secondary hover:underline">
                  {t('auth.login.forgot')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  className={`w-full ps-10 pe-12 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{t(errors.password.message || '')}</p>}
            </div>

            <div className="flex items-center">
              <input type="checkbox" id="remember" className="rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="remember" className="ms-2 text-sm text-gray-600">{t('auth.login.remember')}</label>
            </div>

            <div className="flex justify-center my-4">
              {turnstileSiteKey ? (
                <Turnstile
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onError={() => setCaptchaToken(null)}
                  onExpire={() => setCaptchaToken(null)}
                />
              ) : (
                <p className="text-red-500 text-sm font-bold">{t('auth.captchaMissingConfig')}</p>
              )}
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t('auth.login.submitting')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.login.submit')}</span>
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>
          )}

        </div>
        
        <div className="bg-gray-50 p-6 text-center border-t border-gray-100 space-y-4">
          <p className="text-sm text-gray-600">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="font-bold text-secondary hover:underline">
              {t('auth.login.registerFree')}
            </Link>
          </p>
          <div className="pt-4 border-t border-gray-200">
             <Link to="/extranet" className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-primary transition-all">
                {t('auth.login.proConsole')}
             </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
