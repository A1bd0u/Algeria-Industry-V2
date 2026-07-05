import ConsoleLayout from './console/ConsoleLayout';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Edit2,
  Eye,
  FileText,
  Filter,
  Globe,
  History,
  LayoutDashboard,
  LayoutList,
  Lock,
  MessageSquare,
  Monitor,
  MoreVertical,
  MousePointer,
  Newspaper,
  PackagePlus,
  Plus,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Settings,
  Store,
  ShieldCheck,
  Trash,
  Trash2,
  TrendingUp,
  Users,
  X,
  Zap
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { productCategories } from '../data/productCategories';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from 'recharts';
import { useTracking } from '../context/TrackingContext';
import { cn } from '../lib/utils';



const ConsolePro = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { profile, visits, events, totalTimeSpentSec, clearLogs } = useTracking();
  const [activeTab, setActiveTab] = useState('gov-overview');
  const [chartTimeframe, setChartTimeframe] = useState<'7' | '30' | '90' | '365'>('30');
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [exhibitors, setExhibitors] = useState<any[]>([
    { id: 1, name: "Sonatrach", category: "Énergie & Mines", type: "Grande Entreprise", region: "Alger", status: "Premium", added: "2023-11-20" },
    { id: 2, name: "Cevital", category: "Agroalimentaire", type: "Grande Entreprise", region: "Béjaïa", status: "Premium", added: "2023-11-22" },
    { id: 3, name: "Condor", category: "Électronique & Électroménager", type: "Moyenne Entreprise", region: "Bordj Bou Arreridj", status: "Standard", added: "2023-12-05" }
  ]);
  const [showExhibitorForm, setShowExhibitorForm] = useState(false);
  const [pendingKYC, setPendingKYC] = useState<any[]>([]);
  const [approvedKYC, setApprovedKYC] = useState<string[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resProducts, resAds, resStats] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/campaigns'),
          fetch('/api/stats/admin')
]);
        
        if (resProducts.ok) {
          const data = await resProducts.json();
          // Map backend data to match ConsolePro expectations
          const mapped = data.map((p: any) => ({
             id: p.id,
             name: p.name,
             company: p.brand || p.owner_id || 'Entreprise x',
             status: p.status || 'En attente',
             score: p.score || Math.floor(Math.random() * 20 + 80),
             ref: `#PRD-${new Date(p.created_at || Date.now()).getFullYear()}-${p.id.substring ? p.id.substring(0, 4) : p.id}`,
             region: p.region || 'Alger',
             dateAdded: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          }));
          setProducts(mapped);
        }
        
        if (resAds.ok) {
           const adsData = await resAds.json();
           setAds(adsData);
        }
        if (resStats.ok) {
           const stats = await resStats.json();
           
           const formatTrend = (trend) => {
               const val = parseFloat(trend);
               if (val > 0) return `+${val}% ce mois`;
               if (val < 0) return `${val}% ce mois`;
               return `Stable`;
           };
           
           setStatsAdmin([
             { label: 'Utilisateurs Plateforme', value: stats.users.total.toString(), trend: formatTrend(stats.users.trend), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
             { label: 'Entreprises Validées', value: stats.companies.total.toString(), trend: formatTrend(stats.companies.trend), icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
             { label: 'Produits au Catalogue', value: stats.products.total.toString(), trend: formatTrend(stats.products.trend), icon: PackagePlus, color: 'text-orange-600', bg: 'bg-orange-50' },
             { label: 'Appels d\'Offres', value: stats.tenders.total.toString(), trend: formatTrend(stats.tenders.trend), icon: FileText, color: 'text-secondary', bg: 'bg-secondary/10' },
           ]);
        }

      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, []);

  const [productSearch, setProductSearch] = useState('');
  const [productRegionFilter, setProductRegionFilter] = useState('Tous');
  const [productStatusFilter, setProductStatusFilter] = useState('Tous');
  const [productSortOrder, setProductSortOrder] = useState<'date-desc' | 'date-asc' | 'status'>('date-desc');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.ref.toLowerCase().includes(productSearch.toLowerCase()) || p.company.toLowerCase().includes(productSearch.toLowerCase());
    const matchesRegion = productRegionFilter === 'Tous' || p.region === productRegionFilter;
    const matchesStatus = productStatusFilter === 'Tous' || p.status === productStatusFilter;
    return matchesSearch && matchesRegion && matchesStatus;
  }).sort((a, b) => {
    if (productSortOrder === 'date-desc') return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    if (productSortOrder === 'date-asc') return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
    if (productSortOrder === 'status') return a.status.localeCompare(b.status);
    return 0;
  });

  const [categories, setCategories] = useState<any[]>(
    productCategories.map((c, idx) => ({
      id: idx + 1,
      name: c.name,
      subCategories: c.subCategories.map((sub, sidx) => ({ id: sidx + 100, name: sub.name }))
    }))
  );

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [newSubCatName, setNewSubCatName] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState("");


  const handleApproveProduct = (id: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'Certifié' } : p));
    showNotify("Produit validé et publié au catalogue", "success");
  };

  const handleRejectProduct = (id: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'Rejeté' } : p));
    showNotify("Produit rejeté", "error");
  };

  const handleApproveAd = async (id: string) => {
    // Optimistic update for UI
    setAds(prev => prev.map(ad => ad.id === id ? { ...ad, status: 'Actif' } : ad));
    showNotify("Publicité approuvée et programmée", "success");
    // Ideally this would make an API call to update the status in the DB
  };

  const handleRejectAd = async (id: string) => {
    // Optimistic update for UI
    setAds(prev => prev.map(ad => ad.id === id ? { ...ad, status: 'Rejetée' } : ad));
    showNotify("Demande de publicité refusée", "error");
    // Ideally this would make an API call to update the status in the DB
  };

  const handleAddCategory = () => {
    const name = window.prompt("Nom de la nouvelle catégorie :");
    if (name) {
      setCategories(prev => [...prev, { id: Date.now(), name, subCategories: [] }]);
      showNotify("Catégorie créée", "success");
    }
  };

  const handleOpenCategorySettings = (cat: any) => {
    setSelectedCategory(cat);
    setEditingCategoryName(cat.name);
    setNewSubCatName("");
  };

  const handleSaveCategorySettings = () => {
    if (selectedCategory && editingCategoryName.trim()) {
      setCategories(prev => prev.map(c => c.id === selectedCategory.id ? { ...c, name: editingCategoryName, subCategories: selectedCategory.subCategories } : c));
      showNotify("Catégorie modifiée", "success");
    }
    setSelectedCategory(null);
  };

  const handleAddSubCategory = () => {
    if (selectedCategory && newSubCatName.trim()) {
      const newSub = { id: Date.now(), name: newSubCatName.trim() };
      setSelectedCategory({ ...selectedCategory, subCategories: [...selectedCategory.subCategories, newSub] });
      setNewSubCatName("");
    }
  };

  const handleRemoveSubCategory = (subId: number) => {
    if (selectedCategory) {
      setSelectedCategory({
        ...selectedCategory,
        subCategories: selectedCategory.subCategories.filter((s: any) => s.id !== subId)
      });
    }
  };

  useEffect(() => {
    const fetchKyc = async () => {
      try {
        const res = await fetch('/api/kyc');
        if (res.ok) {
           const data = await res.json();
           setPendingKYC(data);
        }
      } catch (e) {
        console.error('Error fetching KYC:', e);
      }
    };
    fetchKyc();
  }, []);

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApproveKYC = async (id: string, name: string) => {
    try {
      await fetch(`/api/kyc/${id}/approve`, { method: 'POST' });
      setPendingKYC(prev => prev.filter(c => c.id !== id));
      setApprovedKYC(prev => [...prev, id]);
      setNotification({ message: `L'entreprise ${name} a été validée avec succès.`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {
       console.error(e);
    }
  };

  const handleRejectKYC = async (id: string, name: string, reason: string) => {
    try {
      await fetch(`/api/kyc/${id}/reject`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      setPendingKYC(prev => prev.filter(c => c.id !== id));
      setNotification({ message: `La demande de ${name} a été rejetée.`, type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {
       console.error(e);
    }
  };

  const [statsAdmin, setStatsAdmin] = useState<any[]>([
    { label: 'Utilisateurs Plateforme', value: '-', trend: '-', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Entreprises Validées', value: '-', trend: '-', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Produits au Catalogue', value: '-', trend: '-', icon: PackagePlus, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Appels d\'Offres', value: '-', trend: '-', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Revenus Mensuels', value: '-', trend: '-', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]);

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [registrationsData, setRegistrationsData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsDashboardLoading(true);
      try {
        const res = await fetch(`/api/admin/dashboard?days=${chartTimeframe}`);
        if (res.ok) {
          const data = await res.json();
          setStatsAdmin([
            { label: 'Utilisateurs Plateforme', value: data.kpis.total_users || 0, trend: data.trends?.users || '0%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: 'gov-users', tooltip: 'Nombre total d\'inscrits' },
            { label: 'Entreprises Validées', value: data.kpis.approved_companies || 0, trend: data.trends?.companies || '0%', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50', link: 'gov-companies', tooltip: 'Sociétés vérifiées et actives' },
            { label: 'Produits au Catalogue', value: data.kpis.active_products || 0, trend: data.trends?.products || '0%', icon: PackagePlus, color: 'text-orange-600', bg: 'bg-orange-50', link: 'gov-products', tooltip: 'Produits en ligne dans le catalogue' },
            { label: 'Appels d\'Offres', value: data.kpis.published_tenders || 0, trend: data.trends?.tenders || '0%', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50', link: 'gov-ads', tooltip: 'Appels d\'offres publiés' },
            { label: 'Revenus Mensuels', value: (data.kpis.total_revenue || 0).toLocaleString() + ' DZD', trend: '+8.4%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', link: 'gov-revenue', tooltip: 'Revenus générés sur la période' },
          ]);
          
          if (data.charts.registrations && data.charts.registrations.length > 0) {
            setRegistrationsData(data.charts.registrations.map((d: any) => ({ day: d.date.split('-').slice(1).join('/'), inscriptions: d.count })));
          }
          if (data.charts.revenue && data.charts.revenue.length > 0) {
            setRevenueData(data.charts.revenue.map((d: any) => ({ period: d.date.split('-').slice(1).join('/'), revenue: d.revenue })));
          }
        }
      } catch (e) {
        console.error('Error fetching admin dashboard stats:', e);
      } finally {
        setIsDashboardLoading(false);
      }
    };
    fetchDashboard();
  }, [chartTimeframe]);



  
  const consoleState = {
    activeTab, setActiveTab, chartTimeframe, setChartTimeframe, showArticleForm, setShowArticleForm,
    exhibitors, setExhibitors, showExhibitorForm, setShowExhibitorForm, pendingKYC, setPendingKYC,
    approvedKYC, setApprovedKYC, notification, setNotification, products, setProducts, ads, setAds,
    productSearch, setProductSearch, productRegionFilter, setProductRegionFilter, productStatusFilter,
    setProductStatusFilter, productSortOrder, setProductSortOrder, filteredProducts, categories,
    setCategories, selectedCategory, setSelectedCategory, newSubCatName, setNewSubCatName,
    editingCategoryName, setEditingCategoryName, handleApproveProduct, handleRejectProduct,
    handleApproveAd, handleRejectAd, handleAddCategory, handleOpenCategorySettings,
    handleSaveCategorySettings, handleAddSubCategory, handleRemoveSubCategory, showNotify,
    handleApproveKYC, handleRejectKYC, statsAdmin, revenueData, registrationsData, profile, visits, events,
    totalTimeSpentSec, clearLogs, logout, navigate, isDashboardLoading
  };

  return <ConsoleLayout state={consoleState} />;
}
export default ConsolePro;
