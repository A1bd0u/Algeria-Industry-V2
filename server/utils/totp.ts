import crypto from 'crypto';

// Double authentification TOTP (RFC 6238) : codes à 6 chiffres renouvelés
// toutes les 30 secondes, compatibles Google Authenticator, Microsoft
// Authenticator, Aegis, 1Password…

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;
// Tolérance d'une période avant/après pour absorber un léger décalage d'horloge.
const TOTP_WINDOW = 1;

export const base32Encode = (buffer: Buffer): string => {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
};

export const base32Decode = (input: string): Buffer => {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error('Secret base32 invalide');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
};

// Secret de 160 bits, taille recommandée par la RFC 4226.
export const generateTotpSecret = () => base32Encode(crypto.randomBytes(20));

export const currentStep = (now = Date.now()) => Math.floor(now / 1000 / TOTP_PERIOD_SECONDS);

export const totpAt = (secret: string, step: number): string => {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return (binary % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, '0');
};

/**
 * Vérifie un code et renvoie le pas de temps reconnu (ou null). Un pas
 * inférieur ou égal à `lastUsedStep` est refusé : un code déjà utilisé ne
 * peut pas être rejoué.
 */
export const verifyTotp = (
  secret: string,
  code: string,
  lastUsedStep: number | null = null,
  now = Date.now()
): number | null => {
  if (!/^\d{6}$/.test(code)) return null;
  const step = currentStep(now);
  for (let delta = -TOTP_WINDOW; delta <= TOTP_WINDOW; delta++) {
    const candidate = step + delta;
    if (lastUsedStep !== null && candidate <= lastUsedStep) continue;
    const expected = Buffer.from(totpAt(secret, candidate));
    if (crypto.timingSafeEqual(expected, Buffer.from(code))) return candidate;
  }
  return null;
};

export const otpauthUri = (secret: string, account: string, issuer = 'Algeria Industry') =>
  `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD_SECONDS}`;

// --- Chiffrement du secret au repos (AES-256-GCM) ---------------------------
// Clé dédiée MFA_ENCRYPTION_KEY (32 octets en hex ou base64) ; à défaut, clé
// dérivée de JWT_SECRET par HKDF pour ne jamais stocker le secret en clair.

const encryptionKey = (): Buffer => {
  const raw = process.env.MFA_ENCRYPTION_KEY;
  if (raw) {
    const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
    if (key.length === 32) return key;
    throw new Error('MFA_ENCRYPTION_KEY doit faire 32 octets (64 caractères hex ou base64)');
  }
  const base = process.env.JWT_SECRET;
  if (!base) throw new Error('JWT_SECRET manquant');
  return Buffer.from(crypto.hkdfSync('sha256', base, 'algeria-industry', 'mfa-secret-encryption', 32));
};

export const encryptSecret = (plain: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join(':');
};

export const decryptSecret = (payload: string): string => {
  const [version, iv, tag, data] = payload.split(':');
  if (version !== 'v1' || !iv || !tag || !data) throw new Error('Secret chiffré invalide');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
};

// --- Codes de secours ----------------------------------------------------------
// 10 codes à usage unique (format xxxx-xxxx), stockés sous forme d'empreinte.

export const RECOVERY_CODE_COUNT = 10;

export const normalizeRecoveryCode = (code: string) => code.toLowerCase().replace(/[^0-9a-z]/g, '');

export const hashRecoveryCode = (code: string) =>
  crypto.createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex');

export const generateRecoveryCodes = () =>
  Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const raw = crypto.randomBytes(5).toString('hex').slice(0, 8);
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  });
