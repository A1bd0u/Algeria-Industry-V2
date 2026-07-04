import React, { createContext, useContext, useState } from 'react';

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  image: string;
  price?: string;
  specs: { [key: string]: string };
}

interface ComparisonContextType {
  comparedProducts: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);

  const addToCompare = (product: Product) => {
    if (comparedProducts.length >= 4) return; // Limite à 4 produits
    if (!comparedProducts.find(p => p.id === product.id)) {
      setComparedProducts([...comparedProducts, product]);
    }
  };

  const removeFromCompare = (productId: string) => {
    setComparedProducts(comparedProducts.filter(p => p.id !== productId));
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
