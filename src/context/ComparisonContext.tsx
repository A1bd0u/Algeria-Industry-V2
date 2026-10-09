import React, { createContext, useContext, useEffect, useState } from 'react';
import { productCategories } from '../data/productCategories';

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  image: string;
  price?: string;
  priceValue?: number | null;
  sellerId?: string | null;
  companyVerified?: boolean;
  features?: string[];
  specs: { [key: string]: string };
}

interface ComparisonContextType {
  comparedProducts: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isCompared: (productId: string) => boolean;
  // Ajoute ou retire un produit ; « full » si la limite est atteinte.
  toggleCompare: (product: Product) => 'added' | 'removed' | 'full';
}

// Lien pour choisir d'autres produits à comparer : le catalogue du secteur
// (plus large que la sous-catégorie, qui ne compte souvent qu'un ou deux produits).
export const moreToCompareHref = (category?: string | null) => {
  const group = category
    ? productCategories.find((g) => g.name === category || g.subCategories.some((s) => s.name === category))
    : null;
  return group ? `/products?category=${encodeURIComponent(group.name)}` : '/products';
};

// Produit d'une liste (catalogue, accueil) ou d'une fiche, mis au format du
// comparateur : mêmes libellés de caractéristiques que la fiche produit.
export const toCompareItem = (p: any): Product => {
  const specs: Record<string, string> = { ...(p.specs || {}) };
  if (!p.specs) {
    if (p.category) specs['Catégorie'] = p.category;
    if (p.brand) specs['Marque'] = p.brand;
    if (p.region) specs['Région'] = p.region;
    if (p.reference_id) specs['Référence'] = p.reference_id;
  }
  const images = Array.isArray(p.images) ? p.images.filter((u: unknown) => typeof u === 'string' && u) : [];
  const price = p.priceValue ?? (p.price === null || p.price === undefined || p.price === '' ? null : Number(p.price));
  return {
    id: String(p.id),
    name: p.name,
    category: p.category || '',
    brand: p.companyName || p.company_name || (typeof p.company === 'string' ? p.company : p.company?.name) || '',
    image: images[0] || p.image || p.file_url || '',
    priceValue: Number.isFinite(price) && price > 0 ? price : null,
    sellerId: p.sellerId ?? p.owner_id ?? null,
    companyVerified: Boolean(p.companyVerified ?? p.company_verified),
    features: Array.isArray(p.features) ? p.features.slice(0, 8) : [],
    specs,
  };
};

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const MAX_COMPARED = 4;

// La sélection est gardée dans le navigateur : elle survit à un rechargement,
// à un lien ouvert dans un nouvel onglet et à l'accès direct à /compare.
const STORAGE_KEY = 'industigo_compare_v1';

const loadStored = (): Product[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? list.filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string').slice(0, MAX_COMPARED)
      : [];
  } catch {
    return [];
  }
};

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comparedProducts, setComparedProducts] = useState<Product[]>(loadStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparedProducts));
    } catch {
      // Stockage indisponible (navigation privée) : la sélection reste en mémoire.
    }
  }, [comparedProducts]);

  // Un autre onglet a modifié la sélection : on la reprend.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setComparedProducts(loadStored());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addToCompare = (product: Product) => {
    setComparedProducts((list) =>
      list.length >= MAX_COMPARED || list.some((p) => p.id === product.id) ? list : [...list, product],
    );
  };

  const removeFromCompare = (productId: string) => {
    setComparedProducts((list) => list.filter((p) => p.id !== productId));
  };

  const clearCompare = () => setComparedProducts([]);

  const isCompared = (productId: string) => comparedProducts.some((p) => p.id === productId);

  const toggleCompare = (product: Product) => {
    if (isCompared(product.id)) {
      removeFromCompare(product.id);
      return 'removed';
    }
    if (comparedProducts.length >= MAX_COMPARED) return 'full';
    addToCompare(product);
    return 'added';
  };

  return (
    <ComparisonContext.Provider value={{ comparedProducts, addToCompare, removeFromCompare, clearCompare, isCompared, toggleCompare }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) throw new Error('useComparison must be used within a ComparisonProvider');
  return context;
};
