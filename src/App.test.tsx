import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';
import { SearchProvider } from './contexts/SearchContext';
import { AuthSyncProvider } from './contexts/AuthSyncContext';
import { WalletProvider } from './contexts/WalletContext';

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

describe('App Smoke Test', () => {
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

  it('renders without crashing', async () => {
    let renderResult: any;
    await act(async () => {
      renderResult = render(
        <AuthSyncProvider>
          <WalletProvider>
            <SearchProvider>
              <App />
            </SearchProvider>
          </WalletProvider>
        </AuthSyncProvider>
      );
      vi.runAllTimers();
    });
    expect(renderResult.container).toBeTruthy();
  });
});
