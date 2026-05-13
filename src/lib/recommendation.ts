/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card, MerchantInfo, Recommendation } from '../types';
import { CARD_DATA } from '../data/cards';

export function getRecommendations(
  merchant: MerchantInfo, 
  amount: number,
  isOnline: boolean = true,
  isIntl: boolean = false,
  isScanToPay: boolean = false,
  exhaustedCards: Record<string, boolean> = {},
  offerUsage: Record<string, number> = {}
): Recommendation {

  const nameL = merchant.name.toLowerCase();
  const catL = merchant.category.toLowerCase();
  const platL = merchant.platform?.toLowerCase() || '';

  // Google Play special logic
  if (nameL.includes('google play') || platL.includes('google play')) {
    const sbiCard = CARD_DATA.find(c => c.id === 'sbi-cashback')!;
    const isExhausted = exhaustedCards['sbi-cashback'];
    return {
      bestCard: sbiCard,
      reason: isExhausted 
         ? "Using Amazon Gift Card via SBI Cashback. (Accelerated limit reached, earning base rate)"
         : "For Google Play, always buy an Amazon gift card with the SBI Cashback card and load using Amazon's Rewards Gold offer of 5% on Google Play recharges.",
      expectedBenefit: isExhausted ? "1% + 5% Amazon Rewards" : "5% via SBI CB + 5% Amazon Rewards Gold",
      netValue: isExhausted ? amount * 0.06 : amount * 0.10,
      cashbackEarned: isExhausted ? amount * 0.06 : amount * 0.10,
      feesPaid: 0,
      alternatives: []
    };
  }

  // Tata Neu merchants
  const tataNeuMerchants = ['croma', 'westside', 'zudio', 'ihcl', 'bigbasket', '1mg', 'tata cliq', 'air india', 'qmin', 'cult', 'tata play', 'titan', 'tanishq'];
  const isTataNeuAppMerchant = tataNeuMerchants.some(tm => nameL.includes(tm) || catL.includes(tm) || platL.includes(tm));

  // Swiggy BLCK allowed online categories (5% CB list)
  const swiggyAllowed = [
    'apparels', 'pharmacies', 'pet stores', 'personal care',
    'ola', 'zoom', 'uber', 'reliance retail', 'vijay sales', 'croma',
    'paytm travel', 'easemytrip', 'ixigo', 'yatra', 'ibibo',
    'amazon', 'flipkart', 'nykaa', 'cleartrip', 'ajio',
    'netflix', 'hotstar', 'bookmyshow', 'meesho'
  ];
  const isSwiggyAllowed = swiggyAllowed.some(tm => nameL.includes(tm) || catL.includes(tm) || platL.includes(tm));

  const calculationResults = CARD_DATA.map(card => {
    let cashbackAmount = 0;
    let benefitText = 'Base rewards';
    let isExcluded = false;
    let discountAmount = 0;

    // Default Exclusions checking
    const exclusion = card.benefits.find(b => 
      b.type === 'exclusion' && 
      (catL === b.category.toLowerCase() || nameL.includes(b.category.toLowerCase()) || platL === b.category.toLowerCase())
    );

    if (exclusion) {
      isExcluded = true;
      benefitText = 'Excluded from rewards';
    } else if (exhaustedCards[card.id]) {
      cashbackAmount = amount * (card.baseRewardRate / 100);
      benefitText = `Limit Reached - Base rate (${card.baseRewardRate}%)`;
    } 
    // Handle specific card logic statically for complex rules
    else if (card.id === 'hdfc-swiggy') {
      if (nameL.includes('swiggy') || nameL.includes('dineout') || platL.includes('swiggy')) {
        cashbackAmount = Math.min(amount * 0.10, 1500);
        benefitText = '10% Cashback on Swiggy/Dineout';
      } else if (isOnline && (nameL.includes('nykaa') || platL.includes('nykaa'))) {
        cashbackAmount = Math.min(amount * 0.05, 1500); // 5% base on Nykaa
        const maxNykaaDiscount = amount >= 1000 ? Math.min(amount * 0.05, 100) : 0;
        discountAmount = maxNykaaDiscount;
        benefitText = maxNykaaDiscount > 0 ? `5% Cashback + ₹${maxNykaaDiscount.toFixed(0)} Instant Discount` : '5% Cashback';
        cashbackAmount += discountAmount;
      } else if (isOnline && (nameL.includes('cleartrip') || platL.includes('cleartrip'))) {
        cashbackAmount = Math.min(amount * 0.05, 1500); // 5% cb
        const isHotel = nameL.includes('hotel') || catL.includes('hotel');
        const ctDisc = isHotel ? 0.20 : 0.0635;
        discountAmount = amount * ctDisc;
        cashbackAmount += discountAmount;
        benefitText = `5% CB + ${(ctDisc * 100).toFixed(2)}% Instant Discount (Code: CTSWHDFC)`;
      } else if (isOnline && isSwiggyAllowed) {
        cashbackAmount = Math.min(amount * 0.05, 1500);
        benefitText = '5% Cashback (Selected Online Merchant)';
      } else {
        cashbackAmount = amount * 0.01;
        benefitText = '1% Base Cashback';
      }
    }
    else if (card.id === 'kiwi-neon' && isScanToPay) {
      cashbackAmount = amount * 0.05;
      benefitText = '5% Rewards on UPI Scan & Pay';
    }
    // General processing for others
    else {
      let matchedBenefitValue = -1;
      let usedBenefit = null;

      for (const benefit of card.benefits) {
         let matchScore = -1;

         const usageKey = `${card.id}-${benefit.category}-${benefit.value}`;
         const usedCount = offerUsage[usageKey] || 0;
         if (benefit.usageLimit && usedCount >= benefit.usageLimit) {
            continue; // Skip this benefit if monthly limit is exhausted
         }

         if (isIntl) {
            if (benefit.type === 'forex' || benefit.category.toLowerCase() === 'all' || benefit.description.toLowerCase().includes('forex-positive')) {
               matchScore = 200 + (benefit.percentValue || 0);
            }
         } else {
            const pLower = benefit.category.toLowerCase();
            if (platL && pLower === platL) matchScore = 100 + (benefit.percentValue || 0);
            else if (pLower === catL) matchScore = 50 + (benefit.percentValue || 0);
            // HSBC Live+ Food/Grocery/Dining matching
            else if (card.id === 'hsbc-live-plus' && (nameL.includes('food') || catL.includes('food') || nameL.includes('restaurant') || catL.includes('restaurant'))) {
               if (pLower === 'dining') matchScore = 60;
            }
            else if (isOnline && pLower === 'online') matchScore = 20 + (benefit.percentValue || 0);
            else if (isScanToPay && pLower === 'upi scan') matchScore = 30 + (benefit.percentValue || 0);
            else if (benefit.type === 'offer' && (benefit.description.toLowerCase().includes(nameL) || (platL && benefit.description.toLowerCase().includes(platL)))) {
              matchScore = 80;
            }
            else if (pLower === 'all' || pLower === 'other') matchScore = benefit.percentValue || 0;
         }

         if (matchScore > matchedBenefitValue) {
            matchedBenefitValue = matchScore;
            usedBenefit = benefit;
         }
      }

      if (usedBenefit) {
        const rate = usedBenefit.percentValue || 0;
        const limitAmt = usedBenefit.maxSpend || amount;
        const eligibleSpend = Math.min(amount, limitAmt);
        const overSpend = Math.max(0, amount - limitAmt);
        
        let calculatedCb = (eligibleSpend * rate / 100);
        if (usedBenefit.capPerTxn) {
           calculatedCb = Math.min(calculatedCb, usedBenefit.capPerTxn);
        }
        
        const baseCb = (overSpend * card.baseRewardRate / 100);
        cashbackAmount = calculatedCb + baseCb;
        const capType = usedBenefit.type.charAt(0).toUpperCase() + usedBenefit.type.slice(1);
        benefitText = `${usedBenefit.value} ${capType}`;
      } else {
        cashbackAmount = (amount * card.baseRewardRate / 100);
        benefitText = `Base reward rate (${card.baseRewardRate}%)`;
      }
      
      if (!isExcluded && (catL.includes('movie') || nameL.match(/movie|cinepolis|pvr|inox|bookmyshow/i))) {
         const cinepolisDiscount = Math.min(amount * 0.25, 75);
         let onlineRate = card.baseRewardRate;
         if (card.id === 'sbi-cashback') onlineRate = 5;
         if (card.id === 'hdfc-swiggy') onlineRate = 5;
         const onlineCb = (amount * onlineRate) / 100;
         const totalCinepolisValue = cinepolisDiscount + onlineCb;
         
         if (totalCinepolisValue > cashbackAmount) {
            cashbackAmount = totalCinepolisValue;
            if (!nameL.includes('cinepolis')) {
               benefitText = `Switch to Cinepolis via Swiggy (Coupon + ${onlineRate}% CB)`;
            } else {
               benefitText = `Swiggy Cinepolis Coupon (₹${cinepolisDiscount.toFixed(0)} off) + ${onlineRate}% CB`;
            }
         }
      }

      if (!isExcluded && (catL.includes('ajio') || nameL.includes('ajio')) && amount >= 999) {
         const ajioDisc = amount * 0.20;
         cashbackAmount += ajioDisc;
         benefitText += ` + Swiggy Coupon (20% off)`;
      }
    }

    // Forex loading
    const loadedForexMarkup = card.forexMarkup * 1.18;
    const forexFee = isIntl ? (amount * loadedForexMarkup / 100) : 0;
    
    // Tata Neu check
    if (card.id === 'hdfc-tata-neu-infinity' && !isExcluded && !isIntl) {
      if (isTataNeuAppMerchant) {
         if (platL.includes('tata neu')) {
           cashbackAmount = amount * 0.10;
           benefitText = '10% Tata NeuCoins (5% Card + 5% NeuPass)';
         } else {
           cashbackAmount = amount * 0.05;
           benefitText = '5% Base (10% NeuCoins if purchased via Tata Neu App)';
         }
      } else if (catL.includes('utility') || catL.includes('bill')) {
         cashbackAmount = amount * 0.05;
         benefitText = '5% on Utility Payments via Tata Neu App';
      } else if (!isOnline) {
         cashbackAmount = amount * 0.015; // offline doesn't get 5% neupass!
         benefitText = '1.5% Base (10% if Neu App or 5% if Online)';
      }
    }

    const netValue = isExcluded ? -forexFee : (cashbackAmount - forexFee);

    return {
      card, netValue, cashbackEarned: isExcluded ? 0 : cashbackAmount, feesPaid: forexFee, benefitText, isExcluded
    };
  });

  const validOptions = calculationResults
      .filter(s => !s.isExcluded && !(s.netValue <= 0 && s.card.baseRewardRate === 0 && s.card.benefits.length === 0))
      .sort((a, b) => b.netValue - a.netValue);
  
  const bestResult = validOptions.length > 0 ? validOptions[0] : calculationResults.sort((a, b) => b.netValue - a.netValue)[0]; 

  let reason = '';
  if (isIntl) {
     if (bestResult.card.id === 'kotak-811-infinity') reason = "Kotak 811 is best for small international purchases as the 5% cashback beats the forex markup, limited to ₹2000 per txn.";
     else reason = "Calculates exact net value factoring in Forex markup + 18% GST vs Cashback earned.";
  }
  else if (bestResult.card.id === 'hdfc-tata-neu-infinity' && isTataNeuAppMerchant && !platL.includes('tata neu')) {
    reason = `Instead of making a direct purchase, buy from Tata Neu app using Tata Neu Infinity HDFC to get 10% NeuCoins.`;
  }
  else if (isScanToPay && (catL === 'other' || !nameL)) {
    reason = `For general P2P or unknown merchants, use CRED, Amazon, or Kotak 811 Scan & Pay for a better chance at rewards.`;
  }
  else reason = `Based on your amount, this yields the highest net returns for ${merchant.category.toLowerCase()} ${merchant.platform ? `on ${merchant.platform}🎉` : '🎉'}`;

  // Fallback advice if net values are low
  if (bestResult.netValue < amount * 0.01 && !isIntl) {
     reason += " If this merchant doesn't offer good card rewards, consider using CRED, Amazon, or Kotak 811 Scan & Pay for better base rewards.";
  }

  if (nameL.includes('indigo')) {
     reason += " Also, don't forget to redeem your Indigo BluChips!";
  }
  
  if (catL.includes('movie') || nameL.match(/movie|cinepolis|pvr|inox|bookmyshow|district/i)) {
     const movieOffers = [];
     const bmsUsed = offerUsage['kotak-811-infinity-Movies-BookMyShow'] || 0;
     if (bmsUsed < 1) movieOffers.push("\n🔹 Kotak 811 BookMyShow 1+1");
     const districtUsed = offerUsage['axis-myzone-Movies-District'] || 0;
     if (districtUsed < 1) movieOffers.push("\n🔹 Axis MyZone District 1+1");
     movieOffers.push("\n🔹 Swiggy x Cinepolis (25% up to ₹75)\n🔹 Club Cinepolis Points");
     
     reason += ` \n\n🎬 Available Movie Offers: ${movieOffers.join(" ")}`;
  }

  if (nameL.includes('ajio') || platL.includes('ajio') || catL.includes('ajio')) {
     reason += " \n\n🛍️ Make sure to use your Swiggy Coupon for Ajio (Flat 20% off on min ₹999 spend) with whichever card you choose!";
  }

  return {
    bestCard: bestResult.card,
    reason,
    expectedBenefit: bestResult.benefitText,
    netValue: bestResult.netValue,
    cashbackEarned: bestResult.cashbackEarned,
    feesPaid: bestResult.feesPaid,
    alternatives: validOptions.slice(1, 4).map(s => ({ card: s.card, benefit: s.benefitText, netValue: s.netValue }))
  };
}
