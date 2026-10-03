// Identité du site et coordonnées, centralisées. Les valeurs réelles viennent
// des variables d'environnement VITE_* (voir .env.example) : un champ vide
// n'est pas affiché, plutôt que d'afficher une donnée fictive.

const env = import.meta.env;

const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const SITE_NAME = 'Industigo';

export const SITE_URL = (clean(env.VITE_APP_URL) || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');

export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const SUPPORT = {
  phone: clean(env.VITE_SUPPORT_PHONE),
  whatsapp: clean(env.VITE_SUPPORT_WHATSAPP),
  email: clean(env.VITE_SUPPORT_EMAIL),
};

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
export const whatsappHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

export const LEGAL = {
  companyName: clean(env.VITE_LEGAL_COMPANY_NAME),
  companyForm: clean(env.VITE_LEGAL_COMPANY_FORM),
  address: clean(env.VITE_LEGAL_ADDRESS),
  rc: clean(env.VITE_LEGAL_RC),
  nif: clean(env.VITE_LEGAL_NIF),
  phone: clean(env.VITE_LEGAL_PHONE),
  email: clean(env.VITE_LEGAL_EMAIL),
  dpoEmail: clean(env.VITE_LEGAL_DPO_EMAIL),
  director: clean(env.VITE_LEGAL_DIRECTOR),
  host: clean(env.VITE_LEGAL_HOST),
};

export const TURNSTILE_SITE_KEY = clean(env.VITE_TURNSTILE_SITE_KEY);
