import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Edit2, Loader2, Plus, Trash2, X } from 'lucide-react';
import { adminFetch, formatDate } from '../adminApi';

interface EventForm {
  id?: string;
  title: string;
  date: string; // AAAA-MM-JJTHH:MM (champ datetime-local)
  location: string;
  organizer: string;
  description: string;
}

const EMPTY: EventForm = { title: '', date: '', location: '', organizer: '', description: '' };

// Valeur du champ datetime-local à partir d'une date ISO (heure locale).
const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Agenda publié sur /events (salons, forums, webinaires).
export default function GovEvents({ state }: { state: any }) {
  const { showNotify } = state;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventForm | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => adminFetch('/api/events'),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-events'] });

  const saveMutation = useMutation({
    mutationFn: (f: EventForm) => {
      const { id, ...body } = f;
      return adminFetch(id ? `/api/events/${id}` : '/api/events', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify({ ...body, date: new Date(body.date).toISOString() }),
      });
    },
    onSuccess: () => {
      showNotify('Événement enregistré.', 'success');
      setForm(null);
      refresh();
    },
    onError: (err: Error) => showNotify(err.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/events/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      showNotify('Événement supprimé.', 'success');
      refresh();
    },
    onError: (err: Error) => showNotify(err.message, 'error'),
  });

  const field = 'w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-secondary';
  const now = Date.now();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-primary">Événements</h3>
          <p className="text-gray-500 mt-2 text-sm">Agenda publié sur /events. Les événements passés restent consultables.</p>
        </div>
        <button onClick={() => setForm({ ...EMPTY })} className="bg-secondary text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
          <Plus className="h-4 w-4" /> Nouvel événement
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50/50 text-xs font-black text-gray-500 uppercase tracking-widest">
            <tr>
              <th className="p-5 text-start">Événement</th>
              <th className="p-5 text-start">Date</th>
              <th className="p-5 text-start">Lieu</th>
              <th className="p-5 text-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-gray-500" /></td></tr>}
            {!isLoading && events.length === 0 && (
              <tr><td colSpan={4} className="p-10 text-center text-gray-500">Aucun événement. Créez le premier.</td></tr>
            )}
            {events.map((e: any) => (
              <tr key={e.id} className="hover:bg-gray-50/40">
                <td className="p-5">
                  <p className="font-bold text-primary">{e.title}</p>
                  {e.organizer && <p className="text-xs text-gray-500">{e.organizer}</p>}
                </td>
                <td className="p-5 text-gray-600">
                  {formatDate(e.date)}
                  {e.date && new Date(e.date).getTime() < now && <span className="ms-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-black">Passé</span>}
                </td>
                <td className="p-5 text-gray-600">{e.location || '—'}</td>
                <td className="p-5">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setForm({ id: e.id, title: e.title || '', date: toLocalInput(e.date), location: e.location || '', organizer: e.organizer || '', description: e.description || '' })}
                      className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:text-secondary"
                      title="Modifier"
                      aria-label="Modifier"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => window.confirm(`Supprimer « ${e.title} » ?`) && deleteMutation.mutate(e.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                      title="Supprimer"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Édition d'événement">
          <form
            onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-primary">{form.id ? "Modifier l'événement" : 'Nouvel événement'}</h4>
              <button type="button" onClick={() => setForm(null)} aria-label="Fermer"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Titre</span>
              <input required minLength={3} maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={field} />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Date et heure</span>
                <input required type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={field} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Lieu</span>
                <input maxLength={200} placeholder="Ex : SAFEX, Alger" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={field} />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Organisateur</span>
              <input maxLength={200} value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} className={field} />
              <span className="block text-xs text-gray-500">S'il correspond au nom d'une entreprise, l'événement apparaît aussi sur sa fiche.</span>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Description</span>
              <textarea rows={5} maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={field} />
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setForm(null)} className="px-6 py-3 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest">Annuler</button>
              <button type="submit" disabled={saveMutation.isPending} className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </motion.div>
  );
}
