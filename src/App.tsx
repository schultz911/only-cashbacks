/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Search, History, Crown, Info, Landmark, Plane, Coffee, ShoppingBag, Loader2, Sparkles, Globe, Wallet, QrCode, X, ChevronDown, Check, UserCircle, LogOut, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { categorizeMerchant } from './services/gemini';
import { getRecommendations } from './lib/recommendation';
import { Recommendation, MerchantInfo, Card } from './types';
import { CARD_DATA } from './data/cards';
import { CardItem } from './components/CardItem';
import { LoungeTrackerItem } from './components/LoungeTrackerItem';
import { cn } from './lib/utils';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const CustomSelect = ({ value, onChange, options, placeholder, className, dropdownClassName }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={selectRef} className={`relative ${className}`} style={{ zIndex: isOpen ? 500 : 10 }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full flex items-center justify-between outline-none cursor-pointer gap-1 pl-3"
      >
        <span className="truncate">{value ? options.find((o: any) => o.value === value)?.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-[500] bg-white/80 backdrop-blur-xl border border-gray-100/80 shadow-2xl rounded-2xl mt-2 overflow-hidden ring-1 ring-black/5 ${dropdownClassName}`}
          >
            <div className="max-h-64 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-gray-200 space-y-0.5">
              {options.map((option: any) => (
                <button
                  key={option.value}
                  type="button"
                  className={`w-full text-left px-3 py-2 flex items-center justify-between transition-all duration-200 rounded-xl text-sm ${value === option.value ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm text-white font-bold' : 'text-gray-700 font-medium hover:bg-gray-100 hover:text-gray-900'}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate pr-4">{option.label}</span>
                  {value === option.value && <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const parseLoungeBenefit = (b: { value: string, description: string }) => {
  let spend = 0;
  let isFree = false;
  const descLocal = b.description.toLowerCase();

  if (descLocal.includes('complimentary') || descLocal.includes('no spend') || descLocal.includes('free') || descLocal.includes('automatically')) {
    isFree = true;
    spend = 0;
  } else {
    const kMatch = b.description.match(/(\d+)k/i);
    if (kMatch) {
      spend = parseInt(kMatch[1], 10) * 1000;
    }
  }

  let passesStr = b.value.replace('/qtr', ' / Quarter')
    .replace('/milestone', ' / Milestone')
    .replace('/qr', ' / Quarter');

  let passesCount = 0;
  const numMatch = passesStr.match(/(\d+)/);
  if (numMatch) {
    passesCount = parseInt(numMatch[1], 10);
  }

  return { spend, isFree, passesStr, passesCount, description: b.description };
};

export default function App() {
  const [query, setQuery] = useState('');
  const [amount, setAmount] = useState<string>('10000');
  const [foreignAmount, setForeignAmount] = useState<string>('150');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  const [isIntl, setIsIntl] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isScanToPay, setIsScanToPay] = useState(false);

  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [history, setHistory] = useState<MerchantInfo[]>([]);

  const [selectedVoucherPortal, setSelectedVoucherPortal] = useState('');
  const [isLoungeOpen, setIsLoungeOpen] = useState(false);
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<{ card: Card, source: string } | null>(null);
  const [exhaustedCards, setExhaustedCards] = useState<Record<string, boolean>>({});
  const [loungeTab, setLoungeTab] = useState<'Domestic' | 'International'>('Domestic');
  const [loungePassesUsed, setLoungePassesUsed] = useState<Record<string, number>>({});
  const [loungeMilestonesVerified, setLoungeMilestonesVerified] = useState<Record<string, boolean>>({});
  const [offerUsage, setOfferUsage] = useState<Record<string, number>>({});
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [kiwiNeonEarnRate, setKiwiNeonEarnRate] = useState(2);

  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const skipSyncRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !isAuthLoading && !skipSyncRef.current && !openRouterApiKey) {
      // Just flag they need it, could auto open but let them click badge
    }
  }, [user, isAuthLoading, openRouterApiKey]);

  useEffect(() => {
    if (!user) {
      setExhaustedCards({});
      setLoungePassesUsed({});
      setLoungeMilestonesVerified({});
      setOfferUsage({});
      setOpenRouterApiKey('');
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
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
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || isAuthLoading || skipSyncRef.current) return;

    const saveData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, {
          userId: user.uid,
          exhaustedCards,
          loungePassesUsed,
          loungeMilestonesVerified,
          offerUsage,
          openRouterApiKey,
          kiwiNeonEarnRate,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
    };
    saveData();
  }, [exhaustedCards, loungePassesUsed, loungeMilestonesVerified, offerUsage, openRouterApiKey, kiwiNeonEarnRate, user, isAuthLoading]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
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
    fetch('https://open.er-api.com/v6/latest/INR')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setExchangeRates(data.rates);
        }
      })
      .catch(err => console.error("Could not fetch exchange rates:", err));
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      const info = history[0];
      const parsedAmount = parseFloat(amount) || 0;
      const parsedForeign = parseFloat(foreignAmount) || 0;
      let effectiveAmount = parsedAmount;
      if (isIntl && exchangeRates[baseCurrency]) {
        effectiveAmount = parsedForeign / exchangeRates[baseCurrency];
      } else if (isIntl) {
        const mockRates: Record<string, number> = { 'USD': 0.012, 'EUR': 0.011, 'GBP': 0.0094, 'AED': 0.044 };
        if (mockRates[baseCurrency]) effectiveAmount = parsedForeign / mockRates[baseCurrency];
      }
      setRecommendation(getRecommendations(info, effectiveAmount, isOnline, isIntl, !isOnline && isScanToPay, exhaustedCards, offerUsage, kiwiNeonEarnRate));
    }
  }, [exhaustedCards, offerUsage, amount, foreignAmount, isIntl, isOnline, isScanToPay, kiwiNeonEarnRate]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedAmount = parseFloat(amount) || 0;
    const parsedForeign = parseFloat(foreignAmount) || 0;
    if (!query.trim() || parsedAmount <= 0) return;

    let effectiveAmount = parsedAmount;
    if (isIntl && exchangeRates[baseCurrency]) {
      effectiveAmount = parsedForeign / exchangeRates[baseCurrency];
    } else if (isIntl) {
      const mockRates: Record<string, number> = { 'USD': 0.012, 'EUR': 0.011, 'GBP': 0.0094, 'AED': 0.044 };
      if (mockRates[baseCurrency]) effectiveAmount = parsedForeign / mockRates[baseCurrency];
    }

    setLoading(true);
    try {
      const info = await categorizeMerchant(query, openRouterApiKey);
      const rec = getRecommendations(info, effectiveAmount, isOnline, isIntl, !isOnline && isScanToPay, exhaustedCards, offerUsage, kiwiNeonEarnRate);
      setRecommendation(rec);
      setHistory(prev => [info, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-blue-100 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-[#0095f6] rounded-full flex items-center justify-center shadow-md relative overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] mt-0.5 ml-0.5" fill="white" xmlns="http://www.w3.org/2000/svg">
                {/* Outer circle shape similar to the 'O' in OF */}
                <path d="M 50 15 A 35 35 0 1 0 50 85 A 35 35 0 0 0 50 15 Z M 50 35 A 15 15 0 1 1 50 65 A 15 15 0 0 1 50 35 Z" />
                {/* Winged 'B' mimicking the OF wing (roughly) intersecting the O */}
                <path d="M 68 35 C 75 35 85 40 90 30 C 88 45 80 50 72 50 C 82 50 95 60 92 75 C 80 75 70 65 65 60 L 65 35 Z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 leading-none pb-0.5">
                OnlyCashbacks
              </h1>
              <p className="text-[10px] md:text-xs font-bold tracking-widest text-[#0095f6] uppercase">Make Your Credit Cards Pay</p>
            </div>
          </div>
          {isAuthLoading ? (
            <div className="w-9 h-9 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              {(!openRouterApiKey) && (
                <div className="relative group flex items-center">
                  <button onClick={() => { setTempApiKey(openRouterApiKey); setIsApiModalOpen(true); }} className="flex items-center justify-center bg-amber-100 text-amber-700 p-2 rounded-full hover:bg-amber-200 transition-colors shadow-sm">
                    <AlertCircle className="w-5 h-5" />
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-52 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    API not set. Live verification is unavailable. Using local database. Click to set.
                  </div>
                </div>
              )}
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-gray-900">{user.displayName}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-green-600">Synced</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-gray-100 hover:ring-blue-100 transition-all flex items-center justify-center bg-gray-50 text-gray-500 group relative"
                title="Logout"
              >
                {user.photoURL ? (
                  <>
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover group-hover:opacity-10 transition-opacity" />
                    <LogOut className="w-5 h-5 absolute inset-0 m-auto opacity-0 group-hover:opacity-100 text-gray-900 transition-opacity" />
                  </>
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 border border-gray-200 rounded-full font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column - Input */}
          <div className="md:col-span-5 lg:col-span-4 lg:landscape:col-span-5 xl:col-span-5 space-y-8 md:sticky md:top-24 relative z-50">
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Where are you spending?</h2>
                <p className="text-gray-500 text-sm">Enter merchant to get the best card choice.</p>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative group">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Swiggy, Amazon, Uber..."
                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 ring-blue-500 transition-all outline-none text-lg font-medium"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>

                <div className="flex gap-2 relative z-[100]">
                  {isIntl && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center pr-3 border-r border-gray-200 border-dashed z-50">
                      <CustomSelect
                        value={baseCurrency}
                        onChange={setBaseCurrency}
                        options={['USD', 'EUR', 'GBP', 'AED', 'SGD', 'THB', 'AUD', 'CAD', 'OMR'].map(c => ({ label: c, value: c }))}
                        className="bg-transparent text-gray-500 font-bold z-10 w-[84px]"
                        dropdownClassName="w-28 top-full left-0 mt-4"
                      />
                    </div>
                  )}
                  {!isIntl && <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={isIntl ? foreignAmount : amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      isIntl ? setForeignAmount(val) : setAmount(val);
                    }}
                    className={cn("w-full bg-white border border-gray-200 rounded-2xl py-4 pr-24 shadow-sm focus:ring-2 ring-blue-500 transition-all outline-none font-bold text-lg", isIntl ? "pl-[120px]" : "pl-10")}
                  />
                  <button
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#0095f6] text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 shadow"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check'}
                  </button>
                </div>

                <div className="flex flex-nowrap md:portrait:flex-wrap items-center justify-between xl:justify-start gap-2 md:gap-3 px-3 md:px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm w-full overflow-x-auto scrollbar-hide">
                  <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsOnline(!isOnline)}
                      className={cn("flex items-center gap-1.5 md:gap-1 px-3 md:px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0", isOnline ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100")}
                    >
                      <Globe className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">Online</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsIntl(!isIntl)}
                      className={cn("flex items-center gap-1.5 md:gap-1 px-3 md:px-3 py-2 -ml-1 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0", isIntl ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100")}
                    >
                      <Plane className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">International</span>
                    </button>
                  </div>

                  {!isOnline && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setIsScanToPay(!isScanToPay)}
                      className={cn("flex items-center justify-center lg:ml-auto gap-2 px-3 md:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0 md:portrait:w-full lg:w-auto", isScanToPay ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100")}
                    >
                      <QrCode className="w-4 h-4 shrink-0" />
                      <span className="hidden max-md:landscape:inline md:portrait:inline xl:inline whitespace-nowrap">Scan & Pay</span>
                    </motion.button>
                  )}
                </div>
              </form>
            </section>

            {/* Vouchers (Desktop) */}
            <section className="space-y-4 hidden md:block">
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">Voucher Portals</h2>
                <p className="text-gray-500 text-xs">Select your portal to check card pairing.</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4 min-h-[180px]">
                <div className="relative bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 hover:bg-gray-100 transition-colors">
                  <CustomSelect
                    value={selectedVoucherPortal}
                    onChange={setSelectedVoucherPortal}
                    options={Object.keys(VOUCHER_PORTALS).map(portal => ({ label: portal === 'tata neu' ? 'Tata Neu' : portal.charAt(0).toUpperCase() + portal.slice(1), value: portal }))}
                    placeholder="Select a portal..."
                    className="w-full px-4 py-3 font-medium text-gray-800"
                    dropdownClassName="w-full left-0 right-0 top-full"
                  />
                </div>
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-between mt-auto gap-3 flex-wrap">
                  <span className="text-sm font-semibold text-purple-900 shrink-0">Best Card:</span>
                  {selectedVoucherPortal ? (
                    <span className="text-sm font-bold text-purple-700 bg-white px-3 py-1 rounded-lg shadow-sm text-right">
                      {VOUCHER_PORTALS[selectedVoucherPortal]}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-purple-700/60 italic">
                      Pending selection
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Deprecated Quick Categories shortcut area */}
          </div>

          {/* Right Column - Results */}
          <div className="md:col-span-7 lg:col-span-8 lg:landscape:col-span-7 xl:col-span-7 space-y-8 min-h-0">
            <AnimatePresence mode="wait">
              {recommendation ? (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between pl-4 border-l-4 border-blue-600">
                    <h3 className="font-bold text-xl text-gray-900">
                      Recommendation
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 landscape:grid-cols-2 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <CardItem
                        layoutId={`card-rec-${recommendation.bestCard.id}`}
                        card={recommendation.bestCard}
                        isRecommendation
                        benefitText={recommendation.expectedBenefit}
                        onClick={() => setSelectedCardForDetails({ card: recommendation.bestCard, source: 'rec' })}
                        isExhausted={exhaustedCards[recommendation.bestCard.id]}
                      />
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-5 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex bg-blue-50 rounded-xl p-4 items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs uppercase font-bold text-blue-500 mb-1">Net Value</span>
                            <span className="text-2xl font-black text-blue-900">
                              {recommendation.netValue >= 0 ? '+' : ''}₹{recommendation.netValue.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-right font-medium text-gray-500 space-y-1">
                            <div>CB: <span className="font-bold text-green-600">₹{recommendation.cashbackEarned.toFixed(2)}</span></div>
                            {recommendation.feesPaid > 0 && <div className="text-red-500">Fees: ₹{recommendation.feesPaid.toFixed(2)}</div>}
                          </div>
                        </div>

                        <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-line">{recommendation.reason}</p>
                      </div>

                      {recommendation.voucherOption && (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl space-y-2">
                          <h4 className="text-xs font-bold uppercase text-purple-600 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Smart Voucher Hack
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
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mt-6">
                      <h4 className="text-sm uppercase font-bold text-gray-400 mb-4 tracking-wider">Top Alternatives</h4>
                      <div className="grid grid-cols-1 landscape:grid-cols-2 md:grid-cols-3 gap-4">
                        {recommendation.alternatives.map((alt) => (
                          <div key={alt.card.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="font-semibold text-gray-800 mb-1 truncate">{alt.card.name}</div>
                            <div className="text-xs text-gray-500 mb-2 truncate" title={alt.benefit}>{alt.benefit}</div>
                            <div className="text-sm text-blue-600 font-bold bg-blue-100/50 inline-block px-2 py-1 rounded">Net: ₹{alt.netValue.toFixed(0)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.section>
              ) : (
                <div className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl min-h-[300px]">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-gray-500 font-medium">Enter an item, merchant or merchant type, and amount to get recommendations.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>

            <div className="w-full flex flex-col gap-8 md:gap-6">
              {/* Vouchers (Mobile) */}
              <section className="space-y-4 md:hidden">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tight">Voucher Portals</h2>
                  <p className="text-gray-500 text-xs">Select your portal to check card pairing.</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4 min-h-[180px]">
                  <div className="relative bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 hover:bg-gray-100 transition-colors">
                    <CustomSelect
                      value={selectedVoucherPortal}
                      onChange={setSelectedVoucherPortal}
                      options={Object.keys(VOUCHER_PORTALS).map(portal => ({ label: portal === 'tata neu' ? 'Tata Neu' : portal.charAt(0).toUpperCase() + portal.slice(1), value: portal }))}
                      placeholder="Select a portal..."
                      className="w-full px-4 py-3 font-medium text-gray-800"
                      dropdownClassName="w-full left-0 right-0 top-full"
                    />
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-between mt-auto gap-3 flex-wrap">
                    <span className="text-sm font-semibold text-purple-900 shrink-0">Best Card:</span>
                    {selectedVoucherPortal ? (
                      <span className="text-sm font-bold text-purple-700 bg-white px-3 py-1 rounded-lg shadow-sm text-right">
                        {VOUCHER_PORTALS[selectedVoucherPortal]}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-purple-700/60 italic">
                        Pending selection
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* Lounge Access Tip */}
              <section className="bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 py-6 md:py-8 text-white overflow-hidden relative shadow-lg min-h-[140px] flex flex-col sm:flex-row sm:items-center justify-between mt-6 md:mt-0 lg:mt-0 xl:mt-0 border border-gray-700">
                <div className="space-y-3 relative z-10 sm:max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-gray-300 drop-shadow" />
                    <h4 className="text-lg font-bold tracking-wide">Lounge Tracker</h4>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    You have {CARD_DATA.filter(c => c.benefits.some(b => b.type === 'lounge')).length} cards with tracking for lounge access.
                  </p>
                </div>
                <button onClick={() => setIsLoungeOpen(true)} className="relative z-10 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold px-5 py-2.5 rounded-full mt-4 sm:mt-0 backdrop-blur-sm transition-all w-fit shrink-0">View Passes</button>
                <Plane className="absolute -bottom-10 -right-8 w-48 h-48 text-white opacity-[0.03] rotate-12 pointer-events-none" />
              </section>
            </div>
          </div>
        </div>

        {/* My Cards Section - Full Width Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-200 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <History className="w-5 h-5 text-gray-500" />
              My Cards
            </h3>
            <span className="text-sm text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-full">{CARD_DATA.length} Active Cards</span>
          </div>

          {/* We turn this into a horizontal scrolling container with a fade mask on the edges if there's overflow, or just a nice grid */}
          <div className="relative">
            <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-gradient-to-r from-[#F5F5F7] to-transparent z-10 pointer-events-none sm:hidden"></div>
            <div className="absolute top-0 right-0 bottom-0 w-0.5 bg-gradient-to-l from-[#F5F5F7] to-transparent z-10 pointer-events-none sm:hidden"></div>
            <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-x-auto pt-8 pb-4 px-1 snap-x scrollbar-hide">
              {CARD_DATA.map((card) => (
                <div key={card.id} className="snap-start shrink-0 w-72 sm:w-auto">
                  <CardItem layoutId={`card-list-${card.id}`} card={card} onClick={() => setSelectedCardForDetails({ card, source: 'list' })} className="h-full shadow-sm hover:shadow-md transition-shadow cursor-pointer" isExhausted={exhaustedCards[card.id]} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Redemption Reminder Section */}
        <section className="mt-12 bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <Wallet className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-bold text-gray-900">Redemption Reminder</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed font-medium mb-3">
            Don't forget to redeem flat points and balances across your ecosystems. Small balances add up!
          </p>
          <ul className="text-xs space-y-2 text-gray-700">
            <li className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
              <span className="font-semibold">Kiwi Neon</span>
              <span className="text-gray-500">Kiwis</span>
            </li>
            <li className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
              <span className="font-semibold">Tata Neu</span>
              <span className="text-gray-500">NeuCoins</span>
            </li>
            <li className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
              <span className="font-semibold">Amazon Pay</span>
              <span className="text-gray-500">Wallet balance</span>
            </li>
            <li className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
              <span className="font-semibold">Imperia Debit</span>
              <span className="text-gray-500">Cashback points</span>
            </li>
            <li className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
              <span className="font-semibold">OneCard</span>
              <span className="text-gray-500">Reward points</span>
            </li>
          </ul>
        </section>
      </main>

      <AnimatePresence>
        {selectedCardForDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/40 backdrop-blur-md"
            onClick={() => setSelectedCardForDetails(null)}
          >
            <motion.div
              layoutId={`card-${selectedCardForDetails.source}-${selectedCardForDetails.card.id}`}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "rounded-3xl p-6 max-w-md w-full relative flex flex-col text-white max-h-[85vh] bg-gradient-to-br",
                selectedCardForDetails.card.gradient || "from-gray-700 to-gray-900"
              )}
            >
              <div className="absolute inset-0 rounded-3xl shadow-2xl shadow-black/40 pointer-events-none" />
              <button
                onClick={() => setSelectedCardForDetails(null)}
                className="absolute right-4 top-4 p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors z-20 backdrop-blur-md"
                aria-label="Close details"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="flex flex-col mb-6 relative z-10">
                <span className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">{selectedCardForDetails.card.bank}</span>
                <h2 className="text-3xl font-black text-white leading-tight pr-10">
                  {selectedCardForDetails.card.name}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-semibold opacity-90">{selectedCardForDetails.card.network}</span>
                  {selectedCardForDetails.card.tier && (
                    <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded shadow-sm backdrop-blur-md">
                      {selectedCardForDetails.card.tier}
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent relative z-10 pb-4">
                {selectedCardForDetails.card.benefits.filter(b => b.type !== 'exclusion' && b.type !== 'lounge' && !b.isHidden).map((b, i) => {
                  const usageKey = `${selectedCardForDetails.card.id}-${b.category}-${b.value}`;
                  const usedCount = offerUsage[usageKey] || 0;
                  return (
                    <div key={i} className="p-4 border border-white/10 rounded-2xl bg-black/20 backdrop-blur-sm flex flex-col gap-1">
                      <div className="font-bold text-white flex items-center justify-between gap-2 overflow-hidden">
                        <span className="truncate pr-2">{b.category}</span>
                        <span className="shrink-0 font-black bg-white text-black px-2 py-1 rounded-lg text-[13px] shadow-sm">
                          {b.value}
                        </span>
                      </div>
                      <div className="text-sm text-white/80 font-medium leading-relaxed mt-1">
                        {b.description}
                      </div>
                      {b.usageLimit && (
                        <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                          <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Monthly Usage:</span>
                          <div className="flex gap-1.5">
                            {Array.from({ length: b.usageLimit }).map((_, index) => (
                              <button
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOfferUsage(prev => {
                                    const current = prev[usageKey] || 0;
                                    let next = index + 1;
                                    if (current === index + 1) next = index;
                                    return { ...prev, [usageKey]: next };
                                  });
                                }}
                                className={cn(
                                  "w-6 h-6 rounded-md border flex items-center justify-center transition-all",
                                  usedCount > index
                                    ? "bg-green-500 border-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                    : "bg-white/10 border-white/20 hover:bg-white/20"
                                )}
                              >
                                {usedCount > index && <Check className="w-3.5 h-3.5" />}
                              </button>
                            ))}
                          </div>
                          <span className="text-xs text-white/60 ml-auto font-medium">
                            {usedCount}/{b.usageLimit} Used
                          </span>
                        </div>
                      )}
                      {b.maxSpend && (
                        <div className="text-[10px] font-black uppercase tracking-widest mt-2 text-white bg-white/20 px-2 py-1 rounded shadow-sm w-fit">
                          Max Spend: ₹{b.maxSpend.toLocaleString()}
                        </div>
                      )}
                    </div>
                  );
                })}

                {selectedCardForDetails.card.benefits.filter(b => b.type !== 'exclusion' && b.type !== 'lounge' && !b.isHidden).length === 0 && (
                  <div className="text-white/60 text-sm py-4 text-center font-medium">No quick-view benefits available.</div>
                )}
              </div>

              {/* Kiwi Neon Slider */}
              {selectedCardForDetails.card.id === 'kiwi-neon' && (
                <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold block leading-none">Milestone Rate ({kiwiNeonEarnRate}%)</span>
                    <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded shadow-sm text-white">
                      Earned: ₹{kiwiNeonEarnRate === 2 ? '500' : kiwiNeonEarnRate === 3 ? '1,500' : kiwiNeonEarnRate === 4 ? '4,000' : '7,500'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="5"
                    step="1"
                    value={kiwiNeonEarnRate}
                    onChange={(e) => setKiwiNeonEarnRate(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <div className="flex justify-between text-[10px] text-white/70 font-bold mt-1.5 px-0.5">
                    <span>25k (2%)</span>
                    <span>50k (3%)</span>
                    <span>100k (4%)</span>
                    <span>150k+ (5%)</span>
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
                  onClick={() => setExhaustedCards(prev => ({ ...prev, [selectedCardForDetails.card.id]: !prev[selectedCardForDetails.card.id] }))}
                  className={cn("w-12 h-6 rounded-full transition-colors flex items-center px-1 shadow-inner shrink-0 ml-4", exhaustedCards[selectedCardForDetails.card.id] ? "bg-red-500" : "bg-black/40")}
                >
                  <motion.div
                    layout
                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: exhaustedCards[selectedCardForDetails.card.id] ? 24 : 0 }}
                  />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoungeOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
              onClick={() => setIsLoungeOpen(false)}
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-[101] w-full md:w-[28rem] bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 pr-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-2xl">
                    <Plane className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 leading-tight">Lounge Tracker</h2>
                    <p className="text-sm font-medium text-gray-500">Your complimentary passes</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLoungeOpen(false)}
                  className="p-2 bg-gray-100/50 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 flex flex-col p-6 overflow-hidden min-h-0">
                <div className="mb-6 relative shrink-0" style={{ zIndex: 100 }}>
                  <CustomSelect
                    value={loungeTab}
                    onChange={(val: any) => setLoungeTab(val)}
                    options={[
                      { label: 'Domestic Lounges', value: 'Domestic' },
                      { label: 'International Lounges', value: 'International' }
                    ]}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl py-3 px-4 font-bold outline-none"
                    dropdownClassName="w-full top-full left-0 mt-2 z-50 shadow-xl"
                  />
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col gap-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pb-10">
                  {CARD_DATA.map(c => {
                    if (c.id === 'kiwi-neon') {
                      let passes = 0;
                      if (kiwiNeonEarnRate >= 3) passes += 1;
                      if (kiwiNeonEarnRate >= 4) passes += 1;
                      if (kiwiNeonEarnRate >= 5) passes += 1;
                      return {
                        ...c,
                        benefits: c.benefits.map(b => b.type === 'lounge' ? { ...b, value: `${passes}/year` } : b)
                      };
                    }
                    return c;
                  }).filter(c => c.benefits.some(b => b.type === 'lounge' && b.category === loungeTab))
                    .map(card => {
                      const b = card.benefits.find(x => x.type === 'lounge' && x.category === loungeTab)!;
                      const parsed = parseLoungeBenefit(b);
                      const used = loungePassesUsed[`${card.id}-${loungeTab}`] || 0;
                      const passesRemaining = Math.max(0, parsed.passesCount - used);
                      const isExhausted = parsed.passesCount > 0 && passesRemaining === 0;
                      const isVerified = loungeMilestonesVerified[`${card.id}-${loungeTab}`] ?? parsed.isFree;
                      return { card, b, parsed, isExhausted, isVerified };
                    })
                    .sort((a, b) => {
                      if (a.isExhausted && !b.isExhausted) return 1;
                      if (!a.isExhausted && b.isExhausted) return -1;
                      if (a.isVerified && !b.isVerified) return -1;
                      if (!a.isVerified && b.isVerified) return 1;
                      if (a.parsed.spend !== b.parsed.spend) return a.parsed.spend - b.parsed.spend;
                      return b.parsed.passesCount - a.parsed.passesCount;
                    })
                    .map(({ card, parsed }, i) => (
                      <LoungeTrackerItem
                        key={`${card.id}-${loungeTab}`}
                        card={card}
                        parsed={parsed}
                        category={loungeTab}
                        passesUsed={loungePassesUsed[`${card.id}-${loungeTab}`] || 0}
                        setPassesUsed={(updater: any) => setLoungePassesUsed(prev => {
                          const current = prev[`${card.id}-${loungeTab}`] || 0;
                          const next = typeof updater === 'function' ? updater(current) : updater;
                          return { ...prev, [`${card.id}-${loungeTab}`]: next };
                        })}
                        isVerified={loungeMilestonesVerified[`${card.id}-${loungeTab}`] ?? parsed.isFree}
                        setIsVerified={(val: boolean) => setLoungeMilestonesVerified(prev => ({ ...prev, [`${card.id}-${loungeTab}`]: val }))}
                      />
                    ))
                  }
                  {CARD_DATA.filter(c => c.benefits.some(b => b.type === 'lounge' && b.category === loungeTab)).length === 0 && (
                    <div className="text-sm text-gray-400 py-4 text-center">No {loungeTab.toLowerCase()} lounge cards</div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}

        {isApiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button onClick={() => setIsApiModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
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

      <footer className="text-center py-6 mt-8 text-xs text-gray-400 font-medium px-6">
        <p>Crafted by schultz911. Coded with Gemini.</p>
        <p>For non-commercial use only.</p>
      </footer>
    </div>
  );
}
