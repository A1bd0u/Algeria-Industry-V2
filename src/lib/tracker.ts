import { getConsent, onConsentChange } from './consent';

// Analytique détaillée (console admin) : pages vues, clics, recherches, temps
// passé, défilement et erreurs.
// - Sans consentement : anonyme. Identifiant de session gardé en mémoire
//   (perdu à la fermeture de l'onglet), rien n'est écrit sur l'appareil, le
//   compte n'est pas rattaché.
// - Avec consentement (bandeau cookies) : identifiant de visiteur et compte
//   connecté rattachés aux événements.
// Jamais de valeur de champ de formulaire, sauf le texte d'une recherche.

type EventType = 'pageview' | 'page_leave' | 'click' | 'search' | 'form_submit' | 'outbound' | 'download' | 'error' | 'custom';

interface TrackEvent {
  type: EventType;
  path: string;
  ts: number;
  title?: string;
  referrer?: string;
  label?: string;
  target?: string;
  duration?: number;
  scroll?: number;
  meta?: Record<string, string | number | boolean>;
}

const ENDPOINT = '/api/analytics/collect';
const SID_KEY = 'icx-sid';
const VID_KEY = 'icx-vid';
const FLUSH_MS = 5000;

const randomId = () => {
  try {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  }
};

let started = false;
let memorySid = randomId();
let queue: TrackEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let current: { path: string; start: number; visibleMs: number; visibleSince: number | null; maxScroll: number } | null = null;
let errorsOnPage = 0;

const consented = () => getConsent() === 'accepted';

const sessionId = () => {
  if (!consented()) return memorySid;
  try {
    let sid = sessionStorage.getItem(SID_KEY);
    if (!sid) { sid = memorySid; sessionStorage.setItem(SID_KEY, sid); }
    return sid;
  } catch {
    return memorySid;
  }
};

const visitorId = () => {
  if (!consented()) return null;
  try {
    let vid = localStorage.getItem(VID_KEY);
    if (!vid) { vid = randomId(); localStorage.setItem(VID_KEY, vid); }
    return vid;
  } catch {
    return null;
  }
};

const forgetIds = () => {
  try { localStorage.removeItem(VID_KEY); } catch { /* ignore */ }
  try { sessionStorage.removeItem(SID_KEY); } catch { /* ignore */ }
  memorySid = randomId();
};

const currentPath = () => window.location.pathname + window.location.search;

const scrollPercent = () => {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  if (max <= 0) return 100;
  return Math.min(100, Math.round((window.scrollY / max) * 100));
};

export const flush = (useBeacon = false) => {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!queue.length) return;
  const events = queue.splice(0, 50);
  const body = JSON.stringify({
    sessionId: sessionId(),
    visitorId: visitorId(),
    consent: consented(),
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
    events,
  });
  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        credentials: 'same-origin',
      }).catch(() => undefined);
    }
  } catch {
    // La mesure ne doit jamais casser l'interface.
  }
  if (queue.length) flush(useBeacon);
};

const push = (event: Omit<TrackEvent, 'ts' | 'path'> & { path?: string }) => {
  if (!started) return;
  queue.push({ path: currentPath(), ts: Date.now(), ...event });
  if (queue.length >= 25) flush();
  else if (!timer) timer = setTimeout(() => flush(), FLUSH_MS);
};

const endPage = () => {
  if (!current) return;
  const visible = current.visibleMs + (current.visibleSince ? Date.now() - current.visibleSince : 0);
  push({
    type: 'page_leave',
    path: current.path,
    duration: visible,
    scroll: Math.max(current.maxScroll, scrollPercent()),
    meta: { total_ms: Date.now() - current.start },
  });
  current = null;
};

// À appeler à chaque changement de page (routeur).
export const trackPageview = () => {
  if (!started) return;
  const path = currentPath();
  if (current && current.path === path) return;
  const previous = current?.path;
  endPage();
  errorsOnPage = 0;
  const now = Date.now();
  current = { path, start: now, visibleMs: 0, visibleSince: document.visibilityState === 'visible' ? now : null, maxScroll: 0 };
  // Titre lu après le rendu de la nouvelle page.
  setTimeout(() => {
    push({
      type: 'pageview',
      path,
      title: document.title,
      referrer: previous ? undefined : document.referrer || undefined,
      meta: previous ? { from: previous.split('?')[0] } : {},
    });
  }, 300);
};

export const trackEvent = (label: string, meta?: Record<string, string | number | boolean>) =>
  push({ type: 'custom', label, meta });

const textOf = (el: Element) => {
  const explicit = el.getAttribute('data-track') || el.getAttribute('aria-label') || el.getAttribute('title');
  const text = explicit || (el as HTMLElement).innerText || el.textContent || '';
  return text.replace(/\s+/g, ' ').trim().slice(0, 80);
};

const onClick = (e: MouseEvent) => {
  const el = (e.target as Element | null)?.closest?.('a, button, [role="button"], [data-track], summary, label');
  if (!el) return;
  const label = textOf(el) || el.tagName.toLowerCase();
  const meta: Record<string, string | number> = { tag: el.tagName.toLowerCase() };
  if (el.id) meta.id = el.id.slice(0, 40);
  if (el instanceof HTMLAnchorElement && el.href) {
    let url: URL | null = null;
    try { url = new URL(el.href); } catch { /* lien invalide */ }
    if (url && /^https?:$/.test(url.protocol)) {
      if (el.hasAttribute('download') || /\.(pdf|xlsx?|docx?|zip|csv)$/i.test(url.pathname)) {
        push({ type: 'download', label, target: url.href, meta });
        return;
      }
      if (url.origin !== window.location.origin) {
        push({ type: 'outbound', label, target: url.href, meta });
        return;
      }
      push({ type: 'click', label, target: url.pathname + url.search, meta });
      return;
    }
    if (url) meta.scheme = url.protocol.replace(':', '');
  }
  push({ type: 'click', label, meta });
};

const onSubmit = (e: Event) => {
  const form = e.target as HTMLFormElement | null;
  if (!form || form.tagName !== 'FORM') return;
  const search = form.querySelector<HTMLInputElement>('input[type="search"], input[name="q"], input[name="query"], input[name="search"]');
  if (search && search.type !== 'password') {
    push({ type: 'search', label: search.value.trim().slice(0, 100) });
    return;
  }
  const name = form.getAttribute('aria-label') || form.getAttribute('name') || form.id || 'formulaire';
  push({ type: 'form_submit', label: name.slice(0, 80), meta: { fields: form.elements.length } });
};

const onError = (message: string, source?: string) => {
  if (errorsOnPage >= 5) return;
  errorsOnPage++;
  push({ type: 'error', label: message.slice(0, 160), meta: source ? { source: source.slice(0, 120) } : {} });
};

const onVisibility = () => {
  if (!current) return;
  if (document.visibilityState === 'hidden') {
    if (current.visibleSince) { current.visibleMs += Date.now() - current.visibleSince; current.visibleSince = null; }
    current.maxScroll = Math.max(current.maxScroll, scrollPercent());
    flush(true);
  } else if (!current.visibleSince) {
    current.visibleSince = Date.now();
  }
};

let scrollTick = false;
const onScroll = () => {
  if (scrollTick || !current) return;
  scrollTick = true;
  setTimeout(() => {
    scrollTick = false;
    if (current) current.maxScroll = Math.max(current.maxScroll, scrollPercent());
  }, 500);
};

export const initTracker = () => {
  if (started || typeof window === 'undefined') return;
  if ((import.meta as any).env?.VITE_DISABLE_TRACKER === 'true') return;
  started = true;
  document.addEventListener('click', onClick, { capture: true, passive: true });
  document.addEventListener('submit', onSubmit, { capture: true });
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('pagehide', () => { endPage(); flush(true); });
  window.addEventListener('error', (e) => onError(e.message || 'Erreur', e.filename));
  window.addEventListener('unhandledrejection', (e) => onError(String((e.reason && e.reason.message) || e.reason || 'Promesse rejetée')));
  onConsentChange((value) => {
    if (value === 'rejected') forgetIds();
  });
};

// Tests : remet le module à zéro.
export const __resetTracker = () => {
  started = false;
  queue = [];
  current = null;
  memorySid = randomId();
  if (timer) { clearTimeout(timer); timer = null; }
};
