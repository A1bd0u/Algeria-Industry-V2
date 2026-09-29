import { ArrowRight, Building2, CheckCircle2, LayoutDashboard, Mail, Package, RefreshCw, Search, Settings, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

// Étape 1 : saisie du code reçu par e-mail. La session s'ouvre à la validation.
const EmailCodeStep = ({ initialEmail }: { initialEmail: string }) => {
  const { verifyCode, resendCode } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyCode(email.trim().toLowerCase(), code);
    } catch (err: any) {
      setError(err.message || 'Code invalide.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!captchaToken) {
      setError('Veuillez valider le captcha pour renvoyer le code.');
      return;
    }
    setError('');
    setInfo('');
    setResending(true);
    try {
      await resendCode(email.trim().toLowerCase(), captchaToken);
      setInfo('Si un compte en attente existe pour cette adresse, un nouveau code vient d\'être envoyé.');
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-bg flex items-center justify-center px-4 py-20">
      <div className="max-w-lg w-full bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-primary p-8 text-center text-white">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Vérifiez votre adresse e-mail</h1>
          <p className="text-white/70 text-sm">
            Si cette adresse peut être utilisée, un code à 6 chiffres vient d'y être envoyé. Il est valable 15 minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && <div role="alert" className="bg-red-50 text-red-600 p-3 text-xs font-bold border border-red-100 rounded-xl">{error}</div>}
          {info && <div role="status" className="bg-blue-50 text-blue-600 p-3 text-xs font-bold border border-blue-100 rounded-xl">{info}</div>}

          <div className="space-y-2">
            <label htmlFor="verify_email" className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Adresse e-mail</label>
            <input
              id="verify_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl outline-none focus:border-secondary"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="verify_code" className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Code de vérification</label>
            <input
              id="verify_code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-gray-50 border border-gray-100 px-6 py-4 text-2xl tracking-[0.5em] font-mono text-center rounded-xl outline-none focus:border-secondary"
              placeholder="000000"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6 || !email}
            className="w-full btn-secondary py-4 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span className="text-xs font-black uppercase tracking-widest">{loading ? 'Vérification…' : 'Confirmer mon adresse'}</span>
            {!loading && <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
          </button>

          <div className="pt-4 border-t border-gray-100 space-y-4">
            <div className="flex justify-center">
              {turnstileSiteKey ? (
                <Turnstile
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onError={() => setCaptchaToken(null)}
                  onExpire={() => setCaptchaToken(null)}
                />
              ) : (
                <p className="text-red-500 text-[10px] font-bold">Erreur de configuration : VITE_TURNSTILE_SITE_KEY manquant</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !email}
              className="w-full text-[10px] font-black text-secondary hover:text-primary uppercase tracking-widest flex items-center justify-center disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3 w-3 me-2', resending && 'animate-spin')} />
              {resending ? 'Envoi…' : 'Renvoyer le code'}
            </button>
            <p className="text-center text-xs text-gray-500">
              Vous avez déjà un compte ? <Link to="/login" className="font-bold text-primary hover:underline">Connectez-vous</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

const RegisterSuccess = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const initialEmail = (location.state as any)?.email || user?.email || '';
  const isAr = i18n.language?.startsWith('ar');

  if (!user || !user.emailVerified) {
    return <EmailCodeStep initialEmail={initialEmail} />;
  }

  const isSupplier = user.role === 'fournisseur' || user.role === 'exposant';
  const kycDone = user.kycStatus === 'approved';
  const kycPending = user.kycStatus === 'pending';

  // Parcours fournisseur en 3 étapes : compte → entreprise et KYC → premier produit.
  const onboarding = [
    { icon: CheckCircle2, title: isAr ? 'الحساب' : 'Compte créé', desc: isAr ? 'تم التحقق من بريدك الإلكتروني.' : 'Adresse e-mail vérifiée.', done: true, link: null },
    {
      icon: ShieldCheck,
      title: isAr ? 'المؤسسة و KYC' : 'Entreprise et KYC',
      desc: kycPending
        ? (isAr ? 'ملفك قيد المراجعة.' : 'Votre dossier est en cours de vérification.')
        : (isAr ? 'أرسل السجل التجاري و NIF للحصول على شارة "مؤسسة موثقة".' : 'Déposez RC et NIF pour obtenir le badge « entreprise vérifiée ».'),
      done: kycDone,
      link: kycDone || kycPending ? null : '/kyc-upload',
    },
    {
      icon: Package,
      title: isAr ? 'أول منتج' : 'Premier produit',
      desc: isAr ? 'انشر منتجك الأول بعد الموافقة على KYC.' : 'Publiez votre premier produit une fois le KYC approuvé.',
      done: false,
      link: kycDone ? '/dashboard?tab=products' : null,
    },
  ];
  const completed = onboarding.filter((s) => s.done).length;

  const buyerSteps = [
    { icon: Search, title: isAr ? 'استكشاف الموردين' : 'Trouver un fournisseur', desc: isAr ? 'تصفح الموردين الموثقين.' : 'Parcourez les fournisseurs vérifiés.', link: '/directory' },
    { icon: Building2, title: isAr ? 'تصفح المنتجات' : 'Explorer les produits', desc: isAr ? 'قارن واطلب عرض سعر.' : 'Comparez et demandez un devis.', link: '/products' },
    { icon: LayoutDashboard, title: isAr ? 'لوحة التحكم' : 'Compléter votre profil', desc: isAr ? 'أضف معلومات مؤسستك.' : 'Ajoutez les informations de votre entreprise.', link: '/dashboard' },
  ];

  return (
    <div className={cn("min-h-screen bg-neutral-bg flex items-center justify-center px-4 py-20", isAr && "font-arabic")}>
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-primary p-12 text-white flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 bg-secondary rounded-3xl flex items-center justify-center shadow-2xl mb-8"
              >
                <CheckCircle2 className="h-12 w-12 text-white" />
              </motion.div>
              <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-6">
                {isAr ? 'تم إنشاء الحساب بنجاح' : 'Compte créé avec succès'}
              </h1>
              <p className="text-white/60 text-sm font-medium leading-relaxed">
                {isAr ? 'مرحبًا بك في Algeria Industry.' : 'Bienvenue sur Algeria Industry, la marketplace des fournisseurs industriels algériens vérifiés.'}
              </p>
            </div>

            <div className="md:w-1/2 p-12">
              <h2 className="text-xs font-black text-secondary uppercase tracking-[0.3em] mb-4">
                {isAr ? 'الخطوات التالية' : 'Prochaines étapes'}
              </h2>

              {isSupplier ? (
                <>
                  <div className="mb-8" aria-label={`Étape ${completed} sur 3`}>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                      <span>{isAr ? 'التقدم' : 'Progression'}</span>
                      <span>{completed}/3</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary transition-all" style={{ width: `${(completed / 3) * 100}%` }} />
                    </div>
                  </div>
                  <ol className="space-y-4">
                    {onboarding.map((step, idx) => {
                      const content = (
                        <div className="flex items-start space-x-4 rtl:space-x-reverse">
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', step.done ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600')}>
                            <step.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-black text-primary uppercase tracking-tight">{idx + 1}. {step.title}</h3>
                            <p className="text-[11px] text-gray-500 font-medium leading-normal mt-1">{step.desc}</p>
                          </div>
                          {step.link && <ArrowRight className="h-4 w-4 text-gray-300 rtl:rotate-180" />}
                        </div>
                      );
                      return (
                        <li key={idx}>
                          {step.link ? (
                            <Link to={step.link} className="block p-4 rounded-2xl border border-gray-100 hover:border-secondary transition-all">{content}</Link>
                          ) : (
                            <div className={cn('p-4 rounded-2xl border border-gray-100', !step.done && 'opacity-60')}>{content}</div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </>
              ) : (
                <div className="space-y-4">
                  {buyerSteps.map((step, idx) => (
                    <Link key={idx} to={step.link} className="group block p-4 rounded-2xl hover:bg-neutral-bg border border-transparent hover:border-gray-100 transition-all">
                      <div className="flex items-start space-x-4 rtl:space-x-reverse">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                          <step.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-black text-primary uppercase tracking-tight group-hover:text-secondary">{step.title}</h3>
                          <p className="text-[11px] text-gray-500 font-medium leading-normal mt-1">{step.desc}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300 rtl:rotate-180" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-12 flex flex-col space-y-4">
                <Link to="/dashboard" className="w-full btn-secondary py-4 rounded-xl flex items-center justify-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-widest">
                    {isAr ? 'الانتقال إلى لوحة التحكم' : 'Aller au tableau de bord'}
                  </span>
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row items-center justify-between text-gray-500 px-8">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Settings className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Besoin d'aide pour configurer votre compte ?</span>
          </div>
          <Link to="/contact" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-secondary border-b border-primary/20 pb-0.5">
            Contacter le support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterSuccess;
