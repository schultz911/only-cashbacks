import { describe, expect, it } from 'vitest';
import { statementReminder } from './billingDates';

describe('statement-only reminders', () => {
  it('does not schedule from legacy payment dates or invent missing statement dates', () => {
    expect(statementReminder('card', { card: 1, 'card:reminderDays': 7 }, {})).toBeNull();
    for (const invalid of [0, 32, 1.5, NaN]) expect(statementReminder('card', { card: 1, 'card:statement': invalid }, {})).toBeNull();
  });
  it.each([1, 3, 15, 28, 30, 31])('uses statement day %i and ignores the payment day and lead time', day => {
    const dates = { card: 1, 'card:statement': day, 'card:reminderDays': 31 };
    const result = statementReminder('card', dates, {}, new Date('2026-11-01T06:30Z'))!;
    expect(result.dueDate.getUTCDate()).toBe(Math.min(day, 30));
    expect(result.reminderDate).toEqual(result.dueDate);
    expect(result.leadDays).toBe(0);
    expect(result.ready).toBe(day === 1);
    expect(dates).toEqual({ card: 1, 'card:statement': day, 'card:reminderDays': 31 });
  });
  it('clamps February and restores the configured day in March', () => {
    const dates = { 'card:statement': 31 };
    expect(statementReminder('card', dates, {}, new Date('2025-02-28T06:30Z'))!.dueDate.getUTCDate()).toBe(28);
    expect(statementReminder('card', dates, {}, new Date('2025-03-01T06:30Z'))!.dueDate.getUTCDate()).toBe(31);
  });
  it('acknowledges the statement month and advances across the year boundary', () => {
    const result = statementReminder('card', { 'card:statement': 3 }, { card: '2026-12' }, new Date('2026-12-30T06:30Z'))!;
    expect(result.cycle).toBe('2027-1');
    expect(result.ready).toBe(false);
  });
});
