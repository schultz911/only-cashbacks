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
      { type: 'cashback', category: 'Swiggy', value: '10%', percentValue: 10, description: 'Cashback on food delivery, dining, and grocery spends on Swiggy.', minSpend: 249, maxSpend: 15000, fallbackRate: 0 },
      { type: 'cashback', category: 'Online', value: '5%', percentValue: 5, description: '5% cashback on online shopping. Plus 5% off on Nykaa and up to 20% off on Cleartrip (Code: CTSWHDFC).', minSpend: 100, maxSpend: 30000 },
      { type: 'cashback', category: 'All Spends', value: '1%', percentValue: 1, description: 'Cashback on all eligible domestic transactions.', maxSpend: 100000, isHidden: true },
      { type: 'exclusion', category: 'Gift Card', value: '0%', description: 'Gift Cards' },
      { type: 'exclusion', category: 'Gaming', value: '0%', description: 'Gaming' },
      { type: 'exclusion', category: 'Government', value: '0%', description: 'Government' },
      { type: 'exclusion', category: 'Wallet', value: '0%', description: 'Wallets & Amazon Pay Balance' },
      { type: 'exclusion', category: 'Rent', value: '0%', description: 'Rent' },
      { type: 'exclusion', category: 'Education', value: '0%', description: 'Education' },
      { type: 'exclusion', category: 'Insurance', value: '0%', description: 'Insurance' },
      { type: 'exclusion', category: 'Fuel', value: '0%', description: 'Fuel' },
      { type: 'exclusion', category: 'EMI', value: '0%', description: 'EMI' },
      { type: 'exclusion', category: 'Cash Withdrawal', value: '0%', description: 'Cash Withdrawal' },
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
      { type: 'cashback', category: 'Dining', value: '10%', percentValue: 10, description: 'Cashback on food delivery, dining, and groceries on all online and offline merchants.', maxSpend: 10000, fallbackRate: 0 },
      { type: 'lounge', category: 'Domestic', value: '1/qtr', description: 'Complimentary domestic lounge access.' },
      { type: 'exclusion', category: 'Fuel', value: '0%', description: 'Fuel' },
      { type: 'exclusion', category: 'Wallet', value: '0%', description: 'Wallets' },
      { type: 'exclusion', category: 'Rent', value: '0%', description: 'Rent' },
      { type: 'exclusion', category: 'Property Management', value: '0%', description: 'Property Management' },
      { type: 'exclusion', category: 'Education', value: '0%', description: 'Education' },
      { type: 'exclusion', category: 'Government', value: '0%', description: 'Government Services' },
      { type: 'exclusion', category: 'Insurance', value: '0%', description: 'Insurance' },
      { type: 'exclusion', category: 'Jeweler', value: '0%', description: 'Jewelers' },
      { type: 'exclusion', category: 'Toll', value: '0%', description: 'Tolls' },
      { type: 'exclusion', category: 'Wholesale Club', value: '0%', description: 'Wholesale Clubs' }
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
      { type: 'cashback', category: 'Tata Neu App', value: '10%', percentValue: 10, description: 'NeuCoins on spends within the Tata Neu app on partner brands, pharma, shopping, and travel. (NeuPass Legend Tier)', minSpend: 67 },
      { type: 'cashback', category: 'Groceries', value: '10%', percentValue: 10, capPerTxn: 1500, description: 'NeuCoins on grocery spends within the Tata Neu app on BigBasket.', maxSpend: 40000, minSpend: 67, isHidden: true },
      { type: 'cashback', category: 'Utilities', value: '5%', percentValue: 5, description: 'NeuCoins on utility bill payments on the Tata Neu app.', maxSpend: 40000, minSpend: 67 },
      { type: 'cashback', category: 'Telecom', value: '5%', percentValue: 5, description: 'NeuCoins on telecom and internet payments on the Tata Neu app.', maxSpend: 40000, minSpend: 67, isHidden: true },
      { type: 'cashback', category: 'Offline', value: '5%', percentValue: 5, description: 'NeuCoins on spends on Tata partner brands in offline stores like Croma, Westside, Zudio, IHCL, Bigbasket.', minSpend: 67 },
      { type: 'lounge', category: 'Domestic', value: '2/qtr', description: 'Generate voucher on the SmartBuy portal on quarterly spends of 50k.' },
      { type: 'lounge', category: 'International', value: '1/qtr', description: 'Complimentary through Priority Pass.' },
      { type: 'exclusion', category: 'Fuel', value: '0%', description: 'Fuel' },
      { type: 'exclusion', category: 'Wallet', value: '0%', description: 'Wallet Loads' },
      { type: 'exclusion', category: 'Cash Withdrawal', value: '0%', description: 'Cash Advances' },
      { type: 'exclusion', category: 'Rent', value: '0%', description: 'Rent' },
      { type: 'exclusion', category: 'Government', value: '0%', description: 'Government Transactions' },
      { type: 'exclusion', category: 'Gaming', value: '0%', description: 'Online Gaming (MCC 5816)' },
      { type: 'exclusion', category: 'Education', value: '0%', description: 'Education (Third-party platforms)' }
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
      { type: 'exclusion', category: 'Wallet', value: '0%', description: 'Wallets & Amazon Pay Balance' },
      { type: 'exclusion', category: 'Utilities', value: '0%', description: 'Utilities' },
      { type: 'exclusion', category: 'Insurance', value: '0%', description: 'Insurance' },
      { type: 'exclusion', category: 'Education', value: '0%', description: 'Education' },
      { type: 'exclusion', category: 'Jewellery', value: '0%', description: 'Jewellery' },
      { type: 'exclusion', category: 'Railways', value: '0%', description: 'Railways' },
      { type: 'exclusion', category: 'Gaming', value: '0%', description: 'Digital Gaming Platforms (MCC 7993, 7994, 5816)' },
      { type: 'exclusion', category: 'Toll', value: '0%', description: 'Toll Payments (MCC 4784)' },
      { type: 'exclusion', category: 'Government', value: '0%', description: 'Government Transactions (MCC 9222, 9311, 9402)' }
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
      { type: 'offer', category: 'Dining', value: 'Zomato', percentValue: 20, capPerTxn: 750, minSpend: 2000, usageLimit: 1, description: '20% discount on Zomato Dining up to Rs. 750 once a month on min spend of Rs. 2,000.' },
      { type: 'offer', category: 'Movies', value: 'BookMyShow', percentValue: 50, capPerTxn: 300, minSpend: 400, usageLimit: 1, description: '1+1 on movie tickets booked through BookMyShow up to Rs. 300 once a month on min spend of Rs. 400.' },
      { type: 'exclusion', category: 'UPI', value: '0%', description: 'UPI Payments' },
      { type: 'exclusion', category: 'ATM', value: '0%', description: 'ATM Withdrawals' },
      { type: 'exclusion', category: 'Wallet', value: '0%', description: 'Wallet Loads' },
      { type: 'exclusion', category: 'EMI/Loan', value: '0%', description: 'Loan Repayments' },
      { type: 'exclusion', category: 'Utilities', value: '0%', description: 'Utility & Credit Card Bill Payments' },
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
      { type: 'upi', category: 'Scan & Pay', value: '2-5%', percentValue: 2, description: 'Cashback on Scan & pay UPI spends. Rate increases to 5% with milestones.' },
      { type: 'upi', category: 'Online', value: '0.5%', percentValue: 0.5, description: 'Cashback on online payments via Kiwi App. Counts towards milestones.' },
      { type: 'exclusion', category: 'Telecom', value: '0%', description: 'Telecom' },
      { type: 'exclusion', category: 'Utilities', value: '0%', description: 'Utilities' },
      { type: 'exclusion', category: 'Jewellery', value: '0%', description: 'Jewellery' },
      { type: 'exclusion', category: 'Rent', value: '0%', description: 'Rent' },
      { type: 'exclusion', category: 'Insurance', value: '0%', description: 'Insurance' },
      { type: 'exclusion', category: 'Government', value: '0%', description: 'Government Services' },
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
      { type: 'offer', category: 'Around Me', value: '5%', percentValue: 5, capPerTxn: 50, description: 'Reward points up to ₹50 on hyper-local offers.' }
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
      { type: 'forex', category: 'Forex', value: '0%', percentValue: 0, description: 'No forex fees on international spends.' },
      { type: 'offer', category: 'International ATM', value: '100%', description: 'Niyo points back on one international ATM withdrawal per quarter.' },
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
      { type: 'offer', category: 'Swiggy', value: 'Flat ₹120', percentValue: 24, minSpend: 500, capPerTxn: 120, usageLimit: 2, description: 'Flat ₹120 off on Swiggy food orders over ₹500 (Code: AXIS120).' },
      { type: 'offer', category: 'Movies', value: '1+1', percentValue: 50, capPerTxn: 200, usageLimit: 1, description: 'Buy 1 Get 1 free on movie tickets via District up to ₹200 (Code: AXIS200).' },
      { type: 'offer', category: 'Fashion', value: 'Ajio', percentValue: 33, minSpend: 2999, capPerTxn: 1000, usageLimit: 1, description: 'Up to ₹1,000 off on Ajio orders over ₹2,999 (Code: AJIOAXISMZ).' },
      { type: 'offer', category: 'Dining', value: '15%', percentValue: 15, minSpend: 2500, capPerTxn: 500, usageLimit: 1, description: '15% discount on EazyDiner up to ₹500 on min bill of ₹2,500.' },
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
      { type: 'offer', category: 'Movies', value: '25%', percentValue: 25, usageLimit: 1, description: 'Cashback points up to ₹250 on tickets booked through BookMyShow per calendar month.', maxSpend: 1000 },
      { type: 'offer', category: 'Swiggy', value: '5%', percentValue: 5, description: 'Cashback points up to ₹150 on spends in the Swiggy app per calendar month.', maxSpend: 3000 },
      { type: 'cashback', category: 'Online', value: '1%', percentValue: 1, description: 'Cashback points on all online spends to be redeemed through the HDFC Banking app.', maxSpend: 75000 },
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
