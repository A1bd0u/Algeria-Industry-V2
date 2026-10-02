import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

// Catégories produit (groupes A à E) de la page affichée : le bandeau
// publicitaire, rendu au-dessus des pages, s'en sert pour cibler les annonces.

interface AdTargeting {
  categories: string[];
  setCategories: (categories: string[]) => void;
}

const AdTargetingContext = createContext<AdTargeting>({ categories: [], setCategories: () => {} });

export const AdTargetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<string[]>([]);
  return (
    <AdTargetingContext.Provider value={{ categories, setCategories }}>
      {children}
    </AdTargetingContext.Provider>
  );
};

export const useAdTargeting = () => useContext(AdTargetingContext).categories;

// Déclare les catégories de la page tant qu'elle est affichée.
export const useAdCategories = (categories: (string | null | undefined)[]) => {
  const { setCategories } = useContext(AdTargetingContext);
  const key = [...new Set(categories.filter(Boolean) as string[])].sort().join(',');
  useEffect(() => {
    setCategories(key ? key.split(',') : []);
    return () => setCategories([]);
  }, [key, setCategories]);
};
