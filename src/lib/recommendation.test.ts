import { describe, it, expect } from 'vitest';
import { getRecommendations } from './recommendation';

describe('Movie offers recommendation logic', () => {
  it('displays both BMS and District offers for specific cinema merchants like PVR', () => {
    const res = getRecommendations(
      { name: 'PVR Cinemas', category: 'Movies', isOnline: true },
      500
    );
    expect(res).not.toBeNull();
    const offerIds = res!.availableOffers?.map(o => o.id) || [];
    expect(offerIds).toContain('k-bms'); // Kotak 811 BookMyShow offer
    expect(offerIds).toContain('a-district'); // Axis MyZone District offer
  });

  it('displays both BMS and District offers for Cinepolis', () => {
    const res = getRecommendations(
      { name: 'Cinepolis', category: 'Movies', isOnline: true },
      500
    );
    expect(res).not.toBeNull();
    const offerIds = res!.availableOffers?.map(o => o.id) || [];
    expect(offerIds).toContain('k-bms');
    expect(offerIds).toContain('a-district');
  });

  it('displays BMS offers but NOT District offers when looking for BookMyShow', () => {
    const res = getRecommendations(
      { name: 'BookMyShow', category: 'Movies', isOnline: true },
      500
    );
    expect(res).not.toBeNull();
    const offerIds = res!.availableOffers?.map(o => o.id) || [];
    expect(offerIds).toContain('k-bms');
    expect(offerIds).not.toContain('a-district');
  });

  it('displays District offers but NOT BMS offers when looking for District', () => {
    const res = getRecommendations(
      { name: 'District app', category: 'Movies', isOnline: true },
      500
    );
    expect(res).not.toBeNull();
    const offerIds = res!.availableOffers?.map(o => o.id) || [];
    expect(offerIds).toContain('a-district');
    expect(offerIds).not.toContain('k-bms');
  });
});

describe('Amazon Pay ICICI Card recommendation logic', () => {
  it('recommends Amazon Pay ICICI with 5% cashback on Amazon shopping', () => {
    const res = getRecommendations(
      { name: 'Amazon', category: 'E-commerce', isOnline: true, platform: 'Amazon' },
      1000
    );
    expect(res).not.toBeNull();
    const matchingCard = res!.bestCard.id === 'icici-amazon-pay'
      || res!.tiedCards?.some(t => t.card.id === 'icici-amazon-pay');
    expect(matchingCard).toBe(true);
    expect(res!.cashbackEarned).toBe(50);
  });

  it('beats capped cards on large purchases due to unlimited uncapped 5% cashback', () => {
    // SBI Cashback has 5% capped at ₹2,000/mo (up to ₹40k spend).
    // On a ₹60,000 laptop, Amazon Pay ICICI yields ₹3,000 whereas SBI Cashback only gives ₹2,000!
    const res = getRecommendations(
      { name: 'Amazon', category: 'E-commerce', isOnline: true, platform: 'Amazon' },
      60000
    );
    expect(res).not.toBeNull();
    expect(res!.bestCard.id).toBe('icici-amazon-pay');
    expect(res!.cashbackEarned).toBe(3000);
    expect(res!.expectedBenefit).toBe('5% Cashback on Amazon');
  });

  it('gives 2% cashback for utility recharges and bill payments on Amazon Pay', () => {
    const res = getRecommendations(
      { name: 'Amazon Pay', category: 'Utilities', isOnline: true, platform: 'Amazon' },
      1500
    );
    expect(res).not.toBeNull();
    const isAmazonPayBest = res!.bestCard.id === 'icici-amazon-pay';
    const isAmazonPayAlt = res!.alternatives?.some(a => a.card.id === 'icici-amazon-pay');
    expect(isAmazonPayBest || isAmazonPayAlt).toBe(true);
  });

  it('correctly excludes Fuel, Rent, and Jewellery for Amazon Pay ICICI', () => {
    const fuelRes = getRecommendations(
      { name: 'HPCL Fuel Station', category: 'Fuel', isOnline: false },
      2000,
      false,
      false,
      false,
      {},
      {},
      2,
      ['icici-amazon-pay']
    );
    expect(fuelRes).toBeNull();

    const rentRes = getRecommendations(
      { name: 'NoBroker Rent', category: 'Rent', isOnline: true },
      25000,
      true,
      false,
      false,
      {},
      {},
      2,
      ['icici-amazon-pay']
    );
    expect(rentRes).toBeNull();
  });

  it('provides 1% unlimited cashback on other general retail spends', () => {
    const res = getRecommendations(
      { name: 'Decathlon Sport Store', category: 'Shopping', isOnline: false },
      3000,
      false,
      false,
      false,
      {},
      {},
      2,
      ['icici-amazon-pay']
    );
    expect(res).not.toBeNull();
    expect(res!.bestCard.id).toBe('icici-amazon-pay');
    expect(res!.cashbackEarned).toBe(30);
    expect(res!.expectedBenefit).toBe('1% Base Rewards');
  });

  it('includes ICICI Culinary Treats dining offer when dining', () => {
    const res = getRecommendations(
      { name: 'Punjab Grill', category: 'Dining', isOnline: false },
      2000
    );
    expect(res).not.toBeNull();
    const offerIds = res!.availableOffers?.map(o => o.id) || [];
    expect(offerIds).toContain('i-culinary');
  });
});

