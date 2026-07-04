import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlugUrl(name: string, id: string | number) {
  if (!name) return String(id);
  const slug = name.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  
  const encodedId = btoa(id.toString()).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${slug}--${encodedId}`;
}

export function extractIdFromSlug(slugUrl: string | undefined) {
  if (!slugUrl) return null;
  // It could be just an ID (like old URLs) or a slug--id format
  if (slugUrl.includes('--')) {
    const parts = slugUrl.split('--');
    const encodedId = parts[parts.length - 1].replace(/-/g, '+').replace(/_/g, '/');
    try {
      return atob(encodedId);
    } catch(e) {
      return slugUrl; // fallback
    }
  }
  // Try to decode if it looks like base64 without hyphens
  try {
     return atob(slugUrl.replace(/-/g, '+').replace(/_/g, '/'));
  } catch(e) {
     return slugUrl; // old format fallback
  }
}
