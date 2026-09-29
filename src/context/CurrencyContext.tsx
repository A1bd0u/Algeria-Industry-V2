import React, { createContext, ReactNode, useContext } from 'react';

// Au lancement, les prix sont affichés uniquement en dinars (DZD) :
// aucune conversion à partir de taux figés dans le code.
type Currency = 'DZD';

interface CurrencyContextType {
  currency: Currency;
  formatPrice: (price: number | string | null | undefined) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const formatter = new Intl.NumberFormat('fr-DZ', {
  style: 'currency',
  currency: 'DZD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatDzd = (price: number | string | null | undefined) => {
  if (price === null || price === undefined || price === '') return 'Sur devis';
  if (typeof price === 'string' && price.toLowerCase().includes('devis')) return 'Sur devis';
  const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) return 'Sur devis';
  return formatter.format(numericPrice);
};

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <CurrencyContext.Provider value={{ currency: 'DZD', formatPrice: formatDzd }}>
    {children}
  </CurrencyContext.Provider>
);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
