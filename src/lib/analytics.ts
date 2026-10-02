// Mesure d'audience sans cookie (Plausible, hébergé ou auto-hébergé) : aucun
// identifiant stocké sur l'appareil, donc pas de consentement requis.
// Inactive tant que VITE_PLAUSIBLE_DOMAIN n'est pas défini au build.
const DEFAULT_SRC = 'https://plausible.io/js/script.js';

export const initAnalytics = () => {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  if (!domain || typeof document === 'undefined') return;
  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = domain;
  // Le script suit lui-même les changements d'URL de l'application (history API).
  script.src = import.meta.env.VITE_PLAUSIBLE_SRC || DEFAULT_SRC;
  document.head.appendChild(script);
};

// Objectifs de conversion Plausible (à déclarer dans Plausible > Goals avec
// exactement ces noms). Sans Plausible, l'appel ne fait rien.
export type Goal =
  | 'Inscription'
  | 'Contact fournisseur'
  | 'Clic WhatsApp'
  | 'Souscription'
  | 'Paiement en ligne'
  | 'Telechargement catalogue';

export const goal = (name: Goal, props?: Record<string, string>) => {
  try {
    const plausible = (window as any).plausible;
    if (typeof plausible === 'function') plausible(name, props ? { props } : undefined);
  } catch {
    // La mesure ne doit jamais casser l'interface.
  }
};

// Statistiques fournisseur (vues, clics) envoyées à notre API : comptées une
// fois par visiteur et par jour, sans cookie ni donnée personnelle.
export type AudienceType = 'company_view' | 'product_view' | 'whatsapp_click' | 'catalogue_download';

export const trackAudience = (type: AudienceType, id: string | undefined | null) => {
  if (!id || typeof fetch === 'undefined') return;
  try {
    fetch('/api/stats/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
      keepalive: true,
      credentials: 'same-origin',
    }).catch(() => undefined);
  } catch {
    // ignore
  }
};
