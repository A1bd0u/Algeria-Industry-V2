import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Eye, EyeOff, Loader2, RotateCcw, Search, Trash2 } from 'lucide-react';
import { cn, generateSlugUrl } from '../../../lib/utils';
import { adminFetch, formatDate, formatDzd } from '../adminApi';

// Statuts réellement utilisés en base (voir server/routes/products.ts).
const STATUS: Record<string, { label: string; className: string }> = {
  Actif: { label: 'En ligne', className: 'bg-emerald-50 text-emerald-600' },
  active: { label: 'En ligne', className: 'bg-emerald-50 text-emerald-600' },
  Brouillon: { label: 'Brouillon', className: 'bg-gray-100 text-gray-500' },
  Inactif: { label: 'Masqué', className: 'bg-gray-100 text-gray-500' },
  'signalé': { label: 'Dépublié (signalement)', className: 'bg-orange-50 text-orange-600' },
  'rejeté': { label: 'Rejeté', className: 'bg-red-50 text-red-500' },
};

const FILTERS = [
  { id: '', label: 'Tous' },
  { id: 'Actif', label: 'En ligne' },
  { id: 'signalé', label: 'Dépubliés' },
  { id: 'rejeté', label: 'Rejetés' },
  { id: 'Brouillon', label: 'Brouillons' },
];

export default function GovProducts({ state }: { state: any }) {
  const { showNotify } = state;
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products', filter],
    queryFn: async () => (await adminFetch(`/api/admin/products${filter ? `?status=${encodeURIComponent(filter)}` : ''}`)).data || [],
  });

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p: any) =>
      [p.name, p.reference_id, p.company?.name, p.category].some((v) => v && String(v).toLowerCase().includes(q))
    );
  }, [products, search]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-products'] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminFetch(`/api/products/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    onSuccess: (_d, vars) => {
      showNotify(vars.status === 'Actif' ? 'Produit remis en ligne.' : 'Produit retiré du catalogue.', 'success');
      refresh();
    },
    onError: (err: Error) => showNotify(err.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      showNotify('Produit supprimé définitivement.', 'success');
      refresh();
    },
    onError: (err: Error) => showNotify(err.message, 'error'),
  });

  const confirmDelete = (p: any) => {
    if (window.confirm(`Supprimer définitivement « ${p.name} » ? Cette action est irréversible.`)) {
      deleteMutation.mutate(p.id);
    }
  };

  const isOnline = (status: string) => status === 'Actif' || status === 'active';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-primary uppercase italic">Catalogue produits</h3>
        <p className="text-gray-500 mt-2 text-sm">
          Les produits sont publiés directement par les fournisseurs vérifiés (KYC). Vous pouvez les retirer, les remettre en ligne ou les supprimer.
        </p>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            aria-label="Rechercher un produit"
            placeholder="Nom, référence, entreprise ou catégorie…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl ps-12 pe-4 py-3 text-sm outline-none focus:border-secondary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn('px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest', filter === f.id ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500 hover:text-primary')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50/50 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            <tr>
              <th className="p-5 text-start">Produit</th>
              <th className="p-5 text-start">Entreprise</th>
              <th className="p-5 text-start">Prix</th>
              <th className="p-5 text-start">Statut</th>
              <th className="p-5 text-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-gray-400" /></td></tr>
            )}
            {!isLoading && visible.length === 0 && (
              <tr><td colSpan={5} className="p-10 text-center text-gray-500">Aucun produit ne correspond.</td></tr>
            )}
            {visible.map((p: any) => {
              const status = STATUS[p.status] || { label: p.status || '—', className: 'bg-gray-100 text-gray-500' };
              return (
                <tr key={p.id} className="hover:bg-gray-50/40">
                  <td className="p-5">
                    <p className="font-bold text-primary">{p.name}</p>
                    <p className="text-[11px] text-gray-500">{[p.reference_id, p.category, `ajouté le ${formatDate(p.created_at)}`].filter(Boolean).join(' · ')}</p>
                  </td>
                  <td className="p-5 text-gray-600">{p.company?.name || '—'}{p.company?.wilaya ? <span className="block text-[11px] text-gray-500">{p.company.wilaya}</span> : null}</td>
                  <td className="p-5">{Number(p.price) > 0 ? formatDzd(p.price) : 'Sur devis'}</td>
                  <td className="p-5"><span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', status.className)}>{status.label}</span></td>
                  <td className="p-5">
                    <div className="flex justify-end gap-2">
                      <a href={`/products/${generateSlugUrl(p.name, p.id)}`} target="_blank" rel="noopener" className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:text-primary" title="Voir la fiche">
                        <Eye className="h-4 w-4" />
                      </a>
                      {isOnline(p.status) ? (
                        <button onClick={() => statusMutation.mutate({ id: p.id, status: 'Inactif' })} className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100" title="Retirer du catalogue">
                          <EyeOff className="h-4 w-4" />
                        </button>
                      ) : (
                        <button onClick={() => statusMutation.mutate({ id: p.id, status: 'Actif' })} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Remettre en ligne">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => confirmDelete(p)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100" title="Supprimer">
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
    </motion.div>
  );
}
