import React, { createContext, useContext, useCallback } from 'react';
import { useSearchAndCurrency } from '../hooks/useSearchAndCurrency';
import { useAuthSyncContext } from './AuthSyncContext';

const SearchContext = createContext<ReturnType<typeof useSearchAndCurrency> | null>(null);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const searchState = useSearchAndCurrency();
  const { skipSyncRef, markDirty } = useAuthSyncContext();
  const setOpenRouterApiKey = useCallback<typeof searchState.setOpenRouterApiKey>((next) => {
    searchState.setOpenRouterApiKey(next);
    if (!skipSyncRef.current) markDirty();
  }, [searchState.setOpenRouterApiKey, skipSyncRef, markDirty]);

  return (
    <SearchContext.Provider value={{ ...searchState, setOpenRouterApiKey }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearchContext must be used within a SearchProvider');
  return context;
};
