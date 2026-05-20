import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDocFromServer, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { UserData, CashbackLog } from '../types';

interface UserDataContextType {
  userData: UserData;
  updateUserData: (updates: Partial<UserData>) => void;
  user: User | null;
  isAuthLoading: boolean;
  isDataLoaded: boolean;
  isSyncing: boolean;
  syncError: string | null;
  isSyncPaused: boolean;
  setIsSyncPaused: (paused: boolean) => void;
  saveData: () => Promise<void>;
  handleDeleteData: () => Promise<void>;
}

const getInitialState = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultValue;
};

const safeSetItem = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Could not save ${key} to localStorage`, e);
  }
};

const defaultUserData: UserData = {
  exhaustedCards: {},
  cardBillDates: {},
  paidBills: {},
  loungePassesUsed: {},
  loungeMilestonesVerified: {},
  offerUsage: {},
  openRouterApiKey: '',
  kiwiNeonEarnRate: 2,
  walletCards: [],
  cashbackLogs: [],
  theme: null,
};

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(() => ({
    exhaustedCards: getInitialState('oc_exhaustedCards', defaultUserData.exhaustedCards),
    cardBillDates: getInitialState('oc_cardBillDates', defaultUserData.cardBillDates),
    paidBills: getInitialState('oc_paidBills', defaultUserData.paidBills),
    loungePassesUsed: getInitialState('oc_loungePassesUsed', defaultUserData.loungePassesUsed),
    loungeMilestonesVerified: getInitialState('oc_loungeMilestonesVerified', defaultUserData.loungeMilestonesVerified),
    offerUsage: getInitialState('oc_offerUsage', defaultUserData.offerUsage),
    openRouterApiKey: getInitialState('oc_openRouterApiKey', defaultUserData.openRouterApiKey),
    kiwiNeonEarnRate: getInitialState('oc_kiwiNeonEarnRate', defaultUserData.kiwiNeonEarnRate),
    walletCards: getInitialState('oc_walletCards', defaultUserData.walletCards),
    cashbackLogs: getInitialState('oc_cashbackLogs', defaultUserData.cashbackLogs),
    theme: getInitialState('oc_theme', defaultUserData.theme)
  }));

  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncPaused, setIsSyncPaused] = useState(() => getInitialState('oc_isSyncPaused', false));

  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(false);
  const pendingSyncCounterRef = useRef(0);
  const skipSyncRef = useRef(false);
  const latestDataRef = useRef(userData);

  useEffect(() => {
    latestDataRef.current = userData;
  }, [userData]);

  const updateUserData = (updates: Partial<UserData>) => {
    setUserData(prev => {
      const next = { ...prev, ...updates };
      
      // Update local storage
      Object.keys(updates).forEach(key => {
        safeSetItem(`oc_${key}`, next[key as keyof UserData]);
      });
      // specific mapping for backward compatibility
      if (updates.theme !== undefined) {
        safeSetItem('oc_isDarkMode', updates.theme !== 'light');
      }

      return next;
    });

    if (isDataLoaded && !skipSyncRef.current) {
      pendingSyncCounterRef.current += 1;
      setIsDirty(true);
      isDirtyRef.current = true;
    }
  };

  useEffect(() => {
    safeSetItem('oc_isSyncPaused', isSyncPaused);
  }, [isSyncPaused]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsDataLoaded(false);
      setIsDirty(false);
      isDirtyRef.current = false;
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      skipSyncRef.current = true;
      // Load local state again just in case
      setUserData({
        exhaustedCards: getInitialState('oc_exhaustedCards', defaultUserData.exhaustedCards),
        cardBillDates: getInitialState('oc_cardBillDates', defaultUserData.cardBillDates),
        paidBills: getInitialState('oc_paidBills', defaultUserData.paidBills),
        loungePassesUsed: getInitialState('oc_loungePassesUsed', defaultUserData.loungePassesUsed),
        loungeMilestonesVerified: getInitialState('oc_loungeMilestonesVerified', defaultUserData.loungeMilestonesVerified),
        offerUsage: getInitialState('oc_offerUsage', defaultUserData.offerUsage),
        openRouterApiKey: getInitialState('oc_openRouterApiKey', defaultUserData.openRouterApiKey),
        kiwiNeonEarnRate: getInitialState('oc_kiwiNeonEarnRate', defaultUserData.kiwiNeonEarnRate),
        walletCards: getInitialState('oc_walletCards', defaultUserData.walletCards),
        cashbackLogs: getInitialState('oc_cashbackLogs', defaultUserData.cashbackLogs),
        theme: getInitialState('oc_theme', defaultUserData.theme)
      });
      setTimeout(() => { skipSyncRef.current = false; setIsDataLoaded(true); }, 100);
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.metadata.hasPendingWrites) return;
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        skipSyncRef.current = true;
        setUserData(prev => ({
          ...prev,
          exhaustedCards: data.exhaustedCards ?? prev.exhaustedCards,
          cardBillDates: data.cardBillDates ?? prev.cardBillDates,
          paidBills: data.paidBills ?? prev.paidBills,
          loungePassesUsed: data.loungePassesUsed ?? prev.loungePassesUsed,
          loungeMilestonesVerified: data.loungeMilestonesVerified ?? prev.loungeMilestonesVerified,
          offerUsage: data.offerUsage ?? prev.offerUsage,
          openRouterApiKey: data.openRouterApiKey !== undefined ? data.openRouterApiKey : prev.openRouterApiKey,
          kiwiNeonEarnRate: data.kiwiNeonEarnRate !== undefined ? data.kiwiNeonEarnRate : prev.kiwiNeonEarnRate,
          walletCards: data.walletCards ?? prev.walletCards,
          cashbackLogs: data.cashbackLogs ?? prev.cashbackLogs,
          theme: data.theme ?? (data.isDarkMode !== undefined ? (data.isDarkMode ? 'dark' : 'light') : prev.theme),
        }));
        setTimeout(() => { skipSyncRef.current = false; }, 100);
      }
      setIsDataLoaded(true);
      setSyncError(null);
    }, (error: any) => {
      setSyncError(error.message || 'Failed to sync with cloud');
      setIsDataLoaded(true);
    });

    return () => unsubscribe();
  }, [user]);

  const saveData = async () => {
    if (!user) return;
    setIsSyncing(true);
    
    const syncCounterAtStart = pendingSyncCounterRef.current;
    const dataToSave = latestDataRef.current;

    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        userId: user.uid,
        ...dataToSave,
        isDarkMode: dataToSave.theme !== 'light',
        updatedAt: Date.now()
      }, { merge: true });
      
      setSyncError(null);
      if (pendingSyncCounterRef.current === syncCounterAtStart) {
        setIsDirty(false);
        isDirtyRef.current = false;
      }
    } catch (error: any) {
      setSyncError(error.message || 'Failed to save to cloud');
      try {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      } catch (e) {
        console.warn('Save failed, state is local only.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!user || isAuthLoading || !isDataLoaded || skipSyncRef.current || !isDirty || isSyncing || isSyncPaused) return;

    const timer = setTimeout(() => {
      saveData();
    }, 1000); 

    return () => clearTimeout(timer);
  }, [isDirty, user, isAuthLoading, isDataLoaded, isSyncPaused, isSyncing, userData]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDocFromServer(docRef);
          if (docSnap.exists() && !isDirtyRef.current) {
            const data = docSnap.data() as any;
            skipSyncRef.current = true;
            setUserData(prev => ({
              ...prev,
              exhaustedCards: data.exhaustedCards ?? prev.exhaustedCards,
              cardBillDates: data.cardBillDates ?? prev.cardBillDates,
              paidBills: data.paidBills ?? prev.paidBills,
              loungePassesUsed: data.loungePassesUsed ?? prev.loungePassesUsed,
              loungeMilestonesVerified: data.loungeMilestonesVerified ?? prev.loungeMilestonesVerified,
              offerUsage: data.offerUsage ?? prev.offerUsage,
              openRouterApiKey: data.openRouterApiKey !== undefined ? data.openRouterApiKey : prev.openRouterApiKey,
              kiwiNeonEarnRate: data.kiwiNeonEarnRate !== undefined ? data.kiwiNeonEarnRate : prev.kiwiNeonEarnRate,
              walletCards: data.walletCards ?? prev.walletCards,
              cashbackLogs: data.cashbackLogs ?? prev.cashbackLogs,
              theme: data.theme ?? (data.isDarkMode !== undefined ? (data.isDarkMode ? 'dark' : 'light') : prev.theme),
            }));
            setTimeout(() => { skipSyncRef.current = false; }, 100);
          }
        } catch (e) {
          console.error("Failed to persistently refresh data on visibility change", e);
        }
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = setInterval(() => {
       if (document.visibilityState === 'visible' && user && !isDirtyRef.current) {
          handleVisibilityChange();
       }
    }, 30000);

    return () => {
       document.removeEventListener("visibilitychange", handleVisibilityChange);
       clearInterval(interval);
    }
  }, [user]);

  const handleDeleteData = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      await deleteDoc(docRef);
      skipSyncRef.current = true;
      setUserData(defaultUserData);
      Object.keys(defaultUserData).forEach(key => {
        safeSetItem(`oc_${key}`, defaultUserData[key as keyof UserData]);
      });
      setSyncError(null);
      setIsDirty(false);
      setTimeout(() => { skipSyncRef.current = false; }, 500);
    } catch (error: any) {
      console.error('Error deleting data:', error);
      throw error;
    }
  };

  return (
    <UserDataContext.Provider value={{
      userData, updateUserData, user, isAuthLoading, isDataLoaded, isSyncing, syncError, isSyncPaused, setIsSyncPaused, saveData, handleDeleteData
    }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
