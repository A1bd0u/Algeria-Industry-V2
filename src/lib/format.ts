import i18n from '../i18n';

// Formats dépendant de la langue de l'interface. Les locales -DZ gardent les
// chiffres latins, y compris en arabe (usage courant en Algérie).
const LOCALES: Record<string, string> = { fr: 'fr-DZ', en: 'en-GB', ar: 'ar-DZ' };

export const currentLocale = () => {
  const lang = (i18n.resolvedLanguage || i18n.language || 'fr').slice(0, 2);
  return LOCALES[lang] || LOCALES.fr;
};

export const formatNumber = (value: number | string) =>
  new Intl.NumberFormat(currentLocale(), { maximumFractionDigits: 0, numberingSystem: 'latn' } as Intl.NumberFormatOptions)
    .format(Number(value || 0));

export const formatDzd = (value: number | string) => `${formatNumber(value)} ${i18n.t('common.dzd')}`;

export const formatDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(currentLocale(), { day: '2-digit', month: 'long', year: 'numeric', numberingSystem: 'latn' } as Intl.DateTimeFormatOptions)
    : '—';
