import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCycleForCard } from './recommendation';

vi.mock('../data/cards', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/cards')>();
  return {
    ...actual,
    CARD_DICT: {
      ...actual.CARD_DICT,
      'credit-card-1': { type: 'Credit' } as any,
      'debit-card-1': { type: 'Debit' } as any,
    }
  };
});

describe('getCycleForCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 4, 15)); // Month is 0-indexed (4 = May)
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return current month/year if today >= bill day', () => {
    const dates = { 'credit-card-1': 10 };
    expect(getCycleForCard('credit-card-1', dates)).toBe('2024-5');
  });

  it('should return previous month/year if today < bill day', () => {
    const dates = { 'credit-card-1': 20 };
    expect(getCycleForCard('credit-card-1', dates)).toBe('2024-4');
  });

  it('should default to long month name and year if not in cardBillDates', () => {
    const dates = {};
    // Depending on timezone, could be localized. Default is english: "May 2024"
    expect(getCycleForCard('credit-card-1', dates)).toMatch(/May 2024/i);
  });

  it('should still use bill day 1 for Debit cards if a billDate is provided', () => {
    const dates = { 'debit-card-1': 20 };
    // Even if provided, Debit forces billDay = 1. Since today (15) >= 1 -> current month
    expect(getCycleForCard('debit-card-1', dates)).toBe('2024-5');
  });

  it('should handle January correctly when today < bill day (wrap to December previous year)', () => {
    vi.setSystemTime(new Date(2024, 0, 15)); // Jan 15, 2024
    const dates = { 'credit-card-1': 20 };
    expect(getCycleForCard('credit-card-1', dates)).toBe('2023-12');
  });
});
