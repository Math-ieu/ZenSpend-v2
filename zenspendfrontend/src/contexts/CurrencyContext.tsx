import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { globalCurrencyState } from '../lib/utils';

// Static fallback rates in case API is offline or restricted
const DEFAULT_RATES: Record<string, number> = {
  EUR: 1.0,
  USD: 1.09,
  GBP: 0.84,
  CAD: 1.48,
  JPY: 170.8,
  CHF: 0.98,
};

interface CurrencyContextType {
  currency: string;
  setCurrency: (cur: string) => void;
  rates: Record<string, number>;
  isLoadingRates: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem('zenspend_currency') || 'EUR';
  });
  const [rates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [isLoadingRates] = useState(false);

  // Sync state to our global utils.ts reactive bridge
  useEffect(() => {
    globalCurrencyState.setCurrency(currency);
  }, [currency]);

  // Sync rates to our global utils.ts reactive bridge
  useEffect(() => {
    globalCurrencyState.setRates(rates);
  }, [rates]);

  const setCurrency = (cur: string) => {
    setCurrencyState(cur);
    localStorage.setItem('zenspend_currency', cur);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, isLoadingRates }}>
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
