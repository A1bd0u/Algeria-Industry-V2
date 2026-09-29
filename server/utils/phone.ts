// Numéro WhatsApp au format international (E.164, sans le « + ») pour les
// liens wa.me. Les numéros mobiles algériens saisis en local (05, 06, 07…)
// sont convertis en 213…
export const normalizeWhatsapp = (input: string): string | null => {
  const digits = input.replace(/[\s.\-()]/g, '');
  if (!digits) return null;
  let normalized = digits.startsWith('+') ? digits.slice(1) : digits.startsWith('00') ? digits.slice(2) : digits;
  // Un 0 initial désigne un numéro algérien saisi en local : seul un mobile est accepté.
  if (normalized.startsWith('0')) {
    if (!/^0[567]\d{8}$/.test(normalized)) return null;
    normalized = `213${normalized.slice(1)}`;
  }
  if (!/^\d{9,15}$/.test(normalized)) return null;
  // Un numéro algérien doit être un mobile (5, 6 ou 7 après l'indicatif).
  if (normalized.startsWith('213') && !/^213[567]\d{8}$/.test(normalized)) return null;
  return normalized;
};
