// Calendar dates in the product's billing timezone, independent of device/server TZ.
// Existing cardBillDates[id] values are retained. Optional statement/lead-day
// settings use namespaced keys in the same Record<string, number>.
export const BILLING_TIME_ZONE = 'Asia/Kolkata';
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BILLING_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});
const DAY_MS = 86400000;

export function indiaDate(now = new Date()): Date {
  const parts = formatter.formatToParts(now);
  const part = (type: string) => Number(parts.find(p => p.type === type)!.value);
  return new Date(Date.UTC(part('year'), part('month') - 1, part('day')));
}

export function validBillDay(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 31 ? value : undefined;
}

export function statementDay(cardId: string, dates: Record<string, number>): number | undefined {
  return validBillDay(dates[`${cardId}:statement`]) ?? validBillDay(dates[cardId]);
}

export function reminderLeadDays(cardId: string, dates: Record<string, number>): number {
  const value = dates[`${cardId}:reminderDays`];
  return Number.isInteger(value) && value >= 0 && value <= 31 ? value : 0;
}

export function dateInMonth(year: number, month: number, day: number): Date {
  const first = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(day, lastDay)));
}

export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
}

export function billingCycle(day = 1, now = new Date()): string {
  const today = indiaDate(now);
  const start = dateInMonth(today.getUTCFullYear(), today.getUTCMonth(), day);
  return monthKey(today >= start ? start : dateInMonth(today.getUTCFullYear(), today.getUTCMonth() - 1, day));
}

export function calendarCycle(now = new Date()): string {
  return monthKey(indiaDate(now));
}

export function formatBillDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
}

export function paymentReminder(cardId: string, dates: Record<string, number>, paidBills: Record<string, string>, now = new Date()) {
  const day = validBillDay(dates[cardId]);
  if (!day) return null; // A missing account setting is not a due date of the 1st.
  const today = indiaDate(now);
  let dueDate = dateInMonth(today.getUTCFullYear(), today.getUTCMonth(), day);
  if (paidBills[cardId] === monthKey(dueDate)) {
    dueDate = dateInMonth(today.getUTCFullYear(), today.getUTCMonth() + 1, day);
  }
  // When a lead window crosses the month boundary, show/notify the next bill.
  const leadDays = reminderLeadDays(cardId, dates);
  const reminderDate = new Date(dueDate.getTime() - leadDays * DAY_MS);
  const daysUntil = Math.round((dueDate.getTime() - today.getTime()) / DAY_MS);
  return { dueDate, reminderDate, cycle: monthKey(dueDate), daysUntil, leadDays,
    ready: today >= reminderDate, overdue: today > dueDate };
}
