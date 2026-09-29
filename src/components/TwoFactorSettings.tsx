import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, KeyRound, Loader2, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../lib/apiError';

// Réglages de la double authentification (TOTP) du compte connecté :
// activation par QR code, codes de secours, régénération et désactivation.

type Status = { enabled: boolean; enabledAt: string | null; recoveryCodesLeft: number; required: boolean };
type Setup = { secret: string; otpauthUri: string; qrSvg: string };

const api = async <T,>(url: string, body?: unknown): Promise<T> => {
  const res = await fetch(url, body === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data);
  return data as T;
};

const inputClass = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
const codeInputClass = `${inputClass} text-center font-mono text-xl tracking-[0.4em]`;

function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const { t } = useTranslation();
  const text = codes.join('\n');
  const download = () => {
    const url = URL.createObjectURL(new Blob([`${t('mfa.recoveryFileTitle')}\n\n${text}\n`], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'algeria-industry-codes-de-secours.txt';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-4">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900">
        <strong>{t('mfa.recoveryWarningStrong')}</strong> {t('mfa.recoveryWarning')}
      </div>
      <ul className="grid grid-cols-2 gap-2 font-mono text-sm bg-gray-50 p-4 rounded-2xl">
        {codes.map((code) => <li key={code} className="text-center py-1">{code}</li>)}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => navigator.clipboard?.writeText(text)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest hover:bg-gray-50">
          <Copy className="h-4 w-4" /> {t('mfa.copy')}
        </button>
        <button type="button" onClick={download} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest hover:bg-gray-50">
          <Download className="h-4 w-4" /> {t('mfa.download')}
        </button>
        <button type="button" onClick={onDone} className="ms-auto px-5 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest">
          {t('mfa.savedCodes')}
        </button>
      </div>
    </div>
  );
}

export default function TwoFactorSettings({ onChange }: { onChange?: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [mode, setMode] = useState<'idle' | 'disable' | 'regenerate'>('idle');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { data: status, isLoading } = useQuery({
    queryKey: ['mfa-status'],
    queryFn: () => api<Status>('/api/auth/2fa/status'),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['mfa-status'] });
  const reset = () => { setCode(''); setPassword(''); setError(''); setMode('idle'); };

  const setupMutation = useMutation({
    mutationFn: () => api<Setup>('/api/auth/2fa/setup', {}),
    onSuccess: (data) => { setSetup(data); setError(''); },
    onError: (err: Error) => setError(err.message),
  });

  const enableMutation = useMutation({
    mutationFn: () => api<{ recoveryCodes: string[] }>('/api/auth/2fa/enable', { code: code.trim() }),
    onSuccess: (data) => { setRecoveryCodes(data.recoveryCodes); setSetup(null); reset(); refresh(); },
    onError: (err: Error) => setError(err.message),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api<{ recoveryCodes: string[] }>('/api/auth/2fa/recovery-codes', { code: code.trim() }),
    onSuccess: (data) => { setRecoveryCodes(data.recoveryCodes); reset(); refresh(); },
    onError: (err: Error) => setError(err.message),
  });

  const disableMutation = useMutation({
    mutationFn: () => api('/api/auth/2fa/disable', { password, code: code.trim() }),
    onSuccess: () => { reset(); refresh(); onChange?.(); },
    onError: (err: Error) => setError(err.message),
  });

  if (isLoading || !status) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (recoveryCodes) {
    return (
      <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-lg font-black text-primary uppercase italic">{t('mfa.enabledTitle')}</h3>
        <RecoveryCodes codes={recoveryCodes} onDone={() => { setRecoveryCodes(null); onChange?.(); }} />
      </section>
    );
  }

  const errorBox = error && <p className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl" role="alert">{error}</p>;

  return (
    <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-2xl ${status.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
          {status.enabled ? <ShieldCheck className="h-6 w-6" /> : <ShieldOff className="h-6 w-6" />}
        </div>
        <div>
          <h3 className="text-lg font-black text-primary uppercase italic">{t('mfa.title')}</h3>
          <p className="text-sm text-gray-500">
            {status.enabled
              ? t('mfa.activeStatus', { count: status.recoveryCodesLeft })
              : t('mfa.inactiveStatus')}
          </p>
          {status.required && !status.enabled && (
            <p className="mt-2 text-sm font-bold text-amber-700">{t('mfa.requiredForAdmins')}</p>
          )}
        </div>
      </div>

      {!status.enabled && !setup && (
        <>
          {errorBox}
          <button
            type="button"
            onClick={() => setupMutation.mutate()}
            disabled={setupMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest disabled:opacity-60"
          >
            {setupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
            {t('mfa.enable')}
          </button>
        </>
      )}

      {!status.enabled && setup && (
        <form
          className="grid md:grid-cols-[220px_1fr] gap-6 items-start"
          onSubmit={(e) => { e.preventDefault(); enableMutation.mutate(); }}
        >
          <div
            className="bg-white border border-gray-200 rounded-2xl p-3 w-[220px] max-w-full"
            aria-label={t('mfa.qrLabel')}
            // SVG généré par le serveur à partir du secret : aucune donnée utilisateur.
            dangerouslySetInnerHTML={{ __html: setup.qrSvg }}
          />
          <div className="space-y-4">
            <ol className="text-sm text-gray-600 list-decimal ps-5 space-y-1">
              <li>{t('mfa.step1')}</li>
              <li>{t('mfa.step2')}</li>
              <li>{t('mfa.step3')}</li>
            </ol>
            <div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('mfa.manualKey')}</span>
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm break-all bg-gray-50 px-3 py-2 rounded-lg">{setup.secret.match(/.{1,4}/g)?.join(' ')}</code>
                <button type="button" aria-label={t('mfa.copyKey')} onClick={() => navigator.clipboard?.writeText(setup.secret)} className="p-2 rounded-lg hover:bg-gray-100">
                  <Copy className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
            <label htmlFor="mfa-enable-code" className="sr-only">{t('auth.mfa.code')}</label>
            <input
              id="mfa-enable-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className={codeInputClass}
            />
            {errorBox}
            <div className="flex gap-2">
              <button type="submit" disabled={code.length !== 6 || enableMutation.isPending} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest disabled:opacity-60">
                {enableMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {t('mfa.confirm')}
              </button>
              <button type="button" onClick={() => { setSetup(null); reset(); }} className="px-4 py-3 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest">
                {t('mfa.cancel')}
              </button>
            </div>
          </div>
        </form>
      )}

      {status.enabled && mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setMode('regenerate')} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest hover:bg-gray-50">
            <KeyRound className="h-4 w-4" /> {t('mfa.newRecoveryCodes')}
          </button>
          <button type="button" onClick={() => setMode('disable')} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-50">
            <ShieldOff className="h-4 w-4" /> {t('mfa.disable')}
          </button>
        </div>
      )}

      {status.enabled && mode !== 'idle' && (
        <form
          className="space-y-3 max-w-sm"
          onSubmit={(e) => { e.preventDefault(); (mode === 'disable' ? disableMutation : regenerateMutation).mutate(); }}
        >
          {mode === 'disable' && (
            <>
              {status.required && (
                <p className="text-sm font-bold text-amber-700">{t('mfa.disableAdminWarning')}</p>
              )}
              <label htmlFor="mfa-password" className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('auth.password')}</label>
              <input id="mfa-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={inputClass} />
            </>
          )}
          <label htmlFor="mfa-current-code" className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('mfa.currentCode')}</label>
          <input id="mfa-current-code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" placeholder="000000" className={codeInputClass} />
          {errorBox}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={code.trim().length < 6 || (mode === 'disable' && !password) || disableMutation.isPending || regenerateMutation.isPending}
              className={`flex-1 px-6 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest disabled:opacity-60 ${mode === 'disable' ? 'bg-red-600' : 'bg-primary'}`}
            >
              {mode === 'disable' ? t('mfa.disable') : t('mfa.generate')}
            </button>
            <button type="button" onClick={reset} className="px-4 py-3 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest">{t('mfa.cancel')}</button>
          </div>
        </form>
      )}
    </section>
  );
}
