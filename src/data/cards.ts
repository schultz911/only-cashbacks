/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card } from '../types';

export const CARD_DATA: Card[] = [
  {
    id: 'hdfc-swiggy',
    name: 'Swiggy BLCK',
    bank: 'HDFC',
    network: 'Mastercard',
    tier: 'World',
    gradient: 'from-orange-500 to-[#111827]',
    type: 'Credit',
    forexMarkup: 3.5,
    baseRewardRate: 0,
    benefits: [
      { type: 'cashback', category: 'Swiggy', value: '10%', percentValue: 10, description: 'Cashback on food delivery, dining, and online grocery spends on Swiggy.', minSpend: 249, maxSpend: 15000, fallbackRate: 0 },
      { type: 'cashback', category: 'Online', value: '5%', percentValue: 5, description: 'Cashback on online shopping. Plus 5% off on Nykaa and up to 20% off on Cleartrip (Code: CTSWHDFC).', minSpend: 100, maxSpend: 30000 },
      { type: 'cashback', category: 'All Spends', value: '1%', percentValue: 1, description: 'Cashback on all eligible domestic transactions.', maxSpend: 100000, isHidden: true },
      { type: 'exclusion', category: 'Gift Card', value: '0%', description: 'Gift Cards' },
      { type: 'exclusion', category: 'Gaming', value: '0%', description: 'Online Gaming' },
      { type: 'exclusion', category: 'Government', value: '0%', description: 'Government Transactions' },
      { type: 'exclusion', category: 'Wallet', value: '0%', description: 'Wallet Loads & Amazon Pay Balance' },
      { type: 'exclusion', category: 'Rent', value: '0%', description: 'Rent' },
      { type: 'exclusion', category: 'Education', value: '0%', description: 'Education' },
      { type: 'exclusion', category: 'Insurance', value: '0%', description: 'Insurance' },
      { type: 'exclusion', category: 'Fuel', value: '0%', description: 'Fuel' },
      { type: 'exclusion', category: 'Finance', value: '0%', description: 'Loan Repayments & EMI' },
      { type: 'exclusion', category: 'ATM', value: '0%', description: 'ATM Withdrawals' },
    ]
  },
  {
    id: 'hsbc-live-plus',
    name: 'Live+',
    bank: 'HSBC',
    network: 'Visa',
    tier: 'Signature',
    gradient: 'from-[#dc2626] to-[#1e40af]',
    type: 'Credit',
    forexMarkup: 3.5,
    baseRewardRate: 1.5,
    benefits: [
      { type: 'cashback', category: 'Dining', value: '10%', percentValue: 10, description: '10% Cashback on food delivery, dining, and groceries, online and offline.', maxSpend: 10000, fallbackRate: 0 },
      { type: 'lounge', category: 'Domestic', value: '1/qtr', description: 'Complimentary domestic lounge access.' },
      { type: 'exclusion', category: 'Fuel', value: '0%', description: 'Fuel' },
      { type: 'exclusion', category: 'Wallet', value: '0%', description: 'Wallet Loads' },
      { type: 'exclusion', category: 'Rent', value: '0%', description: 'Rent' },
      { type: 'exclusion', category: 'Education', value: '0%', description: 'Education' },
      { type: 'exclusion', category: 'Government', value: '0%', description: 'Government Transactions' },
      { type: 'exclusion', category: 'Insurance', value: '0%', description: 'Insurance' },
      { type: 'exclusion', category: 'Jewellery', value: '0%', description: 'Jewellery' },
      { type: 'exclusion', category: 'Toll', value: '0%', description: 'Tolls' },
    ]
  },
  {
    id: 'hdfc-tata-neu-infinity',
    name: 'Tata Neu Infinity',
    bank: 'HDFC',
    network: 'Visa',
    tier: 'Signature',
    gradient: 'from-[#7e22ce] to-[#111827]',
    type: 'Credit',
    forexMarkup: 3.5,
    baseRewardRate: 1.5,
    benefits: [
      { type: 'cashback', category: 'Tata Neu App', value: '10%', percentValue: 10, description: 'NeuCoins on online spends within the Tata Neu app on partner brands, pharma, shopping, and travel. (NeuPass Legend Tier)', minSpend: 67 },
      { type: 'cashback', category: 'Groceries', value: '10%', percentValue: 10, capPerTxn: 1500, description: 'NeuCoins on online grocery spends within the Tata Neu app on BigBasket.', maxSpend: 40000, minSpend: 67, isHidden: true },
      { type: 'cashback', category: 'Utilities', value: '5%', percentValue: 5, description: 'NeuCoins on online utility bill payments on the Tata Neu app.', maxSpend: 40000, minSpend: 67 },
      { type: 'cashback', category: 'Telecom', value: '5%', percentValue: 5, description: 'NeuCoins on online telecom and internet payments on the Tata Neu app.', maxSpend: 40000, minSpend: 67, isHidden: true },
      { type: 'cashback', category: 'Offline', value: '5%', percentValue: 5, description: 'NeuCoins on offline spends at Tata partner brands like Croma, Westside, Zudio, IHCL, Bigbasket.', minSpend: 67 },
      { type: 'lounge', category: 'Domestic', value: '2/qtr', description: 'Generate voucher on the SmartBuy portal on quarterly spends of 50k.' },
      { type: 'lounge', category: 'International', value: '1/qtr', description: 'Complimentary with Priority Pass.' },
      { type: 'exclusion', category: 'Fuel', value: '0%', description: 'Fuel' },
      { type: 'exclusion', category: 'Wallet', value: '0%', description: 'Wallet Loads' },
      { type: 'exclusion', category: 'ATM', value: '0%', description: 'ATM Withdrawals' },
      { type: 'exclusion', category: 'Rent', value: '0%', description: 'Rent' },
      { type: 'exclusion', category: 'Government', value: '0%', description: 'Government Transactions' },
      { type: 'exclusion', category: 'Gaming', value: '0%', description: 'Online Gaming' },
      { type: 'exclusion', category: 'Education', value: '0%', description: 'Education' }
    ]
  },
  {
    id: 'sbi-cashback',
    name: 'Cashback',
    bank: 'SBI',
    network: 'Visa',
    tier: 'Platinum',
    gradient: 'from-[#eab308] to-[#1d4ed8]',
    type: 'Credit',
    forexMarkup: 3.5,
    baseRewardRate: 0,
    benefits: [
      { type: 'cashback', category: 'Online', value: '5%', percentValue: 5, description: 'Cashback on online spends, including digital gift cards. Forex-positive.', maxSpend: 40000, fallbackRate: 0 },
      { type: 'cashback', category: 'Offline', value: '1%', percentValue: 1, description: 'Cashback on offline transactions.', maxSpend: 200000 },
      { type: 'exclusion', category: 'Rent', value: '0%', description: 'Rent' },
      { type: 'exclusion', category: 'Fuel', value: '0%', description: 'Fuel' },
      { type: 'exclusion', category: 'Wallet', value: '0%', description: 'Wallet Loads & Amazon Pay Balance' },
      { type: 'exclusion', category: 'Utilities', value: '0%', description: 'Utilities' },
      { type: 'exclusion', category: 'Insurance', value: '0%', description: 'Insurance' },
      { type: 'exclusion', category: 'Education', value: '0%', description: 'Education' },
      { type: 'exclusion', category: 'Jewellery', value: '0%', description: 'Jewellery' },
      { type: 'exclusion', category: 'Railways', value: '0%', description: 'Railways' },
      { type: 'exclusion', category: 'Gaming', value: '0%', description: 'Online Gaming' },
      { type: 'exclusion', category: 'Toll', value: '0%', description: 'Toll Payments' },
      { type: 'exclusion', category: 'Government', value: '0%', description: 'Government Transactions' }
    ]
  },
  {
    id: 'kotak-811-infinity',
    name: '811 Infinity Metal',
    bank: 'Kotak',
    network: 'Visa',
    tier: 'Signature',
    gradient: 'from-gray-800 to-red-900',
    type: 'Debit',
    forexMarkup: 2,
    baseRewardRate: 0,
    benefits: [
      { type: 'cashback', category: 'All Spends', value: '5%', percentValue: 5, capPerTxn: 100, description: 'Cashback on online and offline spends. Forex-positive.', maxSpend: 10000 },
      { type: 'offer', category: 'Dining', value: 'District', percentValue: 20, capPerTxn: 750, minSpend: 2000, usageLimit: 1, description: '20% discount up to ₹750 on a min spend of ₹2,000 once a month.' },
      { type: 'offer', category: 'Movies', value: 'BMS', percentValue: 50, capPerTxn: 300, minSpend: 400, usageLimit: 1, description: 'Buy 1 Get 1 on movie tickets online up to ₹300 on a min spend of ₹400 once a month.' },
      { type: 'upi', category: 'Scan & Pay', value: 'Mystery', percentValue: 0, description: 'Earn exclusive Mystery Cashback rewards on all Scan & Pay transactions via Kotak App.', isHidden: true },
      { type: 'exclusion', category: 'ATM', value: '0%', description: 'ATM Withdrawals' },
      { type: 'exclusion', category: 'Wallet', value: '0%', description: 'Wallet Loads' },
      { type: 'exclusion', category: 'Finance', value: '0%', description: 'Loan Repayments and EMI' },
      { type: 'exclusion', category: 'Utilities', value: '0%', description: 'Utilities' },
      { type: 'lounge', category: 'Domestic', value: '1/qtr', description: 'Complimentary domestic lounge access.' }
    ]
  },
  {
    id: 'kiwi-neon',
    name: 'Kiwi Neon',
    bank: 'YES',
    network: 'RuPay',
    gradient: 'from-[#16a34a] to-[#d97706]',
    type: 'Credit',
    forexMarkup: 3.5,
    baseRewardRate: 0,
    benefits: [
      { type: 'upi', category: 'Scan & Pay', value: '2-5%', percentValue: 2, description: 'Cashback on UPI Scan & Pay spends. Rate increases to 5% with milestones.' },
      { type: 'cashback', category: 'Online', value: '0.5%', percentValue: 0.5, description: 'Cashback on online UPI payments via Kiwi App. Counts towards milestones.' },
      { type: 'exclusion', category: 'Telecom', value: '0%', description: 'Telecom' },
      { type: 'exclusion', category: 'Utilities', value: '0%', description: 'Utilities' },
      { type: 'exclusion', category: 'Jewellery', value: '0%', description: 'Jewellery' },
      { type: 'exclusion', category: 'Rent', value: '0%', description: 'Rent' },
      { type: 'exclusion', category: 'Insurance', value: '0%', description: 'Insurance' },
      { type: 'exclusion', category: 'Government', value: '0%', description: 'Government Transactions' },
      { type: 'lounge', category: 'Domestic', value: '1/milestone', description: 'Redeem lounge voucher from the Kiwi app after hitting every 50k spend milestone.' }
    ]
  },
  {
    id: 'one-card',
    name: 'OneCard',
    bank: 'IDIB',
    network: 'Visa',
    tier: 'Signature',
    gradient: 'from-[#374151] to-[#111827]',
    type: 'Credit',
    forexMarkup: 1.0,
    baseRewardRate: 0,
    benefits: [
      { type: 'cashback', category: 'Fuel', value: '5%', percentValue: 5, capPerTxn: 50, description: 'Reward points up to ₹50 and surcharge reversal on fuel transactions.' },
      { type: 'cashback', category: 'Around Me', value: '5%', percentValue: 5, capPerTxn: 50, description: 'Reward points up to ₹50 on hyper-local offers.' }
    ]
  },
  {
    id: 'niyo-dcb',
    name: 'Niyo',
    bank: 'DCB',
    network: 'Visa',
    tier: 'Platinum',
    gradient: 'from-[#2563eb] to-[#111827]',
    type: 'Debit',
    forexMarkup: 0.0,
    baseRewardRate: 0,
    benefits: [
      { type: 'forex', category: 'Forex', value: '0%', percentValue: 0, description: 'No forex fees on online and offline international spends.' },
      { type: 'offer', category: 'International', value: 'ATM', percentValue: 100, capPerTxn: 500, usageLimit: 1, description: '100% back as Niyo points up to ₹500 on one international ATM withdrawal per quarter.' },
      { type: 'lounge', category: 'International', value: '1/qtr', description: 'Generate voucher on the Niyo app after international spends of ₹75k.' }
    ]
  },
  {
    id: 'axis-myzone',
    name: 'MyZone',
    bank: 'Axis',
    network: 'Visa',
    tier: 'Platinum',
    gradient: 'from-[#831843] to-[#111827]',
    type: 'Credit',
    forexMarkup: 3.5,
    baseRewardRate: 0,
    benefits: [
      { type: 'offer', category: 'Food', value: 'Swiggy', percentValue: 24, minSpend: 500, capPerTxn: 120, usageLimit: 2, description: 'Flat ₹120 off on online orders over ₹500 twice a month (Code: AXIS120).' },
      { type: 'offer', category: 'Movies', value: 'District', percentValue: 50, capPerTxn: 200, usageLimit: 1, description: 'Buy 1 Get 1 on movie tickets online up to ₹200 once a month (Code: AXIS200).' },
      { type: 'offer', category: 'Fashion', value: 'Ajio', percentValue: 33, minSpend: 2999, capPerTxn: 1000, description: 'Flat ₹1,000 off on online orders over ₹2,999 (Code: AJIOAXISMZ).', isHidden: true },
      { type: 'offer', category: 'Dining', value: 'EazyDiner', percentValue: 15, minSpend: 2500, capPerTxn: 500, usageLimit: 1, description: '15% off up to ₹500 on min bill of ₹2,500 once a month.' },
      { type: 'exclusion', category: 'Rent', value: '0%', description: 'Rent' },
      { type: 'exclusion', category: 'Wallet', value: '0%', description: 'Wallet Loads' },
      { type: 'exclusion', category: 'Fuel', value: '0%', description: 'Fuel' },
      { type: 'exclusion', category: 'Insurance', value: '0%', description: 'Insurance' },
      { type: 'exclusion', category: 'Utilities', value: '0%', description: 'Utilities' },
      { type: 'exclusion', category: 'Jewellery', value: '0%', description: 'Jewellery' },
      { type: 'exclusion', category: 'Education', value: '0%', description: 'Education' },
      { type: 'exclusion', category: 'Government', value: '0%', description: 'Government Transactions' },
      { type: 'lounge', category: 'Domestic', value: '1/qtr', description: 'Activated on quarterly spends of ₹50k.' }
    ]
  },
  {
    id: 'hdfc-imperia',
    name: 'Imperia Platinum Debit',
    bank: 'HDFC',
    network: 'Mastercard',
    tier: 'World',
    gradient: 'from-[#7f1d1d] to-[#ca8a04]',
    type: 'Debit',
    forexMarkup: 3.5,
    baseRewardRate: 0,
    benefits: [
      { type: 'offer', category: 'Movies', value: 'BMS', percentValue: 25, usageLimit: 1, description: '25% cashback points up to ₹250 on online tickets per calendar month.', maxSpend: 1000 },
      { type: 'offer', category: 'Food', value: 'Swiggy', percentValue: 5, usageLimit: 1, description: '5% cashback points up to ₹150 on online spends per calendar month.', maxSpend: 3000 },
      { type: 'cashback', category: 'Online', value: '1%', percentValue: 1, description: 'Cashback points on all eligible online spends.', maxSpend: 75000 },
      { type: 'lounge', category: 'Domestic', value: '2/qtr', description: 'Generate voucher on the SmartBuy portal on quarterly spends of 10k.' }
    ]
  },
  {
    id: 'amazon-pay-upi',
    name: 'Amazon Pay',
    bank: 'Amazon',
    network: 'Other',
    tier: 'UPI',
    gradient: 'from-[#ff9900] to-[#146eb4]',
    type: 'Prepaid',
    forexMarkup: 0,
    baseRewardRate: 0,
    isDummy: true,
    benefits: [
      { type: 'upi', category: 'Scan & Pay', value: 'Scratch Card', percentValue: 0.1, description: 'Mystery scratch card for UPI spends.' }
    ]
  },
  {
    id: 'cred-pay-upi',
    name: 'Cred Pay',
    bank: 'Cred',
    network: 'Other',
    tier: 'UPI',
    gradient: 'from-[#111827] to-[#374151]',
    type: 'Prepaid',
    forexMarkup: 0,
    baseRewardRate: 0,
    isDummy: true,
    benefits: [
      { type: 'upi', category: 'Scan & Pay', value: 'Cashback', percentValue: 0.2, description: 'Mystery cashback on Cred Pay UPI.' }
    ]
  }
];

// Precompute lowercase categories to avoid redundant allocations in hot loops
CARD_DATA.forEach(card => {
  card.hasLounge = card.benefits.some(b => b.type === 'lounge');
  card.isZeroForex = card.benefits.some(b => b.type === 'forex' || b.description.toLowerCase().includes('zero forex'));
  card.isForexPositive = card.benefits.some(b => b.description.toLowerCase().includes('forex-positive') && !card.isZeroForex);

  card.benefits.forEach(benefit => {
    benefit.categoryLower = benefit.category.toLowerCase();
    benefit.descriptionLower = benefit.description.toLowerCase();
    benefit.descLForOnline = (benefit.category + " " + benefit.value + " " + (benefit.description || '')).toLowerCase();
  });
});

export const CARD_DICT: Record<string, Card> = Object.fromEntries(CARD_DATA.map(c => [c.id, c]));
