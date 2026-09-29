import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { CheckCircle, Loader2, Mail, MessageSquare, RotateCcw } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { adminFetch, formatDate } from '../adminApi';

const STATUS: Record<string, { label: string; className: string }> = {
  new: { label: 'Nouveau', className: 'bg-secondary text-white' },
  in_progress: { label: 'En cours', className: 'bg-blue-50 text-blue-600' },
  closed: { label: 'Traité', className: 'bg-emerald-50 text-emerald-600' },
};

const FILTERS = [
  { id: 'new', label: 'Nouveaux' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'closed', label: 'Traités' },
  { id: '', label: 'Tous' },
];

const SUBJECTS: Record<string, string> = {
  support: 'Support technique',
  sales: 'Commercial / Premium',
  partnership: 'Partenariat',
  other: 'Autre demande',
};

// Boîte de réception du formulaire de contact (/contact).
export default function GovSupport({ state }: { state: any }) {
  const { showNotify } = state;
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('new');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['admin-support', filter],
    queryFn: async () => (await adminFetch(`/api/admin/support/messages${filter ? `?status=${filter}` : ''}`)).data || [],
  });

  const selected = messages.find((m: any) => m.id === selectedId) || null;

  useEffect(() => {
    setNote(selected?.admin_note || '');
  }, [selected?.id]);

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, string> }) =>
      adminFetch(`/api/admin/support/messages/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: (_d, vars) => {
      showNotify(vars.body.status === 'closed' ? 'Demande marquée comme traitée.' : 'Demande mise à jour.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-support'] });
      if (vars.body.status && vars.body.status !== filter && filter) setSelectedId(null);
    },
    onError: (err: Error) => showNotify(err.message, 'error'),
  });

  const update = (body: Record<string, string>) => selected && updateMutation.mutate({ id: selected.id, body });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-primary uppercase italic">Support</h3>
        <p className="text-gray-500 mt-2 text-sm">Messages reçus via le formulaire de contact du site.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setSelectedId(null); }}
            className={cn('px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest', filter === f.id ? 'bg-primary text-white' : 'bg-white border border-gray-100 text-gray-500 hover:text-primary')}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <ul className="xl:col-span-2 bg-white rounded-[32px] border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden self-start">
          {isLoading && <li className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-gray-400" /></li>}
          {!isLoading && messages.length === 0 && (
            <li className="p-8 text-center text-sm text-gray-500">Aucun message dans cette catégorie.</li>
          )}
          {messages.map((m: any) => (
            <li key={m.id}>
              <button
                onClick={() => setSelectedId(m.id)}
                className={cn('w-full text-start p-5 hover:bg-gray-50', selectedId === m.id && 'bg-gray-50')}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-bold text-sm text-primary truncate">{m.name}</span>
                  <span className="text-[10px] text-gray-500 shrink-0">{formatDate(m.created_at)}</span>
                </div>
                <p className="text-[11px] text-gray-500">{SUBJECTS[m.subject] || m.subject || 'Sans sujet'}</p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{m.message}</p>
              </button>
            </li>
          ))}
        </ul>

        <div className="xl:col-span-3">
          {!selected ? (
            <div className="bg-white p-12 rounded-[32px] border border-gray-100 shadow-sm text-center text-gray-500">
              <MessageSquare className="h-10 w-10 mx-auto mb-4 text-gray-300" />
              Sélectionnez un message pour le lire.
            </div>
          ) : (
            <article className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
              <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-black text-primary">{SUBJECTS[selected.subject] || selected.subject || 'Sans sujet'}</h4>
                  <p className="text-sm text-gray-600">{selected.name} — <a href={`mailto:${selected.email}`} className="text-secondary hover:underline">{selected.email}</a></p>
                  <p className="text-[11px] text-gray-500">Reçu le {formatDate(selected.created_at)}</p>
                </div>
                <span className={cn('px-3 py-1 rounded-full text-[10px] font-black self-start', STATUS[selected.status]?.className)}>{STATUS[selected.status]?.label}</span>
              </header>

              <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-5 rounded-2xl">{selected.message}</p>

              <div className="space-y-2">
                <label htmlFor="support_note" className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Note interne</label>
                <textarea
                  id="support_note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm resize-none"
                  placeholder="Suite donnée, personne en charge…"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent('Re : votre message à Algeria Industry')}`}
                  onClick={() => selected.status === 'new' && update({ status: 'in_progress' })}
                  className="px-5 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" /> Répondre par e-mail
                </a>
                <button
                  disabled={updateMutation.isPending || note === (selected.admin_note || '')}
                  onClick={() => update({ admin_note: note })}
                  className="px-5 py-3 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-primary disabled:opacity-50"
                >
                  Enregistrer la note
                </button>
                {selected.status !== 'closed' ? (
                  <button
                    disabled={updateMutation.isPending}
                    onClick={() => update({ status: 'closed', admin_note: note })}
                    className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" /> Marquer comme traité
                  </button>
                ) : (
                  <button
                    disabled={updateMutation.isPending}
                    onClick={() => update({ status: 'in_progress' })}
                    className="px-5 py-3 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" /> Rouvrir
                  </button>
                )}
              </div>
            </article>
          )}
        </div>
      </div>
    </motion.div>
  );
}
