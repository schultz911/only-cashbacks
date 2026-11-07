import { render, act, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';
import { SearchProvider } from './contexts/SearchContext';
import { AuthSyncProvider } from './contexts/AuthSyncContext';
import { WalletProvider } from './contexts/WalletContext';

const categorize = vi.hoisted(() => vi.fn());
vi.mock('./services/gemini', () => ({ categorizeMerchant: categorize }));

// Mock the virtual modules injected by Vite PWA plugin
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

// Mock Firebase initialization to prevent network requests during tests
vi.mock('./firebase', () => ({
  db: {},
  app: {},
  auth: {
    onAuthStateChanged: vi.fn(() => vi.fn()),
  },
}));

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: function(key: string) {
      return store[key] || null;
    },
    setItem: function(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem: function(key: string) {
      delete store[key];
    },
    clear: function() {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: function(i: number) {
      return Object.keys(store)[i] || null;
    }
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Recommendation failure recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          rates: {
            USD: 0.012,
            EUR: 0.011,
            GBP: 0.0094,
            AED: 0.044
          }
        })
      })
    ));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('replaces a previous result with a recoverable error and succeeds on retry', async () => {
    const merchant = { name: 'Swiggy', category: 'Food', isOnline: true, platform: 'Swiggy' };
    categorize.mockReset().mockResolvedValueOnce(merchant).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(merchant);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => { render(<AuthSyncProvider><WalletProvider><SearchProvider><App /></SearchProvider></WalletProvider></AuthSyncProvider>); vi.runAllTimers(); });
    fireEvent.change(screen.getByRole('combobox', { name: /search merchant/i }), { target: { value: 'Swiggy' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Amount' }), { target: { value: '1000' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Check' })); await Promise.resolve(); vi.advanceTimersByTime(1000); });
    expect(screen.getByText('Net Value')).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Check' })); await Promise.resolve(); vi.advanceTimersByTime(1000); });
    expect(screen.getByText('Unable to get a recommendation.')).toBeTruthy();
    expect(screen.queryByText('Net Value')).toBeNull();
    await act(async () => { fireEvent.change(screen.getByRole('textbox', { name: 'Amount' }), { target: { value: '1200' } }); vi.advanceTimersByTime(1000); });
    expect(screen.getByText('Unable to get a recommendation.')).toBeTruthy();
    expect(screen.queryByText('Net Value')).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Check' })); await Promise.resolve(); vi.advanceTimersByTime(1000); });
    expect(screen.getByText('Net Value')).toBeTruthy();
    expect(screen.queryByText('Unable to get a recommendation.')).toBeNull();
    consoleError.mockRestore();
  });
});
