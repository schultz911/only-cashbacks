import React, { createContext, useContext } from 'react';
import { useWalletState } from '../hooks/useWalletState';
import { useAuthSyncContext } from './AuthSyncContext';

const WalletContext = createContext<ReturnType<typeof useWalletState> | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, skipSyncRef, markDirty, pendingEditsRef, authEpochRef } = useAuthSyncContext();
  return <OwnedWalletProvider key={`${user?.uid ?? 'guest'}:${authEpochRef?.current ?? 0}`} owner={user?.uid ?? null} skipSyncRef={skipSyncRef} markDirty={markDirty} pendingEditsRef={pendingEditsRef} authEpochRef={authEpochRef}>{children}</OwnedWalletProvider>;
};

const OwnedWalletProvider: React.FC<{ children: React.ReactNode; owner: string | null; skipSyncRef: React.MutableRefObject<boolean>; markDirty: () => void; pendingEditsRef: React.MutableRefObject<Record<string, unknown>>; authEpochRef?: React.MutableRefObject<number> }> = ({children, owner, skipSyncRef, markDirty, pendingEditsRef, authEpochRef}) => {
  const walletState = useWalletState(skipSyncRef, markDirty, owner, pendingEditsRef, authEpochRef);

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
