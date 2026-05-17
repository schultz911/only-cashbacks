import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useWallet } from '../context/WalletContext';

export function useCloudSync() {
  const { 
    user, setUser, setIsAuthLoading,
    exhaustedCards, setExhaustedCards,
    cardBillDates, setCardBillDates,
    loungePassesUsed, setLoungePassesUsed,
    loungeMilestonesVerified, setLoungeMilestonesVerified,
    offerUsage, setOfferUsage,
    kiwiNeonEarnRate, setKiwiNeonEarnRate,
    openRouterApiKey, setOpenRouterApiKey
  } = useWallet();

  const skipSyncRef = useRef(false);
  const isDataLoadedRef = useRef(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (!currentUser) {
        setIsDataLoaded(false);
        isDataLoadedRef.current = false;
      }
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
      setCardBillDates(getInitialState('oc_cardBillDates', {}));
      setLoungePassesUsed(getInitialState('oc_loungePassesUsed', {}));
      setLoungeMilestonesVerified(getInitialState('oc_loungeMilestonesVerified', {}));
      setOfferUsage(getInitialState('oc_offerUsage', {}));
      setOpenRouterApiKey(getInitialState('oc_openRouterApiKey', ''));
      setKiwiNeonEarnRate(getInitialState('oc_kiwiNeonEarnRate', 2));
      setTimeout(() => { 
        skipSyncRef.current = false; 
        setIsDataLoaded(true); 
        isDataLoadedRef.current = true;
      }, 100);
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        skipSyncRef.current = true;
        setExhaustedCards(data.exhaustedCards || {});
        setCardBillDates(data.cardBillDates || {});
        setLoungePassesUsed(data.loungePassesUsed || {});
        setLoungeMilestonesVerified(data.loungeMilestonesVerified || {});
        setOfferUsage(data.offerUsage || {});
        if (data.openRouterApiKey !== undefined) setOpenRouterApiKey(data.openRouterApiKey);
        if (data.kiwiNeonEarnRate !== undefined) setKiwiNeonEarnRate(data.kiwiNeonEarnRate);

        setTimeout(() => { 
          skipSyncRef.current = false; 
        }, 100);
      }
      setIsDataLoaded(true);
      isDataLoadedRef.current = true;
      setSyncError(null);
    }, (error: any) => {
      setSyncError(error.message || 'Failed to sync with cloud');
      try {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      } catch (e) {}
      setIsDataLoaded(true);
      isDataLoadedRef.current = true;
    });

    return () => unsubscribe();
  }, [user]);

  const saveData = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        exhaustedCards,
        cardBillDates,
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
    localStorage.setItem('oc_cardBillDates', JSON.stringify(cardBillDates));
    localStorage.setItem('oc_loungePassesUsed', JSON.stringify(loungePassesUsed));
    localStorage.setItem('oc_loungeMilestonesVerified', JSON.stringify(loungeMilestonesVerified));
    localStorage.setItem('oc_offerUsage', JSON.stringify(offerUsage));
    localStorage.setItem('oc_openRouterApiKey', JSON.stringify(openRouterApiKey));
    localStorage.setItem('oc_kiwiNeonEarnRate', JSON.stringify(kiwiNeonEarnRate));

    if (isDataLoadedRef.current && !skipSyncRef.current) {
      setIsDirty(true);
      saveData();
    }
  }, [exhaustedCards, cardBillDates, loungePassesUsed, loungeMilestonesVerified, offerUsage, openRouterApiKey, kiwiNeonEarnRate]);

  const handleDeleteData = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      skipSyncRef.current = true;
      setExhaustedCards({});
      setCardBillDates({});
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
