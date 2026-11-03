import type { Card, MerchantInfo } from '../types.js';
import { calendarCycle, billingCycle, validBillDay } from './billingDates.js';

export interface RewardCap {
  id: string;
  label: string;
  limit: number;
  period: 'calendar' | 'statement';
}
export interface RewardRule {
  id: string;
  label: string;
  merchants?: string[];
  categories?: string[];
  mode?: 'online' | 'upi' | 'card';
  minSpend?: number;
  coupon?: string;
  components: { kind: 'discount' | 'cashback'; rate: number; capGroup?: string; onNetAmount?: boolean; minSpend?: number }[];
}
export interface RewardProgram {
  rules: RewardRule[];
  caps: RewardCap[];
  excludedKeywords: string[];
  notes: string;
}
export interface RewardAllocation { usageKey: string; amount: number }

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const contains = (value: string, term: string) => ` ${normalize(value)} `.includes(` ${normalize(term)} `);

export function rewardCapKey(cardId: string, cap: RewardCap, dates: Record<string, number>, now = new Date()): string | null {
  // Legacy billing values are deliberately not guessed to be statement dates for a new program.
  const statement = validBillDay(dates[`${cardId}:statement`]);
  if (cap.period === 'statement' && !statement) return null;
  const cycle = cap.period === 'calendar' ? calendarCycle(now) : billingCycle(statement, now);
  return `reward:${cardId}:${cap.id}:${cycle}`;
}

export function rewardCapUsed(key: string, usage: Record<string, number>): number {
  return Math.max(0, round(Object.entries(usage).reduce((total, [entry, value]) =>
    entry.startsWith(`${key}:`) && Number.isFinite(value) ? total + value : total, 0)));
}

export function calculateRewardProgram(card: Card, merchant: MerchantInfo, amount: number, isOnline: boolean,
  isScanToPay: boolean, isIntl: boolean, usage: Record<string, number>, dates: Record<string, number>, exhausted = false) {
  const program = card.rewardProgram!;
  const text = `${merchant.name} ${merchant.category} ${merchant.platform || ''}`;
  const excluded = merchant.isP2P || program.excludedKeywords.some(keyword => contains(text, keyword));
  if (excluded || (isScanToPay && card.network !== 'RuPay')) {
    return { cashbackAmount: 0, benefitText: 'Excluded from earning rewards', isExcluded: true, allocations: [] as RewardAllocation[] };
  }
  // Explicit platform wins over a name mentioning another marketplace.
  const merchantName = merchant.platform || merchant.name;
  const rule = program.rules.find(candidate => {
    if (candidate.mode === 'upi' && !isScanToPay) return false;
    if (candidate.mode === 'card' && isScanToPay) return false;
    if (isIntl && candidate.merchants) return false;
    if (candidate.mode === 'online' && (!isOnline || isScanToPay || isIntl)) return false;
    if (candidate.merchants && !candidate.merchants.some(name => contains(merchantName, name))) return false;
    if (candidate.categories && !candidate.categories.some(category => contains(text, category))) return false;
    return true;
  });
  if (!rule) return { cashbackAmount: 0, benefitText: 'No eligible reward rule', isExcluded: false, allocations: [] as RewardAllocation[] };
  if (rule.minSpend && amount < rule.minSpend) {
    return { cashbackAmount: 0, benefitText: `Minimum eligible transaction ₹${rule.minSpend}`, isExcluded: false, allocations: [] as RewardAllocation[] };
  }
  let discount = 0;
  let total = 0;
  const allocations: RewardAllocation[] = [];
  const notes: string[] = [];
  for (const component of rule.components) {
    const chargedAmount = component.onNetAmount ? amount - discount : amount;
    let earned = round(chargedAmount * component.rate / 100);
    if (component.minSpend && chargedAmount < component.minSpend) {
      earned = 0;
      notes.push(`Cashback requires an eligible charge of ₹${component.minSpend} or more`);
    }
    if (exhausted) earned = 0;
    if (component.capGroup) {
      const cap = program.caps.find(item => item.id === component.capGroup)!;
      const key = rewardCapKey(card.id, cap, dates);
      if (!key) { notes.push('Set statement day to calculate partner cashback'); earned = 0; }
      else {
        const pending = allocations.filter(item => item.usageKey === key).reduce((sum, item) => sum + item.amount, 0);
        earned = Math.min(earned, Math.max(0, cap.limit - rewardCapUsed(key, usage) - pending));
        if (earned > 0) allocations.push({ usageKey: key, amount: earned });
      }
    }
    if (component.kind === 'discount') discount += earned;
    total += earned;
  }
  const label = `${rule.label}${rule.coupon ? ` (Code: ${rule.coupon})` : ''}`;
  return { cashbackAmount: round(total), benefitText: `${label}${notes.length ? ` · ${notes.join('; ')}` : ''}${exhausted ? ' · Limit marked exhausted' : ''}`,
    isExcluded: false, allocations };
}

export function recordRewardAllocations(usage: Record<string, number>, allocations: RewardAllocation[], logDate: number) {
  const result = { ...usage };
  for (const entry of allocations) {
    const key = `${entry.usageKey}:log:${logDate}`;
    result[key] = round((result[key] || 0) + entry.amount);
  }
  return result;
}

export function removeRewardLogs(usage: Record<string, number>, dates: number[]) {
  const timestamps = new Set(dates.map(String));
  return Object.fromEntries(Object.entries(usage).filter(([key]) => {
    const marker = key.lastIndexOf(':log:');
    return !key.startsWith('reward:') || marker < 0 || !timestamps.has(key.slice(marker + 5));
  }));
}
