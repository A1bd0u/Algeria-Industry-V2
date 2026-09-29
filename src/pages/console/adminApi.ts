// Appels API de la console admin : cookie de session, JSON, erreurs lisibles.
export async function adminFetch<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Erreur ${res.status}`);
  }
  return data as T;
}

export const formatDzd = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(Number(value || 0)) + ' DA';

export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
