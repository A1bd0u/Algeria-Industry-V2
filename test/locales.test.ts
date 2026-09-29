import { describe, it, expect } from 'vitest';
import fr from '../src/locales/fr.json';
import en from '../src/locales/en.json';
import ar from '../src/locales/ar.json';

// Toutes les langues doivent exposer exactement les mêmes clés : une clé
// absente s'afficherait en français (ou brute) dans l'interface traduite.
const flatten = (obj: Record<string, any>, prefix = ''): Record<string, string> =>
  Object.entries(obj).reduce((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') Object.assign(acc, flatten(value, path));
    else acc[path] = value;
    return acc;
  }, {} as Record<string, string>);

const locales = { fr: flatten(fr), en: flatten(en), ar: flatten(ar) };

describe('Fichiers de traduction', () => {
  it('ont les mêmes clés en français, anglais et arabe', () => {
    const reference = Object.keys(locales.fr).sort();
    expect(Object.keys(locales.en).sort()).toEqual(reference);
    expect(Object.keys(locales.ar).sort()).toEqual(reference);
  });

  it('n\'ont aucune valeur vide', () => {
    for (const [lang, entries] of Object.entries(locales)) {
      const empty = Object.entries(entries).filter(([, value]) => typeof value === 'string' && !value.trim());
      expect(empty.map(([key]) => `${lang}:${key}`)).toEqual([]);
    }
  });

  it('gardent les mêmes variables d\'interpolation', () => {
    const vars = (text: string) => (String(text).match(/{{\s*\w+\s*}}/g) || []).sort();
    for (const key of Object.keys(locales.fr)) {
      expect(vars(locales.en[key]), `en:${key}`).toEqual(vars(locales.fr[key]));
      expect(vars(locales.ar[key]), `ar:${key}`).toEqual(vars(locales.fr[key]));
    }
  });

  it('traduisent chaque code d\'erreur de l\'API', () => {
    const codes = Object.keys(locales.fr).filter((key) => key.startsWith('errors.'));
    expect(codes.length).toBeGreaterThan(20);
    for (const key of codes) {
      expect(locales.ar[key]).not.toEqual(locales.fr[key]);
    }
  });
});
