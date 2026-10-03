import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X, XCircle } from 'lucide-react';
import { ApiError } from '../lib/apiError';
import { formatDzd } from '../lib/format';
import { productCategories, categoryLabel } from '../data/productCategories';
import { MAX_IMPORT_ROWS, parseCsv, rowsFromTable, templateCsv, type ImportRow, type RowIssue } from '../lib/productImport';

// Import de produits en masse depuis un fichier CSV ou Excel (.xlsx) :
// modèle à télécharger, lecture dans le navigateur, aperçu ligne par ligne
// avec les erreurs, puis création en brouillon des lignes valides.

type Result = { line: number; row: ImportRow; issues: RowIssue[] };

const MAX_SIZE = 5 * 1024 * 1024;

export default function ProductImport({ onClose, onImported, notify }: {
  onClose: () => void;
  onImported: () => void;
  notify: (message: string, type?: 'success' | 'error') => void;
}) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [results, setResults] = useState<Result[] | null>(null);
  const [fileError, setFileError] = useState('');
  const [reading, setReading] = useState(false);
  const [sending, setSending] = useState(false);

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([templateCsv()], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modele-import-produits.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const readFile = async (file: File | null) => {
    setResults(null);
    setFileError('');
    if (!file) return;
    setFileName(file.name);
    if (file.size > MAX_SIZE) {
      setFileError(t('productImport.errors.TOO_LARGE'));
      return;
    }
    setReading(true);
    try {
      let table: unknown[][];
      if (/\.xlsx$/i.test(file.name)) {
        // Chargé à la demande : la bibliothèque Excel n'alourdit pas le reste du site.
        const { readSheet } = await import('read-excel-file/browser');
        table = (await readSheet(file)) as unknown[][];
      } else if (/\.(csv|txt)$/i.test(file.name)) {
        table = parseCsv(await file.text());
      } else {
        setFileError(t('productImport.errors.FORMAT'));
        return;
      }
      const parsed = rowsFromTable(table);
      if ('error' in parsed) {
        setFileError(t(`productImport.errors.${parsed.error}`, { max: MAX_IMPORT_ROWS }));
        return;
      }
      setResults(parsed.results);
    } catch {
      setFileError(t('productImport.errors.READ'));
    } finally {
      setReading(false);
    }
  };

  const valid = (results || []).filter((r) => r.issues.length === 0);
  const invalid = (results || []).filter((r) => r.issues.length > 0);

  const submit = async () => {
    if (valid.length === 0) return;
    setSending(true);
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: valid.map(({ line, row }) => ({ line, ...row })) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body?.code === 'IMPORT_PLAN_LIMIT') throw new Error(t('productImport.planLimit', { limit: body.limit, remaining: body.remaining }));
        throw new ApiError(body, 'productImport.failed');
      }
      notify(t('productImport.success', { count: body.created }), 'success');
      onImported();
      onClose();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/40 p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl my-8">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
          <div>
            <h3 id="import-title" className="text-xl font-black text-primary">{t('productImport.title')}</h3>
            <p className="text-sm text-gray-500 mt-1">{t('productImport.subtitle', { max: MAX_IMPORT_ROWS })}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-primary" aria-label={t('productImport.close')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <li className="rounded-xl bg-gray-50 p-4">
              <p className="font-bold text-primary mb-2">1. {t('productImport.step1')}</p>
              <button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-2 text-secondary font-bold hover:underline">
                <Download className="h-4 w-4" aria-hidden="true" /> {t('productImport.template')}
              </button>
            </li>
            <li className="rounded-xl bg-gray-50 p-4">
              <p className="font-bold text-primary mb-2">2. {t('productImport.step2')}</p>
              <p className="text-gray-600">{t('productImport.step2Text')}</p>
            </li>
            <li className="rounded-xl bg-gray-50 p-4">
              <p className="font-bold text-primary mb-2">3. {t('productImport.step3')}</p>
              <p className="text-gray-600">{t('productImport.step3Text')}</p>
            </li>
          </ol>

          <details className="text-sm">
            <summary className="cursor-pointer font-bold text-primary">{t('productImport.codes')}</summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-gray-600 max-h-56 overflow-y-auto">
              {productCategories.flatMap((g) => g.subCategories).map((sub) => (
                <p key={sub.id}><span className="font-bold text-primary tabular-nums me-2">{sub.id}</span>{t(`productCategories.${sub.id}`).split(/[:(]/)[0].trim()}</p>
              ))}
            </div>
          </details>

          <label className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border-2 border-dashed border-gray-200 p-5 cursor-pointer hover:border-secondary transition-colors">
            <FileSpreadsheet className="h-7 w-7 text-gray-400 shrink-0" aria-hidden="true" />
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-primary truncate">{fileName || t('productImport.choose')}</span>
              <span className="block text-xs text-gray-500">{t('productImport.formats')}</span>
            </span>
            {reading ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : <Upload className="h-5 w-5 text-gray-400" aria-hidden="true" />}
            <input
              ref={input}
              type="file"
              accept=".csv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              aria-label={t('productImport.choose')}
              onChange={(e) => readFile(e.target.files?.[0] || null)}
            />
          </label>

          {fileError && <p role="alert" className="text-sm font-bold text-red-600">{fileError}</p>}

          {results && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-primary" aria-live="polite">
                {t('productImport.summary', { valid: valid.length, invalid: invalid.length })}
              </p>
              <div className="max-h-72 overflow-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-3 text-start">{t('productImport.colLine')}</th>
                      <th className="p-3 text-start">{t('productImport.colName')}</th>
                      <th className="p-3 text-start">{t('productImport.colCategory')}</th>
                      <th className="p-3 text-start">{t('productImport.colPrice')}</th>
                      <th className="p-3 text-start">{t('productImport.colStatus')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {results.map(({ line, row, issues }) => (
                      <tr key={line} className={issues.length ? 'bg-red-50/40' : undefined}>
                        <td className="p-3 tabular-nums text-gray-500">{line}</td>
                        <td className="p-3 font-bold text-primary">{row.name || '—'}</td>
                        <td className="p-3 text-gray-600">{row.category ? categoryLabel(t, row.category).split(/[:(]/)[0].trim() : '—'}</td>
                        <td className="p-3 tabular-nums">{row.price === null ? t('productImport.onRequest') : formatDzd(row.price)}</td>
                        <td className="p-3">
                          {issues.length === 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{t('productImport.ok')}</span>
                          ) : (
                            <span className="inline-flex items-start gap-1 text-red-600 font-bold">
                              <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                              {issues.map((i) => t(`productImport.issues.${i.code}`)).join(' · ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {invalid.length > 0 && valid.length > 0 && <p className="text-xs text-gray-500">{t('productImport.skipInvalid')}</p>}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 p-6 border-t border-gray-100">
          <p className="text-xs text-gray-500">{t('productImport.draftNote')}</p>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-primary">
              {t('productImport.cancel')}
            </button>
            <button type="button" onClick={submit} disabled={valid.length === 0 || sending} className="btn-primary whitespace-nowrap disabled:opacity-50">
              {sending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('productImport.submit', { count: valid.length })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
