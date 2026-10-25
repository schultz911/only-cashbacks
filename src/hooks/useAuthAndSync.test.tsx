import React from 'react';
import { render, act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import App from '../App';
import { AuthSyncProvider, useAuthSyncContext } from '../contexts/AuthSyncContext';
import { WalletProvider, useWalletContext } from '../contexts/WalletContext';
import { SearchProvider, useSearchContext } from '../contexts/SearchContext';
import { getDocFromServer, deleteDoc } from 'firebase/firestore';

const state = vi.hoisted(() => ({
  snapshot: null as any, authChanged: null as any, writes: [] as any[],
  nextWrite: null as Promise<void> | null, queue: [] as any[],
  nextQueueRead: null as Promise<any[]> | null,
}));
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], updateServiceWorker: vi.fn() }),
}));
vi.mock('../firebase', () => ({
  db: {}, auth: {}, functions: {}, googleProvider: {},
  OperationType: { WRITE: 'write' }, handleFirestoreError: vi.fn(),
}));
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: any, callback: any) => {
    state.authChanged = callback;
    callback({ uid: 'sync-test-user' });
    return vi.fn();
  },
  signInWithPopup: vi.fn(), signInWithRedirect: vi.fn(), signOut: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  doc: (_db: any, _collection: string, uid: string) => ({ uid }), deleteDoc: vi.fn(),
  getDocFromServer: vi.fn(),
  onSnapshot: (_doc: any, callback: any) => { state.snapshot = callback; return vi.fn(); },
  setDoc: vi.fn(async (doc: any, data: any) => {
    state.writes.push({ uid: doc.uid, data: structuredClone(data) });
    const pending = state.nextWrite;
    const callback = state.snapshot;
    state.nextWrite = null;
    if (pending) await pending;
    if (callback === state.snapshot) callback(snapshot(data));
  }),
}));
vi.mock('idb-keyval', () => ({
  get: vi.fn(async () => {
    const pending = state.nextQueueRead;
    state.nextQueueRead = null;
    return pending ? await pending : state.queue;
  }),
  set: vi.fn(async (_key: string, value: any[]) => { state.queue = value; }),
  entries: vi.fn(async () => []), del: vi.fn(),
}));

function snapshot(data: any) {
  return { metadata: { hasPendingWrites: false }, exists: () => true, data: () => structuredClone(data) };
}
const cloudWallet = () => ({
  walletCards: ['sbi-cashback'], exhaustedCards: {}, offerUsage: {}, cardBillDates: {},
  paidBills: {}, cashbackLogs: [], loungePassesUsed: {}, loungeMilestonesVerified: {},
  kiwiNeonEarnRate: 2, theme: 'light',
});
let wallet: ReturnType<typeof useWalletContext>;
let sync: ReturnType<typeof useAuthSyncContext>;
let search: ReturnType<typeof useSearchContext>;
function Observe() { wallet = useWalletContext(); sync = useAuthSyncContext(); search = useSearchContext(); return null; }
function mount() {
  return render(<AuthSyncProvider><WalletProvider><SearchProvider><App /><Observe /></SearchProvider></WalletProvider></AuthSyncProvider>);
}
async function advance(ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += 100) {
    await act(async () => { await vi.advanceTimersByTimeAsync(Math.min(100, ms - elapsed)); });
  }
}
async function hydrate(data = cloudWallet()) {
  await act(async () => { state.snapshot(snapshot(data)); });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

beforeEach(() => {
  vi.useFakeTimers();
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value), clear: () => values.clear() };
  vi.stubGlobal('localStorage', storage);
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
  vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ rates: { USD: 0.012 } }) })));
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  state.writes = []; state.queue = []; state.nextWrite = null; state.nextQueueRead = null;
});
afterEach(() => {
  cleanup(); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe('cloud synchronization provenance', () => {
  it('persists hydrated data locally without writing it back during 60 seconds of inactivity', async () => {
    mount(); await hydrate(); await advance(60000);
    expect(state.writes).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem('oc_walletCards')!)).toEqual(['sbi-cashback']);
    expect(sync.isDirty).toBe(false);
  });

  it('does not echo repeated snapshots and saves one genuine edit once', async () => {
    mount(); await hydrate(); await hydrate(); await advance(1500);
    await act(async () => { wallet.setOfferUsage({ offer: 1 }); });
    await advance(6000);
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0].data.offerUsage).toEqual({ offer: 1 });
    expect(sync.isDirty).toBe(false);
  });

  it('preserves an edit made before an outstanding save is acknowledged', async () => {
    mount(); await hydrate();
    const pending = deferred<void>(); state.nextWrite = pending.promise;
    await act(async () => { wallet.setOfferUsage({ offer: 1 }); });
    await advance(1100);
    expect(state.writes).toHaveLength(1);
    await act(async () => { wallet.setOfferUsage({ offer: 2 }); });
    await act(async () => { pending.resolve(); });
    expect(wallet.offerUsage).toEqual({ offer: 2 });
    expect(sync.isDirty).toBe(true);
    await advance(6000);
    expect(state.writes).toHaveLength(2);
    expect(state.writes[1].data.offerUsage).toEqual({ offer: 2 });
    expect(sync.isDirty).toBe(false);
  });

  it('preserves an edit made while the offline queue is being read', async () => {
    mount(); await hydrate();
    const pending = deferred<any[]>(); state.nextQueueRead = pending.promise;
    await act(async () => { state.snapshot(snapshot(cloudWallet())); });
    await act(async () => { wallet.setOfferUsage({ local: 3 }); });
    await act(async () => { pending.resolve([]); });
    expect(wallet.offerUsage).toEqual({ local: 3 });
    await advance(3000);
    expect(state.writes[0].data.offerUsage).toEqual({ local: 3 });
  });

  it('keeps edits pending while paused and saves them when resumed', async () => {
    mount(); await hydrate();
    await act(async () => { sync.setIsSyncPaused(true); wallet.setPaidBills({ 'sbi-cashback': 'test-cycle' }); });
    await advance(3000);
    expect(state.writes).toHaveLength(0);
    expect(sync.isDirty).toBe(true);
    await act(async () => { sync.setIsSyncPaused(false); });
    await advance(3000);
    expect(state.writes).toHaveLength(1);
  });

  it('preserves offline edits and uploads on reconnect without a write loop', async () => {
    mount(); await hydrate();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await act(async () => { window.dispatchEvent(new Event('offline')); wallet.setOfferUsage({ offline: 1 }); });
    await advance(3000);
    expect(state.writes).toHaveLength(0);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await advance(6000);
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0].data.offerUsage).toEqual({ offline: 1 });
  });

  it('uploads merged offline logs once rather than dropping their pending status', async () => {
    const log = { date: 123, amount: 10, cardId: 'sbi-cashback', cardName: 'SBI', merchantName: 'Amazon', category: 'Shopping' };
    state.queue = [log];
    mount(); await hydrate(); await advance(6000);
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0].data.cashbackLogs).toEqual([log]);
    expect(state.queue).toEqual([]);
  });

  it('does not apply an older hydration after the signed-in account changes', async () => {
    mount(); await hydrate();
    const pending = deferred<any[]>(); state.nextQueueRead = pending.promise;
    await act(async () => { state.snapshot(snapshot({ ...cloudWallet(), walletCards: ['old-account-card'] })); });
    await act(async () => { state.authChanged({ uid: 'another-user' }); });
    await hydrate({ ...cloudWallet(), walletCards: ['icici-amazon-pay'] });
    await act(async () => { pending.resolve([]); });
    await advance(3000);
    expect(wallet.walletCards).toEqual(['icici-amazon-pay']);
    expect(state.writes).toHaveLength(0);
  });

  it('supports manual sync and theme edits without repeated acknowledgements', async () => {
    mount(); await hydrate();
    await act(async () => { await sync.saveData(); });
    await advance(3000);
    expect(state.writes).toHaveLength(1);
    await act(async () => { sync.setTheme('dark'); });
    await advance(5000);
    expect(state.writes).toHaveLength(2);
    expect(state.writes[1].data.theme).toBe('dark');
  });

  it('saves a local BYOK setting once while cloud key hydration stays clean', async () => {
    mount(); await hydrate({ ...cloudWallet(), openRouterApiKey: 'cloud-key' } as any);
    await advance(2000);
    expect(state.writes).toHaveLength(0);
    await act(async () => { search.setOpenRouterApiKey('local-key'); });
    await advance(5000);
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0].data.openRouterApiKey).toBe('local-key');
  });

  it('does not let a previous account save clear a new account edit', async () => {
    mount(); await hydrate();
    const pending = deferred<void>(); state.nextWrite = pending.promise;
    await act(async () => { wallet.setOfferUsage({ first: 1 }); });
    await advance(1100);
    await act(async () => { state.authChanged({ uid: 'another-user' }); });
    await hydrate();
    await act(async () => { wallet.setOfferUsage({ second: 2 }); });
    await act(async () => { pending.resolve(); });
    expect(sync.isDirty).toBe(true);
    await advance(3000);
    expect(state.writes.at(-1)).toMatchObject({ uid: 'another-user', data: { offerUsage: { second: 2 } } });
  });

  it('does not restore a previous account visibility refresh after switching users', async () => {
    mount(); await hydrate();
    const pending = deferred<any>();
    vi.mocked(getDocFromServer).mockReturnValueOnce(pending.promise);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    await act(async () => { state.authChanged({ uid: 'another-user' }); });
    await hydrate({ ...cloudWallet(), walletCards: ['icici-amazon-pay'] });
    await act(async () => { pending.resolve(snapshot(cloudWallet())); });
    expect(wallet.walletCards).toEqual(['icici-amazon-pay']);
  });

  it('keeps deletion from recreating the user document through persistence', async () => {
    mount(); await hydrate(); await advance(1000);
    fireEvent.click(screen.getByLabelText('Toggle profile menu'));
    fireEvent.click(screen.getByText('Delete all data'));
    fireEvent.change(screen.getByPlaceholderText('Type DELETE...'), { target: { value: 'DELETE' } });
    await act(async () => { fireEvent.click(screen.getByText('Delete Forever')); });
    await advance(6000);
    expect(deleteDoc).toHaveBeenCalled();
    expect(state.writes).toHaveLength(0);
    expect(wallet.walletCards).toEqual([]);
    expect(sync.isDirtyRef.current).toBe(false);
  });
});


