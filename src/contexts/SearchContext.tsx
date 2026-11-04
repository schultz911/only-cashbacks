import React, { createContext, useContext, useCallback, useRef } from 'react';
import { useSearchAndCurrency } from '../hooks/useSearchAndCurrency';
import { useAuthSyncContext } from './AuthSyncContext';

const SearchContext = createContext<ReturnType<typeof useSearchAndCurrency> | null>(null);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthSyncContext();
  return <OwnedSearchProvider key={user?.uid ?? 'guest'} owner={user?.uid ?? null}>{children}</OwnedSearchProvider>;
};

const OwnedSearchProvider: React.FC<{ children: React.ReactNode; owner: string | null }> = ({ children, owner }) => {
  const searchState = useSearchAndCurrency(owner);
  const { skipSyncRef, markDirty, pendingEditsRef } = useAuthSyncContext();
  const keyRef = useRef(searchState.openRouterApiKey);
  keyRef.current = searchState.openRouterApiKey;
  const setOpenRouterApiKey = useCallback<typeof searchState.setOpenRouterApiKey>((next) => {
    const value = typeof next === 'function' ? next(keyRef.current) : next;
    keyRef.current = value;
    searchState.setOpenRouterApiKey(value);
    if (!skipSyncRef.current) { pendingEditsRef.current.openRouterApiKey = value; markDirty(); }
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
