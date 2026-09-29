import { ArrowRight, Briefcase, Building2, CheckCircle2, Loader2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Turnstile } from '@marsidev/react-turnstile';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { useTranslation } from 'react-i18next';

const registerSchema = z.object({
  // Les messages sont des clés de traduction, résolues à l'affichage.
  firstName: z.string().min(2, 'auth.validation.firstNameShort'),
  lastName: z.string().min(2, 'auth.validation.lastNameShort'),
  companyName: z.string().min(2, 'auth.validation.companyRequired'),
  email: z.string().email('auth.validation.emailInvalid'),
  password: z.string()
    .min(10, 'auth.validation.passwordMin')
    .regex(/[a-zA-Z]/, 'auth.validation.passwordLetter')
    .regex(/[0-9]/, 'auth.validation.passwordDigit'),
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role');
  const validInitialRole = (initialRole === 'acheteur' || initialRole === 'fournisseur') ? initialRole : null;
  
  const [role, setRole] = useState<'acheteur' | 'fournisseur' | null>(validInitialRole);
  const [step, setStep] = useState(validInitialRole ? 2 : 1);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });
  
  const passwordValue = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    if (!captchaToken) {
      setAuthError(t('auth.captchaRequired'));
      return;
    }
    setIsLoading(true);
    setAuthError('');
    
    try {
      await registerAuth({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        company: data.companyName,
        role: role as any,
        password: data.password,
        captchaToken: captchaToken
      });
      navigate('/register-success', { state: { email: data.email.trim().toLowerCase() } });
    } catch (err: any) {
      setAuthError(err.message || t('auth.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-bg px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row"
      >
        <div className="md:w-5/12 bg-primary p-8 text-white hidden md:flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 end-0 p-12 opacity-10">
            <ShieldCheck className="w-64 h-64" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-6">{t('auth.register.asideTitle')}</h2>
            <div className="space-y-6 mt-12">
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{t('auth.register.benefitTendersTitle')}</h4>
                  <p className="text-primary-100 text-sm mt-1">{t('auth.register.benefitTendersText')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{t('auth.register.benefitVisibilityTitle')}</h4>
                  <p className="text-primary-100 text-sm mt-1">{t('auth.register.benefitVisibilityText')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{t('auth.register.benefitNetworkTitle')}</h4>
                  <p className="text-primary-100 text-sm mt-1">{t('auth.register.benefitNetworkText')}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 mt-12">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center bg-white text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-primary-100 mt-3 font-medium">{t('auth.register.kycBadge')}</p>
          </div>
        </div>

        <div className="md:w-7/12 p-8 md:p-12">
          <div className="max-w-md mx-auto">
            {step === 1 ? (
              <div className="animate-in slide-in-from-right duration-500">
                <h3 className="text-2xl font-bold text-primary mb-2">{t('auth.register.chooseTitle')}</h3>
                <p className="text-gray-500 mb-8">{t('auth.register.chooseText')}</p>

                <div className="space-y-4">
                  <button
                    onClick={() => setRole('acheteur')}
                    className={cn(
                      "w-full p-6 rounded-2xl border-2 text-start transition-all",
                      role === 'acheteur' 
                        ? "border-primary bg-primary/5" 
                        : "border-gray-100 hover:border-primary/30 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "p-3 rounded-xl",
                          role === 'acheteur' ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                        )}>
                          <Briefcase className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{t('auth.register.buyerTitle')}</h4>
                          <p className="text-sm text-gray-500 mt-1">{t('auth.register.buyerText')}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                        role === 'acheteur' ? "border-primary bg-primary" : "border-gray-300"
                      )}>
                        {role === 'acheteur' && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setRole('fournisseur')}
                    className={cn(
                      "w-full p-6 rounded-2xl border-2 text-start transition-all",
                      role === 'fournisseur' 
                        ? "border-secondary bg-secondary/5" 
                        : "border-gray-100 hover:border-secondary/30 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "p-3 rounded-xl",
                          role === 'fournisseur' ? "bg-secondary text-white" : "bg-gray-100 text-gray-500"
                        )}>
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{t('auth.register.supplierTitle')}</h4>
                          <p className="text-sm text-gray-500 mt-1">{t('auth.register.supplierText')}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                        role === 'fournisseur' ? "border-secondary bg-secondary" : "border-gray-300"
                      )}>
                        {role === 'fournisseur' && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                    </div>
                  </button>
                </div>

                <button 
                  onClick={() => setStep(2)}
                  disabled={!role}
                  className="w-full btn-primary mt-8 py-4 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{t('auth.register.continue')}</span>
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                </button>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right duration-500">
                <button onClick={() => setStep(1)} className="text-xs font-bold text-gray-400 hover:text-primary mb-4 flex items-center space-x-1">
                  <ArrowRight className="h-3 w-3 rotate-180 rtl:rotate-180" />
                  <span>{t('auth.register.backToProfile')}</span>
                </button>
                <h3 className="text-2xl font-bold text-primary mb-6">{t('auth.register.formTitle')}</h3>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {authError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl animate-in fade-in duration-300">
                      {authError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="lastName" className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">{t('auth.register.lastName')}</label>
                      <input 
                        id="lastName"
                        type="text"
                        {...register('lastName')}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 ${errors.lastName ? 'border-red-400' : 'border-gray-200'}`}
                        placeholder={t('auth.register.lastName')}
                      />
                      {errors.lastName && <p className="text-red-500 text-[10px] mt-1 font-medium">{t(errors.lastName.message || '')}</p>}
                    </div>
                    <div>
                      <label htmlFor="firstName" className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">{t('auth.register.firstName')}</label>
                      <input 
                        id="firstName"
                        type="text" 
                        {...register('firstName')}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 ${errors.firstName ? 'border-red-400' : 'border-gray-200'}`}
                        placeholder={t('auth.register.firstName')}
                      />
                      {errors.firstName && <p className="text-red-500 text-[10px] mt-1 font-medium">{t(errors.firstName.message || '')}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyName" className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">{t('auth.register.company')}</label>
                    <div className="relative">
                      <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input 
                        id="companyName"
                        type="text" 
                        {...register('companyName')}
                        className={`w-full ps-10 pe-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 ${errors.companyName ? 'border-red-400' : 'border-gray-200'}`}
                        placeholder={t('auth.register.companyPlaceholder')}
                      />
                    </div>
                    {errors.companyName && <p className="text-red-500 text-[10px] mt-1 font-medium">{t(errors.companyName.message || '')}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">{t('auth.register.proEmail')}</label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input 
                        id="email"
                        type="email" 
                        {...register('email')}
                        className={`w-full ps-10 pe-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                        placeholder={t('auth.emailPlaceholder')}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-[10px] mt-1 font-medium">{t(errors.email.message || '')}</p>}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">{t('auth.password')}</label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input 
                        id="password"
                        type="password" 
                        {...register('password')}
                        className={`w-full ps-10 pe-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
                        placeholder="••••••••"
                      />
                    </div>
                    {errors.password && <p className="text-red-500 text-[10px] mt-1 font-medium">{t(errors.password.message || '')}</p>}
                    <PasswordStrengthIndicator password={passwordValue} />
                  </div>

                  <div className="flex justify-center py-2">
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

                  <div className="pt-2">
                    <p className="text-[10px] text-gray-400 mb-4">
                      {t('auth.register.consentPrefix')} <Link to="/terms" className="text-primary font-bold hover:underline">{t('auth.register.terms')}</Link> {t('auth.register.and')} <Link to="/privacy" className="text-primary font-bold hover:underline">{t('auth.register.privacy')}</Link>.
                    </p>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full btn-secondary py-4 rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>{t('auth.register.submitting')}</span>
                        </>
                      ) : (
                        <span>{role === 'fournisseur' ? t('auth.register.submitSupplier') : t('auth.register.submitBuyer')}</span>
                      )}
                    </button>
                  </div>
                </form>

              </div>
            )}
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                {t('auth.register.alreadyMember')}{' '}
                <Link to="/login" className="font-bold text-primary hover:underline">{t('auth.register.signIn')}</Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
