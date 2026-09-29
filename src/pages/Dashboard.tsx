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
  FileText,
  Heart,
  Info,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquare,
  Package,
  Phone,
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
import { useAuth } from '../context/AuthContext';
import SubscriptionPanel from '../components/SubscriptionPanel';
import TwoFactorSettings from '../components/TwoFactorSettings';
import { cn, generateSlugUrl } from '../lib/utils';


const productCategories = [
  {
    id: 1,
    name: 'Équipements Industriels',
    subCategories: [
      { id: 101, name: 'Machines-Outils' },
      { id: 102, name: 'Pompes & Vannes' }
    ]
  },
  {
    id: 2,
    name: 'Matières Premières',
    subCategories: [
      { id: 201, name: 'Métaux' },
      { id: 202, name: 'Chimie' }
    ]
  }
];

const PLAN_BADGES: Record<string, string> = {
  free: 'Offre gratuite',
  basic: 'Abonnement Basic actif',
  pro: 'Abonnement Pro actif',
  founder: 'Membre fondateur',
};

const Dashboard = () => {
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

  const [companyInfo, setCompanyInfo] = useState({ name: '', bio: '', wilaya: '' });

  useEffect(() => {
    const loadCompany = async () => {
      if (!user?.company_id) return;
      try {
        const res = await fetch(`/api/companies/${user.company_id}`);
        if (res.ok) {
          const c = await res.json();
          setCompanyInfo({ name: c.name || '', bio: c.description || '', wilaya: c.wilaya || '' });
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
      showNotify("Aucune entreprise n'est rattachée à votre compte.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/companies/${user.company_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyInfo.name, description: companyInfo.bio, wilaya: companyInfo.wilaya || undefined })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Erreur lors de la mise à jour.');
      }
      showNotify("Informations entreprise mises à jour.", "success");
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
        showNotify("Votre demande d'espace pub a été envoyée pour validation.", "success");
      } else {
        showNotify("Erreur lors de la soumission", "error");
      }
    } catch (err) {
      showNotify("Erreur réseau", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (id: number | string) => {
    try {
      await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
      setFavorites(prev => prev.filter(f => f.id !== id));
      showNotify("Favoris supprimé.");
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
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour du profil.');
      if (data.user) setUser(data.user);
      showNotify("Profil mis à jour avec succès.", "success");
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
      a.download = 'mes-donnees-algeria-industry.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showNotify("L'export a échoué. Veuillez réessayer.", "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Supprimer définitivement votre compte et toutes vos données ? Cette action est irréversible.')) return;
    try {
      const res = await fetch('/api/users/me', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setUser(null);
      navigate('/');
    } catch {
      showNotify("La suppression a échoué. Contactez le support.", "error");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(globalSearch.toLowerCase()) || 
    p.cat.toLowerCase().includes(globalSearch.toLowerCase())
  );

  const renderContent = () => {
    if (!user) return null;
    switch(activeTab) {
      case 'overview':
        const kycLabels: Record<string, string> = { none: 'À faire', pending: 'En cours', approved: 'Approuvé', rejected: 'Refusé' };
        const stats = (user.role === 'fournisseur' || user.role === 'exposant') ? [
          { label: 'Produits publiés', value: apiStats?.metrics?.items || 0, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Messages', value: apiStats?.metrics?.messages || 0, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Vérification KYC', value: kycLabels[user.kycStatus || 'none'], icon: ShieldCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
        ] : [
          { label: 'Messages', value: apiStats?.metrics?.messages || 0, icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Favoris', value: favorites.length, icon: Heart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ];

        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
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
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-primary text-lg">
                    {user.role === 'fournisseur' ? 'Contacts reçus' : 'Messages échangés'}
                  </h3>
                  <div className="flex bg-gray-50 p-1 rounded-lg">
                    <button 
                      onClick={() => setChartTimeframe('6m')}
                      className={cn("px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all", chartTimeframe === '6m' ? "bg-white shadow-sm text-primary" : "text-gray-400 hover:text-primary")}
                    >
                      6 mois
                    </button>
                    <button 
                      onClick={() => setChartTimeframe('1y')}
                      className={cn("px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all", chartTimeframe === '1y' ? "bg-white shadow-sm text-primary" : "text-gray-400 hover:text-primary")}
                    >
                      1 an
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
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-primary text-lg mb-6">Prochaines actions</h3>
                <div className="space-y-3">
                  {(user.role === 'fournisseur' || user.role === 'exposant') && user.kycStatus !== 'approved' && user.kycStatus !== 'pending' && (
                    <Link to="/kyc-upload" className="flex items-center justify-between p-4 rounded-2xl border border-orange-100 bg-orange-50 text-orange-700 text-sm font-bold">
                      <span>Faire vérifier mon entreprise (KYC)</span>
                      <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                  )}
                  {(user.role === 'fournisseur' || user.role === 'exposant') && user.kycStatus === 'approved' && products.length === 0 && (
                    <button onClick={() => setActiveTab('products')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 text-sm font-bold text-primary hover:border-secondary">
                      <span>Publier mon premier produit</span>
                      <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                    </button>
                  )}
                  <button onClick={() => setActiveTab('messages')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 text-sm font-bold text-primary hover:border-secondary">
                    <span>Ouvrir la messagerie</span>
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  </button>
                  <Link to="/directory" className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 text-sm font-bold text-primary hover:border-secondary">
                    <span>Parcourir l'annuaire</span>
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
            className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm max-w-4xl"
          >
            <div className="flex items-center space-x-6 rtl:space-x-reverse mb-12">
               <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center text-primary font-black text-3xl shrink-0">
                  {(profileInfo.name || '?').charAt(0)}
               </div>
               <div>
                  <h3 className="text-xl font-black text-primary uppercase italic">{profileInfo.name}</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{user.role}</p>
               </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label htmlFor="profile_name" className="text-[10px] font-black text-primary uppercase tracking-widest italic">Nom complet</label>
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
                  <label htmlFor="profile_email" className="text-[10px] font-black text-primary uppercase tracking-widest italic">Email professionnel</label>
                  <input
                    id="profile_email"
                    type="email"
                    value={profileInfo.email}
                    readOnly
                    className="w-full px-6 py-4 bg-gray-100 border-none rounded-2xl outline-none font-bold text-sm text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profile_company" className="text-[10px] font-black text-primary uppercase tracking-widest italic">Entreprise</label>
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
                   <h4 className="text-[10px] font-black text-primary uppercase italic mb-1">Sécurité</h4>
                   <Link to="/forgot-password" className="text-[9px] font-black text-secondary hover:underline uppercase tracking-widest">Changer mon mot de passe</Link>
                </div>
                <button type="submit" disabled={isLoading} className="bg-primary text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-secondary transition-all flex items-center space-x-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Sauvegarder les changements</span>}
                </button>
              </div>
            </form>

            <div className="mt-12 pt-8 border-t border-gray-100">
              <h4 className="text-[10px] font-black text-primary uppercase italic mb-2">Mes données personnelles</h4>
              <p className="text-xs text-gray-500 mb-4">Conformément à la loi 18-07, vous pouvez exporter ou supprimer vos données à tout moment.</p>
              <div className="flex flex-wrap gap-4">
                <button type="button" onClick={handleExportData} className="px-6 py-3 rounded-2xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-primary hover:border-secondary">
                  Exporter mes données
                </button>
                {user.role !== 'admin' && (
                  <button type="button" onClick={handleDeleteAccount} className="px-6 py-3 rounded-2xl border border-red-200 bg-red-50 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-100">
                    Supprimer mon compte
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
              <div key={fav.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm group hover:shadow-xl transition-all flex flex-col">
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
                      <h4 className="text-base font-black text-primary uppercase italic">{fav.name || `Favori (${fav.reference_id || fav.item_id.substring(0,8)})`}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{fav.category || fav.item_type}</p>
                      <p className="text-[9px] font-mono text-gray-400 uppercase mt-1 tracking-widest">
                         {fav.reference_id ? `REF: ${fav.reference_id}` : `ID: ${fav.item_id.substring(0,8)}`}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFavorite(fav.id)}
                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shrink-0 ms-4"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
                   <div className="flex items-center space-x-2 text-gray-500">
                      <span className="text-[10px] font-bold uppercase">{fav.location || ''}</span>
                   </div>
                   <Link 
                    to={fav.item_type === 'product' ? `/products/${generateSlugUrl(fav.name, String(fav.item_id))}` : `/directory/${generateSlugUrl(fav.name, String(fav.item_id))}`}
                    className="text-[10px] font-black text-secondary hover:underline uppercase tracking-widest flex items-center space-x-1"
                   >
                     <span>{fav.item_type === 'product' ? 'Voir produit' : 'Voir profil'}</span>
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
                 <h4 className="text-xl font-black text-primary uppercase italic mb-2">Aucun favoris</h4>
                 <p className="text-sm text-gray-500">Explorez le catalogue pour ajouter des produits à vos favoris.</p>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div>
                <h3 className="text-2xl font-black text-primary uppercase italic">Espace Publicitaire</h3>
                <p className="text-gray-500 mt-2">Gérez vos campagnes et maximisez votre visibilité sur la plateforme.</p>
              </div>
              <button 
                onClick={() => setShowAdForm(true)}
                className="bg-secondary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Demander un espace pub</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <h4 className="font-bold text-primary text-lg">Vos campagnes actives</h4>
                <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-gray-200">
                   <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                     <Zap className="h-8 w-8 text-gray-400" />
                   </div>
                   <h5 className="font-bold text-gray-900 mb-2">Aucune campagne en cours</h5>
                   <p className="text-sm text-gray-500">Vous n'avez pas de publicité active actuellement.</p>
                </div>
               
                <div className="bg-primary/5 border border-primary/10 p-6 rounded-3xl mt-4">
                   <h5 className="font-bold text-primary mb-2">Pourquoi annoncer ici ?</h5>
                   <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> Touchez des acheteurs industriels ciblés</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> Augmentez vos chances de remporter des AO</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> Bannières affichées en page d'accueil et annuaire</li>
                   </ul>
                </div>
              </div>
              
              <div className="space-y-6">
                 <h4 className="font-bold text-primary text-lg">Statistiques</h4>
                 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                       <span className="text-sm text-gray-500 font-bold">Vues (30j)</span>
                       <span className="font-black text-primary">0</span>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                       <span className="text-sm text-gray-500 font-bold">Clics (30j)</span>
                       <span className="font-black text-primary">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-sm text-gray-500 font-bold">CTR</span>
                       <span className="font-black text-primary">0.0%</span>
                    </div>
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
            className="bg-white p-12 rounded-[40px] border border-gray-100 shadow-sm text-center"
          >
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-black text-primary uppercase italic mb-2">Statistiques bientôt disponibles</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              La mesure des visites et des clics sur vos fiches est en cours de mise en place.
              En attendant, la vue d'ensemble affiche vos produits et vos messages réels.
            </p>
          </motion.div>
        );
      case 'products':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-primary uppercase italic">Mes Produits</h3>
               <button 
                 onClick={() => setShowAddProduct(true)}
                 className="bg-primary text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center space-x-2 hover:bg-secondary transition-all"
               >
                 <Package className="h-4 w-4" />
                 <span>Ajouter</span>
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {products.map(p => (
                 <div key={p.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group hover:shadow-md transition-all flex flex-col">
                   {p.file_url ? (
                     <img src={p.file_url} className="w-full h-40 object-cover rounded-2xl mb-4" alt={p.name} />
                   ) : (
                     <div className="w-full h-40 bg-gray-50 rounded-2xl mb-4 flex items-center justify-center">
                       <Package className="h-10 w-10 text-gray-300" />
                     </div>
                   )}
                   <h4 className="font-bold text-primary mb-1">{p.name}</h4>
                   <p className="text-xs text-gray-500 mb-2">{p.category}</p>
                   <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                     <span className={cn("text-[10px] font-black uppercase tracking-widest", p.status === 'Actif' ? 'text-success' : 'text-orange-500')}>{p.status}</span>
                     <div className="flex gap-2">
                       <button 
                         onClick={async () => {
                           if(window.confirm('Supprimer ce produit ?')) {
                             const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
                             if (res.ok) {
                               setProducts(products.filter(prod => prod.id !== p.id));
                             }
                           }
                         }}
                         className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                       >
                         <button 
                         onClick={() => {
                           setEditProduct(p);
                           setShowAddProduct(true);
                         }}
                         className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors me-2"
                       >
                         <Edit2 className="h-4 w-4" />
                       </button>
                       <Trash2 className="h-4 w-4" />
                       </button>
                     </div>
                   </div>
                 </div>
               ))}
               {products.length === 0 && (
                 <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <Package className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Aucun produit</p>
                    <p className="text-gray-400 text-xs mt-2 max-w-xs">Vous n'avez pas encore ajouté de produits à votre catalogue.</p>
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
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
               <div className="h-32 bg-primary relative">
                  <div className="absolute -bottom-10 start-10 w-24 h-24 bg-white rounded-[24px] border-4 border-white shadow-xl flex items-center justify-center">
                     <Building2 className="h-10 w-10 text-primary" />
                  </div>
               </div>
               <form onSubmit={handleUpdateCompany} className="p-12 pt-20 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label htmlFor="company_name" className="text-[10px] font-black text-primary uppercase tracking-widest italic">Nom de l'entreprise</label>
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
                        <label htmlFor="company_wilaya" className="text-[10px] font-black text-primary uppercase tracking-widest italic">Wilaya</label>
                        <input
                          id="company_wilaya"
                          type="text"
                          placeholder="Ex : Sétif"
                          value={companyInfo.wilaya}
                          onChange={(e) => setCompanyInfo({...companyInfo, wilaya: e.target.value})}
                          className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold outline-none"
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label htmlFor="company_bio" className="text-[10px] font-black text-primary uppercase tracking-widest italic">Description de l'activité</label>
                     <textarea
                        id="company_bio"
                        rows={4}
                        value={companyInfo.bio}
                        onChange={(e) => setCompanyInfo({...companyInfo, bio: e.target.value})}
                        className="w-full bg-gray-50 border-none px-8 py-6 rounded-3xl text-sm font-medium outline-none resize-none"
                     />
                  </div>
                  <div className="pt-4">
                     <button type="submit" disabled={isLoading} className="bg-primary text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-secondary transition-all flex items-center space-x-2">
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>Mettre à jour la fiche</span>
                     </button>
                  </div>
               </form>
            </div>
          </motion.div>
        );
    }
  };

  const menuItems = [
    { id: 'overview', name: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'profile', name: 'Mon Profil', icon: User },
    { id: 'messages', name: 'Messagerie', icon: MessageSquare },
    { id: 'products', name: 'Mes Produits', icon: Package, roles: ['fournisseur', 'exposant'] },
    { id: 'company', name: 'Ma Fiche Entreprise', icon: Building2, roles: ['fournisseur', 'exposant'] },
    { id: 'favorites', name: 'Favoris', icon: Heart, roles: ['acheteur'] },
    { id: 'ads', name: 'Publicité', icon: Zap },
    { id: 'subscription', name: 'Abonnement', icon: CreditCard },
    { id: 'stats', name: 'Statistiques', icon: BarChart3 },
    { id: 'admin', name: 'Console Pro', icon: ShieldCheck, isExternal: true, roles: ['admin'] },
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
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              const path = item.id === 'admin' ? '/extranet' : 
                          item.id === 'subscription' ? '/subscriptions' :
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
                    isActive ? "text-white" : "text-gray-400 group-hover:text-secondary"
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
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-primary">Tableau de Bord</h1>
              <p className="text-sm text-gray-500">Bienvenue, {user?.name}. Voici un résumé de votre activité.</p>
            </div>
            
            <div className="flex-1 max-w-md hidden xl:block">
               <div className="relative group">
                  <Search className="absolute start-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-secondary transition-colors" />
                  <input 
                    type="text" 
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Filtrer partout (produits, entreprises...)"
                    className="w-full bg-white border border-gray-100 px-16 py-4 rounded-[32px] text-xs font-bold outline-none focus:border-secondary focus:shadow-xl transition-all"
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
                  <span>{PLAN_BADGES[currentPlan || 'free'] || 'Offre gratuite'}</span>
                </Link>
              )}
              {user?.role === 'fournisseur' && (
                <button onClick={() => setShowProductForm(true)} className="btn-primary py-2 px-4 text-sm flex items-center space-x-2">
                   <Plus className="h-4 w-4" />
                   <span>Ajouter Produit</span>
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
                     <h3 className="font-black text-primary uppercase text-sm mt-1">
                       {user?.companyStatus === 'pending' ? 'Vérification en cours' : 'Vérification de Profil Requise (KYC)'}
                     </h3>
                     <p className="text-xs text-gray-600 mt-1">
                       {user?.companyStatus === 'pending' 
                        ? 'Vos documents légaux ont été transmis et sont actuellement en cours de vérification par nos équipes. Vous serez notifié dès que votre compte sera validé.' 
                        : 'Votre entreprise n\'est pas encore vérifiée. Vous devez soumettre vos documents légaux pour débloquer toutes les fonctionnalités et publier au catalogue.'}
                     </p>
                  </div>
               </div>
               {user?.companyStatus !== 'pending' && (
                  <Link to="/kyc-upload" className="bg-primary text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all whitespace-nowrap shadow-lg shrink-0">
                     Transmettre mes documents
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
        productCategories={productCategories}
      />

      {/* Ad Space Request Form Modal */}
      <AnimatePresence>
        {showAdForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white max-w-2xl w-full rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 md:p-12 overflow-y-auto">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-primary uppercase italic mb-2">Demande d'Espace Pub</h2>
                    <p className="text-gray-500 font-medium">Bostez votre visibilité auprès des professionnels de l'industrie.</p>
                  </div>
                  <button 
                    onClick={() => setShowAdForm(false)}
                    className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest italic">Nom de la campagne</label>
                    <input 
                      type="text" 
                      value={adFormData.name}
                      onChange={e => setAdFormData({...adFormData, name: e.target.value})}
                      placeholder="Ex: Lancement produit 2026"
                      className="w-full bg-gray-50 border-none px-6 py-5 rounded-2xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest italic">Type d'emplacement</label>
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
                          <span className="text-sm font-bold text-primary">Bannière Accueil</span>
                        </div>
                        <span className="text-[10px] text-gray-500 ms-7">Visibilité maximale sur la première page</span>
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
                          <span className="text-sm font-bold text-primary">Encart Annuaire</span>
                        </div>
                        <span className="text-[10px] text-gray-500 ms-7">Ciblage précis lors des recherches B2B</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest italic">Visuel de la bannière</label>
                    <div className="mt-2 flex justify-center rounded-2xl border border-dashed border-gray-300 px-6 py-10 hover:border-secondary transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 group relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            showNotify(`Image ${e.target.files[0].name} sélectionnée`, 'success');
                          }
                        }}
                      />
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400 group-hover:text-secondary mb-3 transition-colors" aria-hidden="true" />
                        <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                          <span className="relative cursor-pointer rounded-md font-bold text-secondary focus-within:outline-none focus-within:ring-2 focus-within:ring-secondary focus-within:ring-offset-2 hover:text-secondary">
                            <span>Télécharger un fichier</span>
                          </span>
                          <p className="ps-1">ou glisser-déposer</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-500 mt-2">PNG, JPG, GIF jusqu'à 10MB</p>
                        <p className="text-xs leading-5 text-gray-500">Dimensions recommandées : 1200x300px</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest italic">URL de redirection (Optionnel)</label>
                    <input 
                      type="url" 
                      value={adFormData.url}
                      onChange={e => setAdFormData({...adFormData, url: e.target.value})}
                      placeholder="https://votre-site.com/produit"
                      className="w-full bg-gray-50 border-none px-6 py-5 rounded-2xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest italic">Durée souhaitée</label>
                    <select 
                      value={adFormData.duration}
                      onChange={e => setAdFormData({...adFormData, duration: e.target.value})}
                      className="w-full bg-gray-50 border-none px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none">
                      <option>1 Semaine</option>
                      <option>1 Mois</option>
                      <option>3 Mois</option>
                    </select>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex justify-end space-x-4">
                    <button 
                      onClick={() => setShowAdForm(false)}
                      className="px-8 py-4 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={submitAd}
                      className="bg-secondary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center space-x-3"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span>Soumettre la demande</span>
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
            <span className="text-[11px] font-black uppercase tracking-widest">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
