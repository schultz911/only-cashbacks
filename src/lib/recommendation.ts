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

  const isGrocery = catL.includes('grocery') || nameL.includes('grocery') || nameL.includes('grocer') || nameL.includes('groce') || nameL.includes('bigbasket') || nameL.includes('blinkit') || nameL.includes('zepto') || nameL.includes('instamart') || ['bigbasket', 'blinkit', 'zepto', 'instamart', 'swiggy instamart', 'dunzo', 'jiomart'].some(g => nameL.includes(g) || platL.includes(g) || catL.includes(g));
  const isFoodDelivery = catL.includes('food delivery') || nameL.includes('delivery') || nameL.includes('food') || nameL.includes('swig') || nameL.includes('zomat') || ['swiggy', 'zomato', 'toing', 'bistro', 'box8', 'eatsure', 'freshmenu', 'eatclub', 'uber eats'].some(d => nameL.includes(d) || platL.includes(d) || catL.includes(d));
  const isDining = catL.includes('dining') || nameL.includes('dine') || nameL.includes('restaurant') || nameL.includes('eatery') || nameL.includes('cafe') || nameL.includes('district') || nameL.includes('zomato') || nameL.includes('swiggy');
  const isMovie = catL.includes('movie') || nameL.includes('movie') || ['bookmyshow', 'bms', 'pvr', 'inox', 'cinepolis', 'theatre', 'cinema', 'district'].some(m => nameL.includes(m) || platL.includes(m) || catL.includes(m));

  // Google Play special logic
  if (nameL.includes('google') || platL.includes('google')) {
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
  const isTataNeuPartnerMerchant = ['pharmacy', 'medical', 'health', 'apparel', 'clothing', 'fashion', 'electronics', 'gadgets', 'footwear', 'watches', 'accessories', 'jewelry', 'jewellery', 'hotel', 'resort', 'travel', 'luxury'].some(k => nameL.includes(k));

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

    if (isIntl) {
      const allowedIntlCards = ['kotak-811-infinity', 'sbi-cashback', 'niyo-dcb'];
      if (!allowedIntlCards.includes(card.id)) {
        isExcluded = true;
        benefitText = "Not optimized for International spend";
      }
    }

    const defaultExclusions = ['fuel', 'wallet', 'rent', 'housing', 'gambling', 'gaming', 'toll', 'finance', 'school', 'education', 'jewellery', 'insurance', 'railway', 'government', 'tax', 'utility', 'bills', 'bill', 'telecom', 'internet'];

    if (card.type === 'Credit' || card.type === 'Debit') {
      const isExcludedCat = defaultExclusions.find(ex => catL.includes(ex) || nameL.includes(ex) || platL.includes(ex));
      if (isExcludedCat) {
        isExcluded = true;
        benefitText = `Excluded category (${isExcludedCat})`;

        if (isExcludedCat === 'gaming' && !catL.includes('gambling') && !nameL.includes('gambling')) {
          if (card.id === 'hsbc-live-plus' || card.id === 'kotak-811-infinity') {
            isExcluded = false;
            benefitText = 'Base Rewards';
          }
        }
        if (card.id === 'hdfc-tata-neu-infinity') {
          if (catL.includes('utility') || isExcludedCat === 'toll' ||
            (isExcludedCat === 'jewellery') ||
            (isExcludedCat === 'insurance')) {
            isExcluded = false;
            benefitText = 'Base Rewards';
          }
        }
        if (card.id === 'kotak-811-infinity' && isExcludedCat === 'fuel') {
          isExcluded = false;
          benefitText = 'Base Rewards';
        }
        if (card.id === 'one-card' && isExcludedCat === 'fuel') {
          isExcluded = false; // it will hit the 5% benefit up to 50 Rs logic
          benefitText = 'Base Rewards';
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
      // Priority 1: Specific Tata Neu app merchants (BigBasket, Qmin, Croma, etc.)
      if (isTataNeuAppMerchant && isOnline) {
        if (isGrocery) {
          const eligibleSpend = Math.min(amount, 15000);
          cashbackAmount = (eligibleSpend * 0.035) + (amount * card.baseRewardRate / 100) + (amount * 0.05);
          benefitText = '10% NeuCoins on BigBasket via Tata Neu';
        } else if (isFoodDelivery) {
          const eligibleSpend = Math.min(amount, 15000);
          cashbackAmount = (eligibleSpend * 0.035) + (amount * card.baseRewardRate / 100) + (amount * 0.05);
          benefitText = '10% NeuCoins on Qmin via Tata Neu';
        } else {
          cashbackAmount = (amount * 0.035) + (amount * card.baseRewardRate / 100) + (amount * 0.05);
          benefitText = '10% NeuCoins via Tata Neu';
        }
      } else if (isTataNeuAppMerchant && !isOnline) {
        cashbackAmount = (amount * 0.035) + (amount * card.baseRewardRate / 100);
        benefitText = '5% NeuCoins in Offline Stores';
        // Priority 2: Generic food/grocery searches (suggest routing through Tata Neu app)
      } else if ((isGrocery || isFoodDelivery) && isOnline) {
        const eligibleSpend = Math.min(amount, 15000);
        cashbackAmount = (eligibleSpend * 0.035) + (amount * card.baseRewardRate / 100) + (amount * 0.05);
        benefitText = isGrocery
          ? '10% NeuCoins — Buy via BigBasket on Tata Neu'
          : '10% NeuCoins — Order via Tata Neu';
        // Priority 3: Tata partner category merchants (fashion, electronics, etc.)
      } else if (isTataNeuPartnerMerchant && isOnline) {
        cashbackAmount = (amount * 0.035) + (amount * card.baseRewardRate / 100) + (amount * 0.05);
        benefitText = '10% NeuCoins via Tata Neu';
      } else if (isTataNeuPartnerMerchant && !isOnline) {
        cashbackAmount = (amount * 0.035) + (amount * card.baseRewardRate / 100);
        benefitText = '5% NeuCoins in Offline Stores';
        // Priority 4: Utilities & bill payments
      } else if (catL.includes('utilities') || nameL.includes('internet') || nameL.includes('bill') || nameL.includes('bills') || nameL.includes('toll') || nameL.includes('tata play') || nameL.includes('fastag')) {
        const eligibleSpend = Math.min(amount, 40000);
        cashbackAmount = (eligibleSpend * 0.035) + (eligibleSpend * card.baseRewardRate / 100);
        benefitText = '5% NeuCoins via Tata Neu';
        // Fallback: Base rewards
      } else {
        cashbackAmount = amount * card.baseRewardRate / 100;
        benefitText = '1.5% NeuCoins';
      }
    } else if (card.id === 'hdfc-swiggy') {
      if (isIntl) {
        isExcluded = true;
        benefitText = 'Excluded from earning rewards on International';
      } else if (isOnline && (isFoodDelivery || isDining || isGrocery)) {
        const eligible = Math.min(amount, 15000);
        cashbackAmount = (eligible * 0.10);
        benefitText = '10% Cashback';
      } else if (isOnline && (nameL.includes('nykaa') || platL.includes('nykaa') || catL.includes('beauty'))) {
        const eligible = Math.min(amount, 30000);
        const over = Math.max(0, amount - 30000);
        cashbackAmount = (eligible * 0.05) + (over * 0.01);
        discountAmount = amount * 0.05;
        benefitText = `5% Cashback + 5% Instant Discount`;
        cashbackAmount += discountAmount;
      } else if (isOnline && (nameL.includes('cleartrip') || catL.includes('travel') || platL.includes('cleartrip'))) {
        const eligible = Math.min(amount, 30000);
        const over = Math.max(0, amount - 30000);
        cashbackAmount = (eligible * 0.05) + (over * 0.01);
        const isHotel = nameL.includes('hotel') || catL.includes('hotel');
        const ctDisc = isHotel ? 0.20 : 0.0635;
        discountAmount = amount * ctDisc;
        cashbackAmount += discountAmount;
        benefitText = `5% Cashback + ${(ctDisc * 100).toFixed(2)}% Instant Discount (Code: CTSWHDFC)`;
      } else if (isOnline && !catL.includes('utility') && !nameL.includes('utility') && !catL.includes('fuel') && !nameL.includes('fuel') && !catL.includes('gaming') && !nameL.includes('gaming') && !catL.includes('gambling') && !nameL.includes('gambling') && !catL.includes('finance') && !nameL.includes('finance') && !catL.includes('education') && !nameL.includes('education') && !catL.includes('school') && !nameL.includes('school') && !catL.includes('rail') && !nameL.includes('rail') && !catL.includes('travel') && !nameL.includes('travel') && !catL.includes('flights') && !nameL.includes('flights') && !catL.includes('hotel') && !nameL.includes('hotel')) {
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
    } else if (card.id === 'kotak-811-infinity' && isScanToPay) {
      cashbackAmount = 3;
      benefitText = 'Mystery Cashback on Scan & Pay';
    } else if (card.id === 'kotak-811-infinity' && !isScanToPay) {
      // Special logic for Kotak 811 offers + cashback
      const movieUsed = offerUsage['kotak-811-infinity-Movies-BMS'] || 0;
      const diningUsed = offerUsage['kotak-811-infinity-Dining-District'] || 0;

      if (isIntl) {
        cashbackAmount = Math.min(amount * 0.05, 100);
        benefitText = '5% Cashback';
      } else if (isMovie && movieUsed < 1) {
        discountAmount = Math.min(amount * 0.5, 300);
        const remaining = amount - discountAmount;
        cashbackAmount = discountAmount + Math.min(remaining * 0.05, 100);
        benefitText = '1+1 Movie on BookMyShow + 5% Cashback';
      } else if ((isDining || nameL.includes('district')) && diningUsed < 1) {
        discountAmount = Math.min(amount * 0.15, 500); // Assuming 15% up to 500 for District
        const remaining = amount - discountAmount;
        cashbackAmount = discountAmount + Math.min(remaining * 0.05, 100);
        benefitText = '15% Instant Discount + 5% Cashback';
      } else {
        cashbackAmount = Math.min(amount * 0.05, 100);
        benefitText = '5% Cashback';
      }
    } else {
      let matchedBenefitValue = -1;
      let usedBenefit = null;

      const moviePlatforms = ['bookmyshow', 'bms', 'paytm insider', 'townscript', 'mera event', 'pvr', 'inox', 'cinepolis', 'movie', 'cinema', 'theatre', 'district'];
      const diningPlatforms = ['swiggy', 'toing', 'dineout', 'zomato', 'bistro', 'blinkit', 'zepto cafe', 'eatsure', 'fresh menu', 'box8', 'eat club', 'uber eats', 'domino', 'pizza hut', 'magicpin', 'starbucks', 'mcdonald', 'kfc', 'burger king', 'haldiram', 'bikanervala', 'cafe', 'restaurant', 'diner', 'eatery', 'pub', 'bar', 'coffee', 'district'];
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

                if (isMovieOffer && (catL.includes('movie') || nameL.includes('movie')) && !nameL.match(/cinepolis|pvr|inox|bookmyshow|district|bms|paytm insider|townscript|mera event|cinema|theatre/i)) {
                  if (!searchedMoviePlat) skip = false;
                }
                if (isDiningOffer && (catL.includes('dining') || nameL.includes('dining')) && !nameL.match(/swiggy|zomato|eazydiner|dineout|district|toing|bistro|blinkit|zepto cafe|eatsure|fresh menu|box8|eat club|uber eats|domino|pizza hut|magicpin|starbucks|mcdonald|kfc|burger king|haldiram|bikanervala|cafe|restaurant|diner|eatery|pub|bar|coffee/i)) {
                  if (!searchedDiningPlat) skip = false;
                }
              }
              break;
            }
          }

          if (skip) continue;
        }

        const pLower = `${benefit.category} ${benefit.value} ${benefit.description || ''}`.toLowerCase();
        if (platL && pLower.includes(platL)) matchScore = 100 + (benefit.percentValue || 0);
        else if (pLower.includes(catL) && catL !== 'other') matchScore = 50 + (benefit.percentValue || 0);
        else if (card.id === 'hsbc-live-plus' && !isIntl && (isGrocery || isFoodDelivery || isDining)) {
          if (pLower.includes('dining') || pLower.includes('grocery') || pLower.includes('groceries') || pLower.includes('food')) matchScore = 60;
        }
        else if ((isFoodDelivery || isDining) && (pLower.includes('swiggy') || pLower.includes('district') || pLower.includes('dining'))) {
          matchScore = 70;
        }
        else if (isMovie && (pLower.includes('movie') || pLower.includes('ticket'))) {
          matchScore = 70;
        }
        else if ((card.id === 'axis-myzone') && (nameL.includes('ajio') || platL.includes('ajio'))) {
          if (pLower.includes('fashion') || pLower.includes('ajio')) matchScore = 95;
        }
        else if ((card.id === 'axis-myzone' || card.id === 'kotak-811-infinity') && (nameL.includes('eazydiner') || platL.includes('eazydiner') || nameL.includes('district') || platL.includes('district'))) {
          if (pLower.includes('dining') || pLower.includes('eazydiner') || pLower.includes('district')) matchScore = 95;
        }
        else if (isOnline && benefit.category.toLowerCase().includes('online')) matchScore = 20 + (benefit.percentValue || 0);
        else if (!isOnline && benefit.category.toLowerCase().includes('offline')) matchScore = 20 + (benefit.percentValue || 0);
        else if (isScanToPay && pLower.includes('scan')) matchScore = 30 + (benefit.percentValue || 0);
        else if (benefit.type === 'offer' && (benefit.description.toLowerCase().includes(nameL) || (platL && benefit.description.toLowerCase().includes(platL)))) {
          matchScore = 80;
        }
        else if (pLower.includes('all') || pLower.includes('all spends') || pLower.includes('other')) {
          matchScore = (benefit.percentValue || 0) * 5;
        }

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

            if (usedBenefit.value === 'Swiggy') benefitText = `Flat ₹120 Off (Code: AXIS120)`;
            else if (usedBenefit.category === 'Movies') benefitText = `1+1 via District (Code: AXIS200)`;
            else if (usedBenefit.category === 'Fashion') benefitText = `Up to ₹1,000 Off (Code: AJIOAXISMZ)`;
            else if (usedBenefit.category === 'Dining') benefitText = `${rate}% Off via EazyDiner`;
            else benefitText = `${usedBenefit.value} ${capType}`;
          }
          else if (card.id === 'kotak-811-infinity') {
            if (usedBenefit.category === 'Dining' && usedBenefit.value === 'District') benefitText = `20% Off via District`;
            else if (usedBenefit.category === 'Movies' && usedBenefit.value === 'BMS') benefitText = `1+1 Movie Ticket on BMS`;
            else benefitText = `${usedBenefit.value} ${capType}`;
          }
          else {
            benefitText = `${usedBenefit.value} ${capType}`;
          }
        }
      } else {
        cashbackAmount = (amount * card.baseRewardRate / 100);
        benefitText = `${card.baseRewardRate}% Base Rewards`;
      }
    }

    // Apply Universal Offers (Coupons from Swiggy One apply regardless of card limits if not excluded)
    if (!isExcluded && !exhaustedCards[card.id] && !isIntl && isOnline) {
      if (isMovie) {
        const cinepolisDiscount = Math.min(amount * 0.25, 75);
        let onlineRate = card.baseRewardRate;
        let onlineCap = amount;

        if (card.id === 'sbi-cashback') {
          onlineRate = 5;
          onlineCap = 40000;
        } else if (card.id === 'hdfc-swiggy') {
          onlineRate = 5;
          onlineCap = 30000;
        } else if (card.id === 'kotak-811-infinity') {
          onlineRate = 5;
          onlineCap = 2000;
        }

        const kotakCap = 100;
        const eligibleAmt = Math.min(amount, onlineCap);
        const overSpend = Math.max(0, amount - onlineCap);

        let onlineCb = (eligibleAmt * onlineRate / 100);
        if (card.id === 'kotak-811-infinity') {
          onlineCb = Math.min(onlineCb, kotakCap);
        }
        onlineCb += (overSpend * card.baseRewardRate / 100);

        const totalCinepolisValue = cinepolisDiscount + onlineCb;

        if (totalCinepolisValue > cashbackAmount && !nameL.match(/bookmyshow|district/i)) {
          cashbackAmount = totalCinepolisValue;
          const dealDetail = `Swiggy Cinepolis Coupon (₹${cinepolisDiscount.toFixed(0)} off)`;
          if (benefitText.includes('Base Rewards') || benefitText.includes('Excluded')) {
            benefitText = `${onlineRate}% Online + ${dealDetail}`;
          } else if (!nameL.includes('cinepolis')) {
            benefitText = `${benefitText} (Better Deal: ${dealDetail})`;
          } else {
            benefitText = `${benefitText} with ${dealDetail}!`;
          }
        }
      }

      if ((catL.includes('ajio') || nameL.includes('ajio') || platL.includes('ajio')) && amount >= 999) {
        const ajioDisc = amount * 0.20;
        cashbackAmount += ajioDisc;
        const ajioDetail = `Swiggy One Coupon (20% off)`;
        if (benefitText.includes('Base Rewards') || benefitText.includes('Excluded')) {
          const onlineRate = card.id === 'sbi-cashback' || card.id === 'hdfc-swiggy' || card.id === 'kotak-811-infinity' ? 5 : card.baseRewardRate;
          benefitText = `${onlineRate}% Online + ${ajioDetail}`;
        } else {
          benefitText += ` with ${ajioDetail}`;
        }
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
    if (bestResult.card.id === 'kotak-811-infinity') reason = "Kotak 811 is best for small international purchases as the 5% cashback beats the forex markup, limited to ₹2,000 per transaction.";
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

  const availableOffers: { id: string; icon: string; title: string; description: string; category: string; }[] = [];

  if (isMovie) {
    if ((offerUsage['kotak-811-infinity-Movies-BMS'] || 0) < 1) {
      availableOffers.push({ id: 'k-bms', icon: '🎬', title: 'Kotak 811', description: 'Buy 1 Get 1 Ticket up to ₹300', category: 'BMS' });
    }
    if ((offerUsage['axis-myzone-Movies-District'] || 0) < 1) {
      availableOffers.push({ id: 'a-district', icon: '🍿', title: 'Axis MyZone', description: 'Buy 1 Get 1 Ticket up to ₹200', category: 'District' });
    }
    if ((offerUsage['hdfc-imperia-Movies-BMS'] || 0) < 1) {
      availableOffers.push({ id: 'i-bms', icon: '🎟️', title: 'HDFC Imperia', description: '25% points up to ₹250', category: 'BMS' });
    }
    if (!nameL.match(/bookmyshow|bms|district/i)) {
      availableOffers.push({ id: 's-cine', icon: '🎥', title: 'Swiggy oneBLCK', description: '25% off up to ₹75', category: 'Cinepolis' });
    }
  }

  if (isDining) {
    if ((offerUsage['kotak-811-infinity-Dining-District'] || 0) < 1) {
      availableOffers.push({ id: 'k-dist', icon: '🍽️', title: 'Kotak 811', description: '20% off up to ₹750', category: 'District' });
    }
    if ((offerUsage['axis-myzone-Dining-EazyDiner'] || 0) < 1) {
      availableOffers.push({ id: 'a-eazy', icon: '🥂', title: 'Axis MyZone', description: '15% off up to ₹500', category: 'EazyDiner' });
    }
  }

  if (isFoodDelivery) {
    if ((offerUsage['axis-myzone-Food-Swiggy'] || 0) < 2) {
      availableOffers.push({ id: 'a-swig', icon: '🍔', title: 'Axis MyZone', description: 'Flat ₹120 off (AXIS120)', category: 'Swiggy' });
    }
    if ((offerUsage['hdfc-imperia-Food-Swiggy'] || 0) < 1) {
      availableOffers.push({ id: 'i-swig', icon: '🍕', title: 'HDFC Imperia', description: '5% cashback up to ₹150', category: 'Swiggy' });
    }
  }

  if ((nameL.includes('ajio') || platL.includes('ajio') || catL.includes('apparel')) && amount >= 999) {
    availableOffers.push({ id: 's-ajio', icon: '🛍️', title: 'Swiggy oneBLCK', description: 'Flat 20% off on select styles', category: 'Ajio' });
  }

  const tiedCards = validOptions
    .filter(o => Math.abs(o.netValue - bestResult.netValue) < 0.01)
    .map(o => ({ card: o.card, benefit: o.benefitText }));

  return {
    bestCard: bestResult.card,
    tiedCards: tiedCards.length > 1 ? tiedCards : undefined,
    reason,
    expectedBenefit: bestResult.benefitText,
    netValue: bestResult.netValue,
    cashbackEarned: bestResult.cashbackEarned,
    feesPaid: bestResult.feesPaid,
    alternatives: validOptions.slice(tiedCards.length, tiedCards.length + 3).map(s => ({ card: s.card, benefit: s.benefitText, netValue: s.netValue })),
    availableOffers
  };
}
