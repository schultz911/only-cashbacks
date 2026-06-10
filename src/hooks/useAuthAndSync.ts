import { useState, useEffect, useRef } from 'react';
import { auth, db, handleFirestoreError, OperationType, googleProvider } from '../firebase';
import { onAuthStateChanged, User, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { doc, getDocFromServer, setDoc, onSnapshot } from 'firebase/firestore';
import { getInitialState, safeSetItem } from '../lib/storage';
import { get, set } from 'idb-keyval';

export function useAuthAndSync(latestStateRef: React.MutableRefObject<any>, skipSyncRef: React.MutableRefObject<boolean>) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncPaused, setIsSyncPaused] = useState(() => getInitialState('oc_isSyncPaused', false));
  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(false);
  const pendingSyncCounterRef = useRef(0);

  const [theme, setTheme] = useState<'light' | 'dark' | 'oled'>(() => {
    const saved = getInitialState('oc_theme', null);
    if (saved) return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return getInitialState('oc_isDarkMode', false) ? 'dark' : 'light';
  });

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'oled');
    let themeColor = '#F5F5F7';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      themeColor = '#0f172a';
    } else if (theme === 'oled') {
      document.documentElement.classList.add('dark', 'oled');
      themeColor = '#000000';
    }
    
    let metaThemeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = "theme-color";
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = themeColor;
    
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      if (meta !== metaThemeColor) meta.remove();
    });

    safeSetItem('oc_theme', theme);
  }, [theme]);

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

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Login error with popup:', error);
      alert(`Login Error: ${error.message || error.code || 'Unknown error'}`);
      if (error.code) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError: any) {
          console.error('Redirect login error:', redirectError);
          alert(`Redirect Error: ${redirectError.message || redirectError.code}`);
        }
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const setLocalStateFromData = async (data: any, setFunctions: any) => {
    skipSyncRef.current = true;
    if (data.exhaustedCards) setFunctions.setExhaustedCards(data.exhaustedCards);
    if (data.cardBillDates) setFunctions.setCardBillDates(data.cardBillDates);
    if (data.paidBills) setFunctions.setPaidBills(data.paidBills);
    if (data.loungePassesUsed) setFunctions.setLoungePassesUsed(data.loungePassesUsed);
    if (data.loungeMilestonesVerified) setFunctions.setLoungeMilestonesVerified(data.loungeMilestonesVerified);
    if (data.offerUsage) setFunctions.setOfferUsage(data.offerUsage);
    if (data.openRouterApiKey !== undefined) setFunctions.setOpenRouterApiKey(data.openRouterApiKey);
    if (data.kiwiNeonEarnRate !== undefined) setFunctions.setKiwiNeonEarnRate(data.kiwiNeonEarnRate);
    if (data.walletCards) setFunctions.setWalletCards(data.walletCards);
    
    // Offline queue merge strategy
    if (data.cashbackLogs) {
      const localOfflineQueue = (await get<any[]>('oc_offlineLogsQueue')) || [];
      if (localOfflineQueue.length === 0) {
        setFunctions.setCashbackLogs(data.cashbackLogs);
      } else {
        const uniqueMap = new Map();
        for (let i = 0, len = data.cashbackLogs.length; i < len; i++) {
          const item = data.cashbackLogs[i];
          uniqueMap.set(item.date, item);
        }
        for (let i = 0, len = localOfflineQueue.length; i < len; i++) {
          const item = localOfflineQueue[i];
          uniqueMap.set(item.date, item);
        }
        setFunctions.setCashbackLogs(Array.from(uniqueMap.values()));
        await set('oc_offlineLogsQueue', []);
      }
    }
    
    if (data.theme) setTheme(data.theme);
    else if (data.isDarkMode !== undefined) setTheme(data.isDarkMode ? 'dark' : 'light');
    setTimeout(() => { skipSyncRef.current = false; }, 100);
  };

  // We expose a setup effect hook generator to inject setFunctions cleanly
  const useSyncEffect = (setFunctions: any) => {
    useEffect(() => {
      if (!user) {
        skipSyncRef.current = true;
        setFunctions.setExhaustedCards(getInitialState('oc_exhaustedCards', {}));
        setFunctions.setLoungePassesUsed(getInitialState('oc_loungePassesUsed', {}));
        setFunctions.setLoungeMilestonesVerified(getInitialState('oc_loungeMilestonesVerified', {}));
        setFunctions.setOfferUsage(getInitialState('oc_offerUsage', {}));
        setFunctions.setOpenRouterApiKey(getInitialState('oc_openRouterApiKey', ''));
        setFunctions.setKiwiNeonEarnRate(getInitialState('oc_kiwiNeonEarnRate', 2));
        setFunctions.setCardBillDates(getInitialState('oc_cardBillDates', {}));
        setFunctions.setPaidBills(getInitialState('oc_paidBills', {}));
        setFunctions.setWalletCards(getInitialState('oc_walletCards', []));
        setFunctions.setCashbackLogs(getInitialState('oc_cashbackLogs', []));
        
        const savedTheme = getInitialState('oc_theme', null);
        if (savedTheme) {
          setTheme(savedTheme as any);
        } else {
          setTheme('light');
        }

        setTimeout(() => { skipSyncRef.current = false; setIsDataLoaded(true); }, 100);
        return;
      }

      const docRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.metadata.hasPendingWrites) return;
        if (docSnap.exists()) {
          setLocalStateFromData(docSnap.data(), setFunctions);
        }
        setIsDataLoaded(true);
        setSyncError(null);
      }, (error: any) => {
        setSyncError(error.message || 'Failed to sync with cloud');
        setIsDataLoaded(true);
      });

      return () => unsubscribe();
    }, [user]);

    useEffect(() => {
      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible' && user) {
          try {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDocFromServer(docRef);
            if (docSnap.exists() && !isDirtyRef.current) {
              await setLocalStateFromData(docSnap.data(), setFunctions);
            }
          } catch (e) {
            console.error("Failed to persistently refresh data on visibility change", e);
          }
        }
      };
      
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
         document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    }, [user]);
  };

  const saveData = async () => {
    if (!user) return;
    setIsSyncing(true);
    
    const syncCounterAtStart = pendingSyncCounterRef.current;
    const dataToSave = latestStateRef.current;

    try {
      // Check offline status manually for queue
      if (!navigator.onLine) {
         throw new Error("Offline");
      }

      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        userId: user.uid,
        ...dataToSave,
        theme: theme, // Theme explicitly relies on backend for logged in users
        isDarkMode: theme !== 'light',
        updatedAt: Date.now()
      }, { merge: true });
      
      setSyncError(null);
      if (pendingSyncCounterRef.current === syncCounterAtStart) {
        setIsDirty(false);
        isDirtyRef.current = false;
      }
    } catch (error: any) {
      if (error.message === "Offline" || error.code === 'unavailable') {
         // Queue offline data locally
         const localOfflineQueue = (await get<any[]>('oc_offlineLogsQueue')) || [];
         // If there are new cashback logs, we queue them
         if (dataToSave.cashbackLogs && dataToSave.cashbackLogs.length > 0) {
            // Robust strategy: append all current logs to the offline queue. 
            // The merge logic in setLocalStateFromData handles deduplication via the uniqueMap.
            await set('oc_offlineLogsQueue', [...localOfflineQueue, ...dataToSave.cashbackLogs]);
         }
         setSyncError('Offline: Changes queued locally.');
      } else {
        setSyncError(error.message || 'Failed to save to cloud');
        try {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        } catch (e) {
          console.warn('Save failed, state is local only.');
        }
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const markDirty = () => {
    if (!skipSyncRef.current) {
      pendingSyncCounterRef.current += 1;
      setIsDirty(true);
      isDirtyRef.current = true;
    }
  };

  useEffect(() => {
    safeSetItem('oc_isSyncPaused', isSyncPaused);
  }, [isSyncPaused]);

  return {
    user, isAuthLoading, isDataLoaded,
    syncError, isSyncing, isSyncPaused, setIsSyncPaused,
    isDirty, setIsDirty, isDirtyRef, markDirty,
    theme, setTheme,
    handleLogin, handleLogout,
    saveData, useSyncEffect
  };
}
