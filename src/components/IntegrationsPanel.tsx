import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Copy, KeyRound, Loader2, Lock, RefreshCw, Trash2, Webhook, FileSpreadsheet } from 'lucide-react';
import { ApiError } from '../lib/apiError';
import { formatDateTime } from '../lib/format';
import { cn } from '../lib/utils';

// Intégrations ERP / CRM : flux catalogue (fournisseurs), webhooks vers le CRM
// et clés d'API. Les secrets ne sont affichés qu'une fois, à la création.

type Rights = { plan: string; feed: boolean; feedHourly: boolean; webhooks: boolean; apiKeys: boolean; scopes: string[]; events: string[] };
type Feed = {
  id: string; url: string; format: string; frequency: 'daily' | 'hourly'; deactivate_missing: boolean; active: boolean;
  last_run_at: string | null; last_status: 'success' | 'partial' | 'failed' | null; last_report: any; next_run_at: string;
};
type Hook = { id: string; url: string; events: string[]; active: boolean; disabled_reason: string | null; last_delivery_at: string | null; last_status: number | null };
type ApiKey = { id: string; name: string; prefix: string; scopes: string[]; last_used_at: string | null; created_at: string };
type State = { rights: Rights; feed: Feed | null; webhooks: Hook[]; apiKeys: ApiKey[] };
type Notify = (message: string, type?: 'success' | 'error') => void;

const request = async (url: string, init?: RequestInit, fallbackKey = 'integrations.failed') => {
  const res = await fetch(url, init?.body ? { ...init, headers: { 'Content-Type': 'application/json' } } : init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body, fallbackKey);
  return body;
};

const json = (method: string, data?: unknown): RequestInit => ({ method, body: data === undefined ? undefined : JSON.stringify(data) });

const Section = ({ icon: Icon, title, text, children }: { icon: any; title: string; text: string; children: ReactNode }) => (
  <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-secondary mt-1 shrink-0" aria-hidden="true" />
      <div>
        <h4 className="text-lg font-bold text-primary">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{text}</p>
      </div>
    </div>
    {children}
  </section>
);

const Locked = ({ text }: { text: string }) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <p className="text-sm text-gray-600 flex items-start gap-2"><Lock className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />{text}</p>
      <Link to="/dashboard?tab=subscription" className="btn-ghost shrink-0">{t('integrations.seePlans')}</Link>
    </div>
  );
};

// Secret affiché une seule fois, avec copie.
const SecretBox = ({ label, value, onClose }: { label: string; value: string; onClose: () => void }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3" role="status">
      <p className="text-sm font-semibold text-amber-900">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 break-all rounded-lg bg-white border border-amber-200 px-3 py-2 text-xs font-mono">{value}</code>
        <button type="button" onClick={copy} className="btn-ghost shrink-0" aria-label={t('integrations.copy')}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <button type="button" onClick={onClose} className="text-sm font-semibold text-amber-900 underline">{t('integrations.secretSaved')}</button>
    </div>
  );
};

const label = 'block text-sm font-semibold text-gray-700 mb-1.5';

function FeedSection({ state, notify }: { state: State; notify: Notify; key?: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { rights, feed } = state;
  const [url, setUrl] = useState(feed?.url || '');
  const [format, setFormat] = useState(feed?.format || 'auto');
  const [frequency, setFrequency] = useState<'daily' | 'hourly'>(feed?.frequency || 'daily');
  const [deactivate, setDeactivate] = useState(feed?.deactivate_missing || false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['integrations'] });

  const save = useMutation({
    mutationFn: () => request('/api/integrations/feed', json('PUT', { url, format, frequency, deactivate_missing: deactivate, active: true })),
    onSuccess: () => { notify(t('integrations.feed.saved'), 'success'); refresh(); },
    onError: (err: Error) => notify(err.message, 'error'),
  });
  const run = useMutation({
    mutationFn: () => request('/api/integrations/feed/run', json('POST')),
    onSuccess: (res: any) => { notify(t(`integrations.feed.status.${res.status}`), res.status === 'failed' ? 'error' : 'success'); refresh(); },
    onError: (err: Error) => notify(err.message, 'error'),
  });
  const remove = useMutation({
    mutationFn: () => request('/api/integrations/feed', json('DELETE')),
    onSuccess: () => { notify(t('integrations.feed.removed'), 'success'); setUrl(''); refresh(); },
    onError: (err: Error) => notify(err.message, 'error'),
  });

  const report = feed?.last_report;
  return (
    <Section icon={FileSpreadsheet} title={t('integrations.feed.title')} text={t('integrations.feed.text')}>
      {!rights.feed ? <Locked text={t('integrations.feed.locked')} /> : (
        <>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="feed-url" className={label}>{t('integrations.feed.url')}</label>
              <input id="feed-url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://erp.example.dz/export/produits.csv" className="field" />
              <p className="text-xs text-gray-500 mt-1.5">{t('integrations.feed.urlHint')}</p>
            </div>
            <div>
              <label htmlFor="feed-format" className={label}>{t('integrations.feed.format')}</label>
              <select id="feed-format" value={format} onChange={(e) => setFormat(e.target.value)} className="field">
                {['auto', 'csv', 'xlsx', 'json'].map((f) => <option key={f} value={f}>{t(`integrations.feed.formats.${f}`)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="feed-frequency" className={label}>{t('integrations.feed.frequency')}</label>
              <select id="feed-frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as 'daily' | 'hourly')} className="field">
                <option value="daily">{t('integrations.feed.daily')}</option>
                <option value="hourly" disabled={!rights.feedHourly}>{t('integrations.feed.hourly')}{rights.feedHourly ? '' : ` (${t('integrations.proOnly')})`}</option>
              </select>
            </div>
            <label className="md:col-span-2 flex items-start gap-3 text-sm text-gray-700">
              <input type="checkbox" checked={deactivate} onChange={(e) => setDeactivate(e.target.checked)} className="mt-0.5 h-4 w-4 accent-secondary" />
              <span>{t('integrations.feed.deactivateMissing')}</span>
            </label>
            <div className="md:col-span-2 rounded-xl bg-neutral-bg p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-700 mb-1">{t('integrations.feed.columnsTitle')}</p>
              <p>{t('integrations.feed.columns')}</p>
            </div>
            <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
              {feed && (
                <>
                  <button type="button" onClick={() => remove.mutate()} disabled={remove.isPending} className="btn-ghost text-error">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />{t('integrations.feed.remove')}
                  </button>
                  <button type="button" onClick={() => run.mutate()} disabled={run.isPending} className="btn-ghost">
                    <RefreshCw className={cn('h-4 w-4', run.isPending && 'animate-spin')} aria-hidden="true" />{t('integrations.feed.runNow')}
                  </button>
                </>
              )}
              <button type="submit" disabled={save.isPending || !url} className="btn-primary">{t('integrations.save')}</button>
            </div>
          </form>

          {feed && (
            <div className="border-t border-gray-100 pt-4 text-sm space-y-2" aria-live="polite">
              {feed.last_run_at ? (
                <p>
                  <span className={cn('font-semibold', feed.last_status === 'failed' ? 'text-error' : feed.last_status === 'partial' ? 'text-amber-700' : 'text-success')}>
                    {t(`integrations.feed.status.${feed.last_status}`)}
                  </span>
                  <span className="text-gray-500"> · {formatDateTime(feed.last_run_at)}</span>
                </p>
              ) : <p className="text-gray-500">{t('integrations.feed.neverRun')}</p>}
              {report?.error && <p className="text-error">{report.error}</p>}
              {report && !report.error && (
                <p className="text-gray-600">{t('integrations.feed.report', report)}</p>
              )}
              {report?.issues?.length > 0 && (
                <details className="text-gray-600">
                  <summary className="cursor-pointer font-semibold">{t('integrations.feed.issues', { count: report.rejected + report.skippedPlanLimit })}</summary>
                  <ul className="mt-2 space-y-1 text-xs">
                    {report.issues.map((i: any, idx: number) => (
                      <li key={idx}>{t('integrations.feed.issueLine', { line: i.line })} : {t(`productImport.issues.${i.code}`, { defaultValue: t(`integrations.feed.issueCodes.${i.code}`, { defaultValue: i.code }) })}</li>
                    ))}
                  </ul>
                </details>
              )}
              {feed.active && <p className="text-gray-500">{t('integrations.feed.nextRun', { date: formatDateTime(feed.next_run_at) })}</p>}
            </div>
          )}
        </>
      )}
    </Section>
  );
}

function Deliveries({ hookId }: { hookId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['webhook-deliveries', hookId],
    queryFn: () => request(`/api/integrations/webhooks/${hookId}/deliveries`) as Promise<any[]>,
  });
  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-gray-500" />;
  if (!data || data.length === 0) return <p className="text-xs text-gray-500">{t('integrations.webhooks.noDeliveries')}</p>;
  return (
    <ul className="divide-y divide-gray-100 text-xs">
      {data.map((d) => (
        <li key={d.id} className="py-2 flex flex-wrap gap-x-4 gap-y-1">
          <span className="font-mono text-gray-700">{d.event}</span>
          <span className={cn('font-semibold', d.status === 'success' ? 'text-success' : d.status === 'failed' ? 'text-error' : 'text-amber-700')}>
            {t(`integrations.webhooks.delivery.${d.status}`)}{d.response_status ? ` (${d.response_status})` : ''}
          </span>
          <span className="text-gray-500">{formatDateTime(d.created_at)}</span>
          {d.error && <span className="text-gray-500">{d.error}</span>}
        </li>
      ))}
    </ul>
  );
}

function WebhooksSection({ state, notify }: { state: State; notify: Notify }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { rights, webhooks } = state;
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(rights.events);
  const [secret, setSecret] = useState<string | null>(null);
  const [openLog, setOpenLog] = useState<string | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['integrations'] });
  const onError = (err: Error) => notify(err.message, 'error');

  const create = useMutation({
    mutationFn: () => request('/api/integrations/webhooks', json('POST', { url, events })),
    onSuccess: (res: any) => { setSecret(res.secret); setUrl(''); refresh(); },
    onError,
  });
  const patch = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => request(`/api/integrations/webhooks/${id}`, json('PATCH', { active })),
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: string) => request(`/api/integrations/webhooks/${id}`, json('DELETE')),
    onSuccess: () => { notify(t('integrations.webhooks.removed'), 'success'); refresh(); },
    onError,
  });
  const test = useMutation({
    mutationFn: (id: string) => request(`/api/integrations/webhooks/${id}/test`, json('POST')),
    onSuccess: (res: any, id) => {
      notify(res.ok ? t('integrations.webhooks.testOk') : t('integrations.webhooks.testFailed', { reason: res.delivery?.error || '' }), res.ok ? 'success' : 'error');
      queryClient.invalidateQueries({ queryKey: ['webhook-deliveries', id] });
      refresh();
    },
    onError,
  });

  const toggleEvent = (e: string) => setEvents((list) => (list.includes(e) ? list.filter((x) => x !== e) : [...list, e]));

  return (
    <Section icon={Webhook} title={t('integrations.webhooks.title')} text={t('integrations.webhooks.text')}>
      {!rights.webhooks ? <Locked text={t('integrations.webhooks.locked')} /> : (
        <>
          {secret && <SecretBox label={t('integrations.webhooks.secretOnce')} value={secret} onClose={() => setSecret(null)} />}
          {webhooks.length > 0 && (
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
              {webhooks.map((h) => (
                <li key={h.id} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-primary break-all">{h.url}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{h.events.map((e) => t(`integrations.events.${e.replace('.', '_')}`)).join(' · ')}</p>
                      {!h.active && <p className="text-xs text-error mt-0.5">{h.disabled_reason || t('integrations.webhooks.paused')}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => test.mutate(h.id)} disabled={test.isPending || !h.active} className="btn-ghost px-3 py-1.5">{t('integrations.webhooks.test')}</button>
                      <button type="button" onClick={() => setOpenLog(openLog === h.id ? null : h.id)} className="btn-ghost px-3 py-1.5" aria-expanded={openLog === h.id}>{t('integrations.webhooks.log')}</button>
                      <button type="button" onClick={() => patch.mutate({ id: h.id, active: !h.active })} className="btn-ghost px-3 py-1.5">
                        {h.active ? t('integrations.webhooks.pause') : t('integrations.webhooks.resume')}
                      </button>
                      <button type="button" onClick={() => remove.mutate(h.id)} className="btn-ghost px-3 py-1.5 text-error" aria-label={t('integrations.webhooks.remove')}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  {openLog === h.id && <Deliveries hookId={h.id} />}
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
            <div>
              <label htmlFor="webhook-url" className={label}>{t('integrations.webhooks.url')}</label>
              <input id="webhook-url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://crm.example.dz/hooks/industigo" className="field" />
              <p className="text-xs text-gray-500 mt-1.5">{t('integrations.webhooks.urlHint')}</p>
            </div>
            <fieldset>
              <legend className={label}>{t('integrations.webhooks.events')}</legend>
              <div className="space-y-2">
                {rights.events.map((e) => (
                  <label key={e} className="flex items-start gap-3 text-sm text-gray-700">
                    <input type="checkbox" checked={events.includes(e)} onChange={() => toggleEvent(e)} className="mt-0.5 h-4 w-4 accent-secondary" />
                    <span><span className="font-mono text-xs text-gray-500">{e}</span> · {t(`integrations.events.${e.replace('.', '_')}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex justify-end">
              <button type="submit" disabled={create.isPending || !url || events.length === 0} className="btn-primary">{t('integrations.webhooks.add')}</button>
            </div>
          </form>
        </>
      )}
    </Section>
  );
}

function ApiKeysSection({ state, notify }: { state: State; notify: Notify }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { rights, apiKeys } = state;
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(rights.scopes);
  const [created, setCreated] = useState<string | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['integrations'] });

  const create = useMutation({
    mutationFn: () => request('/api/integrations/api-keys', json('POST', { name, scopes })),
    onSuccess: (res: any) => { setCreated(res.key); setName(''); refresh(); },
    onError: (err: Error) => notify(err.message, 'error'),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => request(`/api/integrations/api-keys/${id}`, json('DELETE')),
    onSuccess: () => { notify(t('integrations.apiKeys.revoked'), 'success'); refresh(); },
    onError: (err: Error) => notify(err.message, 'error'),
  });
  const toggleScope = (s: string) => setScopes((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]));

  return (
    <Section icon={KeyRound} title={t('integrations.apiKeys.title')} text={t('integrations.apiKeys.text')}>
      {!rights.apiKeys ? <Locked text={t('integrations.apiKeys.locked')} /> : (
        <>
          {created && <SecretBox label={t('integrations.apiKeys.keyOnce')} value={created} onClose={() => setCreated(null)} />}
          {apiKeys.length > 0 && (
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
              {apiKeys.map((k) => (
                <li key={k.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-primary">{k.name} <span className="font-mono text-xs text-gray-500">{k.prefix}…</span></p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {k.scopes.join(', ')} · {k.last_used_at ? t('integrations.apiKeys.lastUsed', { date: formatDateTime(k.last_used_at) }) : t('integrations.apiKeys.neverUsed')}
                    </p>
                  </div>
                  <button type="button" onClick={() => revoke.mutate(k.id)} className="btn-ghost px-3 py-1.5 text-error">{t('integrations.apiKeys.revoke')}</button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
            <div>
              <label htmlFor="api-key-name" className={label}>{t('integrations.apiKeys.name')}</label>
              <input id="api-key-name" required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('integrations.apiKeys.namePlaceholder')} className="field" />
            </div>
            <fieldset>
              <legend className={label}>{t('integrations.apiKeys.scopes')}</legend>
              <div className="space-y-2">
                {rights.scopes.map((s) => (
                  <label key={s} className="flex items-start gap-3 text-sm text-gray-700">
                    <input type="checkbox" checked={scopes.includes(s)} onChange={() => toggleScope(s)} className="mt-0.5 h-4 w-4 accent-secondary" />
                    <span><span className="font-mono text-xs text-gray-500">{s}</span> · {t(`integrations.scopes.${s.replace(':', '_')}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex justify-end">
              <button type="submit" disabled={create.isPending || name.trim().length < 2 || scopes.length === 0} className="btn-primary">{t('integrations.apiKeys.create')}</button>
            </div>
          </form>
        </>
      )}
    </Section>
  );
}

export default function IntegrationsPanel({ notify, isSupplier }: { notify: Notify; isSupplier: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery<State>({
    queryKey: ['integrations'],
    queryFn: () => request('/api/integrations'),
  });

  if (isLoading) return <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin inline text-gray-500" /></div>;
  if (error || !data) return <p className="text-error">{(error as Error)?.message || t('integrations.failed')}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-primary">{t('integrations.title')}</h3>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">{t(isSupplier ? 'integrations.subtitleSupplier' : 'integrations.subtitleBuyer')}</p>
        </div>
        <Link to="/developers" className="btn-ghost">{t('integrations.docs')}</Link>
      </div>
      {isSupplier && <FeedSection key={data.feed?.id || 'new'} state={data} notify={notify} />}
      <WebhooksSection state={data} notify={notify} />
      <ApiKeysSection state={data} notify={notify} />
    </div>
  );
}
