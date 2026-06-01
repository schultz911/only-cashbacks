import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCycleForCard } from './recommendation';

describe('getCycleForCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns current month if today is >= bill day', () => {
    vi.setSystemTime(new Date('2024-05-15T12:00:00Z'));
    const cycle = getCycleForCard('sbi-cashback', { 'sbi-cashback': 10 });
    expect(cycle).toBe('2024-5');
  });

  it('returns previous month if today is < bill day', () => {
    vi.setSystemTime(new Date('2024-05-05T12:00:00Z'));
    const cycle = getCycleForCard('sbi-cashback', { 'sbi-cashback': 10 });
    expect(cycle).toBe('2024-4');
  });

  it('returns previous month and year if today is < bill day in January', () => {
    vi.setSystemTime(new Date('2024-01-05T12:00:00Z'));
    const cycle = getCycleForCard('sbi-cashback', { 'sbi-cashback': 10 });
    expect(cycle).toBe('2023-12');
  });

  it('returns formatted date string if card is not in cardBillDates', () => {
    vi.setSystemTime(new Date('2024-05-02T12:00:00Z'));
    // If not in cardBillDates, it returns localized month and year
    const cycle = getCycleForCard('sbi-cashback', {});
    expect(cycle).toBe(new Date('2024-05-02T12:00:00Z').toLocaleString('default', { month: 'long', year: 'numeric' }));
  });

  it('forces bill day to 1 if card type is Debit', () => {
    vi.setSystemTime(new Date('2024-05-05T12:00:00Z'));
    // kotak-811-infinity is a debit card. Even if we pass 10, it should ignore and use 1.
    // 5 >= 1, so it should be current month (5), not previous month (4).
    const cycle = getCycleForCard('kotak-811-infinity', { 'kotak-811-infinity': 10 });
    expect(cycle).toBe('2024-5');
  });
});
