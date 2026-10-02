export const PRODUCT_BUCKET = 'product-images';

// Image déposée via /api/upload dans le bucket public : sous <userId>/ pour
// un utilisateur, n'importe où dans le bucket pour un admin.
export const isAllowedImageUrl = (url: string, user: { id: string; role: string }) => {
  const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  if (!base) return false;
  const prefix = `${base}/storage/v1/object/public/${PRODUCT_BUCKET}/`;
  if (!url.startsWith(prefix) || url.includes('..')) return false;
  return user.role === 'admin' || url.slice(prefix.length).startsWith(`${user.id}/`);
};

// Lien cliquable sûr : http(s) absolu ou chemin interne (« /tarifs »).
export const isSafeLinkUrl = (url: string) => {
  if (/^\/(?!\/)/.test(url)) return true;
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
};
