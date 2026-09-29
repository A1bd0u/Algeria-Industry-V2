import crypto from 'crypto';
import { logger } from './logger';

// Vérifie un mot de passe contre la base Have I Been Pwned par k-anonymat :
// seuls les 5 premiers caractères du SHA-1 quittent le serveur.
// En cas d'indisponibilité du service, on n'empêche pas l'inscription.
export const isPasswordPwned = async (password: string): Promise<boolean> => {
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_PWNED_CHECK === 'true') {
    return false;
  }

  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return false;
    const body = await response.text();
    return body.split('\n').some((line) => {
      const [hashSuffix, count] = line.trim().split(':');
      return hashSuffix === suffix && Number(count) > 0;
    });
  } catch (err) {
    logger.warn('Pwned password check unavailable', err);
    return false;
  }
};
