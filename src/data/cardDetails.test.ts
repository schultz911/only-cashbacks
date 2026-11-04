import { expect, it } from 'vitest';
import { CARD_DATA, CARD_DICT } from './cards';
import { benefitCodes, getCardDetailBenefits, getCardDetailGroups, getBenefitDetailChips, getCardRewardLimits } from './cardDetails';

it('shows base rewards last except cards with hidden base rewards without modifying catalogue rewards', () => {
  const before = JSON.stringify(CARD_DATA);
  for (const card of CARD_DATA.filter(card => !card.isDummy)) {
    const benefits = getCardDetailBenefits(card);
    if (['axis-myzone', 'one-card', 'niyo-dcb'].includes(card.id)) {
      expect(benefits.some(b => b.isBase)).toBe(false);
      continue;
    }
    expect(benefits.at(-1)?.category).toBe('Base reward rate');
    expect(benefits.filter(b => b.isBase)).toHaveLength(1);
  }
  expect(JSON.stringify(CARD_DATA)).toBe(before);
  expect(getCardDetailBenefits(CARD_DICT['hsbc-live-plus']).at(-1)).toMatchObject({ value: '1.5%', description: '1.5% unlimited cashback on other eligible spending.' });
});

it('puts Eternal movies first, groups shared app offers, and keeps the partner spend conditions', () => {
  const benefits = getCardDetailBenefits(CARD_DICT['sbi-eternal']);
  expect(benefits[0]).toMatchObject({ category: 'Movies', usageLimit: 1, trackingCategory: 'Movies', trackingValue: 'District' });
  expect(benefits.find(b => b.category === 'Blinkit')?.value).toBe('10%');
  const partners = benefits.find(b => b.category === 'Uber, Urban Company & Apollo')!;
  expect(partners.description).not.toContain('Blinkit');
  expect(getBenefitDetailChips(partners)).toContain('Min. spend ₹100');
  expect(getBenefitDetailChips(partners)).toContain('Eligible spend limit ₹20,000');
  const shared = getCardDetailGroups(CARD_DICT['sbi-eternal']).find(group => group.title)!;
  expect(shared.benefits.map(b => b.category)).toEqual(['Zomato, District & Bistro', 'Blinkit']);
  expect(shared.chips).toContain('Eligible spend limit ₹20,000');
  expect(benefits.find(b => b.category === 'Blinkit')!.description).toContain('5% on other categories');
});

it('preserves usage keys for limited-use rewards and extracts coupon chips', () => {
  for (const card of CARD_DATA.filter(card => !card.isDummy)) {
    for (const benefit of getCardDetailBenefits(card).filter(b => b.usageLimit)) {
      const original = card.benefits.find(b => b.category === benefit.trackingCategory && b.value === benefit.trackingValue)!;
      expect(original.usageLimit).toBe(benefit.usageLimit);
    }
  }
  expect(benefitCodes('Use IXIGOSBI for 4% off.')).toEqual(['IXIGOSBI']);
});

it('shows published or catalogue caps with their correct periods and units', () => {
  expect(getCardRewardLimits(CARD_DICT['hsbc-live-plus'])).toContainEqual({ label: 'Food, Shopping & Utility', value: '₹1,200', period: 'per month' });
  expect(getCardRewardLimits(CARD_DICT['hdfc-tata-neu-infinity'])).toContainEqual({ label: 'Groceries', value: '2,000 NeuCoins', period: 'per month' });
  expect(getCardRewardLimits(CARD_DICT['sbi-eternal'])).toContainEqual({ label: 'Preferred Partner', value: '₹1,000', period: 'per statement cycle' });
  expect(getCardRewardLimits(CARD_DICT['icici-amazon-pay'])).toEqual([]);
});


it('keeps minimum spend conditions distinct from coupon eligibility and puts extras in chips', () => {
  const ixigo = getCardDetailBenefits(CARD_DICT['sbi-eternal']).find(b => b.category === 'ixigo flights & hotels')!;
  expect(getBenefitDetailChips(ixigo)).toContain('Min. spend ₹100');
  expect(getBenefitDetailChips(ixigo)).toContain('Eligible spend limit ₹1,00,000');
  const online = getCardDetailBenefits(CARD_DICT['hdfc-swiggy']).find(b => b.category === 'Online')!;
  expect(online.description).not.toMatch(/Nykaa|Cleartrip/);
  expect(online.extraChips).toEqual(['Nykaa +5%', 'Cleartrip up to +20%']);
  expect(getCardDetailBenefits(CARD_DICT['hsbc-live-plus'])[0].description).not.toContain('₹1,200');
  expect(getCardDetailBenefits(CARD_DICT['sbi-eternal']).at(-1)?.description).toBe('1% cashback on other eligible spends.');
});
