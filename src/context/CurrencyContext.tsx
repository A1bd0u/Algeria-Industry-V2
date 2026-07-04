import React, { createContext, ReactNode, useContext, useState } from 'react';

type Currency = 'DZD' | 'EUR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (price: number | string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('DZD');

  const formatPrice = (price: number | string) => {
    if (typeof price === 'string' && price.toLowerCase().includes('devis')) {
      return price;
    }
    
    const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
    
    if (isNaN(numericPrice)) return price.toString();

    // Mock conversion rates
    const rates = {
      DZD: 1,
      EUR: 0.0068,
      USD: 0.0074
    };

    const convertedPrice = numericPrice * rates[currency];
    
    return new Intl.NumberFormat(currency === 'DZD' ? 'fr-DZ' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(convertedPrice);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
