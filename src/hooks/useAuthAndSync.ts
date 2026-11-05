import { useState, useEffect, useRef, useCallback } from 'react';
import { auth, db, handleFirestoreError, OperationType, googleProvider } from '../firebase';
import { onAuthStateChanged, User, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { doc, getDocFromServer, runTransaction, onSnapshot } from 'firebase/firestore';
import { excludeRemovedLogs, getInitialState, safeSetItem, getOwnedState, setOwnedState, scopedKey, preserveLegacyStorage, persistOwnedSnapshot } from '../lib/storage';
import { get, set, update } from 'idb-keyval';

function walletVersion(data: any): string {
  return typeof data.updatedAt === 'number' ? 'updated:' + data.updatedAt : 'legacy';
}

export function useAuthAndSync(latestStateRef: React.MutableRefObject<any>, skipSyncRef: React.MutableRefObject<boolean>, pendingEditsRef: React.MutableRefObject<Record<string, unknown>>) {
  const [user, setUser] = useState<User | null>(null);
  const activeUidRef = useRef<string | null>(null);
  const hasAuthResultRef = useRef(false);
  useState(() => { preserveLegacyStorage(); return true; });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [retryBlocked, setRetryBlocked] = useState(false);
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const retryFailuresRef = useRef(0);
  const retryBlockedRef = useRef(false);
  const cloudConflictRef = useRef(false);
  const reloadCloudWalletRef = useRef<(() => Promise<void>) | null>(null);
  const saveInFlightRef = useRef(false);
  const [isSyncPaused, setIsSyncPaused] = useState(() => getInitialState('oc_isSyncPaused', false));
  const [isDirty, setIsDirtyState] = useState(false);
  const isDirtyRef = useRef(false);
  const pendingSyncCounterRef = useRef(0);
  const authEpochRef = useRef(0);
  const ownerEpochRef = useRef(0);
  const cloudVersionRef = useRef<{ uid: string; version: string } | null>(null);
  const hydrationCounterRef = useRef(0);

  const setIsDirty = useCallback<React.Dispatch<React.SetStateAction<boolean>>>((next) => {
    const dirty = typeof next === 'function' ? next(isDirtyRef.current) : next;
    isDirtyRef.current = dirty;
    if (!dirty) {
      hydrationCounterRef.current += 1;
      pendingEditsRef.current = {};
      safeSetItem(scopedKey(activeUidRef.current, 'dirty'), false);
    }
    setIsDirtyState(dirty);
  }, []);

  const markDirty = useCallback(() => {
    if (!skipSyncRef.current) {
      pendingSyncCounterRef.current += 1;
      safeSetItem(scopedKey(activeUidRef.current, 'dirty'), true);
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
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const setTheme = useCallback<React.Dispatch<React.SetStateAction<typeof theme>>>((next) => {
    const value = typeof next === 'function' ? next(themeRef.current) : next;
    themeRef.current = value;
    if (!skipSyncRef.current) pendingEditsRef.current.theme = value;
    setThemeState(value);
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

    setOwnedState(activeUidRef.current, 'oc_theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      authEpochRef.current += 1;
      hydrationCounterRef.current += 1;
      if (hasAuthResultRef.current && isDirtyRef.current) {
        persistOwnedSnapshot(activeUidRef.current, { ...latestStateRef.current, ...pendingEditsRef.current }, true);
      }
      pendingEditsRef.current = {};
      const nextUid = currentUser?.uid ?? null;
      if (nextUid !== activeUidRef.current) ownerEpochRef.current += 1;
      activeUidRef.current = nextUid;
      const priorVersion = nextUid ? getInitialState<string | null>(scopedKey(nextUid, 'cloudWalletVersion'), null) : null;
      cloudConflictRef.current = false;
      cloudVersionRef.current = nextUid && priorVersion ? { uid: nextUid, version: priorVersion } : null;
      safeSetItem('oc_legacy_view_owner', nextUid);
      hasAuthResultRef.current = true;
      const pending = getInitialState(scopedKey(nextUid, 'dirty'), false);
      setIsDataLoaded(false);
      setIsDirty(pending);
      isDirtyRef.current = pending;
      setIsSyncing(false);
      saveInFlightRef.current = false;
      retryFailuresRef.current = 0;
      retryBlockedRef.current = false;
      setRetryBlocked(false);
      setRetryAt(null);
      setSyncError(null);
      setThemeState(getOwnedState(nextUid, 'oc_theme', 'light'));
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
      ? (await get<any[]>(scopedKey(activeUidRef.current, 'offlineLogsQueue'))) || []
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
          setFunctions.setCashbackLogs(excludeRemovedLogs(activeUidRef.current, data.cashbackLogs));
        } else {
          const uniqueMap = new Map();
          for (const item of excludeRemovedLogs(activeUidRef.current, data.cashbackLogs)) uniqueMap.set(item.date, item);
          for (const item of excludeRemovedLogs(activeUidRef.current, localOfflineQueue)) uniqueMap.set(item.date, item);
          const mergedLogs = Array.from(uniqueMap.values());
          setFunctions.setCashbackLogs(mergedLogs);
          pendingEditsRef.current.cashbackLogs = mergedLogs;
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
      // The queue remains durable until its merged data is acknowledged by Firestore.
    }
  };

  const observeCloudWallet = (uid: string, snapshot: { exists: () => boolean; data: () => any }, setFunctions: any) => {
    if (activeUidRef.current !== uid) return;
    const seenKey = scopedKey(uid, 'cloudWalletSeen');
    const version = snapshot.exists() ? walletVersion(snapshot.data()) : 'missing';
    const prior = cloudVersionRef.current;
    const legacyWallet = !prior && (
      getOwnedState(uid, 'oc_cashbackLogs', []).length > 0 ||
      getOwnedState(uid, 'oc_walletCards', []).length > 0 ||
      getOwnedState(uid, 'oc_openRouterApiKey', '') !== ''
    );
    if (version === 'missing' && (legacyWallet || (prior ? prior.version !== 'missing' : getInitialState(seenKey, false)))) {
      // An authoritative deletion invalidates pending saves, hydration and cached data.
      authEpochRef.current += 1;
      saveInFlightRef.current = false;
      setIsSyncing(false);
      cloudConflictRef.current = false;
      setIsDirty(false);
      const empty = {
        exhaustedCards: {}, cardBillDates: {}, paidBills: {}, loungePassesUsed: {},
        loungeMilestonesVerified: {}, offerUsage: {}, openRouterApiKey: '',
        kiwiNeonEarnRate: 2, walletCards: [], cashbackLogs: [], theme: 'light',
      };
      latestStateRef.current = empty;
      persistOwnedSnapshot(uid, empty, false);
      safeSetItem(seenKey, false);
      void set(scopedKey(uid, 'offlineLogsQueue'), []).catch(console.error);
      // Apply empty state directly. The IndexedDB queue can still contain deleted history.
      const wasSkipping = skipSyncRef.current;
      skipSyncRef.current = true;
      try {
        for (const [field, value] of Object.entries(empty)) {
          if (field === 'theme') setTheme(value as 'light');
          else setFunctions['set' + field[0].toUpperCase() + field.slice(1)](value);
        }
      } finally { skipSyncRef.current = wasSkipping; }
    }
    if (!isDirtyRef.current || cloudVersionRef.current === null) {
      cloudVersionRef.current = { uid, version };
      safeSetItem(scopedKey(uid, 'cloudWalletVersion'), version);
    }
    if (snapshot.exists()) {
      safeSetItem(seenKey, true);
      void setLocalStateFromData(snapshot.data(), setFunctions);
    }
  };

  // We expose a setup effect hook generator to inject setFunctions cleanly
  const useSyncEffect = (setFunctions: any) => {
    useEffect(() => {
      if (!user) {
        setIsDataLoaded(true);
        return;
      }

      const docRef = doc(db, 'users', user.uid);
      reloadCloudWalletRef.current = async () => {
        const epoch = authEpochRef.current;
        const snapshot = await getDocFromServer(docRef);
        if (epoch !== authEpochRef.current || activeUidRef.current !== user.uid) return;
        await set(scopedKey(user.uid, 'offlineLogsQueue'), []);
        if (epoch !== authEpochRef.current || activeUidRef.current !== user.uid) return;
        setIsDirty(false);
        cloudConflictRef.current = false;
        retryBlockedRef.current = false;
        setRetryBlocked(false);
        setSyncError(null);
        observeCloudWallet(user.uid, snapshot, setFunctions);
      };
      const unsubscribe = onSnapshot(docRef, { includeMetadataChanges: true }, (docSnap) => {
        if (docSnap.metadata.hasPendingWrites) return;
        if (!docSnap.metadata.fromCache) observeCloudWallet(user.uid, docSnap, setFunctions);
        else if (docSnap.exists()) void setLocalStateFromData(docSnap.data(), setFunctions);
        setIsDataLoaded(true);
        if (!retryBlockedRef.current && retryFailuresRef.current === 0) setSyncError(null);
      }, (error: any) => {
        setSyncError(error.message || 'Failed to sync with cloud');
        setIsDataLoaded(true);
      });

      return () => {
        reloadCloudWalletRef.current = null;
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
            if (epoch === authEpochRef.current) {
              observeCloudWallet(user.uid, docSnap, setFunctions);
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

  const performSave = async () => {
    if (!user || saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setIsSyncing(true);
    
    const syncCounterAtStart = pendingSyncCounterRef.current;
    const epoch = authEpochRef.current;
    const dataToSave = latestStateRef.current;

    try {
      // Check offline status manually for queue
      if (!navigator.onLine) {
         throw new Error("Offline");
      }

      const queueKey = scopedKey(user.uid, 'offlineLogsQueue');
      let queuedAtStart: any[] = [];
      try { queuedAtStart = (await get<any[]>(queueKey)) || []; }
      catch (error) { console.warn('Could not read offline queue before saving', error); }
      if (epoch !== authEpochRef.current) return;
      const logs = new Map(excludeRemovedLogs(user.uid, dataToSave.cashbackLogs || []).map((item: any) => [item.date, item]));
      for (const item of excludeRemovedLogs(user.uid, queuedAtStart)) logs.set(item.date, item);
      const docRef = doc(db, 'users', user.uid);
      const baseline = cloudVersionRef.current;
      if (!baseline || baseline.uid !== user.uid) throw new Error("Wallet has not loaded from the server");
      const savedLogs = excludeRemovedLogs<any>(user.uid, dataToSave.cashbackLogs || []);
      const data = {
        userId: user.uid,
        ...dataToSave,
        cashbackLogs: queuedAtStart.length ? Array.from(logs.values()) : savedLogs,
        theme: theme, // Theme explicitly relies on backend for logged in users
        isDarkMode: theme !== 'light',
        updatedAt: Date.now()
      };
      await runTransaction(db, async transaction => {
        const current = await transaction.get(docRef);
        const version = current.exists() ? walletVersion(current.data()) : 'missing';
        if (epoch !== authEpochRef.current) throw new Error('The signed-in account changed');
        if (version !== baseline.version) {
          cloudConflictRef.current = true;
          throw new Error('The cloud wallet changed. Use manual sync to reload it.');
        }
        transaction.set(docRef, data, { merge: true });
      });
      if (epoch === authEpochRef.current) {
        cloudVersionRef.current = { uid: user.uid, version: walletVersion(data) };
        safeSetItem(scopedKey(user.uid, 'cloudWalletVersion'), walletVersion(data));
        safeSetItem(scopedKey(user.uid, 'cloudWalletSeen'), true);
      }
      
      if (epoch !== authEpochRef.current) return;
      setSyncError(null);
      retryFailuresRef.current = 0;
      retryBlockedRef.current = false;
      setRetryBlocked(false);
      setRetryAt(null);
      if (pendingSyncCounterRef.current === syncCounterAtStart) {
        setIsDirty(false);
        isDirtyRef.current = false;
        pendingEditsRef.current = {};
        safeSetItem(scopedKey(user.uid, 'dirty'), false);
        if (queuedAtStart.length) {
          const uploaded = new Set(queuedAtStart.map(item => JSON.stringify(item)));
          let hasUnsent = false;
          try {
            await update(queueKey, (current: any[] | undefined) => {
              const remaining = (current || []).filter(item => !uploaded.has(JSON.stringify(item)));
              hasUnsent = remaining.length > 0;
              return remaining;
            });
            if (hasUnsent && epoch === authEpochRef.current) markDirty();
          } catch (error) {
            console.warn('Could not clear acknowledged offline entries', error);
            if (epoch === authEpochRef.current) markDirty();
          }
        }
      }
    } catch (error: any) {
      if (epoch !== authEpochRef.current) return;
      const code = typeof error?.code === 'string' ? error.code.replace(/^firestore\//, '') : '';
      const transient = error?.message === 'Offline' || error instanceof TypeError ||
        ['unavailable', 'deadline-exceeded', 'resource-exhausted', 'aborted', 'internal', 'cancelled'].includes(code);
      retryFailuresRef.current += 1;
      retryBlockedRef.current = !transient;
      setRetryBlocked(!transient);
      setRetryAt(transient ? Date.now() + Math.min(60000, 2000 * 2 ** Math.min(retryFailuresRef.current - 1, 5)) : null);
      if (error.message === "Offline" || error.code === 'unavailable') {
         // Queue offline data locally
         try {
           if (dataToSave.cashbackLogs?.length) {
             await update(scopedKey(user.uid, 'offlineLogsQueue'), (current: any[] | undefined) => {
               if (epoch !== authEpochRef.current) return current || [];
               const logs = [...(current || []), ...dataToSave.cashbackLogs];
               return excludeRemovedLogs(user.uid, logs);
             });
           }
           if (epoch === authEpochRef.current) setSyncError('Offline: Changes queued locally.');
         } catch (queueError) {
           console.warn('Could not update the offline queue', queueError);
           if (epoch === authEpochRef.current) setSyncError('Offline: Could not update the local queue. Changes remain pending.');
         }
      } else {
        setSyncError(error.message || 'Failed to save to cloud');
        try {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        } catch (e) {
          console.warn('Save failed, state is local only.');
        }
      }
    } finally {
      if (epoch === authEpochRef.current) { saveInFlightRef.current = false; setIsSyncing(false); }
    }
  };

  const saveData = async () => {
    if (saveInFlightRef.current) return;
    if (cloudConflictRef.current) {
      if (window.confirm('Reload the cloud wallet and discard unsynced changes on this device?')) {
        try { await reloadCloudWalletRef.current?.(); }
        catch { setSyncError('Could not reload the cloud wallet. Your unsynced changes are still on this device.'); }
      }
      return;
    }
    retryFailuresRef.current = 0;
    retryBlockedRef.current = false;
    setRetryBlocked(false);
    setRetryAt(null);
    await performSave();
  };
  const saveDataAutomatically = () => {
    if (retryBlockedRef.current) return;
    return performSave();
  };

  useEffect(() => {
    safeSetItem('oc_isSyncPaused', isSyncPaused);
  }, [isSyncPaused]);

  return {
    user, isAuthLoading, isDataLoaded,
    syncError, isSyncing, isSyncPaused, setIsSyncPaused,
    isDirty, setIsDirty, isDirtyRef, markDirty, authEpochRef: ownerEpochRef,
    theme, setTheme,
    handleLogin, handleLogout,
    saveData, saveDataAutomatically, retryBlocked, retryAt, useSyncEffect
  };
}
