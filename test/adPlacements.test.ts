import { describe, expect, it } from 'vitest';
import { adPlacementForPath } from '../src/data/adPlacements';
import { categoryGroupId } from '../src/data/productCategories';

describe('Emplacements du bandeau publicitaire', () => {
  it('associe chaque page à son groupe, et exclut les pages sans bandeau', () => {
    expect(adPlacementForPath('/')).toBe('home');
    expect(adPlacementForPath('/products')).toBe('catalog');
    expect(adPlacementForPath('/products/pompe--abc')).toBe('catalog');
    expect(adPlacementForPath('/search')).toBe('catalog');
    expect(adPlacementForPath('/compare')).toBe('catalog');
    expect(adPlacementForPath('/secteurs/machines-equipements')).toBe('catalog');
    expect(adPlacementForPath('/directory/sarl--abc')).toBe('suppliers');
    expect(adPlacementForPath('/blog/article--abc')).toBe('content');
    expect(adPlacementForPath('/events')).toBe('content');
    for (const path of ['/login', '/register', '/dashboard', '/contact', '/terms', '/ads-request', '/tarifs', '/faq', '/productsx', '/extranet']) {
      expect(adPlacementForPath(path)).toBeNull();
    }
  });

  it('retrouve le groupe d\'une catégorie produit', () => {
    expect(categoryGroupId('Machines-outils : Tours, fraiseuses, presses.')).toBe('B');
    expect(categoryGroupId('Consommables & Fournitures')).toBe('E');
    expect(categoryGroupId('C')).toBe('C');
    expect(categoryGroupId('Inconnue')).toBeNull();
    expect(categoryGroupId(null)).toBeNull();
  });
});
