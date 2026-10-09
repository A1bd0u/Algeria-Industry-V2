import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  CheckCircle,
  ChevronRight,
  CreditCard,
  Edit2,
  FileSpreadsheet,
  FileText,
  Heart,
  Info,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquare,
  Package,
  Phone,
  Plug,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
  Video,
  X,
  Zap
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Messages from './Messages';
import SupplierStats from '../components/SupplierStats';
import CataloguesPanel from '../components/CataloguesPanel';
import IntegrationsPanel from '../components/IntegrationsPanel';
import ProductImport from '../components/ProductImport';
import AddProduct from './AddProduct';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/apiError';
import { categoryLabel } from '../data/productCategories';
import SubscriptionPanel from '../components/SubscriptionPanel';
import TwoFactorSettings from '../components/TwoFactorSettings';
import { cn, generateSlugUrl, productCover } from '../lib/utils';



const Dashboard = () => {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated, setUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  // Offre réelle de l'entreprise (même cache que l'onglet Abonnement).
  const { data: subscriptionInfo } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      const res = await fetch('/api/subscriptions/me');
      if (!res.ok) throw new Error('Abonnement indisponible');
      return res.json();
    },
    enabled: user?.role === 'fournisseur',
  });
  const currentPlan: string | undefined = subscriptionInfo?.plan;
  const [showProductForm, setShowProductForm] = useState(false);
  const [showAdForm, setShowAdForm] = useState(false);

  const [adFormData, setAdFormData] = useState({
    name: '',
    type: 'Bannière Accueil',
    url: '',
    duration: '1 Semaine'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [showImport, setShowImport] = useState(false);
  const reloadProducts = async () => {
    const res = await fetch('/api/products/my');
    if (res.ok) setProducts(await res.json());
  };
  
  useEffect(() => {
     const fetchData = async () => {
        try {
           const [prodRes, favRes] = await Promise.all([
             fetch('/api/products/my'),
             fetch('/api/favorites')
           ]);
           if (prodRes.ok) {
              const data = await prodRes.json();
              setProducts(data);
           }
           if (favRes.ok) {
              const data = await favRes.json();
              setFavorites(data);
           }
        } catch (e) {
           console.error('Erreur API Dashboard:', e);
        }
     };
     if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
      
    }
  }, [searchParams]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const [companyInfo, setCompanyInfo] = useState({
    name: '', bio: '', wilaya: '', whatsapp: '', logo_url: '', banner_url: '',
    founded_year: '', employees: '', website: '', contact_email: '', contact_phone: '', certifications: '', gallery: [] as string[],
  });
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const GALLERY_MAX = 8;

  // Galerie de la fiche (usine, ateliers, réalisations).
  const uploadGallery = async (files: FileList | null) => {
    const list = Array.from(files || []).slice(0, GALLERY_MAX - companyInfo.gallery.length);
    if (!list.length) return;
    setUploadingGallery(true);
    try {
      for (const file of list) {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/upload?bucket=product-images', { method: 'POST', body: form });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new ApiError(d, 'dashboard.updateError');
        setCompanyInfo((prev) => ({ ...prev, gallery: [...prev.gallery, d.url].slice(0, GALLERY_MAX) }));
      }
    } catch (err: any) {
      showNotify(err.message, 'error');
    } finally {
      setUploadingGallery(false);
    }
  };
  const [uploadingImage, setUploadingImage] = useState<'logo_url' | 'banner_url' | null>(null);

  // Dépose le logo ou la bannière ; l'URL est enregistrée avec le formulaire.
  const uploadCompanyImage = async (field: 'logo_url' | 'banner_url', file: File | undefined) => {
    if (!file) return;
    setUploadingImage(field);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload?bucket=product-images', { method: 'POST', body: form });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(d, 'dashboard.updateError');
      setCompanyInfo((prev) => ({ ...prev, [field]: d.url }));
    } catch (err: any) {
      showNotify(err.message, 'error');
    } finally {
      setUploadingImage(null);
    }
  };

  useEffect(() => {
    const loadCompany = async () => {
      if (!user?.company_id) return;
      try {
        const res = await fetch(`/api/companies/${user.company_id}`);
        if (res.ok) {
          const c = await res.json();
          setCompanyInfo({
            name: c.name || '', bio: c.description || '', wilaya: c.wilaya || '', whatsapp: c.whatsapp ? `+${c.whatsapp}` : '',
            logo_url: c.logo_url || '', banner_url: c.banner_url || '',
            founded_year: c.founded_year ? String(c.founded_year) : '', employees: c.employees || '', website: c.website || '', contact_email: c.contact_email || '', contact_phone: c.contact_phone || '',
            certifications: (c.certifications || []).join(', '), gallery: c.gallery || [],
          });
        }
      } catch (e) {
        console.error('Erreur chargement entreprise', e);
      }
    };
    loadCompany();
  }, [user?.company_id]);

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.company_id) {
      showNotify(t('dashboard.noCompany'), "error");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/companies/${user.company_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyInfo.name, description: companyInfo.bio, wilaya: companyInfo.wilaya || undefined,
          whatsapp: companyInfo.whatsapp.trim(), logo_url: companyInfo.logo_url, banner_url: companyInfo.banner_url,
          founded_year: companyInfo.founded_year.trim(), employees: companyInfo.employees, website: companyInfo.website.trim(), contact_email: companyInfo.contact_email.trim(), contact_phone: companyInfo.contact_phone.trim(),
          certifications: companyInfo.certifications.split(',').map((c) => c.trim()).filter((c) => c.length >= 2).slice(0, 10),
          gallery: companyInfo.gallery,
        })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new ApiError(d, 'dashboard.updateError');
      }
      showNotify(t('dashboard.companyUpdated'), "success");
    } catch (err: any) {
      showNotify(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const submitAd = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adFormData)
      });
      if (res.ok) {
        setShowAdForm(false);
        setAdFormData({ name: '', type: 'Bannière Accueil', url: '', duration: '1 Semaine' });
        showNotify(t('dashboard.adSent'), "success");
      } else {
        const d = await res.json().catch(() => ({}));
        showNotify(new ApiError(d, 'dashboard.adError').message, "error");
      }
    } catch (err) {
      showNotify(t('auth.networkError'), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (id: number | string) => {
    try {
      await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
      setFavorites(prev => prev.filter(f => f.id !== id));
      showNotify(t('dashboard.favoriteRemoved'));
    } catch (e) {
      console.error(e);
    }
  };

  const [profileInfo, setProfileInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || ''
  });
  const [chartTimeframe, setChartTimeframe] = useState<'6m' | '1y'>('6m');
  const [apiStats, setApiStats] = useState<any>(null);

  useEffect(() => {
     const fetchStats = async () => {
         try {
            const res = await fetch(`/api/stats/dashboard?timeframe=${chartTimeframe}`);
            if (res.ok) {
                const data = await res.json();
                setApiStats(data);
            }
         } catch(e) {
            console.error('Stats fetch error:', e);
         }
     };
     if (isAuthenticated) fetchStats();
  }, [isAuthenticated, chartTimeframe]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileInfo.name, company: profileInfo.company })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(data, 'dashboard.updateError');
      if (data.user) setUser(data.user);
      showNotify(t('dashboard.profileUpdated'), "success");
    } catch (err: any) {
      showNotify(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/users/me/export');
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = t('dashboard.exportFileName');
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showNotify(t('dashboard.exportFailed'), "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('dashboard.deleteAccountConfirm'))) return;
    try {
      const res = await fetch('/api/users/me', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setUser(null);
      navigate('/');
    } catch {
      showNotify(t('dashboard.deleteFailed'), "error");
    }
  };

  const search = globalSearch.trim().toLowerCase();
  const filteredProducts = products.filter(p =>
    !search ||
    String(p.name || '').toLowerCase().includes(search) ||
    categoryLabel(t, p.category).toLowerCase().includes(search)
  );
  const roleLabel = (role?: string) => t(`dashboard.roles.${role}`, { defaultValue: role || '' });

  const renderContent = () => {
    if (!user) return null;
    switch(activeTab) {
      case 'overview':

        const stats = (user.role === 'fournisseur' || user.role === 'exposant') ? [
          { label: t('dashboard.stats.products'), value: apiStats?.metrics?.items || 0, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: t('dashboard.stats.messages'), value: apiStats?.metrics?.messages || 0, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: t('dashboard.stats.kyc'), value: t(`dashboard.kyc.${user.kycStatus || 'none'}`), icon: ShieldCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
        ] : [
          { label: t('dashboard.stats.messages'), value: apiStats?.metrics?.messages || 0, icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: t('dashboard.stats.favorites'), value: favorites.length, icon: Heart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ];

        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Démarrage fournisseur : les 4 étapes pour être visible et contacté */}
            {(user.role === 'fournisseur' || user.role === 'exposant') && (() => {
              const steps = [
                { key: 'account', done: true, action: null },
                { key: 'company', done: Boolean(companyInfo.name && companyInfo.logo_url && companyInfo.bio.trim().length >= 80), action: () => setActiveTab('company') },
                { key: 'kyc', done: user.kycStatus === 'approved', pending: user.kycStatus === 'pending', action: () => navigate('/kyc-upload') },
                { key: 'product', done: products.length > 0, action: () => setShowAddProduct(true) },
              ];
              const doneCount = steps.filter((s) => s.done).length;
              if (doneCount === steps.length) return null;
              const next = steps.find((s) => !s.done && !(s as any).pending);
              return (
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8" aria-labelledby="onboarding-title">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
                    <div>
                      <h2 id="onboarding-title" className="text-xl font-black text-primary">{t('dashboard.onboarding.title')}</h2>
                      <p className="text-sm text-gray-500 mt-1">{t('dashboard.onboarding.subtitle')}</p>
                    </div>
                    <span className="text-sm font-black text-secondary">{t('dashboard.onboarding.progress', { done: doneCount, total: steps.length })}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={steps.length} aria-label={t('dashboard.onboarding.title')}>
                    <div className="h-full bg-secondary transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
                  </div>
                  <ol className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {steps.map((step, i) => {
                      const isNext = next?.key === step.key;
                      const pending = (step as any).pending && !step.done;
                      return (
                        <li key={step.key} className={cn(
                          'rounded-xl border p-4 flex flex-col',
                          step.done ? 'border-success/30 bg-success/5' : isNext ? 'border-secondary bg-secondary/5' : 'border-gray-100',
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black',
                              step.done ? 'bg-success text-white' : isNext ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-500',
                            )}>
                              {step.done ? <CheckCircle className="h-4 w-4" /> : i + 1}
                            </span>
                            <p className="font-bold text-primary text-sm">{t(`dashboard.onboarding.${step.key}.title`)}</p>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">
                            {pending ? t('dashboard.onboarding.kyc.pending') : t(`dashboard.onboarding.${step.key}.text`)}
                          </p>
                          {!step.done && !pending && step.action && (
                            <button type="button" onClick={step.action} className={cn('mt-auto w-fit', isNext ? 'btn-primary !py-2' : 'text-sm font-bold text-secondary hover:underline')}>
                              {t(`dashboard.onboarding.${step.key}.cta`)}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })()}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <div 
                  key={i}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2 rounded-lg", stat.bg, stat.color)}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-primary mt-1">{stat.value}</h3>
                </div>
              ))}
            </div>

            {/* Charts & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-primary text-lg">
                    {user.role === 'fournisseur' ? t('dashboard.chart.contacts') : t('dashboard.chart.messages')}
                  </h3>
                  <div className="flex bg-gray-50 p-1 rounded-lg">
                    <button 
                      onClick={() => setChartTimeframe('6m')}
                      className={cn("px-3 py-1 rounded-md text-xs font-black uppercase transition-all", chartTimeframe === '6m' ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:text-primary")}
                    >
                      {t('dashboard.chart.6m')}
                    </button>
                    <button 
                      onClick={() => setChartTimeframe('1y')}
                      className={cn("px-3 py-1 rounded-md text-xs font-black uppercase transition-all", chartTimeframe === '1y' ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:text-primary")}
                    >
                      {t('dashboard.chart.1y')}
                    </button>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={apiStats?.chartData || []}>
                      <defs>
                        <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={user.role === 'fournisseur' ? "#1B4D2E" : "#d97706"} stopOpacity={0.1}/>
                          <stop offset="95%" stopColor={user.role === 'fournisseur' ? "#1B4D2E" : "#d97706"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey={user.role === 'fournisseur' ? "contacts" : "messages"} 
                        stroke={user.role === 'fournisseur' ? "#1B4D2E" : "#d97706"} 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorMain)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Prochaines actions */}
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-primary text-lg mb-6">{t('dashboard.next.title')}</h3>
                <div className="space-y-3">
                  {(user.role === 'fournisseur' || user.role === 'exposant') && user.kycStatus !== 'approved' && user.kycStatus !== 'pending' && (
                    <Link to="/kyc-upload" className="flex items-center justify-between p-4 rounded-2xl border border-orange-100 bg-orange-50 text-orange-700 text-sm font-bold">
                      <span>{t('dashboard.next.kyc')}</span>
                      <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                  )}
                  {(user.role === 'fournisseur' || user.role === 'exposant') && user.kycStatus === 'approved' && products.length === 0 && (
                    <button onClick={() => setActiveTab('products')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 text-sm font-bold text-primary hover:border-secondary">
                      <span>{t('dashboard.next.firstProduct')}</span>
                      <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                    </button>
                  )}
                  <button onClick={() => setActiveTab('messages')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 text-sm font-bold text-primary hover:border-secondary">
                    <span>{t('dashboard.next.messages')}</span>
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  </button>
                  <Link to="/directory" className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 text-sm font-bold text-primary hover:border-secondary">
                    <span>{t('dashboard.next.directory')}</span>
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'profile':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm max-w-4xl"
          >
            <div className="flex items-center space-x-6 rtl:space-x-reverse mb-12">
               <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center text-primary font-black text-3xl shrink-0">
                  {(profileInfo.name || '?').charAt(0)}
               </div>
               <div>
                  <h3 className="text-xl font-black text-primary">{profileInfo.name}</h3>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{roleLabel(user.role)}</p>
               </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label htmlFor="profile_name" className="text-xs font-black text-primary uppercase tracking-widest italic">{t('dashboard.profile.fullName')}</label>
                  <input
                    id="profile_name"
                    type="text"
                    required
                    minLength={2}
                    value={profileInfo.name}
                    onChange={(e) => setProfileInfo({...profileInfo, name: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profile_email" className="text-xs font-black text-primary uppercase tracking-widest italic">{t('dashboard.profile.email')}</label>
                  <input
                    id="profile_email"
                    type="email"
                    value={profileInfo.email}
                    readOnly
                    className="w-full px-6 py-4 bg-gray-100 border-none rounded-2xl outline-none font-bold text-sm text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profile_company" className="text-xs font-black text-primary uppercase tracking-widest italic">{t('dashboard.profile.company')}</label>
                  <input
                    id="profile_company"
                    type="text"
                    value={profileInfo.company}
                    onChange={(e) => setProfileInfo({...profileInfo, company: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm"
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-gray-50 flex flex-wrap gap-4 items-center justify-between">
                <div>
                   <h4 className="text-xs font-black text-primary uppercase italic mb-1">{t('dashboard.profile.security')}</h4>
                   <Link to="/forgot-password" className="text-xs font-black text-secondary hover:underline uppercase tracking-widest">{t('dashboard.profile.changePassword')}</Link>
                </div>
                <button type="submit" disabled={isLoading} className="bg-primary text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-secondary transition-all flex items-center space-x-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>{t('dashboard.profile.save')}</span>}
                </button>
              </div>
            </form>

            <div className="mt-12 pt-8 border-t border-gray-100">
              <h4 className="text-xs font-black text-primary uppercase italic mb-2">{t('dashboard.profile.dataTitle')}</h4>
              <p className="text-xs text-gray-500 mb-4">{t('dashboard.profile.dataText')}</p>
              <div className="flex flex-wrap gap-4">
                <button type="button" onClick={handleExportData} className="px-6 py-3 rounded-2xl border border-gray-200 text-xs font-black uppercase tracking-widest text-primary hover:border-secondary">
                  {t('dashboard.profile.export')}
                </button>
                {user.role !== 'admin' && (
                  <button type="button" onClick={handleDeleteAccount} className="px-6 py-3 rounded-2xl border border-red-200 bg-red-50 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-100">
                    {t('dashboard.profile.deleteAccount')}
                  </button>
                )}
              </div>
            </div>
            <div className="mt-8">
              <TwoFactorSettings onChange={refreshUser} />
            </div>
          </motion.div>
        );
      case 'messages':
        return <Messages />;
      case 'favorites':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {favorites.map((fav) => (
              <div key={fav.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group hover:shadow-xl transition-all flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    {fav.item_type === 'product' && fav.image ? (
                      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
                         <img src={fav.image} alt={fav.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                        {fav.item_type === 'product' ? <Package className="h-7 w-7" /> : <Building2 className="h-7 w-7" />}
                      </div>
                    )}
                    <div>
                      <h4 className="text-base font-black text-primary">{fav.name || `Favori (${fav.reference_id || fav.item_id.substring(0,8)})`}</h4>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{fav.category || fav.item_type}</p>
                      <p className="text-xs font-mono text-gray-500 uppercase mt-1 tracking-widest">
                         {fav.reference_id ? `REF: ${fav.reference_id}` : `ID: ${fav.item_id.substring(0,8)}`}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFavorite(fav.id)}
                    aria-label={t('dashboard.favorites.remove')}
                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shrink-0 ms-4"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
                   <div className="flex items-center space-x-2 text-gray-500">
                      <span className="text-xs font-bold uppercase">{fav.location || ''}</span>
                   </div>
                   <Link 
                    to={fav.item_type === 'product' ? `/products/${generateSlugUrl(fav.name, String(fav.item_id))}` : `/directory/${generateSlugUrl(fav.name, String(fav.item_id))}`}
                    className="text-xs font-black text-secondary hover:underline uppercase tracking-widest flex items-center space-x-1"
                   >
                     <span>{fav.item_type === 'product' ? t('dashboard.favorites.viewProduct') : t('dashboard.favorites.viewProfile')}</span>
                     <ChevronRight className="h-3 w-3 rtl:rotate-180" />
                   </Link>
                </div>
              </div>
            ))}
            {favorites.length === 0 && (
              <div className="col-span-full py-32 text-center">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <Heart className="h-10 w-10" />
                 </div>
                 <h4 className="text-xl font-black text-primary mb-2">{t('dashboard.favorites.emptyTitle')}</h4>
                 <p className="text-sm text-gray-500">{t('dashboard.favorites.emptyText')}</p>
              </div>
            )}
          </motion.div>
        );
      case 'ads':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <h3 className="text-2xl font-black text-primary">{t('dashboard.ads.title')}</h3>
                <p className="text-gray-500 mt-2">{t('dashboard.ads.subtitle')}</p>
              </div>
              <button 
                onClick={() => setShowAdForm(true)}
                className="bg-secondary text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>{t('dashboard.ads.request')}</span>
              </button>
            </div>

            <div className="max-w-4xl">
              <div className="space-y-6">
                <h4 className="font-bold text-primary text-lg">{t('dashboard.ads.activeTitle')}</h4>
                <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200">
                   <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                     <Zap className="h-8 w-8 text-gray-500" />
                   </div>
                   <h5 className="font-bold text-gray-900 mb-2">{t('dashboard.ads.noneTitle')}</h5>
                   <p className="text-sm text-gray-500">{t('dashboard.ads.noneText')}</p>
                </div>
               
                <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl mt-4">
                   <h5 className="font-bold text-primary mb-2">{t('dashboard.ads.whyTitle')}</h5>
                   <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> {t('dashboard.ads.why1')}</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> {t('dashboard.ads.why3')}</li>
                   </ul>
                </div>
              </div>
              
            </div>
          </motion.div>
        );

      case 'subscription':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SubscriptionPanel notify={showNotify} />
          </motion.div>
        );
      case 'stats':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SupplierStats />
          </motion.div>
        );
      case 'integrations':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <IntegrationsPanel notify={showNotify} isSupplier={user?.role === 'fournisseur' || user?.role === 'exposant'} />
          </motion.div>
        );
      case 'catalogues':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CataloguesPanel notify={showNotify} />
          </motion.div>
        );
      case 'products':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
               <h3 className="text-2xl font-black text-primary">{t('dashboard.products.title')}</h3>
               <div className="flex flex-wrap gap-3">
               <button
                 type="button"
                 onClick={() => setShowImport(true)}
                 className="bg-white border border-gray-200 text-primary px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center space-x-2 hover:border-secondary hover:text-secondary transition-all"
               >
                 <FileSpreadsheet className="h-4 w-4" />
                 <span>{t('productImport.open')}</span>
               </button>
               <button 
                 onClick={() => setShowAddProduct(true)}
                 className="bg-primary text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center space-x-2 hover:bg-secondary transition-all"
               >
                 <Package className="h-4 w-4" />
                 <span>{t('dashboard.products.add')}</span>
               </button>
               </div>
            </div>
            {showImport && <ProductImport onClose={() => setShowImport(false)} onImported={reloadProducts} notify={showNotify} />}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredProducts.map(p => (
                 <div key={p.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group hover:shadow-md transition-all flex flex-col">
                   {productCover(p) ? (
                     <img src={productCover(p) as string} className="w-full h-40 object-cover rounded-2xl mb-4" alt={p.name} />
                   ) : (
                     <div className="w-full h-40 bg-gray-50 rounded-2xl mb-4 flex items-center justify-center">
                       <Package className="h-10 w-10 text-gray-300" />
                     </div>
                   )}
                   <h4 className="font-bold text-primary mb-1">{p.name}</h4>
                   <p className="text-xs text-gray-500 mb-2">{categoryLabel(t, p.category)}</p>
                   {p.status === 'Brouillon' && (
                     <p className="text-xs font-bold text-orange-600 mb-2">{t('dashboard.products.draftHint')}</p>
                   )}
                   <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                     <span className={cn("text-xs font-black uppercase tracking-widest", p.status === 'Actif' ? 'text-success' : 'text-orange-500')}>{t(`dashboard.products.status.${p.status}`, { defaultValue: p.status })}</span>
                     <div className="flex gap-2">
                       <button 
                         type="button"
                         onClick={() => {
                           setEditProduct(p);
                           setShowAddProduct(true);
                         }}
                         aria-label={t('dashboard.products.edit')}
                         className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                       >
                         <Edit2 className="h-4 w-4" />
                       </button>
                       <button 
                         type="button"
                         onClick={async () => {
                           if (window.confirm(t('dashboard.products.deleteConfirm'))) {
                             const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
                             if (res.ok) {
                               setProducts(products.filter(prod => prod.id !== p.id));
                             }
                           }
                         }}
                         aria-label={t('dashboard.products.delete')}
                         className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                     </div>
                   </div>
                 </div>
               ))}
               {products.length === 0 && (
                 <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Package className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-bold tracking-widest text-sm">{t('dashboard.products.emptyTitle')}</p>
                    <p className="text-gray-500 text-xs mt-2 max-w-xs">{t('dashboard.products.emptyText')}</p>
                 </div>
               )}
            </div>
            <AddProduct 
              isOpen={showAddProduct}
              initialData={editProduct}
              onClose={() => { setShowAddProduct(false); setEditProduct(null); }}
              onSuccess={(newProd) => {
                if (editProduct) { setProducts(products.map(p => p.id === newProd.id ? newProd : p)); } else { setProducts([newProd, ...products]); }
              }}
            />
          </motion.div>
        );
      case 'company':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-4xl"
          >
            {(() => {
              // Jauge de complétion : ce qui rend une fiche crédible pour un acheteur.
              const checks = [
                { done: Boolean(companyInfo.logo_url), label: t('dashboard.completion.logo') },
                { done: Boolean(companyInfo.banner_url), label: t('dashboard.completion.banner') },
                { done: companyInfo.bio.trim().length >= 80, label: t('dashboard.completion.description') },
                { done: Boolean(companyInfo.whatsapp.trim()), label: t('dashboard.completion.whatsapp') },
                { done: Boolean(companyInfo.wilaya.trim()), label: t('dashboard.completion.wilaya') },
                { done: user?.kycStatus === 'approved', label: t('dashboard.completion.kyc') },
                { done: products.length >= 10, label: t('dashboard.completion.products') },
                { done: companyInfo.gallery.length >= 3, label: t('dashboard.completion.gallery') },
              ];
              const percent = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
              return (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-primary">{t('dashboard.completion.title')}</h3>
                    <span className="text-sm font-black text-secondary">{percent} %</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={t('dashboard.completion.title')}>
                    <div className="h-full bg-secondary transition-all" style={{ width: `${percent}%` }} />
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {checks.map((c) => (
                      <li key={c.label} className={cn('flex items-center gap-2', c.done ? 'text-gray-500 line-through' : 'text-primary font-medium')}>
                        <CheckCircle className={cn('h-4 w-4 shrink-0', c.done ? 'text-success' : 'text-gray-300')} />
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="h-40 bg-primary relative">
                  {companyInfo.banner_url && <img src={companyInfo.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                  <label className="absolute top-4 end-4 btn-ghost !px-3 !py-2 text-xs cursor-pointer">
                     {uploadingImage === 'banner_url' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                     {t('dashboard.company.changeBanner')}
                     <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => uploadCompanyImage('banner_url', e.target.files?.[0])} />
                  </label>
                  <label className="absolute -bottom-10 start-10 w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-xl flex items-center justify-center overflow-hidden cursor-pointer group" title={t('dashboard.company.changeLogo')}>
                     {companyInfo.logo_url
                       ? <img src={companyInfo.logo_url} alt="" className="w-full h-full object-contain" />
                       : <Building2 className="h-10 w-10 text-primary" />}
                     <span className="absolute inset-0 bg-black/50 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       {uploadingImage === 'logo_url' ? <Loader2 className="h-5 w-5 animate-spin" /> : t('dashboard.company.changeLogo')}
                     </span>
                     <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={t('dashboard.company.changeLogo')} onChange={(e) => uploadCompanyImage('logo_url', e.target.files?.[0])} />
                  </label>
               </div>
               <form onSubmit={handleUpdateCompany} className="p-12 pt-20 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label htmlFor="company_name" className="text-xs font-black text-primary uppercase tracking-widest italic">{t('dashboard.company.name')}</label>
                        <input
                          id="company_name"
                          type="text"
                          required
                          minLength={2}
                          value={companyInfo.name}
                          onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                          className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold outline-none"
                        />
                     </div>
                     <div className="space-y-2">
                        <label htmlFor="company_wilaya" className="text-xs font-black text-primary uppercase tracking-widest italic">{t('dashboard.company.wilaya')}</label>
                        <input
                          id="company_wilaya"
                          type="text"
                          placeholder={t('dashboard.company.wilayaPlaceholder')}
                          value={companyInfo.wilaya}
                          onChange={(e) => setCompanyInfo({...companyInfo, wilaya: e.target.value})}
                          className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold outline-none"
                        />
                     </div>
                     <div className="space-y-2 md:col-span-2">
                        <label htmlFor="company_whatsapp" className="text-xs font-black text-primary uppercase tracking-widest italic">{t('dashboard.company.whatsapp')}</label>
                        <input
                          id="company_whatsapp"
                          type="tel"
                          inputMode="tel"
                          dir="ltr"
                          autoComplete="tel"
                          placeholder={t('dashboard.company.whatsappPlaceholder')}
                          value={companyInfo.whatsapp}
                          onChange={(e) => setCompanyInfo({...companyInfo, whatsapp: e.target.value})}
                          aria-describedby="company_whatsapp_help"
                          className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold outline-none"
                        />
                        <p id="company_whatsapp_help" className="text-xs text-gray-500">{t('dashboard.company.whatsappHelp')}</p>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label htmlFor="company_bio" className="text-xs font-black text-primary uppercase tracking-widest italic">{t('dashboard.company.bio')}</label>
                     <textarea
                        id="company_bio"
                        rows={4}
                        value={companyInfo.bio}
                        onChange={(e) => setCompanyInfo({...companyInfo, bio: e.target.value})}
                        className="w-full bg-gray-50 border-none px-8 py-6 rounded-2xl text-sm font-medium outline-none resize-none"
                     />
                  </div>
                  <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-100 pt-8">
                     <legend className="text-sm font-black text-primary mb-4">{t('dashboard.company.showcase')}</legend>
                     <div className="space-y-2">
                        <label htmlFor="company_year" className="text-xs font-bold text-gray-600">{t('company.foundedYear')}</label>
                        <input id="company_year" type="number" min={1900} max={new Date().getFullYear()} inputMode="numeric"
                          value={companyInfo.founded_year} onChange={(e) => setCompanyInfo({ ...companyInfo, founded_year: e.target.value })}
                          className="w-full bg-gray-50 border-none px-5 py-3 rounded-xl text-sm font-bold outline-none" />
                     </div>
                     <div className="space-y-2">
                        <label htmlFor="company_employees" className="text-xs font-bold text-gray-600">{t('company.employees')}</label>
                        <select id="company_employees" value={companyInfo.employees} onChange={(e) => setCompanyInfo({ ...companyInfo, employees: e.target.value })}
                          className="w-full bg-gray-50 border-none px-5 py-3 rounded-xl text-sm font-bold outline-none">
                          <option value="">—</option>
                          {['1-9', '10-49', '50-249', '250+'].map((v) => <option key={v} value={v}>{t('company.employeesValue', { value: v })}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label htmlFor="company_website" className="text-xs font-bold text-gray-600">{t('company.website')}</label>
                        <input id="company_website" type="text" dir="ltr" placeholder="www.exemple.dz" value={companyInfo.website}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                          className="w-full bg-gray-50 border-none px-5 py-3 rounded-xl text-sm font-bold outline-none" />
                     </div>
                     <div className="space-y-2">
                        <label htmlFor="company_contact_phone" className="text-xs font-bold text-gray-600">{t('company.phone')}</label>
                        <input id="company_contact_phone" type="tel" dir="ltr" placeholder="+213 23 00 00 00" value={companyInfo.contact_phone}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, contact_phone: e.target.value })}
                          className="w-full bg-gray-50 border-none px-5 py-3 rounded-xl text-sm font-bold outline-none" />
                     </div>
                     <div className="space-y-2 md:col-span-2">
                        <label htmlFor="company_contact_email" className="text-xs font-bold text-gray-600">{t('company.email')}</label>
                        <input id="company_contact_email" type="email" dir="ltr" placeholder="contact@entreprise.dz" value={companyInfo.contact_email}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, contact_email: e.target.value })}
                          className="w-full bg-gray-50 border-none px-5 py-3 rounded-xl text-sm font-bold outline-none" />
                     </div>
                     <div className="space-y-2 md:col-span-3">
                        <label htmlFor="company_certs" className="text-xs font-bold text-gray-600">{t('company.certifications')}</label>
                        <input id="company_certs" type="text" placeholder="ISO 9001, ISO 14001, CE…" value={companyInfo.certifications}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, certifications: e.target.value })}
                          className="w-full bg-gray-50 border-none px-5 py-3 rounded-xl text-sm font-bold outline-none" />
                        <p className="text-xs text-gray-500">{t('dashboard.company.certificationsHelp')}</p>
                     </div>
                     <div className="space-y-2 md:col-span-3">
                        <p className="text-xs font-bold text-gray-600">{t('company.gallery')} ({companyInfo.gallery.length}/{GALLERY_MAX})</p>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                          {companyInfo.gallery.map((url) => (
                            <div key={url} className="relative aspect-square overflow-hidden rounded-lg border border-gray-100">
                              <img src={url} alt="" className="h-full w-full object-cover" />
                              <button type="button" aria-label={t('addProduct.removePhoto')}
                                onClick={() => setCompanyInfo((prev) => ({ ...prev, gallery: prev.gallery.filter((g) => g !== url) }))}
                                className="absolute top-1 end-1 rounded bg-white/90 p-0.5 text-red-500 shadow"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          ))}
                          {companyInfo.gallery.length < GALLERY_MAX && (
                            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 cursor-pointer hover:border-secondary hover:text-secondary">
                              {uploadingGallery ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                              <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={t('company.gallery')}
                                onChange={(e) => { uploadGallery(e.target.files); e.target.value = ''; }} />
                            </label>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{t('dashboard.company.galleryHelp')}</p>
                     </div>
                  </fieldset>
                  <div className="pt-4">
                     <button type="submit" disabled={isLoading || uploadingGallery} className="bg-primary text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-secondary transition-all flex items-center space-x-2">
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>{t('dashboard.company.save')}</span>
                     </button>
                  </div>
               </form>
            </div>
          </motion.div>
        );
    }
  };

  const menuItems = [
    { id: 'overview', name: t('dashboard.menu.overview'), icon: LayoutDashboard },
    { id: 'profile', name: t('dashboard.menu.profile'), icon: User },
    { id: 'messages', name: t('dashboard.menu.messages'), icon: MessageSquare },
    { id: 'products', name: t('dashboard.menu.products'), icon: Package, roles: ['fournisseur', 'exposant'] },
    { id: 'company', name: t('dashboard.menu.company'), icon: Building2, roles: ['fournisseur', 'exposant'] },
    { id: 'favorites', name: t('dashboard.menu.favorites'), icon: Heart, roles: ['acheteur'] },
    { id: 'ads', name: t('dashboard.menu.ads'), icon: Zap },
    { id: 'subscription', name: t('dashboard.menu.subscription'), icon: CreditCard },
    { id: 'catalogues', name: t('dashboard.menu.catalogues'), icon: FileText, roles: ['fournisseur', 'exposant'] },
    { id: 'stats', name: t('dashboard.menu.stats'), icon: BarChart3, roles: ['fournisseur', 'exposant'] },
    { id: 'integrations', name: t('dashboard.menu.integrations'), icon: Plug, roles: ['fournisseur', 'exposant', 'acheteur'] },
    { id: 'admin', name: t('dashboard.menu.admin'), icon: ShieldCheck, isExternal: true, roles: ['admin'] },
  ].filter(item => !item.roles || item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen bg-neutral-bg flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 hidden lg:flex flex-col sticky top-20 h-[calc(100vh-80px)]">
        <div className="p-6">
          <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-2xl mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {user?.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary truncate">{user?.company}</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{roleLabel(user?.role)}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              const path = item.id === 'admin' ? '/extranet' : 
                          item.id === 'overview' ? '/dashboard' : 
                          `/dashboard?tab=${item.id}`;

              return (
                <Link
                  key={item.id}
                  to={path}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                    isActive 
                      ? "bg-primary text-white shadow-lg" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-primary"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-white" : "text-gray-500 group-hover:text-secondary"
                  )} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('dashboard.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-primary">{t('dashboard.title')}</h1>
              <p className="text-sm text-gray-500">{t('dashboard.welcome', { name: user?.name })}</p>
            </div>
            
            <div className={cn("flex-1 max-w-md hidden", activeTab === 'products' && "xl:block")}>
               <div className="relative group">
                  <Search className="absolute start-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-secondary transition-colors" />
                  <input 
                    type="text" 
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder={t('dashboard.searchPlaceholder')}
                    aria-label={t('dashboard.searchPlaceholder')}
                    className="w-full bg-white border border-gray-100 px-16 py-4 rounded-2xl text-xs font-bold outline-none focus:border-secondary focus:shadow-xl transition-all"
                  />
               </div>
            </div>

            <div className="flex items-center space-x-3">
              {user?.role === 'fournisseur' && (
                <Link
                  to="/dashboard?tab=subscription"
                  onClick={() => setActiveTab('subscription')}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 transition-all",
                    currentPlan && currentPlan !== 'free' ? "bg-success/10 text-success hover:bg-success/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full", currentPlan && currentPlan !== 'free' ? "bg-success animate-pulse" : "bg-gray-400")} />
                  <span>{t(`dashboard.planBadge.${currentPlan || 'free'}`, { defaultValue: t('dashboard.planBadge.free') })}</span>
                </Link>
              )}
              {user?.role === 'fournisseur' && (
                <button onClick={() => setShowProductForm(true)} className="btn-primary py-2 px-4 text-sm flex items-center space-x-2">
                   <Plus className="h-4 w-4" />
                   <span>{t('dashboard.addProduct')}</span>
                </button>
              )}
            </div>
          </div>

          {!user?.isVerified && (user?.role === 'fournisseur' || user?.role === 'exposant') && (
            <motion.div 
               initial={{ opacity: 0, y: -10 }} 
               animate={{ opacity: 1, y: 0 }} 
               className={`mb-8 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  user?.companyStatus === 'pending' ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'
               }`}
            >
               <div className="flex items-start space-x-4">
                  <div className={`p-3 bg-white rounded-2xl shadow-sm shrink-0 ${
                     user?.companyStatus === 'pending' ? 'text-blue-500' : 'text-orange-500'
                  }`}>
                     {user?.companyStatus === 'pending' ? <Building2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                  </div>
                  <div>
                     <h3 className="font-black text-primary text-sm mt-1">
                       {user?.companyStatus === 'pending' ? t('dashboard.kycBanner.pendingTitle') : t('dashboard.kycBanner.requiredTitle')}
                     </h3>
                     <p className="text-xs text-gray-600 mt-1">
                       {user?.companyStatus === 'pending' 
                        ? t('dashboard.kycBanner.pendingText')
                        : t('dashboard.kycBanner.requiredText')}
                     </p>
                  </div>
               </div>
               {user?.companyStatus !== 'pending' && (
                  <Link to="/kyc-upload" className="bg-primary text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-secondary transition-all whitespace-nowrap shadow-lg shrink-0">
                     {t('dashboard.kycBanner.submit')}
                  </Link>
               )}
            </motion.div>
          )}

          {/* Main View Area */}
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </main>

      {/* Product Form Modal */}
      <AddProduct
        isOpen={showProductForm}
        onClose={() => setShowProductForm(false)}
        onSuccess={(addedProd) => setProducts(prev => [addedProd, ...prev])}
      />

      {/* Ad Space Request Form Modal */}
      <AnimatePresence>
        {showAdForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 md:p-12 overflow-y-auto">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-primary mb-2">{t('dashboard.adForm.title')}</h2>
                    <p className="text-gray-500 font-medium">{t('dashboard.adForm.subtitle')}</p>
                  </div>
                  <button 
                    onClick={() => setShowAdForm(false)}
                    aria-label={t('dashboard.adForm.close')}
                    className="p-3 bg-gray-50 text-gray-500 hover:text-red-500 rounded-full transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <label htmlFor="ad_name" className="text-xs font-black text-primary uppercase tracking-widest italic">{t('dashboard.adForm.name')}</label>
                    <input 
                      id="ad_name"
                      type="text" 
                      value={adFormData.name}
                      onChange={e => setAdFormData({...adFormData, name: e.target.value})}
                      placeholder={t('dashboard.adForm.namePlaceholder')}
                      className="w-full bg-gray-50 border-none px-6 py-5 rounded-2xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary uppercase tracking-widest italic">{t('dashboard.adForm.placement')}</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex flex-col p-4 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-gray-200 cursor-pointer transition-all">
                        <div className="flex items-center space-x-3 mb-2">
                          <input 
                            type="radio" 
                            name="ad_type" 
                            checked={adFormData.type === 'Bannière Accueil'}
                            onChange={() => setAdFormData({...adFormData, type: 'Bannière Accueil'})}
                            className="text-secondary" 
                          />
                          <span className="text-sm font-bold text-primary">{t('dashboard.adForm.homeBanner')}</span>
                        </div>
                        <span className="text-xs text-gray-500 ms-7">{t('dashboard.adForm.homeBannerText')}</span>
                      </label>
                      <label className="flex flex-col p-4 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-gray-200 cursor-pointer transition-all">
                        <div className="flex items-center space-x-3 mb-2">
                          <input 
                            type="radio" 
                            name="ad_type" 
                            checked={adFormData.type === 'Encart Annuaire'}
                            onChange={() => setAdFormData({...adFormData, type: 'Encart Annuaire'})}
                            className="text-secondary" 
                          />
                          <span className="text-sm font-bold text-primary">{t('dashboard.adForm.directorySlot')}</span>
                        </div>
                        <span className="text-xs text-gray-500 ms-7">{t('dashboard.adForm.directorySlotText')}</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary uppercase tracking-widest italic">{t('dashboard.adForm.visual')}</label>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-2xl p-5">{t('dashboard.adForm.visualText')}</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="ad_url" className="text-xs font-black text-primary uppercase tracking-widest italic">{t('dashboard.adForm.url')}</label>
                    <input 
                      id="ad_url"
                      type="url" 
                      value={adFormData.url}
                      onChange={e => setAdFormData({...adFormData, url: e.target.value})}
                      placeholder={t('dashboard.adForm.urlPlaceholder')}
                      className="w-full bg-gray-50 border-none px-6 py-5 rounded-2xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="ad_duration" className="text-xs font-black text-primary uppercase tracking-widest italic">{t('dashboard.adForm.duration')}</label>
                    <select 
                      id="ad_duration"
                      value={adFormData.duration}
                      onChange={e => setAdFormData({...adFormData, duration: e.target.value})}
                      className="w-full bg-gray-50 border-none px-6 py-5 rounded-2xl text-xs font-black uppercase tracking-widest outline-none">
                      <option value="1 Semaine">{t('dashboard.adForm.duration1w')}</option>
                      <option value="1 Mois">{t('dashboard.adForm.duration1m')}</option>
                      <option value="3 Mois">{t('dashboard.adForm.duration3m')}</option>
                    </select>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex justify-end space-x-4">
                    <button 
                      onClick={() => setShowAdForm(false)}
                      className="px-8 py-4 rounded-2xl text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-colors"
                    >
                      {t('dashboard.adForm.cancel')}
                    </button>
                    <button 
                      onClick={submitAd}
                      disabled={isLoading}
                      className="bg-secondary text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center space-x-3"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span>{t('dashboard.adForm.submit')}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Notification Feedback */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={cn(
              "fixed bottom-10 start-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl z-[101] flex items-center space-x-4 border",
              notification.type === 'success' ? "bg-emerald-500 text-white border-emerald-400" : "bg-red-500 text-white border-red-400"
            )}
          >
            {notification.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <span className="text-xs font-black uppercase tracking-widest">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
