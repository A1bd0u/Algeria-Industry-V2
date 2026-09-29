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
