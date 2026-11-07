import type { Card } from '../types';

// Display-only fee summaries verified against the linked issuer/programme pages.
// Checked 5 November 2026; account-specific offers can differ.
export const CARD_DETAIL_INFO: Record<string, {
  sourceUrl: string; fee: string; feeLabel?: string; feeNote: string;
}> = {
  'hsbc-live-plus': {
    sourceUrl: 'https://www.hsbc.co.in/credit-cards/products/live-plus/',
    fee: '₹999 + taxes', feeNote: 'Waived on annual spending over ₹2 lakh.'
  },
  'hdfc-swiggy': {
    sourceUrl: 'https://www.hdfc.bank.in/credit-cards/swiggy-blck-hdfc-bank-credit-card',
    fee: '₹1,000 + taxes', feeNote: 'Waived on annual spending over ₹2 lakh.'
  },
  'sbi-eternal': {
    sourceUrl: 'https://www.sbicard.com/en/personal/credit-cards/eternal-sbi-card.html',
    fee: '₹499 + taxes', feeNote: 'Waived on annual spending over ₹2 lakh.'
  },
  'hdfc-tata-neu-infinity': {
    sourceUrl: 'https://www.hdfc.bank.in/credit-cards/tata-neu-infinity-hdfc-bank-credit-card',
    fee: '₹1,499 + taxes', feeNote: 'Waived on annual spending over ₹3 lakh.'
  },
  'kotak-811-infinity': {
    sourceUrl: 'https://www.kotak.bank.in/en/privy/fees-and-charges.html',
    fee: '₹1,499 + taxes', feeNote: 'No waiver.'
  },
  'sbi-cashback': {
    sourceUrl: 'https://www.sbicard.com/en/personal/credit-cards/cashback-sbi-card.html',
    fee: '₹999 + taxes', feeNote: 'Waived on annual spending over ₹2 lakh.'
  },
  'icici-amazon-pay': {
    sourceUrl: 'https://www.icici.bank.in/personal-banking/cards/credit-card/amazon-pay-credit-card',
    fee: '₹0', feeNote: 'Lifetime free. No joining or annual fee.'
  },
  'kiwi-neon': {
    sourceUrl: 'https://gokiwi.in/neon/neon2/',
    feeLabel: 'Neon membership', fee: '₹999 + taxes', feeNote: 'Optional annual rewards membership; existing offers may differ.'
  },
  'one-card': {
    sourceUrl: 'https://www.getonecard.app/metal-credit-card/',
    fee: '₹0', feeNote: 'Lifetime free. No joining or annual fee.'
  },
  'axis-myzone': {
    sourceUrl: 'https://www.axis.bank.in/cards/credit-card/axis-bank-my-zone-credit-card',
    fee: '₹0', feeNote: 'Lifetime free. No joining or annual fee.'
  },
  'hdfc-imperia': {
    sourceUrl: 'https://www.hdfc.bank.in/debit-cards/imperia-platinum-debit-card/fees-and-charges',
    fee: '₹750 + taxes', feeNote: 'Waived while you remain an Imperia banking member.'
  },
  'niyo-dcb': {
    sourceUrl: 'https://goniyo.com/international-debit-card',
    fee: '₹500 + taxes', feeNote: 'Waived with ₹5,000 average quarterly balance.'
  }
};

const ETERNAL_REWARD_COPY: Record<string, string> = {
  'Zomato, District & Bistro': '10% instant discount on eligible app purchases.',
  Blinkit: '10% off beauty and electronics; 5% off other eligible items. Shares the monthly app limit.',
  'Uber, Urban Company & Apollo': '5% cashback on eligible partner purchases of ₹100 or more.',
  'ixigo flights & hotels': '4% off flights and hotels, plus 1% cashback on the charged amount. ₹100 minimum for cashback.',
  'Other eligible spending': '1% cashback on other eligible spends.',
  Movies: 'Buy 1 Get 1 on movie tickets online up to ₹200 once a month.'
};

export function benefitCodes(description: string): string[] {
  return [...new Set(Array.from(description.matchAll(/(?:[Cc]ode|[Cc]oupon|[Uu]se)\s*:?\s*([A-Z][A-Z0-9]{3,})\b/g), match => match[1]))];
}

type Benefit = Card['benefits'][number];
export type DetailBenefit = Benefit & { trackingCategory: string; trackingValue: string; isBase?: boolean; detailChips?: string[]; extraChips?: string[] };

// Presentation copies leave catalogue rewards and persisted usage keys intact.
export function getCardDetailBenefits(card: Card): DetailBenefit[] {
  const items: DetailBenefit[] = card.benefits
    .filter(b => !(card.id === 'one-card' && b.category === 'Top Categories') && !(card.id === 'hdfc-imperia' && b.category === 'Food') && !(card.id === 'axis-myzone' && b.category === 'Dining') && !(card.id === 'icici-amazon-pay' && b.category === 'Dining') && b.type !== 'exclusion' && b.type !== 'lounge' && (!b.isHidden || b.category === 'All Spends') && !['Welcome', 'Fuel surcharge waiver', 'Renewal fee reversal'].includes(b.category))
    .map(b => ({ ...b, trackingCategory: b.category, trackingValue: b.value }));
  for (const b of items) {
    if (b.category === 'All Spends' || b.category === 'Other eligible spending' ||
      (card.id === 'sbi-cashback' && b.category === 'Offline') ||
      (card.id === 'kiwi-neon' && b.category === 'Online') ||
      (card.id === 'hdfc-imperia' && b.category === 'Online')) {
      b.isBase = true;
      b.category = 'Other eligible spending';
    }
    if (card.id === 'one-card') {
      if (['Fuel', 'Around Me'].includes(b.trackingCategory)) b.detailChips = ['Eligible spend limit ₹1,000'];
      if (b.trackingCategory === 'Around Me') b.category = 'Offers Around You';
      if (b.trackingCategory === 'Dining') b.description = '20% valueback on airport terminal dining via Offers Around You.';
    }
    if (card.id === 'niyo-dcb' && b.trackingCategory === 'International') {
      b.category = 'International Withdrawal';
      b.description = '100% Niyo points on one international ATM withdrawal per quarter.';
    }
    if (card.id === 'hdfc-imperia' && b.isBase) b.description = '1% cashback points on all eligible online spending.';
    if (card.id === 'axis-myzone') {
      if (b.trackingCategory === 'Food') b.detailChips = ['Min. spend ₹500', 'Eligible spend limit ₹500'];
      if (b.trackingCategory === 'Movies') {
        b.description = 'Buy 1 Get 1 on movie tickets online up to ₹200 once a month on District.';
        b.detailChips = ['₹25k quarterly spend required'];
      }
    }
    if (card.id === 'kiwi-neon') {
      if (b.trackingCategory === 'Scan & Pay') {
        b.value = '2%';
        b.description = '2% cash back on UPI Scan & Pay for every ₹100 spent.';
      }
      if (b.trackingCategory === 'Online') b.description = '0.5% cashback on online UPI payments via the Kiwi app for every ₹100 spent.';
    }
    if (card.id === 'icici-amazon-pay') {
      if (b.trackingCategory === 'Amazon') {
        b.description = '5% unlimited cashback on Amazon.in.';
        b.extraChips = ['Amazon Prime'];
      }
      if (b.trackingCategory === 'Amazon Pay Partners') {
        b.category = 'Amazon Pay';
        b.description = '2% unlimited cashback on all partner payments made through Amazon Pay.';
      }
      if (b.isBase) b.description = 'Other eligible retail spending, online and offline.';
    }
    if (card.id === 'sbi-cashback') {
      if (b.trackingCategory === 'Online') {
        b.description = '5% cashback on eligible online spends.';
        b.extraChips = ['Forex Positive'];
      }
      if (b.trackingCategory === 'Offline') b.description = '1% cashback on eligible offline spending.';
    }
    if (card.id === 'kotak-811-infinity') {
      if (b.trackingCategory === 'Dining') {
        b.description = '20% discount up to ₹750 once a month.';
        b.detailChips = ['Min. spend ₹2,000', 'Eligible spend limit ₹3,750'];
      }
      if (b.trackingCategory === 'Movies') {
        b.description = 'Buy 1 Get 1 on movie tickets online up to ₹300 once a month.';
        b.detailChips = ['Min. spend ₹400', 'Eligible spend limit ₹600'];
      }
      if (b.isBase) b.description = '5% cashback on online and offline spends. Forex positive.';
    }
    if (card.id === 'hdfc-tata-neu-infinity') {
      if (b.trackingCategory === 'Tata Neu App') {
        b.category = 'Tata Neu';
        b.description = '10% NeuCoins on online spends made after activating partner benefits in the Tata Neu app.';
        b.extraChips = ['NeuPass Select', 'NeuPass Signature'];
      }
      if (b.trackingCategory === 'Utilities') b.description = '5% NeuCoins on online utility bill payments in the Tata Neu app.';
      if (b.trackingCategory === 'Offline') b.description = '5% NeuCoins on offline spends at Tata partner brands like Croma, Westside, Zudio, IHCL, Bigbasket.';
    }
    if (card.id === 'hsbc-live-plus' && b.category === 'Dining') {
      b.category = 'Food, Shopping & Utility';
      b.description = '10% cashback on eligible food delivery, dining, groceries, shopping and utilities, online and offline.';
    }
    if (card.id === 'hdfc-swiggy' && b.trackingCategory === 'Swiggy') {
      b.description = '10% cashback on food delivery, dining, and online grocery spends on Swiggy.';
    }
    if (card.id === 'hdfc-swiggy' && b.isBase) {
      b.description = '1% cashback on all eligible domestic transactions.';
    }
    if (card.id === 'hdfc-swiggy' && b.category === 'Online') {
      b.description = '5% cashback on eligible online shopping.';
      b.extraChips = ['Nykaa +5%', 'Cleartrip up to +20%'];
    }
    if (card.id === 'sbi-eternal') {
      b.description = ETERNAL_REWARD_COPY[b.category] || b.description;
      if (b.category === 'Blinkit') {
        b.value = '10%';
        b.description = '10% instant discount on eligible beauty and electronics. 5% on other categories.';
      }
      if (b.category === 'Uber, Urban Company & Apollo') {
        b.description = '5% cashback on purchases with preferred partners.';
        b.detailChips = ['Min. spend ₹100', 'Eligible spend limit ₹20,000'];
      }
      if (b.category === 'ixigo flights & hotels') {
        b.description = '4% off flights and hotels, plus 1% statement cashback on the charged amount.';
        b.detailChips = ['Min. spend ₹100', 'Eligible spend limit ₹1,00,000'];
      }
      if (b.isBase) b.maxSpend = 50000;
    }
    if (b.isBase) b.category = 'Base reward rate';
  }
  if (!['axis-myzone', 'one-card', 'niyo-dcb'].includes(card.id) && !items.some(b => b.isBase)) {
    const base = card.id === 'axis-myzone'
      ? { value: '4 points / ₹200', description: 'Earn 4 EDGE REWARD points per ₹200 on eligible spending.' }
      : card.id === 'hsbc-live-plus'
        ? { value: '1.5%', description: '1.5% unlimited cashback on other eligible spending.' }
        : card.id === 'one-card'
          ? { value: '0.2%', description: 'Reward points worth 0.2% on other eligible spending.' }
          : card.id === 'hdfc-tata-neu-infinity'
            ? { value: '1.5%', description: '1.5 NeuCoins on other eligible spending.' }
            : { value: `${card.baseRewardRate}%`, description: 'No standard cashback on other purchases.' };
    items.push({ type: 'cashback', category: 'Base reward rate', ...base, trackingCategory: 'Other eligible spending', trackingValue: base.value, isBase: true });
  }
  return items.sort((a, b) => Number(!!a.isBase) - Number(!!b.isBase) || Number(!!b.usageLimit) - Number(!!a.usageLimit));
}

export function getCardRewardLimits(card: Card): { label: string; value: string; period: string }[] {
  if (card.rewardProgram) return card.rewardProgram.caps.map(cap => ({
    label: ({ 'eternal-apps': 'Eternal Instant Discount', preferred: 'Preferred Partner', base: 'Other eligible spending' } as Record<string, string>)[cap.id] || cap.label, value: `₹${cap.limit.toLocaleString('en-IN')}`,
    period: `per ${cap.period === 'calendar' ? 'calendar month' : 'statement cycle'}`
  }));
  return card.benefits.flatMap(b => {
    if (b.type === 'exclusion' || b.type === 'lounge') return [];
    if (card.id === 'one-card' && b.category === 'Dining') return [];
    if (card.id === 'hdfc-imperia' && b.category === 'Food') return [];
    if (card.id === 'axis-myzone' && ['Fashion', 'Dining'].includes(b.category)) return [];
    if (card.id === 'hdfc-tata-neu-infinity' && b.category === 'Scan & Pay') return [];
    if (card.id === 'kotak-811-infinity' && ['Dining', 'Movies'].includes(b.category)) return [];
    const limits = [];
    const explicit = b.description.match(/(?:capped at|up to)\s*₹?([\d,]+)\s*(?:NeuCoins|\/mo|per month|a month|points)/i);
    if ((b.maxSpend && b.percentValue) || explicit) {
      const amount = explicit ? Number(explicit[1].replace(/,/g, '')) : b.maxSpend! * b.percentValue! / 100;
      limits.push({ label: card.id === 'kotak-811-infinity' && b.category === 'All Spends' ? 'Monthly spends' : card.id === 'hsbc-live-plus' && b.category === 'Dining' ? 'Food, Shopping & Utility' : b.category === 'All Spends' ? 'Other eligible spending' : b.category, value: /NeuCoins/i.test(b.description) ? `${amount.toLocaleString('en-IN')} NeuCoins` : `₹${amount.toLocaleString('en-IN')}`, period: 'per month' });
    }
    if (b.capPerTxn && !(card.id === 'hdfc-tata-neu-infinity' && b.category === 'Groceries')) limits.push({ label: card.id === 'kotak-811-infinity' && b.category === 'All Spends' ? 'Individual spends' : b.category, value: `₹${b.capPerTxn.toLocaleString('en-IN')}`, period: 'per transaction' });
    return limits;
  });
}


export type DetailRewardGroup = { title?: string; subtext?: string; chips?: string[]; benefits: DetailBenefit[] };
export function getCardDetailGroups(card: Card): DetailRewardGroup[] {
  const benefits = getCardDetailBenefits(card);
  if (card.id === 'kiwi-neon') return [{ title: 'Cashback rewards', subtext: 'Counts toward milestones. The difference between total and earned cashback is awarded upon reaching a milestone.', benefits }];
  if (card.id === 'icici-amazon-pay') return [{ title: 'Cashback rewards', subtext: 'Credited directly to Amazon Pay balance', benefits }];
  if (card.id !== 'sbi-eternal') return benefits.map(benefit => ({ benefits: [benefit] }));
  return benefits.flatMap(benefit => {
    if (benefit.trackingCategory === 'Blinkit') return [];
    if (benefit.trackingCategory === 'Zomato, District & Bistro') return [{
      title: 'Shared app offers',
      chips: ['Eligible spend limit ₹20,000'],
      benefits: [benefit, ...benefits.filter(b => b.trackingCategory === 'Blinkit')]
    }];
    return [{ benefits: [benefit] }];
  });
}

export function getBenefitDetailChips(benefit: DetailBenefit): string[] {
  if (benefit.detailChips) return benefit.detailChips;
  return [
    benefit.capPerTxn ? `Up to ₹${benefit.capPerTxn.toLocaleString('en-IN')} / transaction` : '',
    benefit.minSpend ? `Min. spend ₹${benefit.minSpend.toLocaleString('en-IN')}` : '',
    benefit.maxSpend ? `Eligible spend limit ₹${benefit.maxSpend.toLocaleString('en-IN')}` : ''
  ].filter(Boolean);
}
