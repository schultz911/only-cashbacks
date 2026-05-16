import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useWallet } from '../context/WalletContext';

export function useCloudSync() {
  const { 
    user, setUser, setIsAuthLoading,
    exhaustedCards, setExhaustedCards,
    loungePassesUsed, setLoungePassesUsed,
    loungeMilestonesVerified, setLoungeMilestonesVerified,
    offerUsage, setOfferUsage,
    kiwiNeonEarnRate, setKiwiNeonEarnRate,
    openRouterApiKey, setOpenRouterApiKey
  } = useWallet();

  const skipSyncRef = useRef(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (!currentUser) setIsDataLoaded(false);
    });
    return () => unsubscribe();
  }, [setUser, setIsAuthLoading]);

  const getInitialState = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch {}
    return defaultValue;
  };

  useEffect(() => {
    if (!user) {
      skipSyncRef.current = true;
      setExhaustedCards(getInitialState('oc_exhaustedCards', {}));
      setLoungePassesUsed(getInitialState('oc_loungePassesUsed', {}));
      setLoungeMilestonesVerified(getInitialState('oc_loungeMilestonesVerified', {}));
      setOfferUsage(getInitialState('oc_offerUsage', {}));
      setOpenRouterApiKey(getInitialState('oc_openRouterApiKey', ''));
      setKiwiNeonEarnRate(getInitialState('oc_kiwiNeonEarnRate', 2));
      setTimeout(() => { skipSyncRef.current = false; setIsDataLoaded(true); }, 100);
      return;
    }

    const loadData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          skipSyncRef.current = true;
          setExhaustedCards(data.exhaustedCards || {});
          setLoungePassesUsed(data.loungePassesUsed || {});
          setLoungeMilestonesVerified(data.loungeMilestonesVerified || {});
          setOfferUsage(data.offerUsage || {});
          setOpenRouterApiKey(data.openRouterApiKey || '');
          setKiwiNeonEarnRate(data.kiwiNeonEarnRate || 2);
          setTimeout(() => { skipSyncRef.current = false; }, 100);
        }
      } catch (error: any) {
        setSyncError(error.message || 'Failed to sync with cloud');
        try {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        } catch (e) {
          console.warn('Sync failed, continuing with local state.');
        }
      } finally {
        setIsDataLoaded(true);
      }
    };

    loadData();
  }, [user]);

  const saveData = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        exhaustedCards,
        loungePassesUsed,
        loungeMilestonesVerified,
        offerUsage,
        openRouterApiKey,
        kiwiNeonEarnRate,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setSyncError(null);
      setIsDirty(false);
      return true;
    } catch (error: any) {
      setSyncError(error.message || 'Failed to save to cloud');
      try {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      } catch (e) {
        // Logged via error handler
      }
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('oc_exhaustedCards', JSON.stringify(exhaustedCards));
    localStorage.setItem('oc_loungePassesUsed', JSON.stringify(loungePassesUsed));
    localStorage.setItem('oc_loungeMilestonesVerified', JSON.stringify(loungeMilestonesVerified));
    localStorage.setItem('oc_offerUsage', JSON.stringify(offerUsage));
    localStorage.setItem('oc_openRouterApiKey', JSON.stringify(openRouterApiKey));
    localStorage.setItem('oc_kiwiNeonEarnRate', JSON.stringify(kiwiNeonEarnRate));

    if (isDataLoaded && !skipSyncRef.current) {
      setIsDirty(true);
      const timeoutId = setTimeout(() => {
        saveData();
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [exhaustedCards, loungePassesUsed, loungeMilestonesVerified, offerUsage, openRouterApiKey, kiwiNeonEarnRate, isDataLoaded]);

  const handleDeleteData = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      skipSyncRef.current = true;
      setExhaustedCards({});
      setLoungePassesUsed({});
      setLoungeMilestonesVerified({});
      setOfferUsage({});
      setOpenRouterApiKey('');
      setKiwiNeonEarnRate(2);
      setSyncError(null);
      setIsDirty(false);
      setTimeout(() => { skipSyncRef.current = false; }, 500);
      return true;
    } catch (error: any) {
      console.error('Error deleting data:', error);
      return false;
    }
  };

  return {
    isDataLoaded,
    syncError,
    setSyncError,
    isSyncing,
    isDirty,
    saveData,
    handleDeleteData
  };
}
