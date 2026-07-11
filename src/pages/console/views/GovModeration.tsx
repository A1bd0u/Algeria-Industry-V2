import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { AlertTriangle, CheckCircle, ShieldCheck, X, Eye, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function GovModeration({ state }: { state: any }) {
  const { showNotify } = state;
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-moderation'],
    queryFn: async () => {
      const res = await fetch('/api/admin/moderation', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch reported content');
      const json = await res.json();
      return json.data || [];
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/moderation/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to approve');
    },
    onSuccess: () => {
      showNotify("Contenu approuvé, signalement résolu", "success");
      queryClient.invalidateQueries({ queryKey: ['admin-moderation'] });
      setSelectedReport(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/moderation/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to reject');
    },
    onSuccess: () => {
      showNotify("Contenu rejeté et supprimé", "success");
      queryClient.invalidateQueries({ queryKey: ['admin-moderation'] });
      setSelectedReport(null);
    }
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic">
            Modération <span className="text-red-500">({reports.length} Signalements)</span>
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Gérez le contenu signalé par la communauté
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden pb-20">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Raison</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-10"><p className="text-xs font-black uppercase text-gray-400 tracking-widest">Chargement...</p></td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-20">
                  <ShieldCheck className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">Aucun signalement</p>
                </td></tr>
              ) : (
                reports.map((r: any) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        {r.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-primary">{r.reason}</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 flex justify-end space-x-2">
                      <button onClick={() => setSelectedReport(r)} className="p-2 bg-gray-50 text-primary rounded-xl hover:bg-gray-100">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => approveMutation.mutate(r.id)} className="p-2 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-100">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button onClick={() => rejectMutation.mutate(r.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-gray-100"
            >
              <h4 className="text-lg font-black text-primary uppercase italic mb-4">Détails du signalement</h4>
              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Type</p>
                  <p className="font-bold text-primary">{selectedReport.type}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Cible ID</p>
                  <p className="font-bold text-primary">{selectedReport.target_id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Motif</p>
                  <p className="font-bold text-red-500">{selectedReport.reason}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setSelectedReport(null)} className="px-6 py-3 bg-gray-100 text-gray-500 font-black uppercase text-[10px] rounded-xl hover:bg-gray-200">
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
