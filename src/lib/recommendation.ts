/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card, MerchantInfo, Recommendation } from '../types';
import { CARD_DATA } from '../data/cards';

const TATA_NEU_MERCHANTS = ['croma', 'westside', 'zudio', 'ihcl', 'bigbasket', '1mg', 'cliq', 'air india', 'air india express', 'qmin', 'cult', 'tata play', 'titan', 'tanishq', 'mia', 'fastrack', 'caratlane', 'helios', 'zoya'];
const ALLOWED_UPI_CARDS = ['kiwi-neon', 'amazon-pay-upi', 'cred-pay-upi', 'kotak-811-infinity'];
const ALLOWED_INTL_CARDS = ['kotak-811-infinity', 'sbi-cashback', 'niyo-dcb'];
const DEFAULT_EXCLUSIONS = ['fuel', 'wallet', 'rent', 'housing', 'gambling', 'gaming', 'tolls', 'toll', 'finance', 'school', 'education', 'jewellery', 'insurance', 'railway', 'rail', 'government', 'tax', 'utilities', 'utility', 'bills', 'bill', 'telecom', 'internet', 'atm', 'cash', 'charity', 'donation'];
const MOVIE_PLATFORMS = ['bookmyshow', 'bms', 'paytm insider', 'townscript', 'mera event', 'pvr', 'inox', 'cinepolis', 'movie', 'cinema', 'theatre', 'district'];
const DINING_PLATFORMS = ['dineout', 'eazydiner', 'district', 'magicpin', 'cafe', 'restaurant', 'diner', 'eatery', 'pub', 'bar', 'coffee'];
const FOOD_PLATFORMS = ['swiggy', 'zomato', 'toing', 'bistro', 'eatsure', 'fresh menu', 'box8', 'eat club', 'uber eats', 'domino', 'pizza hut', 'starbucks', 'mcdonald', 'kfc', 'burger king', 'haldiram', 'bikanervala'];
const SPECIFIC_PLATFORMS = ['bookmyshow', 'district', 'swiggy', 'zomato', 'dineout', 'eazydiner', 'nykaa', 'cleartrip', 'ajio', 'amazon', 'flipkart'];
const SBI_CASHBACK_CARD = CARD_DATA.find(c => c.id === 'sbi-cashback')!;

const GROCERY_KEYWORDS = ['grocery', 'groce', 'bigbasket', 'blinkit', 'zepto', 'instamart', 'dunzo', 'jiomart'];
const FOOD_DELIVERY_KEYWORDS = ['food delivery', 'delivery', 'food', 'swig', 'zomat', ...FOOD_PLATFORMS];
const FOOD_DELIVERY_EXCLUSIONS = ['dineout', 'district', 'eazydiner'];
const DINING_KEYWORDS = ['dining', 'dine', 'restaurant', 'eatery', 'cafe', 'district', 'dineout', 'eazydiner'];
const MOVIE_KEYWORDS = ['movie', ...MOVIE_PLATFORMS];

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;



const hasKeyword = (targets: string[], keywords: string[]) =>
  keywords.some(keyword => targets.some(target => target.includes(keyword)));

export function getCycleForCard(cardId: string, cardBillDates: Record<string, number>): string {
  let billDay = cardBillDates[cardId] || 1;
  const card = CARD_DATA.find(c => c.id === cardId);
  if (card && card.type === 'Debit') {
    billDay = 1;
  }
  
  const now = new Date();
  if (now.getDate() >= billDay) {
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
  } else {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${prev.getMonth() + 1}`;
  }
}

export function getRecommendations(
  merchant: MerchantInfo,
  amount: number,
  isOnline: boolean = true,
  isIntl: boolean = false,
  isScanToPay: boolean = false,
  exhaustedCards: Record<string, boolean> = {},
  offerUsage: Record<string, number> = {},
  kiwiNeonEarnRate: number = 2,
  walletCards: string[] | null = null,
  cardBillDates: Record<string, number> = {}
): Recommendation | null {

  const nameL = merchant.name.toLowerCase();
  const catL = merchant.category.toLowerCase();
  const platL = merchant.platform?.toLowerCase() || '';

  const targets = [nameL, catL, platL];
  const isGrocery = hasKeyword(targets, GROCERY_KEYWORDS);
  const isFoodDelivery = hasKeyword(targets, FOOD_DELIVERY_KEYWORDS) && !hasKeyword([nameL], FOOD_DELIVERY_EXCLUSIONS);
  const isDining = hasKeyword(targets, DINING_KEYWORDS);
  const isMovie = hasKeyword(targets, MOVIE_KEYWORDS);
  const searchedMoviePlat = MOVIE_PLATFORMS.find(p => nameL.includes(p) || (platL && platL.includes(p)));
  const searchedDiningPlat = DINING_PLATFORMS.find(p => nameL.includes(p) || (platL && platL.includes(p)));

  // Google Play special logic
  if (nameL.includes('google') || platL.includes('google')) {
    const isExhausted = exhaustedCards['sbi-cashback'];
    return {
      bestCard: SBI_CASHBACK_CARD,
      reason: isExhausted
        ? "Using Amazon Gift Card via SBI Cashback. (Accelerated limit reached, earning base rewards)"
        : "For Google Play, always buy an Amazon Gift Card with the SBI Cashback card and load using Amazon's Rewards Gold offer of 5% on Google Play recharges.",
      expectedBenefit: isExhausted ? "5% Amazon Rewards Gold" : "5% Cashback + 5% Amazon Rewards Gold",
      netValue: round2((isExhausted ? 0 : Math.min(amount, 40000) * 0.05) + (amount * 0.05)),
      cashbackEarned: round2((isExhausted ? 0 : Math.min(amount, 40000) * 0.05) + (amount * 0.05)),
      feesPaid: 0,
      alternatives: []
    };
  }

  // Tata Neu merchants
  const isTataNeuAppMerchant = TATA_NEU_MERCHANTS.some(tm => nameL.includes(tm) || catL.includes(tm) || platL.includes(tm));
  const isTataNeuPartnerMerchant = ['pharmacy', 'medical', 'health', 'apparel', 'clothing', 'fashion', 'electronics', 'gadgets', 'footwear', 'watches', 'accessories', 'jewelry', 'jewellery', 'hotel', 'resort', 'travel', 'luxury'].some(k => nameL.includes(k));

  // Optimization: Hoist DEFAULT_EXCLUSIONS.find out of the map loop since catL, nameL, and platL are constant
  const isExcludedCatCache = DEFAULT_EXCLUSIONS.find(ex => catL.includes(ex) || nameL.includes(ex) || platL.includes(ex));

  const cardsToEvaluate = walletCards 
    ? CARD_DATA.filter(c => walletCards.includes(c.id) && !c.isDummy)
    : CARD_DATA.filter(c => !c.isDummy);

  const calculationResults = cardsToEvaluate.map(card => {
    let cashbackAmount = 0;
    let benefitText = 'Base Rewards';
    let isExcluded = false;
    let discountAmount = 0;
    let cardToUse = { ...card };

    if (isScanToPay) {
      if (!ALLOWED_UPI_CARDS.includes(card.id)) {
        isExcluded = true;
        benefitText = "Not a Scan & Pay option";
      }
      if (card.id === 'kotak-811-infinity') {
        cardToUse.name = '811 Scan & Pay';
      }
    }

    if (isIntl) {
      if (!ALLOWED_INTL_CARDS.includes(card.id)) {
        isExcluded = true;
        benefitText = "Not optimized for International spend";
      }
    }

    if (card.type === 'Credit' || card.type === 'Debit') {
      const isExcludedCat = isExcludedCatCache;
      if (isExcludedCat) {
        isExcluded = true;
        benefitText = `Excluded category (${isExcludedCat})`;

        if (isExcludedCat === 'gaming' && !catL.includes('gambling') && !nameL.includes('gambling')) {
          if (card.id === 'hsbc-live-plus' || card.id === 'kotak-811-infinity') {
            // Only bypass if it wasn't already excluded by Scan & Pay or International
            if (benefitText.includes('Excluded category')) {
              isExcluded = false;
              benefitText = 'Base Rewards';
            }
          }
        }
        if (card.id === 'hdfc-tata-neu-infinity') {
          if (catL.includes('utility') || catL.includes('utilities') || isExcludedCat === 'toll' || isExcludedCat === 'tolls' ||
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
      // Special bypass for HSBC Live+ and Gaming (if it was accidentally categorized as an exclusion)
      if (card.id === 'hsbc-live-plus' && catL === 'gaming') {
        isExcluded = false;
      } else {
        isExcluded = true;
        benefitText = 'Excluded from earning rewards';
      }
    } else if (exhaustedCards[card.id]) {
      cashbackAmount = amount * (card.baseRewardRate / 100);
      benefitText = `Monthly limit reached. Earning (${card.baseRewardRate}% base rewards.)`;
    } else if (card.id === 'hdfc-tata-neu-infinity' && !isIntl) {
      // Priority 1: Specific Tata Neu app merchants (BigBasket, Qmin, Croma, etc.)
      if (isTataNeuAppMerchant && isOnline) {
        if (isGrocery) {
          const eligibleSpend = Math.min(amount, 15000);
          cashbackAmount = (eligibleSpend * 0.035) + (amount * card.baseRewardRate / 100) + (amount * 0.05);
          benefitText = '10% NeuCoins on BigBasket';
        } else if (isFoodDelivery) {
          const eligibleSpend = Math.min(amount, 15000);
          cashbackAmount = (eligibleSpend * 0.035) + (amount * card.baseRewardRate / 100) + (amount * 0.05);
          benefitText = '10% NeuCoins on Qmin';
        } else {
          cashbackAmount = (amount * 0.035) + (amount * card.baseRewardRate / 100) + (amount * 0.05);
          benefitText = '10% NeuCoins on Tata Neu';
        }
      } else if (isTataNeuAppMerchant && !isOnline) {
        cashbackAmount = (amount * 0.035) + (amount * card.baseRewardRate / 100);
        benefitText = '5% NeuCoins at Offline Stores';
        // Priority 2: Generic food/grocery searches (suggest routing through Tata Neu app)
      } else if ((isGrocery || isFoodDelivery) && isOnline) {
        const eligibleSpend = Math.min(amount, 15000);
        cashbackAmount = (eligibleSpend * 0.035) + (amount * card.baseRewardRate / 100) + (amount * 0.05);
        benefitText = isGrocery
          ? '10% NeuCoins on BigBasket'
          : '10% NeuCoins on Qmin';
        // Priority 3: Tata partner category merchants (fashion, electronics, etc.)
      } else if (isTataNeuPartnerMerchant && isOnline) {
        cashbackAmount = (amount * 0.035) + (amount * card.baseRewardRate / 100) + (amount * 0.05);
        benefitText = '10% NeuCoins on Tata Neu';
      } else if (isTataNeuPartnerMerchant && !isOnline) {
        cashbackAmount = (amount * 0.035) + (amount * card.baseRewardRate / 100);
        benefitText = '5% NeuCoins at Offline Stores';
        // Priority 4: Utilities & bill payments
      } else if (catL.includes('utilities') || nameL.includes('internet') || nameL.includes('bill') || nameL.includes('bills') || nameL.includes('toll') || nameL.includes('tata play') || nameL.includes('fastag')) {
        const eligibleSpend = Math.min(amount, 40000);
        cashbackAmount = (eligibleSpend * 0.035) + (eligibleSpend * card.baseRewardRate / 100);
        benefitText = '5% NeuCoins on Tata Neu';
        // Fallback: Base rewards
      } else {
        cashbackAmount = amount * card.baseRewardRate / 100;
        benefitText = '1.5% NeuCoins';
      }
    } else if (isExcluded) {
      // If already marked as excluded (Intl, Scan & Pay, or Category), skip matching benefits
      // This prevents benefit matching from overwriting the exclusion status or text
      cashbackAmount = 0;
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
      let finalRate = isScanToPay ? kiwiNeonEarnRate : 0.5;
      cashbackAmount = amount * (finalRate / 100);
      benefitText = `${finalRate}% Cashback on ${isScanToPay ? 'Scan & Pay' : 'Online UPI'}`;
    } else if (card.id === 'kotak-811-infinity' && isScanToPay) {
      cashbackAmount = 3;
      benefitText = 'Mystery Cashback on Scan & Pay';
    } else if (card.id === 'sbi-cashback') {
      if (isOnline) {
        const eligible = Math.min(amount, 40000);
        cashbackAmount = eligible * 0.05;
        benefitText = '5% Cashback';
      } else {
        cashbackAmount = amount * 0.01;
        benefitText = '1% Base Rewards';
      }
    } else if (card.id === 'kotak-811-infinity' && !isScanToPay) {
      // Special logic for Kotak 811 offers + cashback
      const movieUsed = offerUsage['kotak-811-infinity-Movies-BMS'] || 0;
      const diningUsed = offerUsage['kotak-811-infinity-Dining-District'] || 0;

      if (isIntl) {
        cashbackAmount = Math.min(amount * 0.05, 100);
        benefitText = '5% Cashback';
      } else if (isMovie && isOnline && movieUsed < 1) {
        discountAmount = Math.min(amount * 0.5, 300);
        const remaining = amount - discountAmount;
        cashbackAmount = discountAmount + Math.min(remaining * 0.05, 100);
        benefitText = '1+1 Movie on BookMyShow + 5% Cashback';
      } else if ((isDining || nameL.includes('district')) && isOnline && diningUsed < 1) {
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

      if (isExcluded) {
        // Skip benefit matching for excluded cards
      } else {

        for (const benefit of card.benefits) {
          if (benefit.type === 'exclusion' || benefit.type === 'lounge' || (benefit.type as any) === 'milestone') continue;
          if (isIntl && benefit.type === 'offer' && benefit.category !== 'International') continue;
          let matchScore = -1;

          const cycle = getCycleForCard(card.id, cardBillDates);
          const usageKey = `${card.id}-${benefit.category}-${benefit.value}-${cycle}`;
          const usedCount = offerUsage[usageKey] || 0;
          if (benefit.usageLimit && usedCount >= benefit.usageLimit) {
            continue;
          }

          const descLForOnline = `${benefit.category} ${benefit.value} ${benefit.description || ''}`.toLowerCase();
          if (!isOnline && descLForOnline.includes('online') && !descLForOnline.includes('offline')) {
            continue;
          }

          if (benefit.type === 'offer') {
            const descL = benefit.description.toLowerCase();
            const valLower = benefit.value.toLowerCase();
            const isMovieOffer = benefit.category.toLowerCase().includes('movie') || descL.includes('movie') || descL.includes('ticket');
            const isDiningOffer = benefit.category.toLowerCase().includes('dining') || benefit.category.toLowerCase().includes('swiggy') || benefit.category.toLowerCase().includes('zomato');

            let skip = false;

            for (const plat of SPECIFIC_PLATFORMS) {
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
    const forexFee = isIntl ? round2(amount * loadedForexMarkup / 100) : 0;

    const netValue = isExcluded ? -forexFee : round2(cashbackAmount - forexFee);

    return {
      card: cardToUse, netValue, cashbackEarned: isExcluded ? 0 : round2(cashbackAmount), feesPaid: forexFee, benefitText, isExcluded
    };
  });

  const validOptions = calculationResults
    .filter(s => !s.isExcluded && !(s.netValue <= 0 && s.card.baseRewardRate === 0 && s.card.benefits.length === 0))
    .sort((a, b) => b.netValue - a.netValue);

  if (validOptions.length === 0) return null;

  const bestResult = validOptions[0];

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

  const availableOffers: { id: string; icon: string; title: string; description: string; cardId?: string; category: string; }[] = [];

  if (!isIntl && isMovie && isOnline) {
    if ((offerUsage['kotak-811-infinity-Movies-BMS'] || 0) < 1) {
      availableOffers.push({ id: 'k-bms', icon: '🎬', title: 'Kotak 811', description: 'Buy 1 Get 1 Ticket up to ₹300', category: 'BMS', cardId: 'kotak-811-infinity' });
    }
    if ((offerUsage['axis-myzone-Movies-District'] || 0) < 1) {
      availableOffers.push({ id: 'a-district', icon: '🍿', title: 'Axis MyZone', description: 'Buy 1 Get 1 Ticket up to ₹200', category: 'District', cardId: 'axis-myzone' });
    }
    if ((offerUsage['hdfc-imperia-Movies-BMS'] || 0) < 1) {
      availableOffers.push({ id: 'i-bms', icon: '🎟️', title: 'HDFC Imperia', description: '25% points up to ₹250', category: 'BMS', cardId: 'hdfc-imperia' });
    }
    if (!nameL.match(/bookmyshow|bms|district/i)) {
      availableOffers.push({ id: 's-cine', icon: '🎥', title: 'Swiggy oneBLCK', description: '25% off up to ₹75', category: 'Cinepolis', cardId: 'hdfc-swiggy' });
    }
  }

  if (!isIntl && isDining && isOnline) {
    if ((offerUsage['kotak-811-infinity-Dining-District'] || 0) < 1) {
      availableOffers.push({ id: 'k-dist', icon: '🍽️', title: 'Kotak 811', description: '20% off up to ₹750', category: 'District', cardId: 'kotak-811-infinity' });
    }
    if ((offerUsage['axis-myzone-Dining-EazyDiner'] || 0) < 1) {
      availableOffers.push({ id: 'a-eazy', icon: '🥂', title: 'Axis MyZone', description: '15% off up to ₹500', category: 'EazyDiner', cardId: 'axis-myzone' });
    }
  }

  if (!isIntl && isFoodDelivery) {
    if ((offerUsage['axis-myzone-Food-Swiggy'] || 0) < 2) {
      availableOffers.push({ id: 'a-swig', icon: '🍔', title: 'Axis MyZone', description: 'Flat ₹120 off (AXIS120)', category: 'Swiggy', cardId: 'axis-myzone' });
    }
    if ((offerUsage['hdfc-imperia-Food-Swiggy'] || 0) < 1) {
      availableOffers.push({ id: 'i-swig', icon: '🍕', title: 'HDFC Imperia', description: '5% cashback up to ₹150', category: 'Swiggy', cardId: 'hdfc-imperia' });
    }
  }

  if (!isIntl && (nameL.includes('ajio') || platL.includes('ajio') || catL.includes('apparel')) && amount >= 999) {
    availableOffers.push({ id: 's-ajio', icon: '🛍️', title: 'Swiggy oneBLCK', description: 'Flat 20% off on select styles', category: 'Ajio', cardId: 'hdfc-swiggy' });
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
    alternatives: validOptions.slice(tiedCards.length, tiedCards.length + 3).map(s => ({ card: s.card, benefit: s.benefitText, netValue: round2(s.netValue) })),
    availableOffers: availableOffers.filter(o => !o.cardId || !calculationResults.find(r => r.card.id === o.cardId)?.isExcluded)
  };
}
