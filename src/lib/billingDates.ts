// The browser and MCP service intentionally use the same pure date functions.
export * from '../../mcp-server/src/lib/billingDates';

import { paymentReminder, validBillDay } from '../../mcp-server/src/lib/billingDates';

// Statement reminders use only the explicitly configured statement day. Keep
// saved payment/lead-day values intact for compatibility, without scheduling from them.
export function statementReminder(cardId: string, dates: Record<string, number>, acknowledged: Record<string, string>, now = new Date()) {
  const day = validBillDay(dates[`${cardId}:statement`]);
  if (!day) return null;
  return paymentReminder(cardId, { ...dates, [cardId]: day, [`${cardId}:reminderDays`]: 0 }, acknowledged, now);
}
