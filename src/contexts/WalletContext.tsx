import React, { createContext, useContext } from 'react';
import { useWalletState } from '../hooks/useWalletState';
import { useAuthSyncContext } from './AuthSyncContext';

const WalletContext = createContext<ReturnType<typeof useWalletState> | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { skipSyncRef, setIsDirty } = useAuthSyncContext();
  const walletState = useWalletState(skipSyncRef, setIsDirty);

  return (
    <WalletContext.Provider value={walletState}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWalletContext must be used within a WalletProvider');
  return context;
};
