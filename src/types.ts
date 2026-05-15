/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CardBenefit {
  type: 'cashback' | 'points' | 'offer' | 'lounge' | 'exclusion' | 'forex' | 'upi';
  category: string;
  value: string;
  description: string;
  percentValue?: number;
  maxSpend?: number;
  capPerTxn?: number;
  minSpend?: number;
  usageLimit?: number;
  fallbackRate?: number;
  isHidden?: boolean;
}

export interface Card {
  id: string;
  name: string;
  bank: string;
  image?: string;
  color?: string;
  benefits: CardBenefit[];
  network: 'Visa' | 'Mastercard' | 'RuPay' | 'Amex' | 'Other';
  tier?: string;
  gradient?: string;
  type: 'Credit' | 'Debit' | 'Prepaid';
  annualFee?: string;
  isExempt?: boolean;
  forexMarkup: number; // Base markup e.g., 3.5
  baseRewardRate: number; // e.g., 1.0 or 1.5
  isDummy?: boolean;
}

export interface MerchantInfo {
  name: string;
  category: string;
  isOnline: boolean;
  platform?: string; // Swiggy, Amazon, etc.
  isP2P?: boolean;
}

export interface Recommendation {
  bestCard: Card;
  tiedCards?: { card: Card; benefit: string }[];
  reason: string;
  expectedBenefit: string;
  netValue: number;
  cashbackEarned: number;
  feesPaid: number;
  alternatives: { card: Card; benefit: string; netValue: number }[];
  voucherOption?: {
    platform: string;
    discount: string;
    cardBenefit: string;
  };
  availableOffers?: {
    id: string;
    icon: string;
    title: string;
    description: string;
    cardId?: string;
    category: string;
  }[];
}
