import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { CheckCircle, ImagePlus, Loader2, Mail, MousePointerClick, Pencil, Phone, Plus, StopCircle, X, XCircle, Zap } from 'lucide-react';
import { adminFetch, formatDate } from '../adminApi';
import { AD_PLACEMENTS } from '../../../data/adPlacements';
import { productCategories } from '../../../data/productCategories';

const PUBLISHED = ['published', 'Actif', 'approuvée', 'Approuvé'];

const PLACEMENT_LABELS: Record<string, { label: string; hint: string }> = {
  home: { label: 'Accueil', hint: 'grand bandeau' },
  catalog: { label: 'Catalogue', hint: 'produits, fiche produit, recherche, comparateur' },
  suppliers: { label: 'Fournisseurs', hint: 'annuaire, fiche entreprise' },
  content: { label: 'Contenus', hint: 'actualités, événements, catalogues PDF, ressources' },
};

const targetingLabel = (ad: any) => {
  const placements: string[] = ad.placements || [];
  const categories: string[] = ad.categories || [];
  const pages = placements.length === 0 || placements.length === AD_PLACEMENTS.length
    ? 'Toutes les pages'
    : placements.map((p) => PLACEMENT_LABELS[p]?.label || p).join(', ');
  return categories.length ? `${pages} · catégories ${categories.join(', ')}` : pages;
};

const EMPTY_FORM = {
  title: '', subtitle: '', brand_name: '', cta_label: '', url: '',
  image_url: '', logo_url: '', starts_at: '', ends_at: '', sort_order: 0, company: '',
  placements: [...AD_PLACEMENTS] as string[], categories: [] as string[],
};
type AdForm = typeof EMPTY_FORM;

// <input type="date"> ↔ ISO : début à 00:00, fin à 23:59 (heure locale).
const toDateInput = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-CA') : '');
const fromDateInput = (value: string, endOfDay: boolean) =>
  value ? new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`).toISOString() : '';

const formFromAd = (ad: any): AdForm => ({
  title: ad.title || '',
  subtitle: ad.subtitle || '',
  brand_name: ad.brand_name || ad.company || '',
  cta_label: ad.cta_label || '',
  url: ad.url || '',
  image_url: ad.image_url || '',
  logo_url: ad.logo_url || '',
  starts_at: toDateInput(ad.starts_at),
  ends_at: toDateInput(ad.ends_at),
  sort_order: ad.sort_order ?? 0,
  company: ad.company || '',
  // Vide en base = toutes les pages.
  placements: ad.placements?.length ? ad.placements : [...AD_PLACEMENTS],
  categories: ad.categories || [],
});

const periodLabel = (ad: any) => {
  if (!ad.starts_at && !ad.ends_at) return 'Sans limite de date';
  return `${ad.starts_at ? formatDate(ad.starts_at) : '…'} → ${ad.ends_at ? formatDate(ad.ends_at) : '…'}`;
};

async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch('/api/upload?bucket=product-images', { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Échec du téléversement');
  return data.url;
}

function ImageField({ label, hint, value, onChange, onError }: {
  label: string; hint: string; value: string; onChange: (url: string) => void; onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <p className="text-xs font-bold text-gray-600 mb-1">{label}</p>
      <div className="flex items-center gap-3">
        <label className="relative flex h-16 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:border-secondary">
          {busy ? <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            : value ? <img src={value} alt="" className="h-full w-full object-cover" />
            : <ImagePlus className="h-5 w-5 text-gray-500" />}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              setBusy(true);
              try { onChange(await uploadImage(file)); } catch (err: any) { onError(err.message); } finally { setBusy(false); }
            }}
          />
        </label>
        <div className="text-xs text-gray-500 space-y-1">
          <p>{hint}</p>
          {value && <button type="button" onClick={() => onChange('')} className="text-red-500 font-bold">Retirer</button>}
        </div>
      </div>
    </div>
  );
}

function AdEditor({ ad, onClose, onSaved, showNotify }: {
  ad: any | null; onClose: () => void; onSaved: () => void; showNotify: (m: string, k?: string) => void;
}) {
  const [form, setForm] = useState<AdForm>(ad ? formFromAd(ad) : EMPTY_FORM);
  const set = (key: keyof AdForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: key === 'sort_order' ? Number(e.target.value) : e.target.value }));
  const toggle = (key: 'placements' | 'categories', value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  const allPages = form.placements.length === AD_PLACEMENTS.length;

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        placements: allPages ? [] : form.placements,
        starts_at: fromDateInput(form.starts_at, false),
        ends_at: fromDateInput(form.ends_at, true),
      };
      return adminFetch(ad ? `/api/admin/ads/${ad.id}` : '/api/admin/ads', {
        method: ad ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      showNotify(ad ? 'Annonce enregistrée.' : 'Annonce créée : publiez-la pour l\'afficher.', 'success');
      onSaved();
    },
    onError: (err: Error) => showNotify(err.message, 'error'),
  });

  const field = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-secondary focus:outline-none';

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h4 className="font-bold text-primary">{ad ? 'Modifier l\'annonce' : 'Nouvelle annonce'}</h4>
          <button type="button" onClick={onClose} aria-label="Fermer" className="p-1 text-gray-500 hover:text-primary"><X className="h-5 w-5" /></button>
        </div>

        {/* Aperçu fidèle au bandeau de l'accueil */}
        <div className="relative mx-6 mt-6 h-40 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-accent text-white">
          {form.image_url && (
            <>
              <img src={form.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
            </>
          )}
          <div className="relative flex h-full items-center gap-6 px-6">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider">Annonce {form.brand_name && <span className="normal-case tracking-normal text-white/90">· {form.brand_name}</span>}</p>
              <p className="line-clamp-2 text-xl font-black leading-tight">{form.title || 'Titre de l\'annonce'}</p>
              {form.subtitle && <p className="mt-1 line-clamp-2 text-sm text-white/80">{form.subtitle}</p>}
              {form.url && <span className="mt-2 inline-block rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold">{form.cta_label || 'En savoir plus'} →</span>}
            </div>
            {form.logo_url && (
              <div className="hidden h-20 w-32 shrink-0 items-center justify-center rounded-xl bg-white p-3 sm:flex">
                <img src={form.logo_url} alt="" className="max-h-full max-w-full object-contain" />
              </div>
            )}
          </div>
        </div>

        <form
          className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2"
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        >
          <label className="md:col-span-2 text-xs font-bold text-gray-600">Titre *
            <input required minLength={2} maxLength={120} value={form.title} onChange={set('title')} className={`${field} mt-1`} />
          </label>
          <label className="md:col-span-2 text-xs font-bold text-gray-600">Sous-titre
            <input maxLength={200} value={form.subtitle} onChange={set('subtitle')} className={`${field} mt-1`} />
          </label>
          <label className="text-xs font-bold text-gray-600">Annonceur (affiché)
            <input maxLength={80} value={form.brand_name} onChange={set('brand_name')} className={`${field} mt-1`} />
          </label>
          <label className="text-xs font-bold text-gray-600">Texte du bouton
            <input maxLength={40} placeholder="En savoir plus" value={form.cta_label} onChange={set('cta_label')} className={`${field} mt-1`} />
          </label>
          <label className="md:col-span-2 text-xs font-bold text-gray-600">Lien du bouton
            <input maxLength={1000} placeholder="https://… ou /directory/…" value={form.url} onChange={set('url')} className={`${field} mt-1`} />
          </label>
          <ImageField label="Visuel de fond" hint="Paysage, 1920 × 460 px conseillé (JPG, PNG, WEBP)." value={form.image_url}
            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} onError={(m) => showNotify(m, 'error')} />
          <ImageField label="Logo" hint="Fond transparent ou blanc." value={form.logo_url}
            onChange={(url) => setForm((f) => ({ ...f, logo_url: url }))} onError={(m) => showNotify(m, 'error')} />
          <label className="text-xs font-bold text-gray-600">Début de diffusion
            <input type="date" value={form.starts_at} onChange={set('starts_at')} className={`${field} mt-1`} />
          </label>
          <label className="text-xs font-bold text-gray-600">Fin de diffusion
            <input type="date" value={form.ends_at} onChange={set('ends_at')} className={`${field} mt-1`} />
          </label>
          <fieldset className="md:col-span-2 rounded-xl border border-gray-100 p-4">
            <legend className="px-1 text-xs font-bold text-gray-600">Pages de diffusion *</legend>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
              <input
                type="checkbox"
                checked={allPages}
                onChange={() => setForm((f) => ({ ...f, placements: allPages ? [] : [...AD_PLACEMENTS] }))}
              />
              Toutes les pages
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {AD_PLACEMENTS.map((p) => (
                <label key={p} className="flex items-start gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="mt-1" checked={form.placements.includes(p)} onChange={() => toggle('placements', p)} />
                  <span><span className="font-bold">{PLACEMENT_LABELS[p].label}</span> <span className="text-xs text-gray-500">({PLACEMENT_LABELS[p].hint})</span></span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="md:col-span-2 rounded-xl border border-gray-100 p-4">
            <legend className="px-1 text-xs font-bold text-gray-600">Ciblage par catégorie produit (facultatif)</legend>
            <p className="mb-2 text-xs text-gray-500">
              Sans case cochée, l'annonce s'affiche sur toutes les pages choisies. Avec des catégories, elle n'apparaît que sur les produits,
              listes filtrées, comparateur et fiches entreprises de ces catégories (pas sur l'accueil ni les contenus).
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {productCategories.map((g) => (
                <label key={g.id} className="flex items-start gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="mt-1" checked={form.categories.includes(g.id)} onChange={() => toggle('categories', g.id)} />
                  <span><span className="font-bold">{g.id}</span> · {g.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="text-xs font-bold text-gray-600">Ordre d'affichage (0 = en premier)
            <input type="number" min={0} max={999} value={form.sort_order} onChange={set('sort_order')} className={`${field} mt-1`} />
          </label>
          <div className="md:col-span-2 flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
            {form.placements.length === 0 && <p className="me-auto self-center text-xs font-bold text-red-500">Choisissez au moins une page.</p>}
            <button type="submit" disabled={save.isPending || form.placements.length === 0} className="btn-primary">
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GovAds({ state }: { state: any }) {
  const { showNotify } = state;
  const queryClient = useQueryClient();
  // undefined = fermé, null = nouvelle annonce, objet = annonce à modifier
  const [editing, setEditing] = useState<any | null | undefined>(undefined);

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-primary">Gestion des publicités</h3>
          <p className="text-gray-500 mt-2 text-sm">
            Une campagne publiée apparaît dans le bandeau des pages choisies (accueil, catalogue, fournisseurs, contenus), pendant sa période de diffusion. Sans campagne, le bandeau présente la plateforme (inscription, offre fondateur, « Votre annonce ici »).
          </p>
        </div>
        <button type="button" onClick={() => setEditing(null)} className="btn-primary shrink-0">
          <Plus className="h-4 w-4" /> Nouvelle annonce
        </button>
      </div>

      {editing !== undefined && (
        <AdEditor
          ad={editing}
          showNotify={showNotify}
          onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); queryClient.invalidateQueries({ queryKey: ['admin-ads'] }); }}
        />
      )}

      {isLoading ? (
        <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin inline text-gray-500" /></div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <section className="xl:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-primary mb-6">Demandes en attente ({pending.length})</h4>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune demande en attente.</p>
            ) : (
              <ul className="space-y-4">
                {pending.map((ad: any) => (
                  <li key={ad.id} className="p-5 border border-gray-100 rounded-2xl space-y-3">
                    <div className="flex flex-col 2xl:flex-row 2xl:items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-gray-900">{ad.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {[ad.company || ad.user?.name, ad.objective === 'homepage_banner' ? 'Bandeau de l\'accueil' : ad.objective, ad.duration, `reçue le ${formatDate(ad.created_at)}`].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          onClick={() => setEditing(ad)}
                          className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 flex items-center gap-1"
                        >
                          <Pencil className="h-4 w-4" /> {ad.image_url ? 'Modifier' : 'Préparer le visuel'}
                        </button>
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
            <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h4 className="font-bold text-primary mb-6">Campagnes en ligne ({active.length})</h4>
              {active.length === 0 ? (
                <div className="bg-gray-50 p-6 text-center rounded-2xl border border-dashed border-gray-200">
                  <Zap className="h-6 w-6 text-gray-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Aucune campagne en ligne.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {active.map((ad: any) => (
                    <li key={ad.id} className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-900 line-clamp-2">{ad.title}</p>
                        <p className="text-xs text-gray-500">{ad.brand_name || ad.company || ad.user?.name}</p>
                        <p className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3">
                          <span>{periodLabel(ad)}</span>
                          <span>{targetingLabel(ad)}</span>
                          <span className="inline-flex items-center gap-1"><MousePointerClick className="h-3 w-3" /> {ad.clicks || 0} clic{(ad.clicks || 0) > 1 ? 's' : ''}</span>
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setEditing(ad)}
                          className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:text-primary"
                          title="Modifier l'annonce"
                          aria-label="Modifier l'annonce"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => statusMutation.mutate({ id: ad.id, status: 'ended' })}
                          className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:text-red-500"
                          title="Terminer la campagne"
                          aria-label="Terminer la campagne"
                        >
                          <StopCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {closed.length > 0 && (
              <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-primary mb-4">Historique</h4>
                <ul className="space-y-2 text-xs">
                  {closed.slice(0, 20).map((ad: any) => (
                    <li key={ad.id} className="flex justify-between gap-2">
                      <span className="text-gray-700">{ad.title}{ad.status === 'ended' && ` · ${ad.clicks || 0} clics`}</span>
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
