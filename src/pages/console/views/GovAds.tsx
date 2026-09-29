import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { CheckCircle, Loader2, Mail, Phone, StopCircle, XCircle, Zap } from 'lucide-react';
import { adminFetch, formatDate } from '../adminApi';

const PUBLISHED = ['published', 'Actif', 'approuvée', 'Approuvé'];

export default function GovAds({ state }: { state: any }) {
  const { showNotify } = state;
  const queryClient = useQueryClient();

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['admin-ads'],
    queryFn: async () => (await adminFetch('/api/admin/ads')).data || [],
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      adminFetch(`/api/admin/ads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
    onSuccess: (_data, vars) => {
      const messages: Record<string, string> = {
        published: 'Campagne publiée sur le site.',
        rejected: 'Demande refusée.',
        ended: 'Campagne terminée.',
      };
      showNotify(messages[vars.status] || 'Statut mis à jour.', vars.status === 'rejected' ? 'error' : 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
    },
    onError: (err: Error) => showNotify(err.message, 'error'),
  });

  const reject = (ad: any) => {
    const reason = window.prompt(`Motif du refus pour « ${ad.title} » :`);
    if (reason && reason.trim().length >= 3) {
      statusMutation.mutate({ id: ad.id, status: 'rejected', reason: reason.trim() });
    }
  };

  const pending = ads.filter((a: any) => a.status === 'en_attente');
  const active = ads.filter((a: any) => PUBLISHED.includes(a.status));
  const closed = ads.filter((a: any) => ['rejected', 'ended'].includes(a.status));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-primary uppercase italic">Gestion des publicités</h3>
        <p className="text-gray-500 mt-2 text-sm">
          Demandes reçues depuis la page « Publicité » et le tableau de bord. Une campagne publiée apparaît dans le carrousel de l'accueil.
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin inline text-gray-400" /></div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <section className="xl:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h4 className="font-bold text-primary mb-6">Demandes en attente ({pending.length})</h4>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune demande en attente.</p>
            ) : (
              <ul className="space-y-4">
                {pending.map((ad: any) => (
                  <li key={ad.id} className="p-5 border border-gray-100 rounded-2xl space-y-3">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-gray-900">{ad.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {[ad.company || ad.user?.name, ad.objective, ad.duration, `reçue le ${formatDate(ad.created_at)}`].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ id: ad.id, status: 'published' })}
                          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 flex items-center gap-1 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" /> Publier
                        </button>
                        <button
                          disabled={statusMutation.isPending}
                          onClick={() => reject(ad)}
                          className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 flex items-center gap-1 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" /> Refuser
                        </button>
                      </div>
                    </div>
                    {ad.message && <p className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded-xl">{ad.message}</p>}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                      {(ad.contact_email || ad.user?.email) && (
                        <a href={`mailto:${ad.contact_email || ad.user?.email}`} className="flex items-center gap-1 hover:text-secondary">
                          <Mail className="h-3 w-3" /> {ad.contact_email || ad.user?.email}
                        </a>
                      )}
                      {ad.contact_phone && (
                        <a href={`tel:${ad.contact_phone}`} className="flex items-center gap-1 hover:text-secondary">
                          <Phone className="h-3 w-3" /> {ad.contact_phone}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="space-y-8">
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <h4 className="font-bold text-primary mb-6">Campagnes en ligne ({active.length})</h4>
              {active.length === 0 ? (
                <div className="bg-gray-50 p-6 text-center rounded-2xl border border-dashed border-gray-200">
                  <Zap className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Aucune campagne en ligne.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {active.map((ad: any) => (
                    <li key={ad.id} className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-sm text-gray-900">{ad.title}</p>
                        <p className="text-[11px] text-gray-500">{ad.company || ad.user?.name}</p>
                      </div>
                      <button
                        onClick={() => statusMutation.mutate({ id: ad.id, status: 'ended' })}
                        className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:text-red-500"
                        title="Terminer la campagne"
                      >
                        <StopCircle className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {closed.length > 0 && (
              <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                <h4 className="font-bold text-primary mb-4">Historique</h4>
                <ul className="space-y-2 text-xs">
                  {closed.slice(0, 20).map((ad: any) => (
                    <li key={ad.id} className="flex justify-between gap-2">
                      <span className="text-gray-700">{ad.title}</span>
                      <span className={ad.status === 'rejected' ? 'text-red-500' : 'text-gray-500'} title={ad.rejection_reason || ''}>
                        {ad.status === 'rejected' ? 'Refusée' : 'Terminée'}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
