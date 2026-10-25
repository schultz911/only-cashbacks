import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isDirty, setIsDirtyState] = useState(false);
  const isDirtyRef = useRef(false);
  const pendingSyncCounterRef = useRef(0);
  const authEpochRef = useRef(0);
  const hydrationCounterRef = useRef(0);

  const setIsDirty = useCallback<React.Dispatch<React.SetStateAction<boolean>>>((next) => {
    const dirty = typeof next === 'function' ? next(isDirtyRef.current) : next;
    isDirtyRef.current = dirty;
    if (!dirty) hydrationCounterRef.current += 1;
    setIsDirtyState(dirty);
  }, []);

  const markDirty = useCallback(() => {
    if (!skipSyncRef.current) {
      pendingSyncCounterRef.current += 1;
      setIsDirty(true);
      isDirtyRef.current = true;
    }
  }, [skipSyncRef]);

  const [theme, setThemeState] = useState<'light' | 'dark' | 'oled'>(() => {
    const saved = getInitialState('oc_theme', null);
    if (saved) return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return getInitialState('oc_isDarkMode', false) ? 'dark' : 'light';
  });
  const setTheme = useCallback<React.Dispatch<React.SetStateAction<typeof theme>>>((next) => {
    setThemeState(next);
    markDirty();
  }, [markDirty]);

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
      authEpochRef.current += 1;
      hydrationCounterRef.current += 1;
      setIsDataLoaded(false);
      setIsDirty(false);
      isDirtyRef.current = false;
      setIsSyncing(false);
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
    if (isDirtyRef.current) return;
    const hydration = ++hydrationCounterRef.current;
    const revision = pendingSyncCounterRef.current;
    const epoch = authEpochRef.current;
    const localOfflineQueue = data.cashbackLogs
      ? (await get<any[]>('oc_offlineLogsQueue')) || []
      : [];

    // An edit, account change or newer snapshot may arrive while IndexedDB loads.
    if (hydration !== hydrationCounterRef.current || epoch !== authEpochRef.current ||
        revision !== pendingSyncCounterRef.current || isDirtyRef.current) return;

    const wasSkipping = skipSyncRef.current;
    skipSyncRef.current = true;
    try {
      if (data.exhaustedCards) setFunctions.setExhaustedCards(data.exhaustedCards);
      if (data.cardBillDates) setFunctions.setCardBillDates(data.cardBillDates);
      if (data.paidBills) setFunctions.setPaidBills(data.paidBills);
      if (data.loungePassesUsed) setFunctions.setLoungePassesUsed(data.loungePassesUsed);
      if (data.loungeMilestonesVerified) setFunctions.setLoungeMilestonesVerified(data.loungeMilestonesVerified);
      if (data.offerUsage) setFunctions.setOfferUsage(data.offerUsage);
      if (data.openRouterApiKey !== undefined) setFunctions.setOpenRouterApiKey(data.openRouterApiKey);
      if (data.kiwiNeonEarnRate !== undefined) setFunctions.setKiwiNeonEarnRate(data.kiwiNeonEarnRate);
      if (data.walletCards) setFunctions.setWalletCards(data.walletCards);

      if (data.cashbackLogs) {
        if (localOfflineQueue.length === 0) {
          setFunctions.setCashbackLogs(data.cashbackLogs);
        } else {
          const uniqueMap = new Map();
          for (const item of data.cashbackLogs) uniqueMap.set(item.date, item);
          for (const item of localOfflineQueue) uniqueMap.set(item.date, item);
          setFunctions.setCashbackLogs(Array.from(uniqueMap.values()));
        }
      }

      if (data.theme) setTheme(data.theme);
      else if (data.isDarkMode !== undefined) setTheme(data.isDarkMode ? 'dark' : 'light');
    } finally {
      skipSyncRef.current = wasSkipping;
    }
    if (localOfflineQueue.length > 0) {
      // Merged offline edits still need uploading; cloud hydration alone does not.
      markDirty();
      await set('oc_offlineLogsQueue', []);
    }
  };

  // We expose a setup effect hook generator to inject setFunctions cleanly
  const useSyncEffect = (setFunctions: any) => {
    useEffect(() => {
      if (!user) {
        const wasSkipping = skipSyncRef.current;
        skipSyncRef.current = true;
        try {
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

        } finally {
          skipSyncRef.current = wasSkipping;
        }
        setIsDataLoaded(true);
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

      return () => {
        hydrationCounterRef.current += 1;
        unsubscribe();
      };
    }, [user]);

    useEffect(() => {
      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible' && user) {
          const epoch = authEpochRef.current;
          try {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDocFromServer(docRef);
            if (epoch === authEpochRef.current && docSnap.exists() && !isDirtyRef.current) {
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
    const epoch = authEpochRef.current;
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
      
      if (epoch !== authEpochRef.current) return;
      setSyncError(null);
      if (pendingSyncCounterRef.current === syncCounterAtStart) {
        setIsDirty(false);
        isDirtyRef.current = false;
      }
    } catch (error: any) {
      if (epoch !== authEpochRef.current) return;
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
      if (epoch === authEpochRef.current) setIsSyncing(false);
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
