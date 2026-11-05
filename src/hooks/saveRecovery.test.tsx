import React from 'react';
import { render, act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import App from '../App';
import { AuthSyncProvider, useAuthSyncContext } from '../contexts/AuthSyncContext';
import { WalletProvider, useWalletContext } from '../contexts/WalletContext';
import { SearchProvider, useSearchContext } from '../contexts/SearchContext';
import { getDocFromServer, deleteDoc, runTransaction } from 'firebase/firestore';

// State/persistence tests do not wait for exit animations. Real animation and
// responsive layout are verified separately in the compiled browser app.
vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof import('motion/react')>('motion/react');
  return { ...actual, AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</> };
});

const state = vi.hoisted(() => ({
  cloudDocuments: new Map<string, any>(), snapshot: null as any, authChanged: null as any, writes: [] as any[],
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
  onSnapshot: (document: any, _options: any, callback: any) => {
    state.snapshot = (value: any) => {
      if (value.exists()) state.cloudDocuments.set(document.uid, value.data());
      else state.cloudDocuments.delete(document.uid);
      callback(value);
    };
    return vi.fn();
  },
  runTransaction: vi.fn(async (_db: unknown, operation: any) => {
    let write: [any, any] | undefined;
    await operation({
      get: async (document: any) => ({
        exists: () => state.cloudDocuments.has(document.uid),
        data: () => state.cloudDocuments.get(document.uid),
      }),
      set: (document: any, data: any) => { write = [document, data]; },
    });
    if (!write) return;
    const [doc, data] = write;
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
  update: vi.fn(async (_key: string, fn: (value: any[]) => any[]) => { state.queue = fn(state.queue); }),
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
  vi.setSystemTime(new Date('2026-11-03T06:30Z'));
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key), clear: () => values.clear() };
  vi.stubGlobal('localStorage', storage);
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
  vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ rates: { USD: 0.012 } }) })));
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  state.cloudDocuments.clear();
  state.writes = []; state.queue = []; state.nextWrite = null; state.nextQueueRead = null;
});
afterEach(() => {
  cleanup(); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});


function errorWithCode(code: string) { return Object.assign(new Error(code), { code }); }
function failAfterDelay(code: string) { return new Promise<void>((_resolve, reject) => setTimeout(() => reject(errorWithCode(code)), 100)); }
describe('save recovery', () => {
  afterEach(() => { vi.mocked(runTransaction).mockReset(); });
  it('attempts a permanent failure once in 12 seconds, retaining edits despite additional changes', async () => {
    vi.mocked(runTransaction).mockImplementation(() => failAfterDelay('permission-denied'));
    mount(); await hydrate(); await act(async () => { wallet.setOfferUsage({first:1}); });
    await advance(5000); await act(async () => { wallet.setOfferUsage({first:2}); }); await advance(7000);
    expect(vi.mocked(runTransaction)).toHaveBeenCalledTimes(1);
    expect(sync.retryBlocked).toBe(true); expect(sync.isDirty).toBe(true);
    expect(wallet.offerUsage).toEqual({first:2});
  });
  it('backs off transient failures without losing edits and resumes on success', async () => {
    vi.mocked(runTransaction).mockImplementationOnce(() => failAfterDelay('unavailable')).mockImplementationOnce(() => failAfterDelay('unavailable'))
      .mockImplementation(async (_db: any, callback: any) => callback({ get: async () => snapshot(cloudWallet()), set: (_doc: any, data: any) => { state.writes.push({data:structuredClone(data)}); } }));
    mount(); await hydrate(); await act(async () => { wallet.setOfferUsage({offline:4}); });
    await advance(2500); expect(vi.mocked(runTransaction)).toHaveBeenCalledTimes(1);
    await advance(1800); expect(vi.mocked(runTransaction)).toHaveBeenCalledTimes(2);
    await advance(4500); expect(vi.mocked(runTransaction)).toHaveBeenCalledTimes(3);
    expect(state.writes.at(-1).data.offerUsage).toEqual({offline:4}); expect(sync.isDirty).toBe(false);
  });
  it('permits explicit manual retry after a permanent error', async () => {
    vi.mocked(runTransaction).mockImplementationOnce(() => failAfterDelay('permission-denied')).mockImplementation(async (_db: any, callback: any) => callback({ get: async () => snapshot(cloudWallet()), set: (_doc: any, data: any) => { state.writes.push({data:structuredClone(data)}); } }));
    mount(); await hydrate(); await act(async () => { wallet.setOfferUsage({manual:3}); }); await advance(2000);
    expect(sync.retryBlocked).toBe(true); await act(async () => { await sync.saveData(); });
    expect(vi.mocked(runTransaction)).toHaveBeenCalledTimes(2); expect(sync.isDirty).toBe(false);
    expect(state.writes[0].data.offerUsage).toEqual({manual:3});
  });
  it('does not carry a permanent failure policy to a different account', async () => {
    vi.mocked(runTransaction).mockImplementationOnce(() => failAfterDelay('permission-denied')).mockImplementation(async (_db: any, callback: any) => callback({ get: async () => snapshot(cloudWallet()), set: (doc: any, data: any) => { state.writes.push({uid:doc.uid,data:structuredClone(data)}); } }));
    mount(); await hydrate(); await act(async () => { wallet.setOfferUsage({a:1}); }); await advance(2000);
    await act(async () => { state.authChanged({uid:'second'}); }); await hydrate();
    await act(async () => { wallet.setOfferUsage({b:2}); }); await advance(2200);
    expect(state.writes.at(-1)).toMatchObject({uid:'second',data:{offerUsage:{b:2}}}); expect(sync.retryBlocked).toBe(false);
  });
  it('honors paused sync during retry and resumes after unpausing', async () => {
    vi.mocked(runTransaction).mockImplementationOnce(() => failAfterDelay('unavailable')).mockImplementation(async (_db: any, callback: any) => callback({ get: async () => snapshot(cloudWallet()), set: (_doc: any, data: any) => { state.writes.push({data:structuredClone(data)}); } }));
    mount(); await hydrate(); await act(async () => { wallet.setOfferUsage({pending:1}); }); await advance(1600);
    await act(async () => { sync.setIsSyncPaused(true); }); await advance(10000);
    expect(vi.mocked(runTransaction)).toHaveBeenCalledTimes(1);
    await act(async () => { sync.setIsSyncPaused(false); }); await advance(2200);
    expect(vi.mocked(runTransaction)).toHaveBeenCalledTimes(2); expect(sync.isDirty).toBe(false);
  });
});
