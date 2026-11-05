import { afterEach, expect, it, vi } from 'vitest';
import { httpsCallable } from 'firebase/functions';
import { categorizeMerchant } from './gemini';
import { getRecommendations } from '../lib/recommendation';

vi.mock('../firebase', () => ({ functions: {} }));
vi.mock('firebase/functions', () => ({ httpsCallable: vi.fn() }));
vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn(), entries: vi.fn(async () => []), del: vi.fn() }));
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

it.each(['District', 'Bistro', 'Zomato'])('recognizes %s locally and connects its card benefit without a BYOK call', async name => {
  vi.useFakeTimers();
  const merchant = await categorizeMerchant(name);
  expect(merchant.platform).toBe(name);
  expect(httpsCallable).not.toHaveBeenCalled();
  const result = getRecommendations(merchant, 1000, true, false, false, {}, {}, 2, ['sbi-eternal']);
  expect(result!.cashbackEarned).toBe(100);
});

it.each([['rent', 'Rent'], ['tax', 'Government'], ['ACT Fibernet', 'Utilities'], ['factory', 'Other']])('classifies %s as %s', async (name, category) => {
  vi.useFakeTimers();
  vi.mocked(httpsCallable).mockReturnValue(vi.fn(async () => ({ data: {} })) as any);
  expect((await categorizeMerchant(name)).category).toBe(category);
});
