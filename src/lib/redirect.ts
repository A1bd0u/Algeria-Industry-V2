// Page à rouvrir après connexion ou inscription (ex. la conversation avec un
// fournisseur). Seuls les chemins internes sont acceptés : pas d'URL absolue
// ni protocol-relative.
export const safeRedirect = (raw: string | null | undefined): string | null =>
  raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : null;

// L'inscription passe par plusieurs écrans (formulaire, code reçu par e-mail) :
// la destination est gardée pour la session du navigateur.
const KEY = 'icx-after-auth';

export const rememberRedirect = (path: string | null) => {
  try {
    if (path) sessionStorage.setItem(KEY, path);
  } catch { /* stockage indisponible : on retombe sur le tableau de bord */ }
};

export const takeRedirect = (): string | null => {
  try {
    const path = safeRedirect(sessionStorage.getItem(KEY));
    sessionStorage.removeItem(KEY);
    return path;
  } catch {
    return null;
  }
};

// Une redirection vers la messagerie : le visiteur voulait écrire à un fournisseur.
export const isMessagingRedirect = (path: string | null) => !!path && path.includes('tab=messages');
