// Consentement aux traceurs non essentiels (loi 18-07). Tant que l'utilisateur
// n'a pas accepté, aucun traceur optionnel (Sentry Replay, mesure d'audience)
// n'est chargé.

export type ConsentValue = 'accepted' | 'rejected';

const STORAGE_KEY = 'ai_cookie_consent_v1';
const listeners = new Set<(value: ConsentValue) => void>();

export const getConsent = (): ConsentValue | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
};

export const setConsent = (value: ConsentValue) => {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // stockage indisponible : le choix vaut pour la session en cours
  }
  listeners.forEach((listener) => listener(value));
};

export const onConsentChange = (listener: (value: ConsentValue) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
