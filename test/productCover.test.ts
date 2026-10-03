import { describe, expect, it } from 'vitest';
import { productCover } from '../src/lib/utils';

describe('productCover', () => {
  it('prend la première image de la galerie', () => {
    expect(productCover({ images: ['/a.jpg', '/b.jpg'], file_url: '/old.jpg' })).toBe('/a.jpg');
  });
  it('retombe sur les anciens champs', () => {
    expect(productCover({ images: [], image: '/i.jpg' })).toBe('/i.jpg');
    expect(productCover({ file_url: '/f.jpg' })).toBe('/f.jpg');
  });
  it('renvoie null sans visuel', () => {
    expect(productCover({ images: [] })).toBeNull();
    expect(productCover(null)).toBeNull();
  });
});
