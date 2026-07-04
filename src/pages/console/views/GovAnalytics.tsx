/* eslint-disable */
import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';
import { Download } from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, CartesianGrid, 
  ResponsiveContainer, Tooltip, XAxis, YAxis 
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';

export default function GovAnalytics({ state }: { state: any }) {
  const { chartTimeframe, setChartTimeframe } = state;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics', chartTimeframe],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics?timeframe=${chartTimeframe}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    }
  });

  const handleExportCSV = () => {
    if (!data) return;

    // Export Registrations
    const csvRegistrations = Papa.unparse(data.registrations);
    const blob1 = new Blob([csvRegistrations], { type: 'text/csv;charset=utf-8;' });
    const url1 = URL.createObjectURL(blob1);
    const link1 = document.createElement('a');
    link1.href = url1;
    link1.setAttribute('download', `inscriptions_${chartTimeframe}.csv`);
    document.body.appendChild(link1);
    link1.click();
    
    // Export Wilayas
    const csvWilayas = Papa.unparse(data.wilayas);
    const blob2 = new Blob([csvWilayas], { type: 'text/csv;charset=utf-8;' });
    const url2 = URL.createObjectURL(blob2);
    const link2 = document.createElement('a');
    link2.href = url2;
    link2.setAttribute('download', `wilayas_${chartTimeframe}.csv`);
    document.body.appendChild(link2);
    link2.click();
    
    // Export Search Terms
    const csvSearch = Papa.unparse(data.searchTerms);
    const blob3 = new Blob([csvSearch], { type: 'text/csv;charset=utf-8;' });
    const url3 = URL.createObjectURL(blob3);
    const link3 = document.createElement('a');
    link3.href = url3;
    link3.setAttribute('download', `tendances_recherche_${chartTimeframe}.csv`);
    document.body.appendChild(link3);
    link3.click();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-xl font-black text-primary uppercase italic px-4">Synthèse Analytique</h3>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-50 p-1 rounded-lg">
            <button 
              onClick={() => setChartTimeframe('6m')}
              className={cn("px-4 py-2 rounded-md text-[10px] font-black uppercase transition-all", chartTimeframe === '6m' ? "bg-white shadow-sm text-primary" : "text-gray-400 hover:text-primary")}
            >
              6 mois
            </button>
            <button 
              onClick={() => setChartTimeframe('1y')}
              className={cn("px-4 py-2 rounded-md text-[10px] font-black uppercase transition-all", chartTimeframe === '1y' ? "bg-white shadow-sm text-primary" : "text-gray-400 hover:text-primary")}
            >
              1 an
            </button>
          </div>
          
          <button
            onClick={handleExportCSV}
            disabled={isLoading || !data}
            className="px-4 py-2 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter en CSV</span>
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
        </div>
      ) : (
        <>
          {/* New Inscriptions Chart */}
          <div className="bg-white/70 backdrop-blur-md p-8 rounded-[40px] border border-white shadow-sm font-sans text-primary">
            <h3 className="text-xs font-black uppercase tracking-widest mb-8 italic">Inscriptions par mois</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.registrations || []}>
                  <defs>
                    <linearGradient id="colorInscriptions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: '900', textTransform: 'uppercase'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: '900'}} />
                  <Tooltip 
                    contentStyle={{ background: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#0EA5E9" strokeWidth={3} fillOpacity={1} fill="url(#colorInscriptions)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/70 backdrop-blur-md p-8 rounded-[40px] border border-white shadow-sm font-sans text-primary">
              <h3 className="text-xs font-black uppercase tracking-widest mb-8 italic">Intensité par Wilaya (Top 5)</h3>
              <div className="space-y-6">
                {data?.wilayas?.map((wilaya: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black uppercase">{wilaya.name}</span>
                      <span className="text-[10px] font-bold text-gray-400">
                        {((wilaya.value / (data.totalIntents || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(wilaya.value / (chartTimeframe === '1y' ? 8500 : 4500) * 100)}%` }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: wilaya.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md p-8 rounded-[40px] border border-white shadow-sm font-sans text-primary">
              <h3 className="text-xs font-black uppercase tracking-widest mb-8 italic">Tendances de Sourcing (Search)</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.searchTerms || []}>
                    <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: '900', textTransform: 'uppercase'}} dy={10} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'rgba(0,0,0,0.02)'}}
                      contentStyle={{ background: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="volume" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="bg-primary p-12 rounded-[48px] text-white relative overflow-hidden">
              <div className="max-w-2xl relative z-10">
                 <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">Algorithme de Matching IA</h3>
                 <p className="text-sm font-medium text-white/60 leading-relaxed mb-8">Nous analysons actuellement plus de 1.2M de points de données pour optimiser les recommandations entre les acheteurs industriels et les fournisseurs certifiés.</p>
                 <div className="flex items-center space-x-12">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 text-white">Précision Recom.</p>
                      <p className="text-2xl font-black italic">94.2%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 text-white">Temps Moyen Rep.</p>
                      <p className="text-2xl font-black italic text-secondary">2.4 Jours</p>
                    </div>
                 </div>
              </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
