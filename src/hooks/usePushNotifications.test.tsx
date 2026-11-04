import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePushNotifications } from './usePushNotifications';
import { getCycleForCard } from '../lib/recommendation';

let sent: { title: string; options: NotificationOptions }[];
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-01T06:30Z'));
  sent = [];
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  class MockNotification {
    static permission = 'granted';
    static requestPermission = vi.fn();
    constructor(title: string, options: NotificationOptions) { sent.push({ title, options }); }
  }
  vi.stubGlobal('Notification', MockNotification);
});
afterEach(() => { cleanup(); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe.each(['icici-amazon-pay', 'sbi-eternal'])('%s actual browser notifications', id => {
  it.each([1, 3, 15, 28, 30, 31])('delivers the notification for configured day %i only on its November occurrence', day => {
    const expected = Math.min(day, 30);
    vi.setSystemTime(new Date(Date.UTC(2026, 10, expected - 1, 6, 30)));
    renderHook(() => usePushNotifications(true, [id], { [`${id}:statement`]: day }, { [id]: '2026-10' }, getCycleForCard));
    act(() => vi.advanceTimersByTime(3000));
    expect(sent.filter(item => /Statement/.test(item.title))).toHaveLength(0);
    vi.setSystemTime(new Date(Date.UTC(2026, 10, expected, 6, 30)));
    act(() => window.dispatchEvent(new Event('focus')));
    const payment = sent.filter(item => /Statement/.test(item.title));
    expect(payment).toHaveLength(1);
    expect(payment[0].options.body).toContain(`statement date ${expected} Nov 2026`);
  });
  it('does not notify a statement date on the 3rd on the 1st; notifies on the statement day', () => {
    const dates = { [`${id}:statement`]: 3 };
    renderHook(() => usePushNotifications(true, [id], dates, {}, getCycleForCard));
    act(() => vi.advanceTimersByTime(3000));
    expect(sent.filter(item => /Statement/.test(item.title))).toHaveLength(0);
    vi.setSystemTime(new Date('2026-11-03T06:30Z'));
    act(() => window.dispatchEvent(new Event('focus')));
    expect(sent.filter(item => /Statement/.test(item.title))).toHaveLength(1);
    expect(sent.find(item => /Statement/.test(item.title))!.options.body).toContain('statement date 3 Nov 2026');
    act(() => vi.advanceTimersByTime(60000));
    expect(sent.filter(item => /Statement/.test(item.title))).toHaveLength(1);
  });
  it('reschedules statement edits and ignores old due-day and lead-day settings', () => {
    const { rerender } = renderHook(({ dates, paid }) => usePushNotifications(true, [id], dates, paid, getCycleForCard), {
      initialProps: { dates: { [id]: 1, [`${id}:statement`]: 3, [`${id}:reminderDays`]: 2 }, paid: {} as Record<string, string> },
    });
    act(() => vi.advanceTimersByTime(3000));
    expect(sent.filter(item => /Statement/.test(item.title))).toHaveLength(0);
    rerender({ dates: { [id]: 15, [`${id}:statement`]: 1, [`${id}:reminderDays`]: 5 }, paid: {} });
    act(() => vi.advanceTimersByTime(3000));
    expect(sent.find(item => /Statement/.test(item.title))!.options.body).toContain('statement date 1 Nov 2026');
    sent = [];
    rerender({ dates: { [id]: 1, [`${id}:statement`]: 15, [`${id}:reminderDays`]: 2 }, paid: {} });
    act(() => vi.advanceTimersByTime(3000));
    expect(sent.filter(item => /Statement/.test(item.title))).toHaveLength(0);
    rerender({ dates: { [id]: 15, [`${id}:statement`]: 1, [`${id}:reminderDays`]: 2 }, paid: { [id]: '2026-11' } });
    act(() => vi.advanceTimersByTime(3000));
    expect(sent.filter(item => /Statement/.test(item.title))).toHaveLength(0);
  });
  it('notifies at India midnight and clamps a February 31 statement date without missing month-end', () => {
    vi.setSystemTime(new Date('2025-02-27T18:29:50Z'));
    renderHook(() => usePushNotifications(true, [id], { [`${id}:statement`]: 31 }, {}, getCycleForCard));
    act(() => vi.advanceTimersByTime(3000));
    expect(sent.filter(item => /Statement/.test(item.title))).toHaveLength(0);
    vi.setSystemTime(new Date('2025-02-27T18:30:00Z'));
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(sent.find(item => /Statement/.test(item.title))!.options.body).toContain('statement date 28 Feb 2025');
  });
});

it('cleans up timers and skips unconfigured, non-credit and unknown cards', () => {
  const { unmount } = renderHook(() => usePushNotifications(true, ['icici-amazon-pay', 'niyo-dcb', 'unknown'], {}, {}, getCycleForCard));
  act(() => vi.advanceTimersByTime(3000));
  expect(sent.filter(item => /Statement/.test(item.title))).toHaveLength(0);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('uses configured cards for the all-selected wallet sentinel, including while the open app is in the background', () => {
  vi.setSystemTime(new Date('2026-11-03T06:30Z'));
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  renderHook(() => usePushNotifications(true, [], { 'icici-amazon-pay:statement': 3 }, {}, getCycleForCard));
  act(() => vi.advanceTimersByTime(3000));
  expect(sent.filter(item => /Statement/.test(item.title))).toHaveLength(1);
  expect(sent[0].options.body).toContain('statement date 3 Nov 2026');
});
