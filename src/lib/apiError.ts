import i18n from '../i18n';

// Message d'erreur affichable pour une réponse d'API en échec.
// Le serveur renvoie un code stable (`AUTH_INVALID`, `KYC_REQUIRED`…) et un
// message en français : le code est traduit dans la langue de l'interface ;
// à défaut, le message du serveur n'est gardé qu'en français.
export const apiErrorMessage = (data: any, fallbackKey = 'auth.genericError'): string => {
  const code = typeof data?.code === 'string' ? data.code : '';
  if (code && i18n.exists(`errors.${code}`)) {
    return i18n.t(`errors.${code}`);
  }
  const serverMessage = typeof data?.error === 'string' ? data.error : '';
  if (serverMessage && (i18n.resolvedLanguage || i18n.language || 'fr').startsWith('fr')) {
    return serverMessage;
  }
  return i18n.t(fallbackKey);
};

// Erreur portant le code de l'API, pour les appelants qui en ont besoin.
export class ApiError extends Error {
  code?: string;
  constructor(data: any, fallbackKey?: string) {
    super(apiErrorMessage(data, fallbackKey));
    this.code = data?.code;
  }
}
