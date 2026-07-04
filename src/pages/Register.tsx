import { ArrowRight, Briefcase, Building2, CheckCircle2, Loader2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Turnstile } from '@marsidev/react-turnstile';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Prénom trop court'),
  lastName: z.string().min(2, 'Nom trop court'),
  companyName: z.string().min(2, "Nom de l'entreprise requis"),
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Mot de passe trop court (6 min)'),
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register = () => {
  const [role, setRole] = useState<'acheteur' | 'fournisseur' | null>(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        window.location.href = '/dashboard';
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleOAuthConnect = async (provider: 'google' | 'linkedin') => {
    try {
      const response = await fetch(`/api/auth/oauth/url?provider=${provider}`);
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      const { url } = await response.json();
      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );
      if (!authWindow) {
        setAuthError('Veuillez autoriser les popups pour vous inscrire.');
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      setAuthError('Impossible d\'initier l\'inscription avec ' + provider);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    if (!captchaToken) {
      setAuthError('Veuillez valider le captcha.');
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
      navigate('/register-success');
    } catch (err: any) {
      setAuthError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-bg px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row"
      >
        <div className="md:w-5/12 bg-primary p-8 text-white hidden md:flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <ShieldCheck className="w-64 h-64" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-6">Rejoignez le réseau industriel leader</h2>
            <div className="space-y-6 mt-12">
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Appels d'offres exclusifs</h4>
                  <p className="text-primary-100 text-sm mt-1">Accédez à des centaines d'opportunités B2B qualifiées.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Visibilité accrue</h4>
                  <p className="text-primary-100 text-sm mt-1">Présentez vos produits à des milliers d'acheteurs professionnels.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Réseautage qualifié</h4>
                  <p className="text-primary-100 text-sm mt-1">Entrez en contact direct avec les décideurs de l'industrie.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 mt-12">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center font-bold text-xs bg-white text-primary z-[${5-i}]`}>
                  {i === 4 ? '+5k' : `U${i}`}
                </div>
              ))}
            </div>
            <p className="text-sm text-primary-100 mt-3 font-medium">Déjà plus de 5000 entreprises inscrites</p>
          </div>
        </div>

        <div className="md:w-7/12 p-8 md:p-12">
          <div className="max-w-md mx-auto">
            {step === 1 ? (
              <div className="animate-in slide-in-from-right duration-500">
                <h3 className="text-2xl font-bold text-primary mb-2">Comment souhaitez-vous utiliser la plateforme ?</h3>
                <p className="text-gray-500 mb-8">Choisissez votre profil principal. Vous pourrez toujours accéder aux autres fonctionnalités plus tard.</p>

                <div className="space-y-4">
                  <button
                    onClick={() => setRole('acheteur')}
                    className={cn(
                      "w-full p-6 rounded-2xl border-2 text-left transition-all",
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
                          <h4 className="font-bold text-gray-900 text-lg">Je suis un Acheteur</h4>
                          <p className="text-sm text-gray-500 mt-1">Je cherche des fournisseurs et je publie des appels d'offres.</p>
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
                      "w-full p-6 rounded-2xl border-2 text-left transition-all",
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
                          <h4 className="font-bold text-gray-900 text-lg">Je suis un Fournisseur</h4>
                          <p className="text-sm text-gray-500 mt-1">Je propose mes produits/services et réponds aux offres.</p>
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
                  <span>Continuer</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right duration-500">
                <button onClick={() => setStep(1)} className="text-xs font-bold text-gray-400 hover:text-primary mb-4 flex items-center space-x-1">
                  <ArrowRight className="h-3 w-3 rotate-180" />
                  <span>Retour au choix du profil</span>
                </button>
                <h3 className="text-2xl font-bold text-primary mb-6">Créer votre compte</h3>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {authError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl animate-in fade-in duration-300">
                      {authError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Nom</label>
                      <input 
                        type="text"
                        {...register('lastName')}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 ${errors.lastName ? 'border-red-400' : 'border-gray-200'}`}
                        placeholder="Nom"
                      />
                      {errors.lastName && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.lastName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Prénom</label>
                      <input 
                        type="text" 
                        {...register('firstName')}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 ${errors.firstName ? 'border-red-400' : 'border-gray-200'}`}
                        placeholder="Prénom"
                      />
                      {errors.firstName && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.firstName.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Nom de l'entreprise</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input 
                        type="text" 
                        {...register('companyName')}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 ${errors.companyName ? 'border-red-400' : 'border-gray-200'}`}
                        placeholder="Ex: SARL Industrie"
                      />
                    </div>
                    {errors.companyName && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.companyName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Email professionnel</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input 
                        type="email" 
                        {...register('email')}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                        placeholder="email@entreprise.dz"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input 
                        type="password" 
                        {...register('password')}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
                        placeholder="••••••••"
                      />
                    </div>
                    {errors.password && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.password.message}</p>}
                  </div>

                  <div className="flex justify-center py-2">
                    <Turnstile
                      siteKey={turnstileSiteKey}
                      onSuccess={(token) => setCaptchaToken(token)}
                      onError={() => setCaptchaToken(null)}
                      onExpire={() => setCaptchaToken(null)}
                    />
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] text-gray-400 mb-4">
                      En vous inscrivant, vous acceptez nos <Link to="/terms" className="text-primary font-bold hover:underline">Conditions Générales</Link> et notre <Link to="/privacy" className="text-primary font-bold hover:underline">Politique de Confidentialité</Link>.
                    </p>
                    <button 
                      type="submit" 
                      disabled={isLoading || !captchaToken}
                      className="w-full btn-secondary py-4 rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Création en cours...</span>
                        </>
                      ) : (
                        <span>Créer mon compte {role}</span>
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-8 relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-gray-400 font-medium tracking-widest">Ou s'inscrire avec</span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => handleOAuthConnect('google')}
                    className="flex items-center justify-center space-x-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="bg-gradient-to-r from-red-500 to-yellow-500 p-0.5 rounded text-white overflow-hidden w-4 h-4 flex items-center justify-center font-bold text-[10px]">G</div>
                    <span className="text-sm font-bold text-gray-700">Google</span>
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => handleOAuthConnect('linkedin')}
                    className="flex items-center justify-center space-x-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="bg-[#0077b5] p-0.5 rounded text-white">
                      <ArrowRight className="h-3 w-3" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">LinkedIn</span>
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Déjà membre ?{' '}
                <Link to="/login" className="font-bold text-primary hover:underline">Connectez-vous</Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
