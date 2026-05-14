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
    baseRewardRate: 1,
    benefits: [
      { type: 'cashback', category: 'Swiggy', value: '10%', percentValue: 10, description: 'Cashback on spends within the Swiggy ecosystem.', maxSpend: 15000 },
      { type: 'cashback', category: 'Online', value: '5%', percentValue: 5, description: 'Cashback on online shopping. Additional instant discounts on Nykaa and Cleartrip.', maxSpend: 30000 },
      { type: 'exclusion', category: 'Gift Card', value: '0%', description: 'Gift Cards' },
      { type: 'exclusion', category: 'Gaming', value: '0%', description: 'Gaming' },
      { type: 'exclusion', category: 'Government', value: '0%', description: 'Government' },
      { type: 'exclusion', category: 'Wallet', value: '0%', description: 'Wallets & Amazon Pay Balance' },
      { type: 'exclusion', category: 'Rent', value: '0%', description: 'Rent' },
      { type: 'exclusion', category: 'Education', value: '0%', description: 'Education' }
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
      { type: 'cashback', category: 'Dining', value: '10%', percentValue: 10, description: 'Cashback on food delivery, dining, and groceries.', maxSpend: 10000 },
      { type: 'lounge', category: 'Domestic', value: '1/qtr', description: 'Complimentary domestic lounge access.' }
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
      { type: 'cashback', category: 'Tata Neu App', value: '10%', percentValue: 10, description: 'NeuCoins on spends within the Tata Neu app on partner brands, pharma, shopping, and travel. (NeuPass Legend Tier)' },
      { type: 'cashback', category: 'Groceries', value: '10%', percentValue: 10, capPerTxn: 15000, description: 'NeuCoins on grocery spends within the Tata Neu app on BigBasket.', maxSpend: 40000 },
      { type: 'cashback', category: 'Tata Brands', value: '5%', percentValue: 5, description: 'NeuCoins on spends on Tata partner brands in offline stores like Croma, Westside, Zudio, IHCL, Bigbasket.' },
      { type: 'cashback', category: 'Utilities', value: '5%', percentValue: 5, description: 'NeuCoins on utility bill payments on the Tata Neu app.', maxSpend: 40000 },
      { type: 'cashback', category: 'Telecom', value: '5%', percentValue: 5, description: 'NeuCoins on telecom and internet payments on the Tata neu app.', maxSpend: 40000 },
      { type: 'lounge', category: 'Domestic', value: '2/qtr', description: 'Generate voucher on the SmartBuy portal on quarterly spends of 50k.' },
      { type: 'lounge', category: 'International', value: '1/qtr', description: 'Complimentary through Priority Pass.' }
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
      { type: 'cashback', category: 'Online', value: '5%', percentValue: 5, description: 'Cashback on online spends, including digital gift cards. Forex-positive.', maxSpend: 40000 },
      { type: 'cashback', category: 'Offline', value: '1%', percentValue: 1, description: 'Cashback on offline transactions.', maxSpend: 200000 },
      { type: 'exclusion', category: 'Gaming', value: '0%', description: 'Gaming' },
      { type: 'exclusion', category: 'Wallet', value: '0%', description: 'Wallets & Amazon Pay Balance' },
      { type: 'exclusion', category: 'Fuel', value: '0%', description: 'Fuel' }
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
      { type: 'cashback', category: 'All', value: '5%', percentValue: 5, capPerTxn: 2000, description: 'Cashback on online and offline spends. Forex-positive.', maxSpend: 10000 },
      { type: 'offer', category: 'Dining', value: 'District', percentValue: 15, capPerTxn: 750, usageLimit: 1, description: '15% discount on District up to Rs. 750 once a month.' },
      { type: 'offer', category: 'Movies', value: 'BookMyShow', percentValue: 50, capPerTxn: 300, usageLimit: 1, description: '1+1 on movie tickets booked through BookMyShow up to Rs. 300 once a month.' },
      { type: 'exclusion', category: 'Utilities', value: '0%', description: 'Utility' },
      { type: 'exclusion', category: 'Wallet', value: '0%', description: 'Wallets & Amazon Pay Balance' },
      { type: 'exclusion', category: 'Education', value: '0%', description: 'Education' },
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
      { type: 'upi', category: 'Scan & Pay', value: '5%', percentValue: 5, description: 'Cashback on Scan & pay UPI spends.' },
      { type: 'upi', category: 'Online UPI', value: '0.5%', percentValue: 0.5, description: 'Cashback on online UPI payments via Kiwi App. Counts towards milestones.' },
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
      { type: 'cashback', category: 'Fuel', value: '5%', percentValue: 5, capPerTxn: 50, description: 'Reward points up to Rs. 50 and surcharge reversal on fuel transactions.' },
      { type: 'offer', category: 'Around Me', value: 'Offers', percentValue: 5, capPerTxn: 50, description: '5% reward points up to Rs. 50 on hyper-local offers.' }
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
      { type: 'forex', category: 'Forex', value: '0% Fees', percentValue: 0, description: 'Zero Forex Markup.' },
      { type: 'offer', category: 'International ATM', value: '100% Back', description: 'Niyo points on one international ATM withdrawal per quarter.' },
      { type: 'lounge', category: 'International', value: '1/qtr', description: 'Generate voucher on the Niyo app after international spends of 75k.' }
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
      { type: 'offer', category: 'Swiggy', value: 'Flat ₹120', percentValue: 40, maxSpend: 300, capPerTxn: 120, usageLimit: 2, description: 'Instant discount on Swiggy food delivery twice a month.' },
      { type: 'offer', category: 'Movies', value: 'District', percentValue: 50, capPerTxn: 200, usageLimit: 1, description: '1+1 on movie tickets booked through District up to Rs. 200 once a month.' },
      { type: 'lounge', category: 'Domestic', value: '1/qtr', description: 'Activated on quartely spends of 50k.' }
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
      { type: 'offer', category: 'Movies', value: '25%', percentValue: 25, usageLimit: 1, description: 'Cashback points up to 250 on tickets booked through BookMyShow per calendar month.', maxSpend: 1000 },
      { type: 'offer', category: 'Swiggy', value: '5%', percentValue: 5, description: 'Cashback points up to 150 on spends in the Swiggy app per calendar month.', maxSpend: 3000 },
      { type: 'cashback', category: 'Online', value: '1%', percentValue: 1, description: 'Cashback points on all online spends to be redeemed through the HDFC Banking app.', maxSpend: 75000 },
      { type: 'lounge', category: 'Domestic', value: '2/qtr', description: 'Generate voucher on the SmartBuy portal on quarterly spends of 10k.' }
    ]
  }
];
