import { Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Durée de vie courte : le rôle et la suspension sont de toute façon relus
// en base à chaque requête, mais un jeton volé expire vite.
export const SESSION_TTL_SECONDS = 24 * 60 * 60;

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
});

// Le JWT ne porte que l'identité : aucune décision d'autorisation ne s'appuie dessus.
export const issueSession = (res: Response, user: { id: string; token_version?: number | null }) => {
  const token = jwt.sign(
    { id: user.id, token_version: user.token_version || 0 },
    JWT_SECRET,
    { expiresIn: SESSION_TTL_SECONDS }
  );
  res.cookie('token', token, { ...cookieOptions(), maxAge: SESSION_TTL_SECONDS * 1000 });
};

export const clearSession = (res: Response) => {
  res.clearCookie('token', cookieOptions());
};
