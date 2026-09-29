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
import { cn } from '../lib/utils';



const ConsolePro = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('gov-overview');
  const [chartTimeframe, setChartTimeframe] = useState<'7' | '30' | '90' | '365'>('30');
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [pendingKYC, setPendingKYC] = useState<any[]>([]);
  const [approvedKYC, setApprovedKYC] = useState<string[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

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

  // Les actions KYC ne retirent la demande de la liste que si le serveur a confirmé.
  const handleApproveKYC = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/kyc/${id}/approve`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Validation impossible');
      setPendingKYC(prev => prev.filter(c => c.id !== id));
      setApprovedKYC(prev => [...prev, id]);
      showNotify(`L'entreprise ${name} a été validée.`, 'success');
    } catch (e: any) {
      showNotify(e.message, 'error');
    }
  };

  const handleRejectKYC = async (id: string, name: string, reason: string) => {
    try {
      const res = await fetch(`/api/kyc/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Rejet impossible');
      setPendingKYC(prev => prev.filter(c => c.id !== id));
      showNotify(`La demande de ${name} a été rejetée.`, 'error');
    } catch (e: any) {
      showNotify(e.message, 'error');
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
            { label: 'Appels d\'Offres', value: data.kpis.published_tenders || 0, trend: data.trends?.tenders || '0%', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50', link: 'gov-overview', tooltip: 'Appels d\'offres ouverts' },
            { label: 'Revenus Mensuels', value: (data.kpis.total_revenue || 0).toLocaleString() + ' DZD', trend: '', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', link: 'gov-revenue', tooltip: 'Revenus générés sur la période' },
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
    activeTab, setActiveTab, chartTimeframe, setChartTimeframe,
    pendingKYC, setPendingKYC, approvedKYC, setApprovedKYC,
    notification, setNotification, showNotify,
    handleApproveKYC, handleRejectKYC,
    statsAdmin, revenueData, registrationsData, isDashboardLoading,
    logout, navigate
  };


  return <ConsoleLayout state={consoleState} />;
}
export default ConsolePro;
