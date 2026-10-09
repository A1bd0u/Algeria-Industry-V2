import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getConsent, setConsent } from '../lib/consent';

export const OPEN_COOKIE_SETTINGS_EVENT = 'open-cookie-settings';

// Bandeau de consentement (loi 18-07) : aucun traceur non essentiel n'est
// chargé tant que l'utilisateur n'a pas accepté.
const CookieBanner = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
    const reopen = () => setVisible(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  if (!visible) return null;

  const choose = (value: 'accepted' | 'rejected') => {
    setConsent(value);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('cookies.label')}
      className="fixed bottom-0 inset-x-0 z-[10000] bg-white border-t border-gray-200 shadow-2xl"
    >
      <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col md:flex-row md:items-center gap-4">
        <p className="text-sm text-gray-700 flex-1">
          {t('cookies.text')}{' '}
          <Link to="/privacy" className="font-bold text-primary underline">{t('cookies.more')}</Link>
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => choose('rejected')}
            className="px-5 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {t('cookies.reject')}
          </button>
          <button
            onClick={() => choose('accepted')}
            className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-secondary"
          >
            {t('cookies.accept')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
