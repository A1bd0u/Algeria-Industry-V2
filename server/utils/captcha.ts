import { logger } from './logger';

// Vérification Cloudflare Turnstile. Sans clé secrète : refus en production,
// tolérance en développement.
export const verifyCaptcha = async (token: string | undefined | null): Promise<boolean> => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('Configuration error: TURNSTILE_SECRET_KEY is missing');
      return false;
    }
    return true;
  }
  if (!token) return false;
  try {
    const formData = new URLSearchParams();
    formData.append('secret', secret);
    formData.append('response', token);
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });
    const outcome = await result.json();
    return Boolean(outcome.success);
  } catch (err) {
    logger.error('Captcha verification error:', err);
    return false;
  }
};
