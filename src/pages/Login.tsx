import { Eye, EyeOff, Building2, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Turnstile } from '@marsidev/react-turnstile';

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Redirection interne uniquement (pas d'URL absolue ni protocol-relative).
  const rawRedirect = searchParams.get('redirect');
  const redirectUrl = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.startsWith('/\\') ? rawRedirect : null;

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    if (!captchaToken) {
      setAuthError('Veuillez valider le captcha pour continuer.');
      return;
    }
    setIsLoading(true);
    setAuthError('');
    
    try {
      const loggedUser = await login(data.email, data.password, captchaToken);
      if (loggedUser?.role === 'admin') {
        navigate('/extranet');
      } else {
        navigate(redirectUrl || '/dashboard');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Identifiants invalides. Veuillez réessayer.');
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
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-primary">Bon retour !</h2>
            <p className="text-gray-500 mt-2">Connectez-vous à votre espace Algeria Industry</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl animate-in fade-in zoom-in duration-300">
                {authError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Adresse Email</label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input 
                  id="email"
                  type="text"
                  {...register('email')}
                  className={`w-full ps-10 pe-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="nom@entreprise.dz"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Mot de passe</label>
                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-secondary hover:underline">
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
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
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>

            <div className="flex items-center">
              <input type="checkbox" id="remember" className="rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="remember" className="ms-2 text-sm text-gray-600">Se souvenir de moi</label>
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
                <p className="text-red-500 text-sm font-bold">Erreur de configuration : VITE_TURNSTILE_SITE_KEY manquant</p>
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
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

        </div>
        
        <div className="bg-gray-50 p-6 text-center border-t border-gray-100 space-y-4">
          <p className="text-sm text-gray-600">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-bold text-secondary hover:underline">
              Inscrivez-vous gratuitement
            </Link>
          </p>
          <div className="pt-4 border-t border-gray-200">
             <Link to="/extranet" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-all">
                Console Professionnelle
             </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
