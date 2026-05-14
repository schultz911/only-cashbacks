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
  offerUsage: Record<string, number> = {},
  kiwiNeonEarnRate: number = 2
): Recommendation {

  const nameL = merchant.name.toLowerCase();
  const catL = merchant.category.toLowerCase();
  const platL = merchant.platform?.toLowerCase() || '';

  const isGrocery = catL.includes('grocery') || nameL.includes('grocery') || ['bigbasket', 'blinkit', 'instamart', 'zepto', 'swiggy instamart', 'dmart', 'reliance fresh', "nature's basket", 'spencers'].some(g => nameL.includes(g) || platL.includes(g) || catL.includes(g));

  // Google Play special logic
  if (nameL.includes('google play') || platL.includes('google play')) {
    const sbiCard = CARD_DATA.find(c => c.id === 'sbi-cashback')!;
    const isExhausted = exhaustedCards['sbi-cashback'];
    return {
      bestCard: sbiCard,
      reason: isExhausted
        ? "Using Amazon Gift Card via SBI Cashback. (Accelerated limit reached, earning base rewards)"
        : "For Google Play, always buy an Amazon Gift Card with the SBI Cashback card and load using Amazon's Rewards Gold offer of 5% on Google Play recharges.",
      expectedBenefit: isExhausted ? "5% Amazon Rewards Gold" : "5% Cashback + 5% Amazon Rewards Gold",
      netValue: (isExhausted ? 0 : Math.min(amount, 40000) * 0.05) + (amount * 0.05),
      cashbackEarned: (isExhausted ? 0 : Math.min(amount, 40000) * 0.05) + (amount * 0.05),
      feesPaid: 0,
      alternatives: []
    };
  }

  // Tata Neu merchants
  const tataNeuMerchants = ['croma', 'westside', 'zudio', 'ihcl', 'bigbasket', '1mg', 'cliq', 'air india', 'air india express', 'qmin', 'cult', 'tata play', 'titan', 'tanishq', 'mia', 'fastrack', 'caratlane', 'helios', 'zoya'];
  const isTataNeuAppMerchant = tataNeuMerchants.some(tm => nameL.includes(tm) || catL.includes(tm) || platL.includes(tm));

  const calculationResults = CARD_DATA.map(card => {
    let cashbackAmount = 0;
    let benefitText = 'Base Rewards';
    let isExcluded = false;
    let discountAmount = 0;
    let cardToUse = { ...card };

    if (isScanToPay) {
      const allowedUpiCards = ['kiwi-neon', 'amazon-pay-upi', 'cred-pay-upi', 'kotak-811-infinity'];
      if (!allowedUpiCards.includes(card.id)) {
        isExcluded = true;
        benefitText = "Not a Scan & Pay option";
      }
      if (card.id === 'kotak-811-infinity') {
        cardToUse.name = '811 Scan & Pay';
      }
    }

    const defaultExclusions = ['fuel', 'wallet', 'rent', 'housing', 'gambling', 'gaming', 'toll', 'finance', 'school', 'education', 'jewellery', 'insurance', 'railway', 'government', 'tax'];

    if (card.type === 'Credit' || card.type === 'Debit') {
      const isExcludedCat = defaultExclusions.find(ex => catL.includes(ex) || nameL.includes(ex) || platL.includes(ex));
      if (isExcludedCat) {
        isExcluded = true;
        benefitText = `Excluded category (${isExcludedCat})`;

        if (isExcludedCat === 'gaming' && !catL.includes('gambling') && !nameL.includes('gambling')) {
          if (card.id === 'hsbc-live-plus' || card.id === 'kotak-811-infinity') {
            isExcluded = false;
          }
        }
        if (card.id === 'hdfc-tata-neu-infinity') {
          if (catL.includes('utility') || isExcludedCat === 'toll' ||
            (isExcludedCat === 'jewellery') ||
            (isExcludedCat === 'insurance')) {
            isExcluded = false;
          }
        }
        if (card.id === 'kotak-811-infinity' && isExcludedCat === 'fuel') {
          isExcluded = false;
        }
        if (card.id === 'one-card' && isExcludedCat === 'fuel') {
          isExcluded = false; // it will hit the 5% benefit up to 50 Rs logic
        }
      }
    }

    // Default Exclusions checking
    const exclusion = card.benefits.find(b =>
      b.type === 'exclusion' &&
      (catL === b.category.toLowerCase() || nameL.includes(b.category.toLowerCase()) || platL === b.category.toLowerCase())
    );

    if (exclusion) {
      isExcluded = true;
      benefitText = 'Excluded from earning rewards';
    } else if (exhaustedCards[card.id]) {
      cashbackAmount = amount * (card.baseRewardRate / 100);
      benefitText = `Monthly limit reached. Earning (${card.baseRewardRate}% base rewards.)`;
    } else if (card.id === 'hdfc-tata-neu-infinity' && !isIntl) {
      if (isGrocery && isTataNeuAppMerchant && isOnline) {
        const eligibleSpend = Math.min(amount, 15000);
        cashbackAmount = (eligibleSpend * 0.035) + (amount * card.baseRewardRate / 100) + (amount * 0.05);
        benefitText = '10% NeuCoins on BigBasket via Tata Neu app';
      } else if (!isGrocery && isTataNeuAppMerchant && isOnline) {
        cashbackAmount = (amount * 0.035) + (amount * card.baseRewardRate / 100) + (amount * 0.05);
        benefitText = '10% NeuCoins via Tata neu app';
      } else if (!isGrocery && isTataNeuAppMerchant && !isOnline) {
        {
          cashbackAmount = (amount * 0.035) + (amount * card.baseRewardRate / 100);
          benefitText = '5% NeuCoins in offline stores';
        }
      } else if ((nameL.includes('grocery') || nameL.includes('groceries')) && isOnline) {
        {
          const eligibleSpend = Math.min(amount, 15000);
          cashbackAmount = (eligibleSpend * 0.035) + (amount * card.baseRewardRate / 100) + (amount * 0.05);
          benefitText = '10% NeuCoins on BigBasket via Tata Neu app';
        }
      } else if ((nameL.includes('grocery') || nameL.includes('groceries')) && !isOnline) {
        {
          cashbackAmount = amount * card.baseRewardRate / 100;
          benefitText = '1.5% NeuCoins';
        }
      }
      else if (catL.includes('utility') || catL.includes('utilities') || catL.includes('telecom') || catL.includes('internet') || catL.includes('bill') || catL.includes('bills') || platL.includes('tata play')) {
        const eligibleSpend = Math.min(amount, 40000);
        cashbackAmount = (eligibleSpend * 0.035) + (eligibleSpend * card.baseRewardRate / 100);
        benefitText = '5% NeuCoins via Tata Neu App';
      } else if (!isOnline) {
        cashbackAmount = amount * card.baseRewardRate / 100;
        benefitText = '1.5% NeuCoins';
      } else {
        cashbackAmount = amount * card.baseRewardRate / 100;
        benefitText = '1.5% NeuCoins';
      }
    } else if (card.id === 'hdfc-swiggy') {
      if (isIntl) {
        isExcluded = true;
        benefitText = 'Excluded from earning rewards on International';
      } else if (nameL.includes('swiggy') || nameL.includes('dineout') || platL.includes('swiggy') || platL.includes('dineout') || platL.includes('instamart') || isGrocery || catL.includes('dining') || nameL.includes('dining') || nameL.includes('restaurant') || catL.includes('restaurant')) {
        const eligible = Math.min(amount, 15000);
        cashbackAmount = (eligible * 0.10);
        benefitText = '10% Cashback';
      } else if (isOnline && (nameL.includes('nykaa') || platL.includes('nykaa'))) {
        const eligible = Math.min(amount, 30000);
        const over = Math.max(0, amount - 30000);
        cashbackAmount = (eligible * 0.05) + (over * 0.01);
        discountAmount = amount * 0.05;
        benefitText = `5% Cashback + 5% Instant Discount`;
        cashbackAmount += discountAmount;
      } else if (isOnline && (nameL.includes('cleartrip') || platL.includes('cleartrip'))) {
        const eligible = Math.min(amount, 30000);
        const over = Math.max(0, amount - 30000);
        cashbackAmount = (eligible * 0.05) + (over * 0.01);
        const isHotel = nameL.includes('hotel') || catL.includes('hotel');
        const ctDisc = isHotel ? 0.20 : 0.0635;
        discountAmount = amount * ctDisc;
        cashbackAmount += discountAmount;
        benefitText = `5% Cashback + ${(ctDisc * 100).toFixed(2)}% Instant Discount (Code: CTSWHDFC)`;
      } else if (isOnline && !catL.includes('utility') && !nameL.includes('utility')) {
        const eligible = Math.min(amount, 30000);
        const over = Math.max(0, amount - 30000);
        cashbackAmount = (eligible * 0.05) + (over * 0.01);
        benefitText = '5% Cashback';
      } else {
        cashbackAmount = amount * 0.01;
        benefitText = '1% Base Rewards';
      }
    } else if (card.id === 'kiwi-neon' && (isScanToPay || isOnline)) {
      cashbackAmount = amount * (kiwiNeonEarnRate / 100);
      benefitText = `${kiwiNeonEarnRate}% Cashback on ${isScanToPay ? 'Scan & Pay' : 'Online UPI'}`;
    } else if (card.id === 'kotak-811-infinity' && !isScanToPay) {
      // Special logic for Kotak 811 offers + cashback
      const movieUsed = offerUsage['kotak-811-infinity-Movies-BookMyShow'] || 0;
      const diningUsed = offerUsage['kotak-811-infinity-Dining-District'] || 0;

      if ((catL.includes('movie') || nameL.includes('bookmyshow')) && movieUsed < 1) {
        discountAmount = Math.min(amount * 0.5, 300);
        const remaining = amount - discountAmount;
        cashbackAmount = discountAmount + (remaining * 0.05);
        benefitText = '50% BMS Discount + 5% Cashback';
      } else if ((catL.includes('dining') || nameL.includes('district')) && diningUsed < 1) {
        discountAmount = Math.min(amount * 0.15, 500); // Assuming 15% up to 500 for District
        const remaining = amount - discountAmount;
        cashbackAmount = discountAmount + (remaining * 0.05);
        benefitText = '15% District Discount + 5% Cashback';
      } else {
        cashbackAmount = amount * 0.05;
        benefitText = '5% Cashback';
      }
    } else {
      let matchedBenefitValue = -1;
      let usedBenefit = null;

      const moviePlatforms = ['bookmyshow', 'district', 'pvr', 'inox', 'cinepolis', 'paytm'];
      const diningPlatforms = ['swiggy', 'zomato', 'eazydiner', 'dineout', 'district'];
      const searchedMoviePlat = moviePlatforms.find(p => nameL.includes(p) || (platL && platL.includes(p)));
      const searchedDiningPlat = diningPlatforms.find(p => nameL.includes(p) || (platL && platL.includes(p)));

      for (const benefit of card.benefits) {
        let matchScore = -1;

        const usageKey = `${card.id}-${benefit.category}-${benefit.value}`;
        const usedCount = offerUsage[usageKey] || 0;
        if (benefit.usageLimit && usedCount >= benefit.usageLimit) {
          continue;
        }

        if (benefit.type === 'offer') {
          const descL = benefit.description.toLowerCase();
          const valLower = benefit.value.toLowerCase();
          const isMovieOffer = benefit.category.toLowerCase().includes('movie') || descL.includes('movie') || descL.includes('ticket');
          const isDiningOffer = benefit.category.toLowerCase().includes('dining') || benefit.category.toLowerCase().includes('swiggy') || benefit.category.toLowerCase().includes('zomato');

          let skip = false;
          const specificPlatforms = ['bookmyshow', 'district', 'swiggy', 'zomato', 'dineout', 'eazydiner', 'nykaa', 'cleartrip', 'ajio'];

          for (const plat of specificPlatforms) {
            if (descL.includes(plat) || valLower.includes(plat)) {
              if (!nameL.includes(plat) && !(platL && platL.includes(plat))) {
                skip = true;

                if (isMovieOffer && (catL.includes('movie') || nameL.includes('movie')) && !nameL.match(/cinepolis|pvr|inox|bookmyshow|district/i)) {
                  if (!searchedMoviePlat) skip = false;
                }
                if (isDiningOffer && (catL.includes('dining') || nameL.includes('dining')) && !nameL.match(/swiggy|zomato|eazydiner|dineout|district/i)) {
                  if (!searchedDiningPlat) skip = false;
                }
              }
              break;
            }
          }

          if (skip) continue;
        }

        const pLower = benefit.category.toLowerCase();
        if (platL && pLower === platL) matchScore = 100 + (benefit.percentValue || 0);
        else if (pLower === catL) matchScore = 50 + (benefit.percentValue || 0);
        else if (card.id === 'hsbc-live-plus' && (isGrocery || nameL.includes('food') || catL.includes('food') || nameL.includes('restaurant') || catL.includes('restaurant') || nameL.includes('dining'))) {
          if (pLower.includes('dining') || pLower.includes('grocery')) matchScore = 60;
        }
        else if ((nameL.includes('food') || catL.includes('food') || nameL.includes('dining') || catL.includes('dining')) && (pLower === 'swiggy' || pLower === 'zomato' || pLower === 'dining')) {
          matchScore = 70;
        }
        else if ((nameL.includes('movie') || catL.includes('movie') || nameL.includes('bookmyshow') || nameL.includes('district') || nameL.includes('pvr') || nameL.includes('inox') || nameL.includes('cinepolis') || nameL.includes('entertainment')) && (pLower === 'movies' || pLower === 'entertainment' || benefit.description.toLowerCase().includes('movie'))) {
          matchScore = 70;
        }
        else if (card.id === 'axis-myzone' && (nameL.includes('ajio') || platL.includes('ajio'))) {
          if (pLower.includes('fashion') || pLower.includes('ajio')) matchScore = 95;
        }
        else if (card.id === 'axis-myzone' && (nameL.includes('eazydiner') || platL.includes('eazydiner'))) {
          if (pLower.includes('dining') || pLower.includes('eazydiner')) matchScore = 95;
        }
        else if (isOnline && (pLower === 'online' || pLower === 'online upi')) matchScore = 20 + (benefit.percentValue || 0);
        else if (!isOnline && pLower === 'offline') matchScore = 20 + (benefit.percentValue || 0);
        else if (isScanToPay && pLower === 'upi scan') matchScore = 30 + (benefit.percentValue || 0);
        else if (benefit.type === 'offer' && (benefit.description.toLowerCase().includes(nameL) || (platL && benefit.description.toLowerCase().includes(platL)))) {
          matchScore = 80;
        }
        else if (pLower === 'all' || pLower === 'all spends' || pLower === 'other') matchScore = benefit.percentValue || 0;

        if (matchScore > matchedBenefitValue) {
          matchedBenefitValue = matchScore;
          usedBenefit = benefit;
        }
      }

      if (usedBenefit) {
        if (usedBenefit.minSpend && amount < usedBenefit.minSpend) {
          cashbackAmount = (amount * card.baseRewardRate / 100);
          benefitText = `${card.baseRewardRate}% Base Rewards (Min ₹${usedBenefit.minSpend} not met)`;
        } else {
          const rate = usedBenefit.percentValue || 0;
          const limitAmt = usedBenefit.maxSpend || amount;
          const eligibleSpend = Math.min(amount, limitAmt);
          const overSpend = Math.max(0, amount - limitAmt);

          let calculatedCb = (eligibleSpend * rate / 100);
          if (usedBenefit.capPerTxn) {
            calculatedCb = Math.min(calculatedCb, usedBenefit.capPerTxn);
          }

          const fallbackRate = usedBenefit.fallbackRate !== undefined ? usedBenefit.fallbackRate : card.baseRewardRate;
          const baseCb = (overSpend * fallbackRate / 100);
          cashbackAmount = calculatedCb + baseCb;
          const capType = usedBenefit.type.charAt(0).toUpperCase() + usedBenefit.type.slice(1);
          if (card.id === 'axis-myzone') {
            if (usedBenefit.category === 'Swiggy') benefitText = `Flat ₹120 Off (Code: AXIS120)`;
            else if (usedBenefit.category === 'Movies') benefitText = `1+1 via District (Code: AXIS200)`;
            else if (usedBenefit.category === 'Fashion') benefitText = `Up to ₹1,000 Off (Code: AJIOAXISMZ)`;
            else if (usedBenefit.category === 'Dining') benefitText = `${rate}% Off via EazyDiner`;
            else benefitText = `${usedBenefit.value} ${capType}`;
          } else {
            benefitText = `${usedBenefit.value} ${capType}`;
          }
        }
      } else {
        cashbackAmount = (amount * card.baseRewardRate / 100);
        benefitText = `${card.baseRewardRate}% Base Rewards`;
      }
    }

    // Apply Universal Offers (Coupons from Swiggy One apply regardless of card limits if not excluded)
    if (!isExcluded && !exhaustedCards[card.id] && !isIntl) {
      if (catL.includes('movie') || nameL.match(/movie|cinepolis|pvr|inox|bookmyshow/i)) {
        const cinepolisDiscount = Math.min(amount * 0.25, 75);
        let onlineRate = card.baseRewardRate;
        let onlineCap = amount;
        if (card.id === 'sbi-cashback') {
          onlineRate = 5;
          onlineCap = 40000;
        }
        if (card.id === 'hdfc-swiggy') {
          onlineRate = 5;
          onlineCap = 30000;
        }
        const eligibleAmt = Math.min(amount, onlineCap);
        const overSpend = Math.max(0, amount - onlineCap);
        const onlineCb = (eligibleAmt * onlineRate / 100) + (overSpend * card.baseRewardRate / 100);
        const totalCinepolisValue = cinepolisDiscount + onlineCb;

        if (totalCinepolisValue > cashbackAmount && !nameL.includes('bookmyshow') && !nameL.includes('district')) {
          cashbackAmount = totalCinepolisValue;
          if (!nameL.includes('cinepolis')) {
            benefitText += ` (Better Deal: Swiggy Cinepolis with ₹${cinepolisDiscount.toFixed(0)} off)`;
          } else {
            benefitText += ` with Swiggy Cinepolis Coupon for ₹${cinepolisDiscount.toFixed(0)} off!`;
          }
        }
      }

      if ((catL.includes('ajio') || nameL.includes('ajio')) && amount >= 999) {
        const ajioDisc = amount * 0.20;
        cashbackAmount += ajioDisc;
        benefitText += ` with Swiggy One Coupon (20% off)`;
      }
    }

    // Forex loading
    const loadedForexMarkup = card.forexMarkup * 1.18;
    const forexFee = isIntl ? (amount * loadedForexMarkup / 100) : 0;

    const netValue = isExcluded ? -forexFee : (cashbackAmount - forexFee);

    return {
      card: cardToUse, netValue, cashbackEarned: isExcluded ? 0 : cashbackAmount, feesPaid: forexFee, benefitText, isExcluded
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
    if (!nameL.match(/cinepolis|pvr|inox|district/i)) {
      if (bmsUsed < 1) movieOffers.push("\n🔹 Kotak 811 BookMyShow 1+1");
      const imperiaUsed = offerUsage['hdfc-imperia-Movies-25%'] || 0;
      if (imperiaUsed < 1) movieOffers.push("\n🔹 HDFC Imperia BookMyShow 25%");
    }
    const districtUsed = offerUsage['axis-myzone-Movies-District'] || 0;
    if (districtUsed < 1 && !nameL.match(/cinepolis|pvr|inox|bookmyshow/i)) movieOffers.push("\n🔹 Axis MyZone District 1+1");

    if (!nameL.match(/bookmyshow|district/i)) {
      movieOffers.push("\n🔹 Swiggy Cinepolis (25% up to ₹75)\n🔹 Club Cinepolis Points");
    }

    reason += ` \n\n🎬 Available Movie Offers: ${movieOffers.join(" ")}`;
  }

  if (nameL.includes('ajio') || platL.includes('ajio') || catL.includes('ajio')) {
    reason += " \n\n🛍️ Make sure to use your Swiggy Coupon for Ajio (Flat 20% off on min ₹999 spend) with whichever card you choose!";
  }

  if ((catL.includes('food') || catL.includes('dining') || nameL.includes('swiggy') || nameL.includes('zomato')) && !nameL.includes('cinepolis')) {
    const swiggyOffers = [];

    const districtDiningUsed = offerUsage['kotak-811-infinity-Dining-District'] || 0;
    if (districtDiningUsed < 1) {
      if (nameL.includes('district') || nameL.includes('dining') || catL.includes('dining')) {
        swiggyOffers.push("\n🔹 Kotak 811 Infinity District Dining 15%");
      }
    }

    const myZoneSwiggyUsed = offerUsage['axis-myzone-Swiggy-Flat ₹120'] || 0;
    if (myZoneSwiggyUsed < 2) swiggyOffers.push("\n🔹 Axis MyZone Flat ₹120 off");
    const imperiaSwiggyUsed = offerUsage['hdfc-imperia-Swiggy-5%'] || 0;
    if (imperiaSwiggyUsed < 3000) swiggyOffers.push("\n🔹 HDFC Imperia 5% up to ₹150");

    if (swiggyOffers.length > 0) {
      reason += ` \n\n🍔 Available Dining Offers: ${swiggyOffers.join(" ")}`;
    }
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
