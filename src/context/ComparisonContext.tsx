import React, { createContext, useContext, useEffect, useState } from 'react';

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
}

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

  return (
    <ComparisonContext.Provider value={{ comparedProducts, addToCompare, removeFromCompare, clearCompare }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) throw new Error('useComparison must be used within a ComparisonProvider');
  return context;
};
