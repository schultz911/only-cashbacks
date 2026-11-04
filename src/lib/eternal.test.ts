import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CARD_DATA, CARD_DICT } from '../data/cards';
import { CARD_DATA as SERVER_CARDS } from '../../mcp-server/src/data/cards';
import { getRecommendations } from './recommendation';
import { getRecommendations as serverRecommendations } from '../../mcp-server/src/lib/recommendation';
import { recordRewardAllocations, removeRewardLogs, rewardCapKey, rewardCapUsed } from './rewardRules';
import type { MerchantInfo } from '../types';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-03T06:30:00Z')); });
afterEach(() => vi.useRealTimers());

function recommend(name: string, category = 'Shopping', amount = 1000, usage = {}, id = 'sbi-eternal', online = true, scan = false, dates = { [`${id}:statement`]: 15 }) {
  return getRecommendations({ name, category, isOnline: online }, amount, online, false, scan, {}, usage, 2, [id], dates);
}

it('registers the exact same catalogue in browser and MCP without invented account information', () => {
  expect(CARD_DATA.map(card => card.id)).toEqual(SERVER_CARDS.map(card => card.id));
  expect(CARD_DATA.filter(card => card.rewardProgram)).toEqual(SERVER_CARDS.filter(card => card.rewardProgram));
  expect(new Set(CARD_DATA.map(card => card.id)).size).toBe(CARD_DATA.length);
  expect(CARD_DATA.filter(card => card.officialName === 'Eternal SBI Credit Card').map(card => card.network)).toEqual(['Mastercard']);
  expect(CARD_DICT['sbi-eternal']).toMatchObject({ bank: 'SBI', network: 'Mastercard', type: 'Credit', hasLounge: false });
  for (const id of ['sbi-eternal']) {
    expect(CARD_DICT[id]).not.toHaveProperty('creditLimit');
    expect(CARD_DICT[id]).not.toHaveProperty('dueDate');
  }
});

describe.each(['sbi-eternal'])('%s reward rules', id => {
  it.each([
    ['Zomato', 'Food Delivery', 100], ['District', 'Dining', 100], ['Bistro', 'Food Delivery', 100],
    ['Blinkit beauty', 'Beauty', 100], ['Blinkit electronics', 'Electronics', 100], ['Blinkit', 'Grocery', 50],
    ['Uber', 'Commute', 50], ['Urban Company', 'Services', 50], ['Apollo 24|7', 'Health', 50],
    ['Apollo Pharmacy', 'Health', 50], ['Decathlon', 'Shopping', 10],
  ])('calculates %s without leaking its rate to unrelated merchants', (name, category, expected) => {
    const result = recommend(String(name), String(category), 1000, {}, id)!;
    expect(result.bestCard.id).toBe(id);
    expect(result.cashbackEarned).toBe(expected);
  });

  it.each(['Fuel', 'Wallet', 'Prepaid card loads', 'Gift cards', 'Vouchers', 'Cash advances', 'Rent', 'Government', 'Utilities', 'Education', 'Insurance', 'Jewellery', 'Gaming', 'EMI', 'Flexipay', 'Card dues', 'Card fees', 'Baby food', 'Feeding essentials', 'Tobacco', 'Paan Corner'])('excludes %s even inside Eternal apps', category => {
    expect(recommend(`Blinkit ${category}`, category, 1000, {}, id)).toBeNull();
  });

  it('does not award cashback below the documented partner minimum', () => {
    expect(recommend('Uber', 'Commute', 99, {}, id)!.cashbackEarned).toBe(0);
    expect(recommend('Uber', 'Commute', 100, {}, id)!.cashbackEarned).toBe(5);
  });

  it('shares the instant discount pool across merchant rates and respects its remaining balance', () => {
    const key = rewardCapKey(id, CARD_DICT[id].rewardProgram!.caps[0], {})!;
    const usage = { [`${key}:opening`]: 1980 };
    expect(recommend('Zomato', 'Food Delivery', 1000, usage, id)!.cashbackEarned).toBe(20);
    expect(recommend('Blinkit', 'Grocery', 1000, usage, id)!.cashbackEarned).toBe(20);
    expect(recommend('Blinkit', 'Grocery', 100000, {}, id)!.cashbackEarned).toBe(2000);
  });

  it('caps preferred statement cashback separately from the base calendar-month pool', () => {
    const result = recommend('Uber', 'Commute', 100000, {}, id)!;
    expect(result.cashbackEarned).toBe(1000);
    expect(result.rewardAllocations![0].usageKey).toBe(`reward:${id}:preferred:2026-10`);
    expect(recommend('Decathlon', 'Shopping', 100000, {}, id)!.cashbackEarned).toBe(500);
  });

  it('does not guess a statement day from a payment due date', () => {
    const result = recommend('Uber', 'Commute', 1000, {}, id, true, false, { [id]: 3 })!;
    expect(result.cashbackEarned).toBe(0);
    expect(result.expectedBenefit).toContain('Set statement day');
  });

  it('splits ixigo coupon savings and statement credit and does not apply flights benefits to trains', () => {
    const result = recommend('ixigo flight', 'Flights', 10000, {}, id)!;
    expect(result.cashbackEarned).toBe(496); // 400 checkout reduction + 96 on the charged 9,600.
    expect(result.expectedBenefit).toContain('IXIGOSBI');
    expect(result.rewardAllocations).toEqual([{ usageKey: `reward:${id}:preferred:2026-10`, amount: 96 }]);
    expect(recommend('ixigo train', 'Railways', 10000, {}, id)!.cashbackEarned).toBe(100);
    expect(recommend('Another hotel', 'Hotel', 10000, {}, id)!.cashbackEarned).toBe(100);
    const smallBooking = recommend('ixigo flight', 'Flights', 99, {}, id)!;
    expect(smallBooking.cashbackEarned).toBe(3.96);
    expect(smallBooking.rewardAllocations).toEqual([]);
    expect(smallBooking.expectedBenefit).toContain('₹100');
  });

  it('offers BOGO conditionally without assuming ticket count, equal price or discount stacking', () => {
    const result = recommend('District movie', 'Movies', 1000, {}, id)!;
    expect(result.cashbackEarned).toBe(100);
    expect(result.availableOffers!.some(offer => offer.id === `${id}-movies`)).toBe(true);
    expect(result.availableOffers!.every(offer => offer.cardId === id)).toBe(true);
    const used = recommend('District movie', 'Movies', 1000, { [`${id}-Movies-District-2026-11`]: 1 }, id)!;
    expect(used.availableOffers!.some(offer => offer.id === `${id}-movies`)).toBe(false);
    expect(recommend('BookMyShow', 'Movies', 1000, {}, id)!.availableOffers!.some(offer => offer.id === `${id}-movies`)).toBe(false);
  });

  it('keeps all other wallets out of its calculation and avoids an unrelated Google fixed route', () => {
    const result = recommend('Google software', 'Software', 1000, {}, id)!;
    expect(result.bestCard.id).toBe(id);
    expect(result.cashbackEarned).toBe(10);
    expect(result.availableOffers!.every(offer => offer.cardId === id)).toBe(true);
  });
});

it('does not offer merchant UPI for the Mastercard card', () => {
  expect(recommend('Retail store', 'Shopping', 1000, {}, 'sbi-eternal', false, true)).toBeNull();
  expect(recommend('Zomato', 'Food Delivery', 1000, {}, 'sbi-eternal', false, true)).toBeNull();
});

it('tracks confirmed allocations, clamps later recommendations, and restores caps on undo/reset', () => {
  const first = recommend('Zomato', 'Food Delivery', 19000)!;
  const usage = recordRewardAllocations({ oldOffer: 1 }, first.rewardAllocations!, 12345);
  expect(recommend('Blinkit', 'Grocery', 10000, usage)!.cashbackEarned).toBe(100);
  expect(rewardCapUsed('reward:sbi-eternal:eternal-apps:2026-11', usage)).toBe(1900);
  const cleared = removeRewardLogs(usage, [12345]);
  expect(cleared).toEqual({ oldOffer: 1 });
  expect(recommend('Blinkit', 'Grocery', 10000, cleared)!.cashbackEarned).toBe(500);
  vi.setSystemTime(new Date('2026-12-01T06:30Z'));
  expect(recommend('Zomato', 'Food Delivery', 19000, usage)!.cashbackEarned).toBe(1900);
});

it('keeps browser and MCP results identical with saved limits, statement dates and exclusions', () => {
  for (const name of ['Zomato', 'Blinkit beauty', 'Apollo', 'ixigo hotel', 'Wallet', 'Google software']) {
    const merchant: MerchantInfo = { name, category: 'Shopping', isOnline: true };
    for (const id of ['sbi-eternal', 'icici-amazon-pay']) {
      const args: Parameters<typeof getRecommendations> = [merchant, 10000, true, false, false, {}, {}, 2, [id], { [id]: 3, [`${id}:statement`]: 15 }];
      expect(getRecommendations(...args)).toEqual(serverRecommendations(...args));
    }
  }
});
