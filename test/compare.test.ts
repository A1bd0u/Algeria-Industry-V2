import { describe, expect, it } from 'vitest';
import { moreToCompareHref, toCompareItem } from '../src/context/ComparisonContext';

describe('Comparateur', () => {
  it('met un produit de liste au format du comparateur', () => {
    const item = toCompareItem({
      id: 7, name: 'Vanne', category: 'Hydraulique & pneumatique', brand: 'Saharis', region: 'Ouargla',
      price: '1500', images: ['/a.jpg'], company_name: 'Saharis Énergies', company_verified: true,
      owner_id: 'u1', features: ['DN50'],
    });
    expect(item).toMatchObject({
      id: '7', brand: 'Saharis Énergies', image: '/a.jpg', priceValue: 1500, sellerId: 'u1',
      companyVerified: true, features: ['DN50'],
      specs: { 'Catégorie': 'Hydraulique & pneumatique', Marque: 'Saharis', 'Région': 'Ouargla' },
    });
  });

  it('garde les caractéristiques d\'une fiche produit et traite « sur devis »', () => {
    const item = toCompareItem({ id: 'p', name: 'X', companyName: 'Y', priceValue: null, price: null, specs: { 'Région': 'Oran' } });
    expect(item.specs).toEqual({ 'Région': 'Oran' });
    expect(item.priceValue).toBeNull();
    expect(item.brand).toBe('Y');
  });

  it('propose les autres produits du secteur', () => {
    expect(moreToCompareHref('Hydraulique & pneumatique')).toBe(`/products?category=${encodeURIComponent('Mécanique, Métallurgie & Machines')}`);
    expect(moreToCompareHref('Inconnue')).toBe('/products');
    expect(moreToCompareHref(null)).toBe('/products');
  });
});
