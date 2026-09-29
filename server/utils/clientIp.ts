import { Request } from 'express';

// Derrière Cloudflare, req.ip est l'adresse du point de présence Cloudflare :
// tous les visiteurs partageraient le même quota. L'en-tête CF-Connecting-IP
// n'est lu que si BEHIND_CLOUDFLARE=true, car il est falsifiable si le
// service reste joignable sans passer par Cloudflare.
export const getClientIp = (req: Request): string => {
  if (process.env.BEHIND_CLOUDFLARE === 'true') {
    const cfIp = req.headers['cf-connecting-ip'];
    if (typeof cfIp === 'string' && cfIp.trim()) {
      return cfIp.trim();
    }
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};
