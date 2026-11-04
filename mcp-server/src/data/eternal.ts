import type { Card } from '../types.js';
import type { RewardProgram } from '../lib/rewardRules.js';

// Reviewed 2026-11-03. Source distinctions and remaining uncertainties:
// docs/eternal-sbi-integration.md. Product data only; no account defaults.
const rewardProgram: RewardProgram = {
  notes: 'Estimates depend on eligible items and approved merchant IDs. Enter your statement day for partner cashback. ixigo requires IXIGOSBI; movie BOGO is a separate checkout offer. Cashback posts within two working days of statement generation.',
  caps: [
    { id: 'eternal-apps', label: 'Eternal app instant discounts', limit: 2000, period: 'calendar' },
    { id: 'preferred', label: 'Preferred partner statement cashback', limit: 1000, period: 'statement' },
    { id: 'base', label: 'Other eligible spending cashback', limit: 500, period: 'calendar' },
  ],
  excludedKeywords: ['fuel', 'petrol', 'diesel', 'wallet', 'prepaid', 'gift card', 'gift cards', 'voucher', 'vouchers', 'cash advance', 'cash advances', 'cash withdrawal', 'cash withdrawals', 'ATM',
    'rent', 'government', 'tax', 'taxes', 'utility', 'utilities', 'electricity', 'telecom', 'recharge', 'education', 'school fees', 'college fees', 'insurance',
    'jewellery', 'jewelry', 'gold coin', 'gaming', 'gambling', 'EMI', 'Flexipay', 'card dues', 'card fees', 'credit card bill', 'loan',
    'baby food', 'infant formula', 'feeding essentials', 'tobacco', 'cigarette', 'cigarettes', 'paan corner', 'personal', 'p2p', 'upi transfer', 'transfer to'],
  rules: [
    { id: 'blinkit-beauty-electronics', label: '10% Blinkit instant discount', mode: 'online', merchants: ['blinkit'], categories: ['beauty', 'electronics', 'cosmetics', 'makeup'], components: [{ kind: 'discount', rate: 10, capGroup: 'eternal-apps' }] },
    { id: 'blinkit', label: '5% Blinkit instant discount', mode: 'online', merchants: ['blinkit'], components: [{ kind: 'discount', rate: 5, capGroup: 'eternal-apps' }] },
    { id: 'eternal', label: '10% Eternal app instant discount', mode: 'online', merchants: ['zomato', 'district', 'bistro'], components: [{ kind: 'discount', rate: 10, capGroup: 'eternal-apps' }] },
    { id: 'preferred', label: '5% partner statement cashback (eligible MID required)', mode: 'card', merchants: ['uber', 'urban company', 'urbancompany', 'apollo', 'apollo 24 7'], minSpend: 100, components: [{ kind: 'cashback', rate: 5, capGroup: 'preferred' }] },
    { id: 'ixigo-flight-hotel', label: '4% ixigo instant discount + 1% statement cashback on charged amount (estimate)', mode: 'online', merchants: ['ixigo'], categories: ['flight', 'flights', 'hotel', 'hotels'], coupon: 'IXIGOSBI', components: [{ kind: 'discount', rate: 4 }, { kind: 'cashback', rate: 1, capGroup: 'preferred', onNetAmount: true, minSpend: 100 }] },
    { id: 'base', label: '1% statement cashback on other eligible spending', components: [{ kind: 'cashback', rate: 1, capGroup: 'base' }] },
  ],
};

export const ETERNAL_CARDS: Card[] = [{
  id: 'sbi-eternal', name: 'Eternal', officialName: 'Eternal SBI Credit Card', bank: 'SBI', network: 'Mastercard',
  gradient: 'from-[#292929] to-[#050505]', type: 'Credit', forexMarkup: 3.5, baseRewardRate: 1,
  image: '/cards/eternal-sbi.png', sourceUrl: 'https://www.sbicard.com/en/personal/credit-cards/eternal-sbi-card.html',
  annualFee: '₹499 + GST; renewal reversed at ₹2 lakh annual spends', offerReset: 'calendar', rewardProgram,
  benefits: [
    { type: 'offer', category: 'Zomato, District & Bistro', value: '10%', percentValue: 10, description: 'Instant discount on eligible app transactions. Shared ₹2,000 calendar-month cap with Blinkit. Exclusions also apply within these apps.' },
    { type: 'offer', category: 'Blinkit', value: '5–10%', description: '10% instant discount on beauty/electronics; 5% on other eligible categories. Uses the same ₹2,000 monthly discount pool.' },
    { type: 'cashback', category: 'Uber, Urban Company & Apollo', value: '5%', percentValue: 5, minSpend: 100, description: 'Statement cashback on transactions of ₹100 or more at approved merchant IDs; shared ₹1,000 statement-cycle cap. Enter the statement day separately.' },
    { type: 'offer', category: 'ixigo flights & hotels', value: '4% + 1%', description: 'Use IXIGOSBI for 4% instant discount, plus 1% statement cashback. Estimates use the charged amount; cashback requires an eligible charge of ₹100 or more and shares the preferred-partner ₹1,000 statement cap. Confirm coupon conditions at checkout.' },
    { type: 'cashback', category: 'Other eligible spending', value: '1%', percentValue: 1, description: 'Statement cashback up to ₹500 per month. Auto-credited within two working days after statement generation. No ordinary cashback expiry; returns reverse cashback.' },
    { type: 'offer', category: 'Movies', value: 'District', usageLimit: 1, description: 'Buy two tickets in one District transaction: second ticket free up to ₹200, once per month. Confirm ticket prices and voucher eligibility at checkout; stacking with 10% is not assumed.' },
    { type: 'offer', category: 'Welcome', value: '6 months Gold', description: 'Complimentary Zomato Gold membership for six months on card activation.' },
    { type: 'offer', category: 'Fuel surcharge waiver', value: '1%', description: 'Surcharge waiver for fuel transactions of ₹500–₹4,000; maximum ₹200 per statement cycle. No cashback on fuel. Not included in ordinary cashback estimates.' },
    { type: 'offer', category: 'Renewal fee reversal', value: '₹2 lakh/year', description: '₹499 + GST joining and renewal fees. Renewal fee reversed at ₹2 lakh annual spending. Add-on card fee nil.' },
    ...['Fuel', 'Wallet / prepaid loads', 'Gift cards / vouchers', 'Cash advances', 'Rent', 'Government / utilities', 'Education', 'Insurance', 'Jewellery', 'Gaming', 'EMI / Flexipay', 'Card dues / fees', 'Baby food / feeding essentials', 'Tobacco / Paan Corner'].map(category => ({ type: 'exclusion' as const, category, value: '0%', description: category })),
  ],
}];
