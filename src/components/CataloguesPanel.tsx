import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { ApiError } from '../lib/apiError';
import { formatDate } from '../lib/format';

// Catalogues PDF de l'entreprise : dépôt (10 Mo max), liste et retrait, dans
// la limite de l'offre (1 en gratuit, 5 en Basic, illimité en Pro).
const MAX_SIZE = 10 * 1024 * 1024;

const fileSize = (bytes?: number | null) =>
  bytes ? (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`) : '';

export default function CataloguesPanel({ notify }: { notify: (message: string, type?: 'success' | 'error') => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-catalogues'],
    queryFn: async () => {
      const res = await fetch('/api/catalogues/mine');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(body);
      return body as { data: any[]; limit: number | null; used: number };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error(t('cataloguesPanel.fileRequired'));
      const form = new FormData();
      form.append('file', file);
      const up = await fetch('/api/upload?bucket=product-images', { method: 'POST', body: form });
      const uploaded = await up.json().catch(() => ({}));
      if (!up.ok) throw new ApiError(uploaded, 'cataloguesPanel.uploadFailed');
      const res = await fetch('/api/catalogues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, pdf_url: uploaded.url, file_size: file.size }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(body, 'cataloguesPanel.saveFailed');
      return body;
    },
    onSuccess: () => {
      notify(t('cataloguesPanel.published'), 'success');
      setTitle('');
      setDescription('');
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['my-catalogues'] });
    },
    onError: (err: Error) => notify(err.message, 'error'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/catalogues/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new ApiError(await res.json().catch(() => ({})), 'cataloguesPanel.deleteFailed');
    },
    onSuccess: () => {
      notify(t('cataloguesPanel.deleted'), 'success');
      queryClient.invalidateQueries({ queryKey: ['my-catalogues'] });
    },
    onError: (err: Error) => notify(err.message, 'error'),
  });

  const pickFile = (f: File | null) => {
    if (f && (f.type !== 'application/pdf' || f.size > MAX_SIZE)) {
      notify(t('cataloguesPanel.invalidFile'), 'error');
      if (fileInput.current) fileInput.current.value = '';
      return;
    }
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').slice(0, 150));
  };

  if (isLoading) {
    return <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin inline text-gray-500" /></div>;
  }

  const list = data?.data || [];
  const limit = data?.limit ?? null;
  const full = limit !== null && list.length >= limit;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-primary">{t('cataloguesPanel.title')}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('cataloguesPanel.subtitle')}</p>
        </div>
        <p className="text-sm font-bold text-gray-600">
          {limit === null ? t('cataloguesPanel.usageUnlimited', { count: list.length }) : t('cataloguesPanel.usage', { used: list.length, limit })}
        </p>
      </div>

      {full ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-gray-600">{t('cataloguesPanel.limitReached')}</p>
          <Link to="/dashboard?tab=subscription" className="btn-ghost shrink-0">{t('cataloguesPanel.upgrade')}</Link>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
          className="bg-white p-6 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <label className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border-2 border-dashed border-gray-200 p-5 cursor-pointer hover:border-secondary transition-colors">
            <Upload className="h-6 w-6 text-gray-400 shrink-0" aria-hidden="true" />
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-primary truncate">{file ? file.name : t('cataloguesPanel.choose')}</span>
              <span className="block text-xs text-gray-500">{file ? fileSize(file.size) : t('cataloguesPanel.fileHint')}</span>
            </span>
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] || null)}
            />
          </label>
          <div className="md:col-span-2">
            <label htmlFor="catalogue-title" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">{t('cataloguesPanel.titleLabel')}</label>
            <input id="catalogue-title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={150}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-secondary focus:outline-none" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="catalogue-description" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">{t('cataloguesPanel.descriptionLabel')}</label>
            <textarea id="catalogue-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-secondary focus:outline-none" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={!file || title.trim().length < 3 || create.isPending} className="btn-primary disabled:opacity-50">
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('cataloguesPanel.publish')}
            </button>
          </div>
        </form>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-gray-500">{t('cataloguesPanel.empty')}</p>
      ) : (
        <ul className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-100">
          {list.map((c: any) => (
            <li key={c.id} className="flex items-center gap-4 p-5">
              <FileText className="h-6 w-6 text-gray-400 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-primary truncate">{c.title}</p>
                <p className="text-xs text-gray-500">{[formatDate(c.created_at), fileSize(c.file_size)].filter(Boolean).join(' · ')}</p>
              </div>
              <a href={c.pdf_url} target="_blank" rel="noopener noreferrer" aria-label={t('cataloguesPanel.open')} className="p-2 text-primary hover:bg-gray-50 rounded-lg">
                <Download className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => { if (window.confirm(t('cataloguesPanel.deleteConfirm'))) remove.mutate(c.id); }}
                aria-label={t('cataloguesPanel.delete')}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
