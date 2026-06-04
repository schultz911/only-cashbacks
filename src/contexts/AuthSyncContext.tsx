import React, { createContext, useContext, useRef } from 'react';
import { useAuthAndSync } from '../hooks/useAuthAndSync';

const AuthSyncContext = createContext<ReturnType<typeof useAuthAndSync> & { skipSyncRef: React.MutableRefObject<boolean>, latestStateRef: React.MutableRefObject<any> } | null>(null);

export const AuthSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const skipSyncRef = useRef(false);
  const latestStateRef = useRef<any>({});
  
  const authSyncState = useAuthAndSync(latestStateRef, skipSyncRef);

  return (
    <AuthSyncContext.Provider value={{ ...authSyncState, skipSyncRef, latestStateRef }}>
      {children}
    </AuthSyncContext.Provider>
  );
};

export const useAuthSyncContext = () => {
  const context = useContext(AuthSyncContext);
  if (!context) throw new Error('useAuthSyncContext must be used within an AuthSyncProvider');
  return context;
};
