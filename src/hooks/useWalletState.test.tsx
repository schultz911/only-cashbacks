import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWalletState } from './useWalletState';

beforeEach(() => {
  vi.useFakeTimers();
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
});
afterEach(() => { cleanup(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe.each(['icici-amazon-pay', 'sbi-eternal'])('%s billing persistence', id => {
  it.each([1, 3, 15, 28, 30, 31])('saves and restores due day %i independently from statement and reminder settings', day => {
    const skip = { current: false };
    const dirty = vi.fn();
    const first = renderHook(() => useWalletState(skip, dirty));
    const dates = { [id]: day, [`${id}:statement`]: 20, [`${id}:reminderDays`]: 2, unrelated: 7 };
    act(() => first.result.current.setCardBillDates(dates));
    act(() => vi.advanceTimersByTime(500));
    expect(JSON.parse(localStorage.getItem('oc_cardBillDates')!)).toEqual(dates);
    first.unmount();
    const second = renderHook(() => useWalletState(skip, dirty));
    expect(second.result.current.cardBillDates).toEqual(dates);
  });
});
