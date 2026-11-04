export const getInitialState = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn(`Could not read ${key} from localStorage`, e);
  }
  return defaultValue;
};

export const safeSetItem = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Could not save ${key} to localStorage`, e);
  }
};

// Legacy unscoped values have no provable owner. Preserve them for recovery,
// but never automatically assign them to the next signed-in account.
const ACCOUNT_FIELDS = ['exhaustedCards', 'cardBillDates', 'paidBills', 'loungePassesUsed',
  'loungeMilestonesVerified', 'offerUsage', 'kiwiNeonEarnRate', 'walletCards', 'cashbackLogs',
  'openRouterApiKey', 'theme'];
export const scopedKey = (uid: string | null, key: string) =>
  `oc_owner:${uid === null ? 'guest' : `user:${encodeURIComponent(uid)}`}:${key}`;
export function preserveLegacyStorage() {
  try {
    if (localStorage.getItem('oc_legacy_unowned_backup') !== null) return;
    const backup: Record<string, string> = {};
    for (const field of ACCOUNT_FIELDS) {
      const key = `oc_${field}`;
      const value = localStorage.getItem(key);
      if (value !== null) backup[key] = value;
    }
    localStorage.setItem('oc_legacy_unowned_backup', JSON.stringify(backup));
  } catch (error) { console.warn('Could not preserve legacy local data', error); }
}
export function getOwnedState<T>(uid: string | null | undefined, key: string, fallback: T): T {
  return getInitialState(uid === undefined ? key : scopedKey(uid, key), fallback);
}
export function setOwnedState(uid: string | null | undefined, key: string, value: unknown) {
  if (uid === undefined) { safeSetItem(key, value); return; }
  safeSetItem(scopedKey(uid, key), value);
  // Retain the legacy view for existing integrations, but never read it as an
  // account source. The owner is recorded so it cannot be mistaken for guest data.
  if (uid !== null) {
    safeSetItem(key, value);
  }
}
export function persistOwnedSnapshot(uid: string | null, data: Record<string, unknown>, dirty: boolean) {
  for (const field of ACCOUNT_FIELDS) {
    if (data[field] !== undefined) safeSetItem(scopedKey(uid, `oc_${field}`), data[field]);
  }
  safeSetItem(scopedKey(uid, 'dirty'), dirty);
}
