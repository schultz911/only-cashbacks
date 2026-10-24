/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Standalone type definitions for the MCP server.
 * Mirrors the frontend types without React/Vite dependencies.
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
  categoryLower?: string;
  descriptionLower?: string;
  descLForOnline?: string;
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
  forexMarkup: number;
  baseRewardRate: number;
  isDummy?: boolean;
  hasLounge?: boolean;
  isZeroForex?: boolean;
  isForexPositive?: boolean;
}

export interface MerchantInfo {
  name: string;
  category: string;
  isOnline: boolean;
  platform?: string;
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

export interface CashbackLog {
  amount: number;
  date: number;
  cardId: string;
  cardName: string;
  merchantName: string;
  category: string;
}

/** Shape of user data stored in Firestore */
export interface UserData {
  walletCards?: string[];
  exhaustedCards?: Record<string, boolean | string>;
  offerUsage?: Record<string, number>;
  cardBillDates?: Record<string, number>;
  kiwiNeonEarnRate?: number;
  cashbackLogs?: CashbackLog[];
}
