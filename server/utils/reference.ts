import crypto from 'crypto';

export function generateReferenceId(prefix: string): string {
  // Generates a string like PRD-4A2B81
  const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${hex}`;
}
