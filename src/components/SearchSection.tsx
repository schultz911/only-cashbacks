import React from 'react';
import { Search, X, Loader2, Globe, Plane, QrCode, Store, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { CustomSelect } from './CustomSelect';
import { MerchantInfo } from '../types';

interface SearchSectionProps {
  query: string;
  setQuery: (query: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  foreignAmount: string;
  setForeignAmount: (amount: string) => void;
  baseCurrency: string;
  setBaseCurrency: (currency: string) => void;
  isIntl: boolean;
  setIsIntl: (isIntl: boolean) => void;
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
  isScanToPay: boolean;
  setIsScanToPay: (isScanToPay: boolean) => void;
  handleSearch: (e?: React.FormEvent, directQuery?: string, prefilledAmount?: string) => void;
  loading: boolean;
  suggestions: string[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  focusedSuggestionIndex: number;
  setFocusedSuggestionIndex: (index: number | ((prev: number) => number)) => void;
  history: MerchantInfo[];
  suggestionRef: React.RefObject<HTMLDivElement>;
  formatAmountStr: (val: string) => string;
}

export const SearchSection: React.FC<SearchSectionProps> = React.memo(({
  query,
  setQuery,
  amount,
  setAmount,
  foreignAmount,
  setForeignAmount,
  baseCurrency,
  setBaseCurrency,
  isIntl,
  setIsIntl,
  isOnline,
  setIsOnline,
  isScanToPay,
  setIsScanToPay,
  handleSearch,
  loading,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  focusedSuggestionIndex,
  setFocusedSuggestionIndex,
  history,
  suggestionRef,
  formatAmountStr
}) => {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight dark:text-white">Where are you spending?</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Enter a merchant, category, or item.</p>
      </div>

      <form onSubmit={(e) => handleSearch(e)} className="space-y-4 relative z-[120]">
        <div className="relative group z-[110]" ref={suggestionRef}>
          <input
            type="text"
            aria-label="Search merchant, category, or item"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (!showSuggestions || suggestions.length === 0) return;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
              } else if (e.key === 'Enter') {
                if (focusedSuggestionIndex >= 0) {
                  e.preventDefault();
                  setQuery(suggestions[focusedSuggestionIndex]);
                  setShowSuggestions(false);
                  setFocusedSuggestionIndex(-1);
                }
              }
            }}
            placeholder="e.g. Swiggy, Groceries, iPhone..."
            className="w-full bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-200 rounded-2xl py-4 pl-12 pr-12 shadow-sm focus:ring-2 ring-blue-500 transition-all outline-none text-lg font-medium"
            autoComplete="off"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          {query && (
            <button 
              type="button" 
              aria-label="Clear search"
              title="Clear search"
              onClick={() => { setQuery(''); setShowSuggestions(false); }} 
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 bg-gray-100 dark:bg-gray-700 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50"
              >
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(s);
                      setShowSuggestions(false);
                    }}
                    className={cn(
                      "w-full px-5 py-3 text-left flex items-center gap-3 transition-colors text-gray-700 dark:text-gray-200 font-medium border-b border-gray-50 dark:border-gray-700/50 last:border-0", 
                      focusedSuggestionIndex === idx ? "bg-gray-100 dark:bg-white/10" : "hover:bg-gray-50 dark:hover:bg-white/10"
                    )}
                  >
                    <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2 relative z-[100]">
          {isIntl && (
            <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center pr-3 border-r border-gray-200 dark:border-gray-700 border-dashed z-50">
              <CustomSelect
                value={baseCurrency}
                onChange={setBaseCurrency}
                options={['USD', 'EUR', 'GBP', 'AED', 'SGD', 'THB', 'AUD', 'CAD', 'OMR'].map(c => ({ label: c, value: c }))}
                className="bg-transparent text-gray-500 dark:text-gray-400 font-bold z-10 w-[84px]"
                dropdownClassName="w-28 top-full left-0 mt-4"
              />
            </div>
          )}
          {!isIntl && <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold">₹</span>}
          <input
            type="text"
            aria-label="Amount"
            inputMode="decimal"
            value={formatAmountStr(isIntl ? foreignAmount : amount)}
            onChange={(e) => {
              const val = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
              isIntl ? setForeignAmount(val) : setAmount(val);
            }}
            className={cn(
              "w-full bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-200 rounded-2xl py-4 pr-24 shadow-sm focus:ring-2 ring-blue-500 transition-all outline-none font-bold text-lg", 
              isIntl ? "pl-[120px]" : "pl-10"
            )}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#0095f6] text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 shadow"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check'}
          </motion.button>
        </div>

        <div className="flex flex-nowrap md:portrait:flex-wrap items-center justify-between xl:justify-start gap-2 md:gap-3 px-3 md:px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm w-full overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => { setIsOnline(!isOnline); setIsScanToPay(false); }}
              className={cn(
                "flex items-center gap-1.5 md:gap-1 px-3 md:px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0",
                isOnline
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/30 dark:hover:border-white/60 dark:hover:text-white hover:scale-[1.03] active:scale-95 transition-all duration-200"
              )}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Online</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsIntl(!isIntl);
                if (!isIntl) { setIsScanToPay(false); }
              }}
              className={cn(
                "flex items-center gap-1.5 md:gap-1 px-3 md:px-3 py-2 -ml-1 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0",
                isIntl
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/30 dark:hover:border-white/60 dark:hover:text-white hover:scale-[1.03] active:scale-95 transition-all duration-200"
              )}
            >
              <Plane className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">International</span>
            </button>
          </div>

          {!isOnline && !isIntl && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => { setIsScanToPay(!isScanToPay); setIsOnline(false); }}
              className={cn(
                "flex items-center justify-center lg:ml-auto gap-2 px-3 md:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0 md:portrait:w-full lg:w-auto",
                isScanToPay
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/30 dark:hover:border-white/60 dark:hover:text-white hover:scale-[1.03] active:scale-95 transition-all duration-200"
              )}
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span className="hidden max-md:landscape:inline md:portrait:inline xl:inline whitespace-nowrap">Scan & Pay</span>
            </motion.button>
          )}
          {isOnline && !isIntl && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => { setIsOnline(false); setIsScanToPay(false); }}
              className={cn(
                "flex items-center justify-center lg:ml-auto gap-2 px-3 md:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0 md:portrait:w-full lg:w-auto",
                !isOnline && !isScanToPay && !isIntl
                  ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900"
                  : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/30 dark:hover:border-white/60 dark:hover:text-white hover:scale-[1.03] active:scale-95 transition-all duration-200"
              )}
            >
              <Store className="w-4 h-4 shrink-0" />
              <span className="hidden max-md:landscape:inline md:portrait:inline xl:inline whitespace-nowrap">In-Store</span>
            </motion.button>
          )}
        </div>
      </form>

      {/* Recent History Shortcuts */}
      {history.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800 render-optimized">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 4).map((item, idx) => (
              <button
                key={`${item.name}-${idx}`}
                onClick={() => {
                  setIsOnline(true);
                  setIsIntl(false);
                  handleSearch(undefined, item.name, amount);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700/50 rounded-xl text-sm font-medium hover:border-blue-300 dark:hover:border-white/60 hover:bg-gray-100 dark:hover:bg-white/30 hover:text-blue-600 dark:hover:text-white transition-all text-gray-600 dark:text-gray-300 text-left hover:scale-[1.03] active:scale-95"
              >
                <History className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
});
