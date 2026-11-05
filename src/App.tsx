/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { Search, Loader2, Sparkles, Wallet, X, ChevronDown, Check, AlertCircle, Ticket, Tag, Info, Trash2, Store, PiggyBank, Plane, CloudOff } from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { categorizeMerchant } from './services/gemini';
import { getCycleForCard, getOfferCycleForCard, getQuarterCycle, getRecommendations } from './lib/recommendation';
import { Recommendation, MerchantInfo, Card, CashbackLog } from './types';
import { CARD_DATA, CARD_DICT } from './data/cards';
import { CARD_DETAIL_INFO, getCardDetailBenefits, getCardDetailGroups, getBenefitDetailChips, benefitCodes } from './data/cardDetails';
import { CardItem } from './components/CardItem';
import { BillReminders } from './components/BillReminders';
import { CardBillingSettings } from './components/CardBillingSettings';
import { CardRewardUsage } from './components/CardRewardUsage';
import { dateInMonth, indiaDate, statementReminder, statementDay } from './lib/billingDates';
import { recordRewardAllocations, removeRewardLogs } from './lib/rewardRules';
import { useBillingDay } from './hooks/useBillingDay';

const LoungeTrackerModal = lazy(() => import('./components/LoungeTrackerModal').then(module => ({ default: module.LoungeTrackerModal })));
const WalletManagerModal = lazy(() => import('./components/WalletManagerModal').then(module => ({ default: module.WalletManagerModal })));
const DashboardModal = lazy(() => import('./components/DashboardModal').then(module => ({ default: module.DashboardModal })));
import { Header } from './components/Header';
import { SearchSection } from './components/SearchSection';
import { cn } from './lib/utils';
import { db } from './firebase';
import { doc, deleteDoc } from 'firebase/firestore';

import Fuse from 'fuse.js';
import { KNOWN_MERCHANTS } from './data/merchants';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { clearLegacyWalletHistory, getInitialState, persistOwnedSnapshot, safeSetItem, scopedKey } from './lib/storage';
import { set as setIndexedValue } from 'idb-keyval';
import { useAuthSyncContext } from './contexts/AuthSyncContext';
import { useWalletContext } from './contexts/WalletContext';
import { useSearchContext } from './contexts/SearchContext';

const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const WALLET_CARD_ORDER = [
  'hsbc-live-plus', 'hdfc-swiggy', 'sbi-eternal',
  'hdfc-tata-neu-infinity', 'sbi-cashback', 'kotak-811-infinity',
  'icici-amazon-pay', 'kiwi-neon', 'hdfc-imperia',
  'one-card', 'niyo-dcb', 'axis-myzone'
];

// Stale exchange rates from 2024 used as a last-resort fallback when the exchange API fails and cache is empty.
const FALLBACK_EXCHANGE_RATES: Record<string, number> = { 'USD': 0.012, 'EUR': 0.011, 'GBP': 0.0094, 'AED': 0.044 };

export default function App() {
  const billingDay = useBillingDay();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const {
    user, isAuthLoading, isDataLoaded,
    syncError, isSyncing, isSyncPaused, setIsSyncPaused,
    isDirty, setIsDirty, isDirtyRef, markDirty,
    theme, setTheme,
    handleLogin, handleLogout,
    saveData, saveDataAutomatically, retryBlocked, retryAt, useSyncEffect, skipSyncRef, latestStateRef, pendingEditsRef, authEpochRef
  } = useAuthSyncContext();

  const {
    exhaustedCards, setExhaustedCards, normalizedExhaustedCards,
    cardBillDates, setCardBillDates,
    paidBills, setPaidBills, markBillPaid,
    loungePassesUsed, setLoungePassesUsed,
    loungeMilestonesVerified, setLoungeMilestonesVerified,
    offerUsage, setOfferUsage,
    walletCards, setWalletCards,
    cashbackLogs, setCashbackLogs,
    kiwiNeonEarnRate, setKiwiNeonEarnRate
  } = useWalletContext();

  const {
    query, setQuery,
    suggestions, setSuggestions,
    showSuggestions, setShowSuggestions,
    focusedSuggestionIndex, setFocusedSuggestionIndex,
    suggestionRef,
    amount, setAmount,
    foreignAmount, setForeignAmount,
    baseCurrency, setBaseCurrency,
    exchangeRates,
    currencyError,
    isIntl, setIsIntl,
    isOnline, setIsOnline,
    isScanToPay, setIsScanToPay,
    openRouterApiKey, setOpenRouterApiKey
  } = useSearchContext();

  useSyncEffect({
    setExhaustedCards, setCardBillDates, setPaidBills, setLoungePassesUsed,
    setLoungeMilestonesVerified, setOfferUsage, setOpenRouterApiKey,
    setKiwiNeonEarnRate, setWalletCards, setCashbackLogs
  });

  useEffect(() => {
    latestStateRef.current = {
      exhaustedCards, loungePassesUsed, loungeMilestonesVerified, offerUsage, cardBillDates, paidBills, openRouterApiKey, kiwiNeonEarnRate, walletCards, cashbackLogs, theme
    };
  }, [exhaustedCards, loungePassesUsed, loungeMilestonesVerified, offerUsage, cardBillDates, paidBills, openRouterApiKey, kiwiNeonEarnRate, walletCards, cashbackLogs, theme]);

  useEffect(() => {
    const flushPending = () => {
      if (isDirtyRef.current) persistOwnedSnapshot(user?.uid ?? null, { ...latestStateRef.current, ...pendingEditsRef.current }, true);
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flushPending(); };
    window.addEventListener('pagehide', flushPending);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.removeEventListener('pagehide', flushPending); document.removeEventListener('visibilitychange', onVisibility); };
  }, [user, isDirtyRef, latestStateRef, pendingEditsRef]);

  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [lastSearchInfo, setLastSearchInfo] = useState<MerchantInfo | null>(null);
  const [history, setHistory] = useState<MerchantInfo[]>([]);

  const [isLoungeOpen, setIsLoungeOpen] = useState(false);
  const [showOffersOverlay, setShowOffersOverlay] = useState(false);
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<{ card: Card, source: string } | null>(null);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testErrorMessage, setTestErrorMessage] = useState('');

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const [loungeTab, setLoungeTab] = useState<'Domestic' | 'International'>('Domestic');


  const fuse = useMemo(() => new Fuse(KNOWN_MERCHANTS, { threshold: 0.3 }), []);

  useEffect(() => {
    if (isApiModalOpen) {
      setTestStatus('idle');
      setTestErrorMessage('');
    }
  }, [isApiModalOpen]);

  const handleTestConnection = async () => {
    if (!tempApiKey.trim()) {
      setTestStatus('error');
      setTestErrorMessage('API key cannot be empty.');
      return;
    }
    if (!tempApiKey.startsWith('sk-or-')) {
      setTestStatus('error');
      setTestErrorMessage('OpenRouter keys typically start with "sk-or-".');
      return;
    }

    setTestStatus('testing');
    setTestErrorMessage('');
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('./firebase');
      const categorize = httpsCallable(functions, 'categorize');
      
      const response = await categorize({ merchantName: "Test Connection Check", apiKey: tempApiKey });
      const data = response.data as any;

      if (data && data.category) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
        setTestErrorMessage('Received invalid response structure.');
      }
    } catch (error: any) {
      setTestStatus('error');
      setTestErrorMessage(error.message || 'Network request failed.');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query && showSuggestions) {
      const results = fuse.search(query, { limit: 5 }).map(r => r.item);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
    setFocusedSuggestionIndex(-1);
  }, [query, showSuggestions, fuse]);



  const debouncedAmount = useDebouncedValue(amount, 300);
  const debouncedForeignAmount = useDebouncedValue(foreignAmount, 300);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user || isAuthLoading || !isDataLoaded || skipSyncRef.current || !isDirty || isSyncing || isSyncPaused || isOffline || retryBlocked) return;
    const delay = retryAt === null ? 1000 : Math.max(1000, retryAt - Date.now());
    const timer = setTimeout(() => {
      saveDataAutomatically();
    }, delay);
    return () => clearTimeout(timer);
  }, [isOffline, isDirty, user, isAuthLoading, isDataLoaded, isSyncPaused, isSyncing, retryBlocked, retryAt, exhaustedCards, loungePassesUsed, loungeMilestonesVerified, offerUsage, cardBillDates, paidBills, openRouterApiKey, kiwiNeonEarnRate, walletCards, cashbackLogs, theme]);

  const activeWalletCards = useMemo(() => {
    const cards = walletCards.length > 0
      ? CARD_DATA.filter(c => walletCards.includes(c.id) && !c.isDummy)
      : CARD_DATA.filter(c => !c.isDummy);
    return cards.sort((a, b) => {
      const rank = (id: string) => {
        const index = WALLET_CARD_ORDER.indexOf(id);
        return index === -1 ? WALLET_CARD_ORDER.length : index;
      };
      return rank(a.id) - rank(b.id);
    });
  }, [walletCards]);

  const loungeCardCount = useMemo(() => CARD_DATA.filter(c => !c.isDummy && c.benefits.some(b => b.type === 'lounge')).length, []);

  useEffect(() => {
    if (!isDataLoaded || !walletCards || walletCards.length === 0) return;
    const timer = setTimeout(() => {
      let hasUnpaidPastDue = false;
      for (const cardId of walletCards) {
        const card = CARD_DICT[cardId];
        if (!card || card.isDummy || card.type !== 'Credit') continue;
        const reminder = statementReminder(cardId, cardBillDates, paidBills);
        if (reminder?.overdue) {
          hasUnpaidPastDue = true;
          break;
        }
      }
      if (hasUnpaidPastDue) {
        showToast('You have credit card statements to review.', 'info');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isDataLoaded, walletCards, paidBills, cardBillDates, billingDay]);

  useEffect(() => {
    if (!isDataLoaded) return;

    const timeoutId = setTimeout(() => {
      const today = indiaDate();
      const todayDate = today.getUTCDate();
      const todayKey = `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${todayDate}`;
      let lastResetDates: Record<string, string> = {};
      try {
        const stored = localStorage.getItem(scopedKey(user?.uid ?? null, 'oc_lastOfferResetDates'));
        if (stored) lastResetDates = JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to parse oc_lastOfferResetDates from localStorage:', error);
      }

      let offerUsageDirty = false;
      let exhaustedDirty = false;
      const newOfferUsage = { ...offerUsage };
      const newExhaustedCards = { ...exhaustedCards };

      const cardsToResetOffers = new Set<string>();
    const cardCycles: Record<string, string> = {};

    for (const card of CARD_DATA) {
      if (card.isDummy) continue;

      const configuredReset = card.type === 'Credit' && !card.rewardProgram ? (statementDay(card.id, cardBillDates) ?? 1) : 1;
      const billResetDay = dateInMonth(today.getUTCFullYear(), today.getUTCMonth(), configuredReset).getUTCDate();
      const offerResetDay = card.id === 'axis-myzone' || card.offerReset === 'calendar' ? 1 : billResetDay;

      // Handle offer usage resets
      if (todayDate === offerResetDay) {
        const offerLastResetKey = lastResetDates[`${card.id}_offer`] || lastResetDates[card.id];
        if (offerLastResetKey !== todayKey) {
          cardsToResetOffers.add(card.id);
          cardCycles[card.id] = getOfferCycleForCard(card.id, cardBillDates);
          lastResetDates[`${card.id}_offer`] = todayKey;
        }
      }

      // Handle card exhaustion resets
      if (todayDate === billResetDay) {
        const billLastResetKey = lastResetDates[`${card.id}_bill`] || lastResetDates[card.id];
        if (billLastResetKey !== todayKey) {
          if (card.type === 'Credit' || card.type === 'Debit') {
            const billCycle = getCycleForCard(card.id, cardBillDates);
            if (newExhaustedCards[card.id] !== undefined && newExhaustedCards[card.id] !== billCycle) {
              delete newExhaustedCards[card.id];
              exhaustedDirty = true;
            }
          }
          lastResetDates[`${card.id}_bill`] = todayKey;
        }
      }

      // Keep backward compatibility so old format resets don't cause issues
      if (todayDate === offerResetDay && todayDate === billResetDay) {
         lastResetDates[card.id] = todayKey;
      }
    }

    const quarterStartMonths = [0, 3, 6, 9];
    const isQuarterStart = todayDate === 1 && quarterStartMonths.includes(today.getUTCMonth());
    const shouldResetQuarterly = isQuarterStart && lastResetDates['_quarterly'] !== todayKey;
    const currentQuarter = getQuarterCycle();

    if (cardsToResetOffers.size > 0 || shouldResetQuarterly) {
      const resetPrefixes: string[] = [];
      const resetCycles: string[] = [];

      if (cardsToResetOffers.size > 0) {
        for (const cardId of cardsToResetOffers) {
          resetPrefixes.push(`${cardId}-`);
          resetCycles.push(`-${cardCycles[cardId]}`);
        }
      }

      const prefixesLen = resetPrefixes.length;

      // ⚡ Bolt: Avoid for-in loops and object allocations in hot path
      // Iterate over Object.keys() to avoid prototype chain checks and
      // pre-compile Regex to avoid allocations inside the loop.
      const keys = Object.keys(newOfferUsage);
      const expectedQ = `-${currentQuarter}`;
      const qRegex = /-\d{4}-Q\d$/;

      for (let k = 0, len = keys.length; k < len; k++) {
        const key = keys[k];
        let deleted = false;

        if (shouldResetQuarterly) {
          const keyLen = key.length;
          // Fast check for Quarterly pattern (ends with -YYYY-QX)
          if (keyLen >= 7 && key[keyLen - 2] === 'Q') {
            if (!key.endsWith(expectedQ) && qRegex.test(key)) {
              delete newOfferUsage[key];
              offerUsageDirty = true;
              deleted = true;
            }
          }
        }

        if (!deleted && prefixesLen > 0) {
          for (let i = 0; i < prefixesLen; i++) {
            if (key.startsWith(resetPrefixes[i])) {
              if (!key.endsWith(resetCycles[i])) {
                delete newOfferUsage[key];
                offerUsageDirty = true;
              }
              break;
            }
          }
        }
      }

      if (shouldResetQuarterly) {
        lastResetDates['_quarterly'] = todayKey;
      }
    }

      if (offerUsageDirty) setOfferUsage(newOfferUsage);
      if (exhaustedDirty) setExhaustedCards(newExhaustedCards);
      localStorage.setItem(scopedKey(user?.uid ?? null, 'oc_lastOfferResetDates'), JSON.stringify(lastResetDates));
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isDataLoaded, cardBillDates, billingDay]);

  const handleDeleteData = async () => {
    if (deleteConfirmText !== 'DELETE' || !user) return;
    const ownerEpoch = authEpochRef.current;
    try {
      const docRef = doc(db, 'users', user.uid);
      await deleteDoc(docRef);
      await setIndexedValue(scopedKey(user.uid, 'offlineLogsQueue'), []);
      clearLegacyWalletHistory();
      if (ownerEpoch !== authEpochRef.current) return;
      skipSyncRef.current = true;
      setExhaustedCards({});
      setLoungePassesUsed({});
      setLoungeMilestonesVerified({});
      setOfferUsage({});
      setOpenRouterApiKey('');
      setKiwiNeonEarnRate(2);
      setWalletCards([]);
      setCashbackLogs([]);
      setCardBillDates({});
      setPaidBills({});
      setHistory([]);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      setIsProfileMenuOpen(false);
      setIsDirty(false);
      showToast('All user data deleted permanently.', 'info');
      setTimeout(() => { skipSyncRef.current = false; }, 500);
    } catch (error: any) {
      console.error('Error deleting data:', error);
      showToast('Failed to delete data. Please check your permissions.', 'error');
    }
  };



  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showOffersOverlay) setShowOffersOverlay(false);
        else if (selectedCardForDetails) setSelectedCardForDetails(null);
        else if (isLoungeOpen) setIsLoungeOpen(false);
        else if (isApiModalOpen) setIsApiModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showOffersOverlay, selectedCardForDetails, isLoungeOpen, isApiModalOpen]);

  useEffect(() => {
    if (history.length > 0) {
      const info = history[0];
      const parsedAmount = parseFloat(debouncedAmount) || 0;
      const parsedForeign = parseFloat(debouncedForeignAmount) || 0;
      let effectiveAmount = 0;
      if (isIntl) {
        if (exchangeRates[baseCurrency]) {
          effectiveAmount = parsedForeign / exchangeRates[baseCurrency];
        } else if (FALLBACK_EXCHANGE_RATES[baseCurrency]) {
          effectiveAmount = parsedForeign / FALLBACK_EXCHANGE_RATES[baseCurrency];
        }
      } else {
        effectiveAmount = parsedAmount;
      }

      if (effectiveAmount > 0) {
        setRecommendation(getRecommendations(info, effectiveAmount, isOnline, isIntl, !isOnline && isScanToPay, normalizedExhaustedCards, offerUsage, kiwiNeonEarnRate, walletCards.length > 0 ? walletCards : null, cardBillDates));
      } else {
        setRecommendation(null);
      }
    }
  }, [normalizedExhaustedCards, offerUsage, cardBillDates, debouncedAmount, debouncedForeignAmount, isIntl, isOnline, isScanToPay, kiwiNeonEarnRate, exchangeRates, baseCurrency, walletCards, billingDay]);

  const formatAmountStr = useCallback((val: string) => {
    if (!val) return '';
    const parts = val.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }, []);

  const handleLogTransaction = () => {
    if (recommendation && recommendation.cashbackEarned > 0) {
      const newLog: CashbackLog = {
        amount: recommendation.cashbackEarned,
        date: Date.now(),
        cardId: recommendation.bestCard.id,
        cardName: recommendation.bestCard.name,
        merchantName: lastSearchInfo?.name || query || 'Unknown Merchant',
        category: lastSearchInfo?.category || 'General'
      };
      setCashbackLogs(prev => [...prev, newLog]);
      if (recommendation.rewardAllocations?.length) {
        setOfferUsage(previous => recordRewardAllocations(previous, recommendation.rewardAllocations!, newLog.date));
      }
      showToast('Transaction logged!', 'success');
    } else {
      showToast('No cashback earned for this transaction.', 'info');
    }
  };

  const [isLogged, setIsLogged] = useState(false);
  const logTransactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (logTransactionTimerRef.current) clearTimeout(logTransactionTimerRef.current);
  }, []);

  const searchAbortControllerRef = useRef<AbortController | null>(null);

  const handleSearch = async (e?: React.FormEvent, directQuery?: string, prefilledAmount?: string) => {
    if (e) e.preventDefault();
    
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    searchAbortControllerRef.current = abortController;
    const signal = abortController.signal;

    setIsLogged(false);
    const activeQuery = directQuery !== undefined ? directQuery : query;
    let activeAmountRaw = prefilledAmount !== undefined ? prefilledAmount : (isIntl ? foreignAmount : amount);
    const parsedAmount = parseFloat(prefilledAmount !== undefined ? prefilledAmount : amount) || 0;
    const parsedForeign = parseFloat(prefilledAmount !== undefined ? prefilledAmount : foreignAmount) || 0;

    if (!activeQuery.trim() || (isIntl ? parsedForeign <= 0 : parsedAmount <= 0)) {
      setRecommendation(null);
      return;
    }

    let effectiveAmount = parsedAmount;
    if (isIntl && exchangeRates[baseCurrency]) {
      effectiveAmount = parsedForeign / exchangeRates[baseCurrency];
    } else if (isIntl && FALLBACK_EXCHANGE_RATES[baseCurrency]) {
      effectiveAmount = parsedForeign / FALLBACK_EXCHANGE_RATES[baseCurrency];
    }

    if (directQuery !== undefined) setQuery(directQuery);
    if (prefilledAmount !== undefined && !isIntl) setAmount(prefilledAmount);

    setLoading(true);
    try {
      const info = await categorizeMerchant(activeQuery, openRouterApiKey || undefined);
      if (signal.aborted) return;
      
      setLastSearchInfo(info);
      const rec = getRecommendations(info, effectiveAmount, isOnline, isIntl, !isOnline && isScanToPay, normalizedExhaustedCards, offerUsage, kiwiNeonEarnRate, walletCards.length > 0 ? walletCards : null, cardBillDates);
      if (signal.aborted) return;

      setRecommendation(rec);
      setHistory(prev => {
        const filtered = prev.filter(p => p.name.toLowerCase() !== info.name.toLowerCase());
        return [info, ...filtered].slice(0, 4);
      });
    } catch (error) {
      if (!signal.aborted) {
        console.error('Failed to get recommendation:', error);
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  usePushNotifications(isDataLoaded, walletCards, cardBillDates, paidBills, getCycleForCard);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-blue-100 pb-12 isolate relative z-0">
      {/* Header */}
      <Header
        isAuthLoading={isAuthLoading}
        user={user}
        openRouterApiKey={openRouterApiKey}
        setTempApiKey={setTempApiKey}
        setIsApiModalOpen={setIsApiModalOpen}
        isSyncing={isSyncing}
        saveData={saveData}
        syncError={syncError}
        isDirty={isDirty}
        isSyncPaused={isSyncPaused}
        setIsSyncPaused={setIsSyncPaused}
        theme={theme}
        setTheme={setTheme}
        setIsProfileMenuOpen={setIsProfileMenuOpen}
        isProfileMenuOpen={isProfileMenuOpen}
        profileMenuRef={profileMenuRef}
        handleLogout={handleLogout}
        handleLogin={handleLogin}
        setShowDeleteConfirm={setShowDeleteConfirm}
      />

      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 dark:bg-gray-800 text-amber-900 dark:text-gray-200 border-b border-amber-200 dark:border-gray-700 text-sm font-medium text-center py-2 px-4 flex items-center justify-center gap-2"
          >
            <CloudOff className="w-4 h-4 shrink-0" />
            <span>Offline Mode: Changes will be saved locally and synced when online.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-6xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column - Input */}
          <div className="md:col-span-5 lg:col-span-4 lg:landscape:col-span-5 xl:col-span-5 space-y-8 md:sticky md:top-24 relative z-50">
            <SearchSection
              query={query}
              setQuery={setQuery}
              amount={amount}
              setAmount={setAmount}
              foreignAmount={foreignAmount}
              setForeignAmount={setForeignAmount}
              baseCurrency={baseCurrency}
              setBaseCurrency={setBaseCurrency}
              currencyError={currencyError}
              isIntl={isIntl}
              setIsIntl={setIsIntl}
              isOnline={isOnline}
              setIsOnline={setIsOnline}
              isScanToPay={isScanToPay}
              setIsScanToPay={setIsScanToPay}
              handleSearch={handleSearch}
              loading={loading}
              suggestions={suggestions}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              focusedSuggestionIndex={focusedSuggestionIndex}
              setFocusedSuggestionIndex={setFocusedSuggestionIndex}
              history={history}
              suggestionRef={suggestionRef}
              formatAmountStr={formatAmountStr}
              isOffline={isOffline}
            />

          </div>

          {/* Right Column - Results */}
          <div className="md:col-span-7 lg:col-span-8 lg:landscape:col-span-7 xl:col-span-7 space-y-8 min-h-0">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.section
                  key="loading-skeleton"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 pl-4 border-l-4 border-gray-200">
                    <div className="w-40 h-6 bg-gray-200 rounded-lg animate-pulse" />
                  </div>
                  <div className="grid grid-cols-1 landscape:grid-cols-2 lg:grid-cols-2 gap-6">
                    <div className="w-full h-[220px] bg-gray-200 rounded-[2rem] animate-pulse" />
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5 shadow-sm">
                      <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-100 rounded-lg w-full animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded-lg w-5/6 animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded-lg w-4/6 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </motion.section>
              ) : recommendation ? (
                <motion.section
                  key="recommendation-result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between pl-4 border-l-4 border-blue-600">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-xl text-gray-900">
                        Recommendation
                      </h3>
                      {recommendation.tiedCards && recommendation.tiedCards.length > 1 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full animate-bounce">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">
                            {recommendation.tiedCards.length === 2 ? "It's a Tie!" : `${recommendation.tiedCards.length}-Way Tie!`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 landscape:grid-cols-2 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {recommendation.tiedCards ? (
                        recommendation.tiedCards.map(({ card, benefit }) => (
                          <CardItem
                            key={card.id}
                            layoutId={`card-rec-${card.id}`}
                            card={card}
                            isRecommendation
                            benefitText={benefit}
                            onClick={() => setSelectedCardForDetails({ card, source: 'rec' })}
                            isExhausted={normalizedExhaustedCards[card.id]}
                          />
                        ))
                      ) : (
                        <CardItem
                          layoutId={`card-rec-${recommendation.bestCard.id}`}
                          card={recommendation.bestCard}
                          isRecommendation
                          benefitText={recommendation.expectedBenefit}
                          onClick={() => setSelectedCardForDetails({ card: recommendation.bestCard, source: 'rec' })}
                          isExhausted={normalizedExhaustedCards[recommendation.bestCard.id]}
                        />
                      )}
                    </div>

                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5 flex flex-col justify-between">
                      <div className="space-y-4 relative z-10">
                        <div className="flex bg-gray-50 dark:bg-gray-800 rounded-xl p-4 items-center justify-between border border-gray-200 dark:border-gray-700 relative">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Net Value</span>
                            <span className="text-3xl font-semibold text-gray-900 dark:text-white tabular-nums">
                              {recommendation.netValue < 0 ? '-' : ''}₹{Math.abs(recommendation.netValue).toFixed(2)}
                            </span>
                          </div>
                          {recommendation.feesPaid > 0 && (
                            <div className="absolute top-2 right-2 text-[8px] font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 rounded-lg px-1.5 py-0.5 shadow-sm border border-red-100 dark:border-red-900/50 flex items-center justify-center uppercase tracking-tighter">
                              <div>Fee: ₹{recommendation.feesPaid.toFixed(2)}</div>
                            </div>
                          )}
                        </div>

                        {lastSearchInfo?.isP2P && (
                          <div className="p-4 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-start gap-3 text-left shadow-sm">
                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-amber-800 dark:text-amber-400 block uppercase tracking-wide">P2P UPI Exclusion Warning</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold block">
                                Peer-to-peer personal transfers are excluded from standard credit card rewards. Use bank-account UPI (CRED, Amazon) or Kotak 811.
                              </span>
                            </div>
                          </div>
                        )}

                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{recommendation.reason}</p>

                        {recommendation.availableOffers && recommendation.availableOffers.length > 0 && (
                          <button
                            onClick={() => setShowOffersOverlay(true)}
                            className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span><span className="block text-sm font-semibold text-gray-900 dark:text-white">Offers available</span><span className="block text-xs text-gray-500 dark:text-gray-400">{recommendation.availableOffers.length} exclusive deals found</span></span>
                          </button>
                        )}

                        <div className="pt-2 relative">
                          <motion.button
                            onClick={(e) => {
                              if (isLogged) return;
                              setIsLogged(true);

                              for (let i = 0; i < 15; i++) {
                                const confetti = document.createElement('div');
                                confetti.textContent = '🪙';
                                confetti.className = 'fixed pointer-events-none z-[400] text-xl drop-shadow-md';

                                confetti.style.left = `${e.clientX}px`;
                                confetti.style.top = `${e.clientY}px`;
                                document.body.appendChild(confetti);

                                const angle = Math.random() * Math.PI * 2;
                                const velocity = 40 + Math.random() * 80;
                                const tx = Math.cos(angle) * velocity;
                                const ty = Math.sin(angle) * velocity - 60;

                                confetti.animate([
                                  { transform: 'translate(-50%, -50%) scale(0.5) rotate(0deg)', opacity: 1 },
                                  { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1.5) rotate(${Math.random() * 180}deg)`, opacity: 0 }
                                ], {
                                  duration: 700 + Math.random() * 400,
                                  easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
                                }).onfinish = () => confetti.remove();
                              }

                              logTransactionTimerRef.current = setTimeout(() => {
                                handleLogTransaction();
                              }, 1200);
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              "w-full h-12 relative overflow-hidden group text-white font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2",
                              isLogged
                                ? "bg-emerald-600"
                                : "bg-blue-600 hover:bg-blue-700"
                            )}
                          >
                            <div className="flex items-center justify-center relative z-10 w-full h-full">
                              <motion.div
                                animate={{
                                  x: isLogged ? 48 : -82,
                                }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                className="absolute z-20"
                              >
                                <Check className="w-5 h-5" strokeWidth={3} />
                              </motion.div>

                              <div className="flex items-center justify-center relative">
                                <AnimatePresence mode="wait">
                                  {!isLogged ? (
                                    <motion.div
                                      key="initial"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0, x: 20 }}
                                      transition={{ duration: 0.2 }}
                                      className="flex items-center gap-2 ml-6"
                                    >
                                      <span className="text-base font-bold whitespace-nowrap">Log Transaction</span>
                                    </motion.div>
                                  ) : (
                                    <motion.div
                                      key="logged"
                                      initial={{ opacity: 1 }}
                                      className="flex items-center mr-7"
                                    >
                                      {['L', 'o', 'g', 'g', 'e', 'd'].map((char, index) => (
                                        <motion.span
                                          key={index}
                                          initial={{ opacity: 0, x: -5 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{
                                            delay: index * 0.05 + 0.1,
                                            duration: 0.2,
                                            ease: "easeOut"
                                          }}
                                          className="text-base font-bold"
                                        >
                                          {char}
                                        </motion.span>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </motion.button>
                        </div>
                      </div>

                      {recommendation.voucherOption && (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl space-y-2">
                          <h4 className="text-xs font-bold uppercase text-purple-600 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Smart Voucher Strategy
                          </h4>
                          <p className="text-sm text-gray-800">
                            Check <span className="font-semibold">{recommendation.voucherOption.platform}</span> for <span className="font-semibold text-green-700">{recommendation.voucherOption.discount}</span> value.
                          </p>
                          <p className="text-xs text-gray-600 font-medium">
                            {recommendation.voucherOption.cardBenefit}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {recommendation.alternatives.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Top alternatives</h4>
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden">
                        {recommendation.alternatives.map((alt) => (
                          <div key={alt.card.id} className="flex items-center justify-between gap-4 p-4">
                            <div className="min-w-0"><div className="font-semibold text-gray-900 dark:text-gray-100">{alt.card.name}</div><div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{alt.benefit}</div></div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums whitespace-nowrap">₹{alt.netValue.toFixed(0)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.section>
              ) : (
                <motion.div 
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 rounded-2xl min-h-[160px]"
                >
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-gray-500 font-medium">Start a search to find the best card.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full flex flex-col gap-8 md:gap-6">
              {/* Lounge Access Tip */}
              <section className="bg-gray-900/95 dark:bg-black/80 backdrop-blur-xl rounded-3xl p-6 py-6 md:py-8 text-white overflow-hidden relative shadow-lg min-h-[140px] flex flex-col sm:flex-row sm:items-center justify-between border border-gray-800 dark:border-gray-700/50 group">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="space-y-3 relative z-10 sm:max-w-[70%]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 flex items-center justify-center border border-blue-500/10 shadow-sm backdrop-blur-md">
                      <Plane className="w-5 h-5 text-blue-300/80 drop-shadow-sm" />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-lg font-bold tracking-tight leading-tight">Lounge Tracker</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Airport Benefits</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-medium pl-1">
                    You have {loungeCardCount} cards with tracking for lounge access.
                  </p>
                </div>
                <button onClick={() => setIsLoungeOpen(true)} className="relative z-10 bg-white hover:bg-gray-100 text-gray-900 text-sm font-bold px-6 py-3 rounded-2xl mt-4 sm:mt-0 transition-all w-fit shrink-0 shadow-lg shadow-white/5 hover:scale-105 active:scale-95 flex items-center gap-2 group/btn">
                  View Passes
                </button>
                <Plane className="absolute -bottom-10 -right-8 w-48 h-48 text-white opacity-[0.02] group-hover:opacity-[0.04] rotate-12 transition-opacity duration-500 pointer-events-none" />
              </section>
            </div>
          </div>
        </div>

        {/* My Cards Section - Full Width Bottom */}
        <div className="relative z-20 mt-12 pt-8 border-t border-gray-200 space-y-6 isolate">
          <div className="flex items-center justify-between relative z-30">
            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <Wallet className="w-5 h-5 text-gray-500" />
              My Wallet
              <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full px-2 py-0.5 text-[10px] font-black ml-1">
                {activeWalletCards.length}
              </span>
            </h3>
            <div className="flex items-center gap-3">
              <div className="relative group flex cursor-pointer" onClick={() => setIsDashboardOpen(true)}>
                <button aria-label="My Savings" className="relative overflow-hidden flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm text-yellow-600 dark:text-yellow-500 px-4 py-1.5 rounded-full text-sm font-bold gap-2 focus:ring-2 ring-gray-200 dark:ring-gray-800 outline-none group/piggy">
                  <span className="absolute -top-1 left-[50%] w-1.5 h-1.5 rounded-full bg-yellow-600 dark:bg-yellow-500 opacity-0 group-hover/piggy:opacity-0 group-hover/piggy:animate-[coin-drop_0.5s_ease-in_forwards] z-[5]"></span>
                  <PiggyBank className="w-5 h-5 transition-transform group-hover/piggy:scale-110 relative z-10 fill-white dark:fill-gray-800" strokeWidth={2} />
                </button>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-gray-900 border border-gray-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg whitespace-nowrap shadow-xl z-50">
                  My Savings
                </div>
              </div>
              <button
                onClick={() => setIsWalletOpen(true)}
                className="text-sm font-semibold flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-5 py-1.5 rounded-full transition-colors shadow-sm focus:ring-2 ring-gray-200 outline-none"
              >
                Edit
              </button>
            </div>
          </div>

          {/* We turn this into a horizontal scrolling container with a fade mask on the edges if there's overflow, or just a nice grid */}
          <div className="relative z-30 isolate" style={{ WebkitTransform: 'translate3d(0,0,0)', transform: 'translate3d(0,0,0)' }}>
            <motion.div 
              layoutScroll
              className="flex sm:grid sm:grid-cols-[repeat(auto-fit,minmax(310px,1fr))] gap-4 overflow-x-auto pt-8 pb-4 px-1 snap-x scrollbar-hide relative z-40 isolate render-optimized"
              style={{ paddingBottom: '2rem', WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }} // ensure enough overflow room
            >
              {activeWalletCards.map((card) => (
                <div key={card.id} className={cn("snap-start shrink-0 w-[310px] sm:w-auto", selectedCardForDetails?.card.id === card.id ? "opacity-0 pointer-events-none" : "opacity-100")}>
                  <CardItem layoutId={`card-list-${card.id}`} card={card} onClick={() => setSelectedCardForDetails({ card, source: 'list' })} className="h-full shadow-sm hover:shadow-md transition-shadow cursor-pointer" isExhausted={normalizedExhaustedCards[card.id]} />
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Reminders / Dashboard Area */}
        <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <BillReminders
            walletCards={walletCards}
            cardBillDates={cardBillDates}
            paidBills={paidBills}
            markBillPaid={markBillPaid}
          />

          {/* Redemption Reminder Section */}
          <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-pink-500/10 to-transparent rounded-bl-full pointer-events-none -z-10" />

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/40 dark:to-pink-900/20 flex items-center justify-center border border-pink-200/50 shadow-sm relative z-10">
                  <Ticket className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-bold text-gray-900 dark:text-white leading-tight">Redemption Reminder</h3>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Don't let balances expire</p>
                </div>
              </div>

              <ul className="space-y-2 mt-6 relative z-10">
                {[
                  { name: 'Kiwi Neon', type: 'Kiwis' },
                  { name: 'Tata Neu', type: 'NeuCoins' },
                  { name: 'Amazon Pay', type: 'Wallet balance' },
                  { name: 'OneCard', type: 'Reward points' },
                  { name: 'Imperia Platinum', type: 'Cashback points' }
                ].map((item, i) => (
                  <li key={i} className="flex justify-between items-center bg-gray-50/50 hover:bg-gray-100/50 dark:bg-gray-800/50 dark:hover:bg-gray-800 transition-colors p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <span className="font-bold text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600/80 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-2 py-1 rounded-md">{item.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>

      <AnimatePresence>
        {selectedCardForDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-md"
            onClick={() => setSelectedCardForDetails(null)}
          >
            <motion.div
              layoutId={`card-${selectedCardForDetails.source}-${selectedCardForDetails.card.id}`}
              onClick={(e) => e.stopPropagation()}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)'
              }}
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedCardForDetails.card.name} rewards`}
              className="rounded-3xl p-6 max-w-md w-full relative flex flex-col text-white max-h-[85dvh] overflow-hidden bg-gray-900 border border-gray-800 z-0"
            >
              <div className="absolute inset-0 rounded-3xl shadow-2xl shadow-black/40 pointer-events-none" />
              <button
                onClick={() => setSelectedCardForDetails(null)}
                className="absolute right-4 top-4 p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors z-40 backdrop-blur-md"
                aria-label="Close details"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="flex flex-col mb-6 relative z-30">
                <span className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">{{ YES: 'YES BANK', IDIB: 'INDIAN BANK' }[selectedCardForDetails.card.bank] ?? selectedCardForDetails.card.bank}</span>
                <h2 className="text-3xl font-black text-white leading-tight pr-10">
                  {selectedCardForDetails.card.name}
                </h2>
              </div>

              <div className="overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent relative z-10 pb-4">
                {CARD_DETAIL_INFO[selectedCardForDetails.card.id] && (() => {
                  const info = CARD_DETAIL_INFO[selectedCardForDetails.card.id];
                  return <section className="rounded-2xl p-4 border border-blue-800/40 bg-gradient-to-br from-blue-950/70 to-gray-800/60">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-blue-200/70">{info.feeLabel || 'Annual fee'}</div>
                    <div className="text-2xl font-black tracking-tight text-white mt-1">{info.fee}</div>
                    <p className="text-xs text-white/65 leading-relaxed mt-2">{info.feeNote}</p>
                  </section>;
                })()}
                {(CARD_DETAIL_INFO[selectedCardForDetails.card.id]?.sourceUrl || selectedCardForDetails.card.sourceUrl) && <a href={CARD_DETAIL_INFO[selectedCardForDetails.card.id]?.sourceUrl || selectedCardForDetails.card.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 hover:text-blue-200 py-1">Official benefits and terms <span aria-hidden="true">↗</span></a>}
                <CardRewardUsage card={selectedCardForDetails.card} dates={cardBillDates} usage={offerUsage} setUsage={setOfferUsage} />
                {getCardDetailGroups(selectedCardForDetails.card).map((group, groupIndex) => <section key={groupIndex} className={group.title ? 'rounded-2xl border border-blue-400/25 bg-blue-500/5 p-3 space-y-3' : undefined}>
                  {group.title && <h3 className="px-1 text-xs font-bold text-blue-200/80">{group.title}</h3>}
                  {group.benefits.map((b, i) => {
                  const isQuarterly = b.description.toLowerCase().includes('quarter') || b.description.toLowerCase().includes('qtr');
                  const description = b.description.replace(/\s*\([Cc]ode:\s*[A-Z0-9]+\)/g, '');
                  const cycle = isQuarterly ? getQuarterCycle() : getOfferCycleForCard(selectedCardForDetails.card.id, cardBillDates);
                  const usageKey = `${selectedCardForDetails.card.id}-${b.trackingCategory}-${b.trackingValue}-${cycle}`;
                  const usedCount = offerUsage[usageKey] || 0;
                  const detailChips = getBenefitDetailChips(b);
                  const codes = benefitCodes(selectedCardForDetails.card.benefits.find(original => original.category === b.trackingCategory && original.value === b.trackingValue)?.description || b.description);
                  return (
                    <div key={i} className="p-4 border border-white/10 rounded-2xl bg-black/20 backdrop-blur-sm flex flex-col gap-1">
                      <div className="font-bold text-white flex items-start justify-between gap-2 min-w-0">
                        <span className="min-w-0 flex-1 leading-snug pr-2">{b.category}</span>
                        <span className="shrink-0 font-bold bg-white/20 border border-white/20 text-white px-2 py-1 rounded-lg text-[13px] shadow-sm relative z-10">
                          {b.value}
                        </span>
                      </div>
                      <div className="text-sm text-white/80 font-medium leading-relaxed mt-1">
                        {description}
                      </div>
                      {(codes.length > 0 || b.extraChips?.length) && <div className="flex flex-wrap gap-2 mt-2">
                        {b.extraChips?.map(chip => <span key={chip} className="rounded-lg border border-purple-400/30 bg-purple-400/10 px-2.5 py-1 text-[11px] font-semibold text-purple-200">{chip}</span>)}
                        {codes.map(code => <code key={code} className="rounded-lg border border-blue-400/30 bg-blue-400/10 px-2.5 py-1 text-[11px] font-bold text-blue-200 tracking-wider">{code}</code>)}
                      </div>}
                      {b.usageLimit && <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                        <span className="text-[10px] text-white/60 font-semibold mr-1">Used this {isQuarterly ? 'quarter' : 'month'}</span>
                        {Array.from({ length: b.usageLimit }, (_, index) => <button key={index} type="button" role="checkbox" aria-checked={usedCount > index} aria-label={`${b.category} use ${index + 1}`} onClick={() => setOfferUsage(previous => ({ ...previous, [usageKey]: previous[usageKey] === index + 1 ? index : index + 1 }))} className={cn("w-7 h-7 rounded-lg border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400", usedCount > index ? "bg-blue-500 border-blue-400 text-white" : "bg-white/5 border-white/20 hover:bg-white/10")}>
                          {usedCount > index && <Check className="w-4 h-4" />}
                        </button>)}
                        <span className="text-[10px] text-white/50 ml-auto">{usedCount}/{b.usageLimit}</span>
                      </div>}
                      {detailChips.length > 0 && <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10 text-[10px] font-semibold text-white/65">
                        {detailChips.map(chip => <span key={chip} className="rounded-lg bg-white/5 px-2 py-1">{chip}</span>)}
                      </div>}
                    </div>
                  );
                  })}
                  {group.subtext && <p className="px-1 text-xs text-gray-400">{group.subtext}</p>}
                  {group.chips && <div className="flex flex-wrap gap-2 px-1 text-[10px] font-semibold text-blue-100/75">{group.chips.map(chip => <span key={chip} className="rounded-lg bg-blue-400/10 px-2 py-1.5">{chip}</span>)}</div>}
                </section>)}

                {getCardDetailBenefits(selectedCardForDetails.card).length === 0 && (
                  <div className="text-white/60 text-sm py-4 text-center font-medium">No quick-view benefits available.</div>
                )}

                <details className="border-y border-white/10 py-3 text-xs text-white/60">
                  <summary className="cursor-pointer font-semibold text-xs text-white/70">Excluded spending</summary>
                  <p className="mt-3 leading-relaxed">{selectedCardForDetails.card.benefits.filter(b => b.type === 'exclusion').map(b => b.description).join(', ') || 'See official terms for excluded spending.'}</p>
                </details>

                {selectedCardForDetails.card.type === 'Credit' && (
                  <CardBillingSettings cardId={selectedCardForDetails.card.id} dates={cardBillDates} setDates={setCardBillDates} />
                )}
              </div>

              {/* Kiwi Neon Slider */}
              {selectedCardForDetails.card.id === 'kiwi-neon' && (
                <div className="mt-2 pt-4 border-t border-white/20 relative z-10 flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-extrabold tracking-widest uppercase text-white/90">Current Milestone</span>
                    <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full shadow-inner text-white border border-white/10">
                      Earned: ₹{kiwiNeonEarnRate === 2 ? '500' : kiwiNeonEarnRate === 3 ? '1,500' : kiwiNeonEarnRate === 4 ? '4,000' : '7,500'}
                    </span>
                  </div>

                  <div className="relative pt-6 pb-2 px-1">
                    <div className="flex justify-between absolute top-0 left-0 right-0 px-2 text-[10px] font-bold text-white/70">
                      <span>25k</span>
                      <span>50k</span>
                      <span>100k</span>
                      <span>150k+</span>
                    </div>
                    <input
                      id="kiwiNeonSlider"
                      aria-label="Kiwi Neon Earn Rate"
                      type="range"
                      min="2"
                      max="5"
                      step="1"
                      value={kiwiNeonEarnRate}
                      onChange={(e) => setKiwiNeonEarnRate(parseInt(e.target.value, 10))}
                      className="w-full h-2.5 rounded-full appearance-none cursor-pointer outline-none shadow-inner"
                      style={{
                        background: `linear-gradient(to right, #4ade80 0%, #fef08a ${((kiwiNeonEarnRate - 2) / 3) * 100}%, rgba(255,255,255,0.3) ${((kiwiNeonEarnRate - 2) / 3) * 100}%, rgba(255,255,255,0.3) 100%)`,
                      }}
                    />
                    <style>{`
                      input[type=range]::-webkit-slider-thumb {
                        appearance: none;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: white;
                        cursor: pointer;
                        box-shadow: 0 0 10px rgba(0,0,0,0.3);
                        border: 2px solid ${kiwiNeonEarnRate === 5 ? '#fef08a' : '#4ade80'};
                      }
                    `}</style>
                    <div className="flex justify-between mt-3 px-2 text-sm font-black text-white">
                      <span className={kiwiNeonEarnRate >= 2 ? "opacity-100 drop-shadow-md" : "opacity-50"}>2%</span>
                      <span className={kiwiNeonEarnRate >= 3 ? "opacity-100 drop-shadow-md" : "opacity-50"}>3%</span>
                      <span className={kiwiNeonEarnRate >= 4 ? "opacity-100 drop-shadow-md" : "opacity-50"}>4%</span>
                      <span className={kiwiNeonEarnRate >= 5 ? "opacity-100 drop-shadow-md" : "opacity-50"}>5%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Max Spends Toggle */}
              <div className="mt-auto pt-4 border-t border-white/10 relative z-10 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold block leading-none mb-1">Accelerated Limit Reached</span>
                  <span className="text-[11px] font-medium text-white/60 leading-none">Exclude from recommendations</span>
                </div>
                <button
                  onClick={() => {
                    const isEx = normalizedExhaustedCards[selectedCardForDetails.card.id];
                    setExhaustedCards(prev => {
                      if (isEx) {
                        const copy = { ...prev };
                        delete copy[selectedCardForDetails.card.id];
                        return copy;
                      } else {
                        return { ...prev, [selectedCardForDetails.card.id]: getCycleForCard(selectedCardForDetails.card.id, cardBillDates) };
                      }
                    });
                  }}
                  className={cn("w-12 h-6 rounded-full transition-colors flex items-center px-1 shadow-inner shrink-0 ml-4", normalizedExhaustedCards[selectedCardForDetails.card.id] ? "bg-red-500" : "bg-white/20 border border-white/20")}
                >
                  <motion.div
                    layout
                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: normalizedExhaustedCards[selectedCardForDetails.card.id] ? 24 : 0 }}
                  />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <AnimatePresence>
          <LoungeTrackerModal
            isOpen={isLoungeOpen}
            onClose={() => setIsLoungeOpen(false)}
            loungeTab={loungeTab}
            setLoungeTab={setLoungeTab}
            loungePassesUsed={loungePassesUsed}
            setLoungePassesUsed={setLoungePassesUsed}
            loungeMilestonesVerified={loungeMilestonesVerified}
            setLoungeMilestonesVerified={setLoungeMilestonesVerified}
            kiwiNeonEarnRate={kiwiNeonEarnRate}
          />
        </AnimatePresence>
      </Suspense>

      <AnimatePresence>
        {showOffersOverlay && recommendation?.availableOffers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-xl"
            onClick={() => setShowOffersOverlay(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 relative flex flex-col max-h-[85vh]"
            >
              <div className="p-6 flex items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Card Offers</h3>
                <button aria-label="Close offers overlay" onClick={() => setShowOffersOverlay(false)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto p-6 space-y-3">
                {recommendation.availableOffers.map((offer) => (
                  <div key={offer.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="min-w-0 flex-1"><div className="text-xs text-gray-500 dark:text-gray-400">{offer.category}</div><h4 className="font-semibold text-gray-900 dark:text-white">{offer.title}</h4><p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{offer.description}</p></div>
                    <button onClick={() => { if (offer.cardId) { const card = CARD_DICT[offer.cardId]; if (card) { setShowOffersOverlay(false); setSelectedCardForDetails({ card, source: 'offer' }); } } }} className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Details</button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isApiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ type: "spring", damping: 35, stiffness: 400 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button aria-label="Close configure API key modal" onClick={() => setIsApiModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure API Key</h2>
              <p className="text-sm text-gray-500 mb-6 font-medium">
                Live verification requires an OpenRouter API key. Without it, the app relies on a local database.<br />
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline underline-offset-2">Create a free OpenRouter API key here</a>.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your OpenRouter API Key</label>
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500 transition-all font-mono text-sm"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testStatus === 'testing'}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {testStatus === 'testing' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Test Connection
                    </button>

                    {testStatus === 'success' && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" strokeWidth={3} /> Connection OK
                      </span>
                    )}

                    {testStatus === 'error' && (
                      <span className="text-xs font-semibold text-red-500 max-w-[200px] text-right truncate" title={testErrorMessage}>
                        {testErrorMessage}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsApiModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setOpenRouterApiKey(tempApiKey);
                      setIsApiModalOpen(false);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative border border-red-100"
            >
              <button
                aria-label="Close delete confirmation modal"
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Delete all data?</h2>
              <p className="text-sm text-gray-500 mb-8 font-medium leading-relaxed">
                This action is <span className="text-red-600 font-bold">permanent</span> and cannot be undone. All your card tracking, lounge passes, and settings will be wiped from our database.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400">Type <span className="text-red-600">DELETE</span> to confirm</label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 outline-none focus:ring-2 ring-red-500 transition-all font-bold text-gray-900"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                    className="flex-1 px-4 py-4 rounded-2xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Keep Data
                  </button>
                  <button
                    disabled={deleteConfirmText !== 'DELETE'}
                    onClick={handleDeleteData}
                    className="flex-1 px-4 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-30 disabled:grayscale shadow-lg shadow-red-600/20"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <WalletManagerModal
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
          walletCards={walletCards}
          setWalletCards={setWalletCards}
        />
        <DashboardModal
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
          logs={cashbackLogs}
          setLogs={setCashbackLogs}
          onRemoveLogs={(dates) => {
            const key = scopedKey(user?.uid ?? null, 'removedSavingsDates');
            safeSetItem(key, [...new Set([...getInitialState<number[]>(key, []), ...dates])]);
            setOfferUsage(previous => removeRewardLogs(previous, dates));
          }}
        />
      </Suspense>

      <footer className="text-center py-6 mt-8 text-xs text-gray-400 font-medium px-6 flex flex-col items-center gap-3">
        <div>
          <p>Crafted by Chief Keefe. Coded with Codex.</p>
          <p className="mt-2">I built this web app for myself, but feel free to fork it and customize it for your own cards.</p>
          <a href="https://github.com/schultz911/only-cashbacks" target="_blank" rel="noopener noreferrer" className="inline-flex mt-2 text-blue-400 hover:text-blue-300 underline underline-offset-4">Fork on GitHub ↗</a>
        </div>
      </footer>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[5000] px-4 py-3 bg-gray-900 border border-gray-700 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-xl"
          >
            {toast.type === 'success' && <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center"><Check className="w-4 h-4" /></div>}
            {toast.type === 'error' && <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center"><AlertCircle className="w-4 h-4" /></div>}
            {toast.type === 'info' && <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center"><Info className="w-4 h-4" /></div>}
            <span className="text-white text-sm font-semibold tracking-wide pr-2">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {needRefresh && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[450] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-5 py-4 rounded-3xl shadow-2xl flex items-center gap-4 font-semibold text-sm max-w-sm backdrop-blur-xl"
          >
            <div className="flex flex-col text-left">
              <span className="text-gray-950 dark:text-white font-bold leading-tight">Update Available</span>
              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium mt-0.5">A new version of OnlyCashbacks is ready.</span>
            </div>
            <button 
              onClick={() => updateServiceWorker(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow hover:shadow-lg active:scale-95 shrink-0"
            >
              Reload
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
