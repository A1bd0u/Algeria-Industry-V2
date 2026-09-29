import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Edit2, ExternalLink, Loader2, Plus, Star, Trash2, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { adminFetch, formatDate } from '../adminApi';

interface ArticleForm {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  category: string;
  author: string;
  featured: boolean;
  status: 'published' | 'draft';
}

const EMPTY: ArticleForm = {
  title: '',
  excerpt: '',
  content: '',
  image_url: '',
  category: '',
  author: '',
  featured: false,
  status: 'draft',
};

// Gestion des articles du blog (/blog).
export default function SiteCms({ state }: { state: any }) {
  const { showNotify } = state;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ArticleForm | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['admin-articles'],
    queryFn: () => adminFetch('/api/articles/admin/all'),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-articles'] });

  const saveMutation = useMutation({
    mutationFn: (f: ArticleForm) => {
      const { id, ...body } = f;
      return adminFetch(id ? `/api/articles/${id}` : '/api/articles', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify({ ...body, excerpt: body.excerpt || undefined, category: body.category || undefined, author: body.author || undefined }),
      });
    },
    onSuccess: (_d, f) => {
      showNotify(f.status === 'published' ? 'Article publié.' : 'Brouillon enregistré.', 'success');
      setForm(null);
      refresh();
    },
    onError: (err: Error) => showNotify(err.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/articles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      showNotify('Article supprimé.', 'success');
      refresh();
    },
    onError: (err: Error) => showNotify(err.message, 'error'),
  });

  const edit = (a: any) =>
    setForm({
      id: a.id,
      title: a.title || '',
      excerpt: a.excerpt || '',
      content: a.content || '',
      image_url: a.image_url || '',
      category: a.category || '',
      author: a.author || '',
      featured: Boolean(a.featured),
      status: a.status === 'published' ? 'published' : 'draft',
    });

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('/api/upload?bucket=product-images', { method: 'POST', body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec de l'envoi");
      setForm((f) => (f ? { ...f, image_url: json.url } : f));
    } catch (err: any) {
      showNotify(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const field = 'w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-secondary';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-primary uppercase italic">Contenu du blog</h3>
          <p className="text-gray-500 mt-2 text-sm">Articles publiés sur /blog (2 articles par mois recommandés pour le référencement).</p>
        </div>
        <button onClick={() => setForm({ ...EMPTY })} className="bg-secondary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
          <Plus className="h-4 w-4" /> Nouvel article
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50/50 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            <tr>
              <th className="p-5 text-start">Article</th>
              <th className="p-5 text-start">Catégorie</th>
              <th className="p-5 text-start">Date</th>
              <th className="p-5 text-start">Statut</th>
              <th className="p-5 text-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-gray-400" /></td></tr>}
            {!isLoading && articles.length === 0 && (
              <tr><td colSpan={5} className="p-10 text-center text-gray-500">Aucun article. Créez le premier.</td></tr>
            )}
            {articles.map((a: any) => (
              <tr key={a.id} className="hover:bg-gray-50/40">
                <td className="p-5">
                  <p className="font-bold text-primary flex items-center gap-2">{a.featured && <Star className="h-3 w-3 text-secondary fill-current" />}{a.title}</p>
                  {a.excerpt && <p className="text-[11px] text-gray-500 line-clamp-1">{a.excerpt}</p>}
                </td>
                <td className="p-5 text-gray-600">{a.category || '—'}</td>
                <td className="p-5 text-gray-600">{formatDate(a.created_at)}</td>
                <td className="p-5">
                  <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', a.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500')}>
                    {a.status === 'published' ? 'Publié' : 'Brouillon'}
                  </span>
                </td>
                <td className="p-5">
                  <div className="flex justify-end gap-2">
                    {a.status === 'published' && (
                      <a href={`/blog/${a.id}`} target="_blank" rel="noopener" className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:text-primary" title="Voir sur le site">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button onClick={() => edit(a)} className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:text-secondary" title="Modifier"><Edit2 className="h-4 w-4" /></button>
                    <button
                      onClick={() => window.confirm(`Supprimer « ${a.title} » ?`) && deleteMutation.mutate(a.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                      title="Supprimer"
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Édition d'article">
          <form
            onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
            className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-primary uppercase">{form.id ? "Modifier l'article" : 'Nouvel article'}</h4>
              <button type="button" onClick={() => setForm(null)} aria-label="Fermer"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-2">
              <label htmlFor="art_title" className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Titre</label>
              <input id="art_title" required minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={field} />
            </div>
            <div className="space-y-2">
              <label htmlFor="art_excerpt" className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Résumé (affiché dans la liste et les partages)</label>
              <textarea id="art_excerpt" maxLength={500} rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className={cn(field, 'resize-none')} />
            </div>
            <div className="space-y-2">
              <label htmlFor="art_content" className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Contenu</label>
              <textarea id="art_content" required minLength={20} rows={12} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className={field} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="art_category" className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Catégorie</label>
                <input id="art_category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex : Réglementation" className={field} />
              </div>
              <div className="space-y-2">
                <label htmlFor="art_author" className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Auteur</label>
                <input id="art_author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Par défaut : votre nom" className={field} />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="art_image" className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Image de couverture</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input id="art_image" type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" className={field} />
                <label className="px-4 py-3 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-primary cursor-pointer whitespace-nowrap flex items-center gap-2">
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Téléverser
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                </label>
              </div>
              {form.image_url && <img src={form.image_url} alt="" className="h-32 rounded-xl object-cover" />}
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                Article à la une
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.status === 'published'} onChange={(e) => setForm({ ...form, status: e.target.checked ? 'published' : 'draft' })} />
                Publié sur le site
              </label>
            </div>
            <button
              type="submit"
              disabled={saveMutation.isPending || uploading}
              className="w-full bg-primary text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {form.status === 'published' ? 'Publier' : 'Enregistrer le brouillon'}
            </button>
          </form>
        </div>
      )}
    </motion.div>
  );
}
