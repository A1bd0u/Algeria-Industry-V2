import i18n, { BackendModule } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr.json';

// Le français (langue de repli) est embarqué ; l'anglais et l'arabe sont
// chargés à la demande, dans leur propre fichier, pour alléger le premier
// affichage de ceux qui ne s'en servent pas.
const loaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import('./locales/en.json'),
  ar: () => import('./locales/ar.json'),
};

const lazyLocales: BackendModule = {
  type: 'backend',
  init: () => {},
  read(language, _namespace, callback) {
    const load = loaders[language.split('-')[0]];
    if (!load) {
      callback(null, {});
      return;
    }
    load()
      .then((module) => callback(null, module.default))
      .catch((error) => callback(error, false));
  },
};

// Promesse résolue quand la langue de l'utilisateur est prête : main.tsx
// attend ce signal avant le premier rendu (pas de texte français fugace).
export const i18nReady = i18n
  .use(lazyLocales)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr } },
    partialBundledLanguages: true,
    supportedLngs: ['fr', 'en', 'ar'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    fallbackLng: 'fr',
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    },
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false,
    },
  });

// Support RTL
i18n.on('languageChanged', (lng) => {
  if (lng.startsWith('ar')) {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  } else {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = lng;
  }
});

// Initial load
const currentLang = i18n.language || (i18n.languages && i18n.languages[0]) || 'fr';
if (currentLang.startsWith('ar')) {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
} else {
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = currentLang;
}

export default i18n;
