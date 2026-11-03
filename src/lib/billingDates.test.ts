import { afterEach, describe, expect, it, vi } from 'vitest';
import { billingCycle, dateInMonth, indiaDate, paymentReminder, statementDay } from './billingDates';
import { getCycleForCard, getOfferCycleForCard } from './recommendation';
import { getCycleForCard as serverCycle, getOfferCycleForCard as serverOfferCycle } from '../../mcp-server/src/lib/recommendation';

afterEach(() => vi.useRealTimers());

const months = [
  { year: 2024, month: 2, last: 29 }, { year: 2025, month: 2, last: 28 },
  { year: 2026, month: 4, last: 30 }, { year: 2026, month: 12, last: 31 },
  { year: 2027, month: 1, last: 31 },
];
describe.each(['icici-amazon-pay', 'sbi-eternal', 'sbi-eternal-rupay'])('%s payment calendar', cardId => {
  for (const { year, month, last } of months) {
    it.each([1, 3, 15, 28, 30, 31])(`retains day %i in ${year}-${month}, clamping only the occurrence`, day => {
      const expected = Math.min(day, last);
      const dates = { [cardId]: day };
      const now = new Date(`${year}-${String(month).padStart(2, '0')}-${String(expected).padStart(2, '0')}T06:30:00Z`);
      const reminder = paymentReminder(cardId, dates, {}, now)!;
      expect(reminder.dueDate.toISOString().slice(0, 10)).toBe(`${year}-${String(month).padStart(2, '0')}-${String(expected).padStart(2, '0')}`);
      expect(reminder.reminderDate).toEqual(reminder.dueDate);
      expect(reminder.ready).toBe(true);
      expect(reminder.overdue).toBe(false);
      expect(dates[cardId]).toBe(day);
    });
  }
  it('distinguishes a reminder on the 1st from a payment due on the 3rd', () => {
    const now = new Date('2026-11-01T06:30:00Z');
    expect(paymentReminder(cardId, { [cardId]: 3 }, {}, now)).toMatchObject({ ready: false, daysUntil: 2 });
    const early = paymentReminder(cardId, { [cardId]: 3, [`${cardId}:reminderDays`]: 2 }, {}, now)!;
    expect(early.ready).toBe(true);
    expect(early.dueDate.toISOString()).toBe('2026-11-03T00:00:00.000Z');
    expect(early.reminderDate.toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });
  it('preserves a lead window across year transition after marking the current bill paid', () => {
    const value = paymentReminder(cardId, { [cardId]: 3, [`${cardId}:reminderDays`]: 5 }, { [cardId]: '2026-12' }, new Date('2026-12-30T06:30Z'))!;
    expect(value.cycle).toBe('2027-1');
    expect(value.dueDate.toISOString()).toBe('2027-01-03T00:00:00.000Z');
    expect(value.reminderDate.toISOString()).toBe('2026-12-29T00:00:00.000Z');
    expect(value.ready).toBe(true);
  });
  it('uses the configured 31st again after February', () => {
    const dates = { [cardId]: 31 };
    expect(paymentReminder(cardId, dates, {}, new Date('2025-02-28T06:30Z'))!.dueDate.getUTCDate()).toBe(28);
    expect(paymentReminder(cardId, dates, {}, new Date('2025-03-01T06:30Z'))!.dueDate.getUTCDate()).toBe(31);
  });
});

it.each([undefined, 0, -1, 32, 1.2, NaN, '3'])('does not invent a payment deadline for invalid setting %s', value => {
  expect(paymentReminder('card', { card: value } as any, {})).toBeNull();
});

it('uses India midnight rather than UTC or the host timezone', () => {
  expect(indiaDate(new Date('2026-12-31T18:29:59Z')).toISOString()).toBe('2026-12-31T00:00:00.000Z');
  expect(indiaDate(new Date('2026-12-31T18:30:00Z')).toISOString()).toBe('2027-01-01T00:00:00.000Z');
  expect(billingCycle(31, new Date('2025-02-28T00:00:00Z'))).toBe('2025-2');
});

it('keeps statement rewards separate from payment deadlines and calendar offers', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-10T06:30Z'));
  const dates = { 'icici-amazon-pay': 3, 'icici-amazon-pay:statement': 15, 'sbi-eternal': 3, 'sbi-eternal:statement': 15 };
  expect(statementDay('icici-amazon-pay', dates)).toBe(15);
  expect(paymentReminder('icici-amazon-pay', dates, {})!.dueDate.getUTCDate()).toBe(3);
  expect(getCycleForCard('icici-amazon-pay', dates)).toBe('2026-10');
  expect(getOfferCycleForCard('sbi-eternal', dates)).toBe('2026-11');
  expect(getOfferCycleForCard('axis-myzone', dates)).toBe('2026-11');
  for (const cardId of ['icici-amazon-pay', 'sbi-eternal', 'sbi-eternal-rupay', 'axis-myzone', 'kotak-811-infinity']) {
    expect(getCycleForCard(cardId, dates)).toBe(serverCycle(cardId, dates));
    expect(getOfferCycleForCard(cardId, dates)).toBe(serverOfferCycle(cardId, dates));
  }
  expect(dateInMonth(2026, 11, 31).toISOString()).toBe('2026-12-31T00:00:00.000Z');
});
