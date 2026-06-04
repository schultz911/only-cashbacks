import { useState, useEffect, useRef } from 'react';
import { safeSetItem } from '../lib/storage';

export function useSearchAndCurrency() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const [amount, setAmount] = useState<string>('');
  const [foreignAmount, setForeignAmount] = useState<string>('');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [currencyError, setCurrencyError] = useState<string | null>(null);

  const [isIntl, setIsIntl] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isScanToPay, setIsScanToPay] = useState(false);

  const [openRouterApiKey, setOpenRouterApiKey] = useState(() => {
    try {
      const stored = localStorage.getItem('oc_openRouterApiKey');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Could not load cached OpenRouter API key", e);
    }
    return '';
  });

  useEffect(() => {
    safeSetItem('oc_openRouterApiKey', openRouterApiKey);
  }, [openRouterApiKey]);

  useEffect(() => {
    let hasLoadedFresh = false;
    try {
      const cachedRates = localStorage.getItem('oc_exchangeRates');
      const cachedTimestamp = localStorage.getItem('oc_exchangeRatesTimestamp');
      const twelveHours = 12 * 60 * 60 * 1000;
      if (cachedRates) {
        setExchangeRates(JSON.parse(cachedRates));
        if (cachedTimestamp && (Date.now() - Number(cachedTimestamp) < twelveHours)) {
          hasLoadedFresh = true;
        }
      }
    } catch (e) {
      console.warn("Could not load cached exchange rates", e);
    }

    if (hasLoadedFresh) return;

    const controller = new AbortController();

    fetch('https://open.er-api.com/v6/latest/INR', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setExchangeRates(data.rates);
          safeSetItem('oc_exchangeRates', data.rates);
          safeSetItem('oc_exchangeRatesTimestamp', Date.now());
          setCurrencyError(null);
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.error("Could not fetch exchange rates:", err);
        setCurrencyError("Failed to fetch exchange rates. Using cached or default rates.");
      });

    return () => controller.abort();
  }, []);

  return {
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
  };
}
