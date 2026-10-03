import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { EyeOff, FileText, Loader2, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { cn, generateSlugUrl } from '../../../lib/utils';
import { adminFetch, formatDate } from '../adminApi';

// Modération des catalogues PDF publiés par les fournisseurs : ouverture du
// fichier, retrait motivé (le fournisseur est prévenu par e-mail et voit le
// motif dans son tableau de bord), remise en ligne, suppression définitive.

const STATUS: Record<string, { label: string; className: string }> = {
  published: { label: 'En ligne', className: 'bg-emerald-50 text-emerald-600' },
  removed: { label: 'Retiré', className: 'bg-red-50 text-red-500' },
};

const FILTERS = [
  { id: '', label: 'Tous' },
  { id: 'published', label: 'En ligne' },
  { id: 'removed', label: 'Retirés' },
];

const REASONS = [
  "Contenu sans rapport avec l'activité industrielle",
  'Document vide, illisible ou corrompu',
  'Informations trompeuses ou prix non conformes',
  "Contenu protégé ou marque d'un tiers utilisée sans droit",
];

const fileSize = (bytes?: number | null) =>
  bytes ? (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`) : '';

const one = (value: any) => (Array.isArray(value) ? value[0] : value);

export default function GovCatalogues({ state }: { state: any }) {
  const { showNotify } = state;
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [removing, setRemoving] = useState<any | null>(null);
  const [reason, setReason] = useState('');

  const { data: catalogues = [], isLoading } = useQuery({
    queryKey: ['admin-catalogues', filter],
    queryFn: async () => (await adminFetch(`/api/admin/catalogues${filter ? `?status=${filter}` : ''}`)).data || [],
  });

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalogues;
    return catalogues.filter((c: any) =>
      [c.title, c.description, one(c.company)?.name, one(c.owner)?.email].some((v) => v && String(v).toLowerCase().includes(q))
    );
  }, [catalogues, search]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-catalogues'] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason: why }: { id: string; status: 'published' | 'removed'; reason?: string }) =>
      adminFetch(`/api/admin/catalogues/${id}`, { method: 'PATCH', body: JSON.stringify(status === 'removed' ? { status, reason: why } : { status }) }),
    onSuccess: (_d, vars) => {
      showNotify(vars.status === 'removed' ? 'Catalogue retiré. Le fournisseur a été prévenu.' : 'Catalogue remis en ligne.', 'success');
      setRemoving(null);
      setReason('');
      refresh();
    },
    onError: (err: Error) => showNotify(err.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/catalogues/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      showNotify('Catalogue et fichier supprimés définitivement.', 'success');
      refresh();
    },
    onError: (err: Error) => showNotify(err.message, 'error'),
  });

  const confirmDelete = (c: any) => {
    if (window.confirm(`Supprimer définitivement « ${c.title} » et son fichier ? Cette action est irréversible.`)) {
      deleteMutation.mutate(c.id);
    }
  };

  const published = catalogues.filter((c: any) => c.status === 'published').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-primary">Catalogues PDF</h3>
        <p className="text-gray-500 mt-2 text-sm">
          Les catalogues sont publiés directement par les fournisseurs vérifiés. Ouvrez-les pour contrôler leur contenu ; un retrait est motivé et le fournisseur est prévenu par e-mail.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="search"
            aria-label="Rechercher un catalogue"
            placeholder="Titre, entreprise ou e-mail du déposant…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl ps-12 pe-4 py-3 text-sm outline-none focus:border-secondary"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn('px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest', filter === f.id ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500 hover:text-primary')}
            >
              {f.label}
            </button>
          ))}
          {!filter && <span className="text-xs text-gray-500 ms-2">{published} en ligne sur {catalogues.length}</span>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50/50 text-xs font-black text-gray-500 uppercase tracking-widest">
            <tr>
              <th className="p-5 text-start">Catalogue</th>
              <th className="p-5 text-start">Entreprise</th>
              <th className="p-5 text-start">Statut</th>
              <th className="p-5 text-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-gray-500" /></td></tr>
            )}
            {!isLoading && visible.length === 0 && (
              <tr><td colSpan={4} className="p-10 text-center text-gray-500">Aucun catalogue ne correspond.</td></tr>
            )}
            {visible.map((c: any) => {
              const status = STATUS[c.status] || { label: c.status || '—', className: 'bg-gray-100 text-gray-500' };
              const company = one(c.company);
              const owner = one(c.owner);
              return (
                <tr key={c.id} className="hover:bg-gray-50/40 align-top">
                  <td className="p-5 max-w-sm">
                    <p className="font-bold text-primary">{c.title}</p>
                    {c.description && <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>}
                    <p className="text-xs text-gray-500 mt-1">{[`déposé le ${formatDate(c.created_at)}`, fileSize(c.file_size), owner?.email].filter(Boolean).join(' · ')}</p>
                  </td>
                  <td className="p-5 text-gray-600">
                    {company ? (
                      <a href={`/directory/${generateSlugUrl(company.name, company.id)}`} target="_blank" rel="noopener" className="hover:text-secondary">{company.name}</a>
                    ) : '—'}
                    {company?.wilaya ? <span className="block text-xs text-gray-500">{company.wilaya}</span> : null}
                  </td>
                  <td className="p-5">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-black', status.className)}>{status.label}</span>
                    {c.status === 'removed' && c.removal_reason && (
                      <p className="text-xs text-gray-500 mt-2 max-w-[220px]">{c.removal_reason}{c.removed_at ? ` (${formatDate(c.removed_at)})` : ''}</p>
                    )}
                  </td>
                  <td className="p-5">
                    <div className="flex justify-end gap-2">
                      <a href={c.pdf_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:text-primary" title="Ouvrir le PDF">
                        <FileText className="h-4 w-4" />
                      </a>
                      {c.status === 'published' ? (
                        <button onClick={() => { setRemoving(c); setReason(''); }} className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100" title="Retirer">
                          <EyeOff className="h-4 w-4" />
                        </button>
                      ) : (
                        <button onClick={() => statusMutation.mutate({ id: c.id, status: 'published' })} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Remettre en ligne">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => confirmDelete(c)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100" title="Supprimer définitivement">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {removing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="remove-title">
          <form
            onSubmit={(e) => { e.preventDefault(); statusMutation.mutate({ id: removing.id, status: 'removed', reason: reason.trim() }); }}
            className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 id="remove-title" className="text-lg font-black text-primary">Retirer « {removing.title} »</h4>
                <p className="text-sm text-gray-500 mt-1">Le motif est envoyé au fournisseur et affiché dans son tableau de bord.</p>
              </div>
              <button type="button" onClick={() => setRemoving(null)} className="p-1 text-gray-400 hover:text-primary" aria-label="Fermer"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border', reason === r ? 'border-secondary text-secondary bg-orange-50' : 'border-gray-200 text-gray-600 hover:border-gray-400')}
                >
                  {r}
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="removal-reason" className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Motif</label>
              <textarea
                id="removal-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                minLength={3}
                maxLength={500}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-secondary"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setRemoving(null)} className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-primary">Annuler</button>
              <button type="submit" disabled={reason.trim().length < 3 || statusMutation.isPending} className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 flex items-center gap-2">
                {statusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Retirer le catalogue
              </button>
            </div>
          </form>
        </div>
      )}
    </motion.div>
  );
}
