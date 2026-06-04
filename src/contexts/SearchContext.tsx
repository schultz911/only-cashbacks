import React, { createContext, useContext } from 'react';
import { useSearchAndCurrency } from '../hooks/useSearchAndCurrency';

const SearchContext = createContext<ReturnType<typeof useSearchAndCurrency> | null>(null);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const searchState = useSearchAndCurrency();

  return (
    <SearchContext.Provider value={searchState}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearchContext must be used within a SearchProvider');
  return context;
};
