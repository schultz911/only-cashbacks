import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getQuarterCycle } from './recommendation';

describe('getQuarterCycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns Q1 for January (start of quarter)', () => {
    vi.setSystemTime(new Date(2024, 0, 1)); // Jan 1, 2024
    expect(getQuarterCycle()).toBe('Q1-2024');
  });

  it('returns Q1 for February', () => {
    vi.setSystemTime(new Date(2024, 1, 15)); // Feb 15, 2024
    expect(getQuarterCycle()).toBe('Q1-2024');
  });

  it('returns Q1 for March (end of quarter)', () => {
    vi.setSystemTime(new Date(2024, 2, 31)); // Mar 31, 2024
    expect(getQuarterCycle()).toBe('Q1-2024');
  });

  it('returns Q2 for April (start of quarter)', () => {
    vi.setSystemTime(new Date(2024, 3, 1)); // Apr 1, 2024
    expect(getQuarterCycle()).toBe('Q2-2024');
  });

  it('returns Q2 for June (end of quarter)', () => {
    vi.setSystemTime(new Date(2024, 5, 30)); // Jun 30, 2024
    expect(getQuarterCycle()).toBe('Q2-2024');
  });

  it('returns Q3 for July (start of quarter)', () => {
    vi.setSystemTime(new Date(2024, 6, 1)); // Jul 1, 2024
    expect(getQuarterCycle()).toBe('Q3-2024');
  });

  it('returns Q3 for September (end of quarter)', () => {
    vi.setSystemTime(new Date(2024, 8, 30)); // Sep 30, 2024
    expect(getQuarterCycle()).toBe('Q3-2024');
  });

  it('returns Q4 for October (start of quarter)', () => {
    vi.setSystemTime(new Date(2024, 9, 1)); // Oct 1, 2024
    expect(getQuarterCycle()).toBe('Q4-2024');
  });

  it('returns Q4 for December (end of quarter)', () => {
    vi.setSystemTime(new Date(2024, 11, 31)); // Dec 31, 2024
    expect(getQuarterCycle()).toBe('Q4-2024');
  });

  it('works correctly for a leap year date (Feb 29)', () => {
    vi.setSystemTime(new Date(2024, 1, 29)); // Feb 29, 2024
    expect(getQuarterCycle()).toBe('Q1-2024');
  });

  it('works correctly for different years', () => {
    vi.setSystemTime(new Date(2023, 7, 15)); // Aug 15, 2023
    expect(getQuarterCycle()).toBe('Q3-2023');

    vi.setSystemTime(new Date(2025, 11, 25)); // Dec 25, 2025
    expect(getQuarterCycle()).toBe('Q4-2025');
  });
});
