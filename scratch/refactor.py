import re
import os

filepath = r'c:\only-cashbacks\src\App.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('export default function App() {')
end_idx = content.find('  return (\n    <div className="min-h-screen bg-[#F5F5F7]')

imports_to_add = """
import { useWalletState } from './hooks/useWalletState';
import { useAuthAndSync } from './hooks/useAuthAndSync';
import { useSearchAndCurrency } from './hooks/useSearchAndCurrency';
import { usePushNotifications } from './hooks/usePushNotifications';
"""

content = content[:start_idx] + imports_to_add + content[start_idx:]

# Adjust start_idx after adding imports
start_idx = content.find('export default function App() {')
end_idx = content.find('  return (\n    <div className="min-h-screen bg-[#F5F5F7]')

new_state_logic = """export default function App() {
  const skipSyncRef = useRef(false);

  const {
    user, isAuthLoading, isDataLoaded,
    syncError, isSyncing, isSyncPaused, setIsSyncPaused,
    isDirty, setIsDirty, isDirtyRef, markDirty,
    theme, setTheme,
    handleLogin, handleLogout,
    saveData, useSyncEffect
  } = useAuthAndSync(useRef({}), skipSyncRef);

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
  } = useWalletState(skipSyncRef, setIsDirty);

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
    isIntl, setIsIntl,
    isOnline, setIsOnline,
    isScanToPay, setIsScanToPay,
    openRouterApiKey, setOpenRouterApiKey
  } = useSearchAndCurrency();

  useSyncEffect({
    setExhaustedCards, setCardBillDates, setPaidBills, setLoungePassesUsed,
    setLoungeMilestonesVerified, setOfferUsage, setOpenRouterApiKey,
    setKiwiNeonEarnRate, setWalletCards, setCashbackLogs
  });

  const latestStateRef = useRef({
    exhaustedCards, loungePassesUsed, loungeMilestonesVerified, offerUsage, cardBillDates, paidBills, openRouterApiKey, kiwiNeonEarnRate, walletCards, cashbackLogs, theme
  });
  useEffect(() => {
    latestStateRef.current = {
      exhaustedCards, loungePassesUsed, loungeMilestonesVerified, offerUsage, cardBillDates, paidBills, openRouterApiKey, kiwiNeonEarnRate, walletCards, cashbackLogs, theme
    };
  }, [exhaustedCards, loungePassesUsed, loungeMilestonesVerified, offerUsage, cardBillDates, paidBills, openRouterApiKey, kiwiNeonEarnRate, walletCards, cashbackLogs, theme]);

  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [lastSearchInfo, setLastSearchInfo] = useState<MerchantInfo | null>(null);
  const [history, setHistory] = useState<MerchantInfo[]>([]);

  const [selectedVoucherPortal, setSelectedVoucherPortal] = useState('');
  const [isLoungeOpen, setIsLoungeOpen] = useState(false);
  const [showOffersOverlay, setShowOffersOverlay] = useState(false);
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<{ card: Card, source: string } | null>(null);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const [loungeTab, setLoungeTab] = useState<'Domestic' | 'International'>('Domestic');

  const isAndroidApp = useMemo(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches;
      const isTwaReferrer = document.referrer.includes('android-app://');
      const isWebView = /Android/i.test(navigator.userAgent) && /wv/i.test(navigator.userAgent);
      return isStandalone || isTwaReferrer || isWebView;
    }
    return false;
  }, []);

  const fuse = useMemo(() => new Fuse(KNOWN_MERCHANTS, { threshold: 0.3 }), []);

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
      const results = fuse.search(query).slice(0, 5).map(r => r.item);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
    setFocusedSuggestionIndex(-1);
  }, [query, showSuggestions, fuse]);

  const useDebouncedValue = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  };

  const debouncedAmount = useDebouncedValue(amount, 300);
  const debouncedForeignAmount = useDebouncedValue(foreignAmount, 300);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const offersScrollRef = useRef<HTMLDivElement>(null);
  const [carouselConstraint, setCarouselConstraint] = useState(0);

  useEffect(() => {
    const updateConstraint = () => {
      if (offersScrollRef.current) {
        setCarouselConstraint(
          Math.min(0, offersScrollRef.current.offsetWidth - offersScrollRef.current.scrollWidth)
        );
      }
    };
    const timeout = setTimeout(updateConstraint, 50);
    window.addEventListener('resize', updateConstraint);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateConstraint);
    };
  }, [recommendation?.availableOffers?.length, showOffersOverlay]);

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
    if (!user || isAuthLoading || !isDataLoaded || skipSyncRef.current || !isDirty || isSyncing || isSyncPaused) return;
    const timer = setTimeout(() => {
      saveData();
    }, 1000);
    return () => clearTimeout(timer);
  }, [isDirty, user, isAuthLoading, isDataLoaded, isSyncPaused, isSyncing, exhaustedCards, loungePassesUsed, loungeMilestonesVerified, offerUsage, cardBillDates, paidBills, openRouterApiKey, kiwiNeonEarnRate, walletCards, cashbackLogs, theme]);

  useEffect(() => markDirty(), [exhaustedCards, loungePassesUsed, loungeMilestonesVerified, offerUsage, cardBillDates, paidBills, walletCards, cashbackLogs, theme, openRouterApiKey, kiwiNeonEarnRate]);

  useEffect(() => {
    if (!isDataLoaded || !walletCards || walletCards.length === 0) return;
    const timer = setTimeout(() => {
      let hasUnpaidPastDue = false;
      const today = new Date();
      for (const cardId of walletCards) {
        const card = CARD_DATA.find(c => c.id === cardId);
        if (!card || card.isDummy || card.type !== 'Credit') continue;
        const billDay = cardBillDates[cardId] || 1;
        const cycle = getCycleForCard(cardId, cardBillDates);
        const isPaid = paidBills[cardId] === cycle;
        if (!isPaid) {
          if (today.getDate() >= billDay + 2) {
            hasUnpaidPastDue = true;
            break;
          }
        }
      }
      if (hasUnpaidPastDue) {
        showToast('You have unpaid credit card bills past their billing dates.', 'info');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isDataLoaded, walletCards, paidBills, cardBillDates]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const today = new Date();
    const todayDate = today.getDate();
    const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${todayDate}`;
    let lastResetDates: Record<string, string> = {};
    try {
      const stored = localStorage.getItem('oc_lastOfferResetDates');
      if (stored) lastResetDates = JSON.parse(stored);
    } catch { }

    let offerUsageDirty = false;
    let exhaustedDirty = false;
    const newOfferUsage = { ...offerUsage };
    const newExhaustedCards = { ...exhaustedCards };

    for (const card of CARD_DATA) {
      if (card.isDummy) continue;
      const resetDay = card.type === 'Credit' ? (cardBillDates[card.id] || 1) : 1;
      if (todayDate !== resetDay) continue;
      if (lastResetDates[card.id] === todayKey) continue;
      const currentCycle = getCycleForCard(card.id, cardBillDates);
      for (const key of Object.keys(newOfferUsage)) {
        if (key.startsWith(`${card.id}-`) && !key.endsWith(`-${currentCycle}`)) {
          delete newOfferUsage[key];
          offerUsageDirty = true;
        }
      }
      if (card.type === 'Credit' || card.type === 'Debit') {
        if (newExhaustedCards[card.id] !== undefined && newExhaustedCards[card.id] !== currentCycle) {
          delete newExhaustedCards[card.id];
          exhaustedDirty = true;
        }
      }
      lastResetDates[card.id] = todayKey;
    }
    const quarterStartMonths = [0, 3, 6, 9];
    const isQuarterStart = todayDate === 1 && quarterStartMonths.includes(today.getMonth());
    if (isQuarterStart && lastResetDates['_quarterly'] !== todayKey) {
      const currentQuarter = getQuarterCycle();
      for (const key of Object.keys(newOfferUsage)) {
        const qMatch = key.match(/-\d{4}-Q\d$/);
        if (qMatch && qMatch[0] !== `-${currentQuarter}`) {
          delete newOfferUsage[key];
          offerUsageDirty = true;
        }
      }
      lastResetDates['_quarterly'] = todayKey;
    }

    if (offerUsageDirty) setOfferUsage(newOfferUsage);
    if (exhaustedDirty) setExhaustedCards(newExhaustedCards);
    localStorage.setItem('oc_lastOfferResetDates', JSON.stringify(lastResetDates));
  }, [isDataLoaded, cardBillDates]);

  const handleDeleteData = async () => {
    if (deleteConfirmText !== 'DELETE' || !user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      await deleteDoc(docRef);
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
      alert('Failed to delete data. Please check your permissions.');
    }
  };

  const VOUCHER_PORTALS: Record<string, string> = {
    'Maximize': 'Kotak 811 Infinity Metal',
    'Amazon': 'SBI Cashback',
    'Blinkit': 'SBI Cashback',
    'Cred': 'SBI Cashback',
    'OneCard': 'IDIB OneCard',
    'Kiwi': 'YES Kiwi Neon',
    'Tata Neu': 'HDFC Tata Neu Infinity'
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
        } else {
          const mockRates: Record<string, number> = { 'USD': 0.012, 'EUR': 0.011, 'GBP': 0.0094, 'AED': 0.044 };
          if (mockRates[baseCurrency]) effectiveAmount = parsedForeign / mockRates[baseCurrency];
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
  }, [normalizedExhaustedCards, offerUsage, cardBillDates, debouncedAmount, debouncedForeignAmount, isIntl, isOnline, isScanToPay, kiwiNeonEarnRate, exchangeRates, baseCurrency, walletCards]);

  const formatAmountStr = (val: string) => {
    if (!val) return '';
    const parts = val.split('.');
    parts[0] = parts[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
    return parts.join('.');
  };

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
      showToast('Transaction logged!', 'success');
    } else {
      showToast('No cashback earned for this transaction.', 'info');
    }
  };

  const [isLogged, setIsLogged] = useState(false);

  const handleSearch = async (e?: React.FormEvent, directQuery?: string, prefilledAmount?: string) => {
    if (e) e.preventDefault();
    if (loading) return;
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
    } else if (isIntl) {
      const mockRates: Record<string, number> = { 'USD': 0.012, 'EUR': 0.011, 'GBP': 0.0094, 'AED': 0.044 };
      if (mockRates[baseCurrency]) effectiveAmount = parsedForeign / mockRates[baseCurrency];
    }

    if (directQuery !== undefined) setQuery(directQuery);
    if (prefilledAmount !== undefined && !isIntl) setAmount(prefilledAmount);

    setLoading(true);
    try {
      const info = await categorizeMerchant(activeQuery, openRouterApiKey || undefined);
      setLastSearchInfo(info);
      const rec = getRecommendations(info, effectiveAmount, isOnline, isIntl, !isOnline && isScanToPay, normalizedExhaustedCards, offerUsage, kiwiNeonEarnRate, walletCards.length > 0 ? walletCards : null, cardBillDates);
      setRecommendation(rec);
      setHistory(prev => {
        const filtered = prev.filter(p => p.name.toLowerCase() !== info.name.toLowerCase());
        return [info, ...filtered].slice(0, 4);
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  usePushNotifications(isDataLoaded, walletCards, cardBillDates, paidBills, getCycleForCard);
"""

new_file_content = content[:start_idx] + new_state_logic + '\n' + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_file_content)

print("App.tsx refactored.")
