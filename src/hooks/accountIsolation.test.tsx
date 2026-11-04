import React from 'react';
import { render, act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import App from '../App';
import { AuthSyncProvider, useAuthSyncContext } from '../contexts/AuthSyncContext';
import { WalletProvider, useWalletContext } from '../contexts/WalletContext';
import { SearchProvider, useSearchContext } from '../contexts/SearchContext';
import { getDocFromServer, deleteDoc } from 'firebase/firestore';

// State/persistence tests do not wait for exit animations. Real animation and
// responsive layout are verified separately in the compiled browser app.
vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof import('motion/react')>('motion/react');
  return { ...actual, AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</> };
});

const state = vi.hoisted(() => ({
  snapshot: null as any, authChanged: null as any, writes: [] as any[],
  nextWrite: null as Promise<void> | null, queue: [] as any[],
  nextQueueRead: null as Promise<any[]> | null, queues: new Map<string, any[]>(),
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
  get: vi.fn(async (key: string) => { const pending = state.nextQueueRead; state.nextQueueRead = null; return pending ? await pending : state.queues.get(key); }),
  set: vi.fn(async (key: string, value: any[]) => { state.queues.set(key, structuredClone(value)); }),
  update: vi.fn(async (key: string, fn: (value: any[] | undefined) => any[]) => { state.queues.set(key, fn(state.queues.get(key))); }),
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
    setItem: (key: string, value: string) => values.set(key, value), clear: () => values.clear() };
  vi.stubGlobal('localStorage', storage);
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
  vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ rates: { USD: 0.012 } }) })));
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  state.writes = []; state.queue = []; state.queues.clear(); state.nextWrite = null; state.nextQueueRead = null;
});
afterEach(() => {
  cleanup(); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});


const qkey = (uid: string) => `oc_owner:user:${encodeURIComponent(uid)}:offlineLogsQueue`;
const log = {date: 123, amount: 42, cardId: 'sbi-cashback', cardName: 'A', merchantName: 'private-a', category: 'Other'};
describe('account ownership isolation', () => {
  it('does not carry the old account key or logs into a new account without a document', async () => {
    mount(); await hydrate({...cloudWallet(), openRouterApiKey:'sk-or-synthetic', cashbackLogs:[log]} as any); await advance(1200);
    await act(async()=>state.authChanged({uid:'second'}));
    await act(async()=>state.snapshot({metadata:{hasPendingWrites:false},exists:()=>false}));
    expect(search.openRouterApiKey).toBe(''); expect(wallet.cashbackLogs).toEqual([]);
    await act(async()=>sync.setTheme('dark')); await advance(2500);
    expect(state.writes.at(-1)).toMatchObject({uid:'second',data:{openRouterApiKey:'',cashbackLogs:[]}});
  });
  it('keeps the old account queue out of an existing second account', async () => {
    state.queues.set(qkey('sync-test-user'),[log]);
    mount(); await hydrate(); await advance(2500);
    state.queues.set(qkey('sync-test-user'),[log]);
    await act(async()=>state.authChanged({uid:'second'}));
    await hydrate({...cloudWallet(),walletCards:['sbi-eternal']}); await advance(2500);
    expect(wallet.cashbackLogs).toEqual([]);
    expect(state.queues.get(qkey('sync-test-user'))).toEqual([log]);
    expect(state.writes.filter(w=>w.uid==='second')).toHaveLength(0);
  });
  it('retains a pending edit for its original account when switching back', async () => {
    mount(); await hydrate();
    await act(async()=>{sync.setIsSyncPaused(true); wallet.setOfferUsage({pending:8});});
    await act(async()=>state.authChanged({uid:'second'})); await hydrate();
    expect(wallet.offerUsage).toEqual({});
    await act(async()=>state.authChanged({uid:'sync-test-user'})); await hydrate();
    expect(wallet.offerUsage).toEqual({pending:8});
    expect(sync.isDirty).toBe(true);
    await act(async()=>sync.setIsSyncPaused(false)); await advance(2500);
    expect(state.writes.at(-1)).toMatchObject({uid:'sync-test-user',data:{offerUsage:{pending:8}}});
  });
  it('keeps unowned legacy values for recovery without importing them into a new account', async () => {
    localStorage.setItem('oc_openRouterApiKey',JSON.stringify('legacy-key'));
    localStorage.setItem('oc_cashbackLogs',JSON.stringify([log]));
    mount(); await hydrate(); await advance(700);
    expect(search.openRouterApiKey).toBe(''); expect(wallet.cashbackLogs).toEqual([]);
    expect(JSON.parse(localStorage.getItem('oc_legacy_unowned_backup')!)).toMatchObject({oc_openRouterApiKey:JSON.stringify('legacy-key'),oc_cashbackLogs:JSON.stringify([log])});
  });
  it('retains an edit made immediately before switching accounts', async () => {
    mount(); await hydrate();
    await act(async()=>{wallet.setOfferUsage({immediate:9});state.authChanged({uid:'second'});});
    await hydrate(); await act(async()=>state.authChanged({uid:'sync-test-user'})); await hydrate();
    expect(wallet.offerUsage).toEqual({immediate:9});
  });
  it('does not show a signed-out account in guest mode and restores the account on sign-in', async () => {
    mount(); await hydrate({...cloudWallet(),openRouterApiKey:'account-key',cashbackLogs:[log]} as any); await advance(1000);
    await act(async()=>state.authChanged(null));
    expect(search.openRouterApiKey).toBe(''); expect(wallet.cashbackLogs).toEqual([]);
    await act(async()=>state.authChanged({uid:'sync-test-user'}));
    await hydrate({...cloudWallet(),openRouterApiKey:'account-key',cashbackLogs:[log]} as any);
    expect(search.openRouterApiKey).toBe('account-key'); expect(wallet.cashbackLogs).toEqual([log]);
  });
  it('restores pending owner data after a reload and uploads it once', async () => {
    const view=mount(); await hydrate();
    await act(async()=>{sync.setIsSyncPaused(true); wallet.setOfferUsage({retained:7});});
    await advance(700); view.unmount(); mount(); await hydrate();
    expect(wallet.offerUsage).toEqual({retained:7}); expect(sync.isDirty).toBe(true);
    await act(async()=>sync.setIsSyncPaused(false)); await advance(3000);
    expect(state.writes.at(-1)).toMatchObject({uid:'sync-test-user',data:{offerUsage:{retained:7}}});
  });
  it('clears a deleted account queue and dirty marker without touching another owner', async () => {
    mount(); await hydrate(); await advance(600);
    state.queues.set(qkey('sync-test-user'),[log]); state.queues.set(qkey('second'),[log]);
    fireEvent.click(screen.getByLabelText('Toggle profile menu'));
    fireEvent.click(screen.getByText('Delete all data'));
    fireEvent.change(screen.getByPlaceholderText('Type DELETE...'),{target:{value:'DELETE'}});
    await act(async()=>{fireEvent.click(screen.getByText('Delete Forever'));}); await advance(1000);
    expect(state.queues.get(qkey('sync-test-user'))).toEqual([]);
    expect(state.queues.get(qkey('second'))).toEqual([log]);
    expect(JSON.parse(localStorage.getItem('oc_owner:user:sync-test-user:dirty')!)).toBe(false);
  });

  it('includes a durable owner queue when restoring a dirty local snapshot', async () => {
    localStorage.setItem('oc_owner:user:sync-test-user:dirty',JSON.stringify(true));
    localStorage.setItem('oc_owner:user:sync-test-user:oc_offerUsage',JSON.stringify({offline:3}));
    state.queues.set(qkey('sync-test-user'),[log]);
    mount(); await hydrate(); await advance(3500);
    expect(state.writes.at(-1)).toMatchObject({uid:'sync-test-user',data:{offerUsage:{offline:3},cashbackLogs:[log]}});
    expect(state.queues.get(qkey('sync-test-user'))).toEqual([]);
  });

  it('keeps new queued entries pending when a previous save is acknowledged', async () => {
    mount(); await hydrate();
    state.queues.set(qkey('sync-test-user'),[log]);
    const pending=deferred<void>(); state.nextWrite=pending.promise;
    await act(async()=>wallet.setOfferUsage({changed:1})); await advance(1200);
    const newLog={...log,date:456,merchantName:'later'};
    state.queues.set(qkey('sync-test-user'),[log,newLog]);
    await act(async()=>pending.resolve());
    expect(state.queues.get(qkey('sync-test-user'))).toEqual([newLog]);
    expect(sync.isDirty).toBe(true);
    await advance(3000);
    expect(state.writes.at(-1).data.cashbackLogs).toContainEqual(newLog);
    expect(state.queues.get(qkey('sync-test-user'))).toEqual([]);
  });

});
