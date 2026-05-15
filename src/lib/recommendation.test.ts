import { test, expect, describe } from 'bun:test';
import { getRecommendations } from './recommendation';
import { MerchantInfo } from '../types';

describe('getRecommendations Performance', () => {
  test('should execute quickly over many iterations', () => {
    const merchant: MerchantInfo = { name: 'bookmyshow', category: 'movie', isOnline: true };
    const iterations = 5000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      getRecommendations(merchant, 1000);
    }
    const end = performance.now();

    console.log(`Execution time for ${iterations} iterations: ${end - start} ms`);
    expect(end - start).toBeLessThan(5000);
  });
});
