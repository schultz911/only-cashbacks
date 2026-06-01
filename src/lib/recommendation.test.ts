import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCycleForCard, getQuarterCycle, getOfferCycleForCard } from './recommendation';

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

  it('should return current month/year if today == bill day exactly', () => {
    const dates = { 'credit-card-1': 15 }; // today is 15
    expect(getCycleForCard('credit-card-1', dates)).toBe('2024-5');
  });

  it('should fall back correctly for unknown cards not in CARD_DICT', () => {
    const dates = { 'unknown-card-123': 20 }; // not in mock CARD_DICT
    expect(getCycleForCard('unknown-card-123', dates)).toBe('2024-4');
  });

  it('should handle leap year correctly (Feb 29)', () => {
    vi.setSystemTime(new Date(2024, 1, 29)); // Feb 29, 2024
    const dates = { 'credit-card-1': 30 }; // bill day is 30, so today (29) < 30
    expect(getCycleForCard('credit-card-1', dates)).toBe('2024-1');
  });

  it('should handle non-leap year correctly for end of Feb', () => {
    vi.setSystemTime(new Date(2023, 1, 28)); // Feb 28, 2023
    const dates = { 'credit-card-1': 30 }; // bill day is 30, today (28) < 30
    expect(getCycleForCard('credit-card-1', dates)).toBe('2023-1');
  });

});


describe('getQuarterCycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return Q1 for Jan, Feb, Mar', () => {
    vi.setSystemTime(new Date(2024, 0, 15)); // Jan
    expect(getQuarterCycle()).toBe('Q1-2024');
    vi.setSystemTime(new Date(2024, 2, 15)); // Mar
    expect(getQuarterCycle()).toBe('Q1-2024');
  });

  it('should return Q2 for Apr, May, Jun', () => {
    vi.setSystemTime(new Date(2024, 4, 15)); // May
    expect(getQuarterCycle()).toBe('Q2-2024');
  });

  it('should return Q3 for Jul, Aug, Sep', () => {
    vi.setSystemTime(new Date(2024, 7, 15)); // Aug
    expect(getQuarterCycle()).toBe('Q3-2024');
  });

  it('should return Q4 for Oct, Nov, Dec', () => {
    vi.setSystemTime(new Date(2024, 11, 15)); // Dec
    expect(getQuarterCycle()).toBe('Q4-2024');
  });
});

describe('getOfferCycleForCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 4, 15)); // Month is 0-indexed (4 = May)
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return current month/year if today >= bill day', () => {
    const dates = { 'credit-card-1': 10 };
    expect(getOfferCycleForCard('credit-card-1', dates)).toBe('2024-5');
  });

  it('should return previous month/year if today < bill day', () => {
    const dates = { 'credit-card-1': 20 };
    expect(getOfferCycleForCard('credit-card-1', dates)).toBe('2024-4');
  });

  it('should default to bill day 1 if not in cardBillDates (current month)', () => {
    const dates = {};
    // billDay defaults to 1. Today (15) >= 1 -> current month
    expect(getOfferCycleForCard('credit-card-1', dates)).toBe('2024-5');
  });

  it('should force bill day 1 for Debit cards', () => {
    const dates = { 'debit-card-1': 20 };
    // Debit forces billDay = 1. Today (15) >= 1 -> current month
    expect(getOfferCycleForCard('debit-card-1', dates)).toBe('2024-5');
  });

  it('should force bill day 1 for axis-myzone card', () => {
    const dates = { 'axis-myzone': 20 };
    // axis-myzone forces billDay = 1. Today (15) >= 1 -> current month
    expect(getOfferCycleForCard('axis-myzone', dates)).toBe('2024-5');
  });

  it('should handle January correctly when today < bill day (wrap to December previous year)', () => {
    vi.setSystemTime(new Date(2024, 0, 15)); // Jan 15, 2024
    const dates = { 'credit-card-1': 20 };
    expect(getOfferCycleForCard('credit-card-1', dates)).toBe('2023-12');
  });
});
