/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card, MerchantInfo, Recommendation } from '../types';
import { CARD_DATA, CARD_DICT } from '../data/cards';

const TATA_NEU_MERCHANTS = ['croma', 'westside', 'zudio', 'ihcl', 'bigbasket', '1mg', 'cliq', 'air india', 'air india express', 'qmin', 'cult', 'tata play', 'titan', 'tanishq', 'mia', 'fastrack', 'caratlane', 'helios', 'zoya'];
const DEFAULT_EXCLUSIONS = ['fuel', 'wallet', 'rent', 'housing', 'gambling', 'gaming', 'tolls', 'toll', 'finance', 'school', 'education', 'jewellery', 'insurance', 'railway', 'rail', 'government', 'tax', 'utilities', 'utility', 'bills', 'bill', 'telecom', 'internet', 'atm', 'cash', 'charity', 'donation'];
const MOVIE_PLATFORMS = ['bookmyshow', 'bms', 'paytm insider', 'townscript', 'mera event', 'pvr', 'inox', 'cinepolis', 'movie', 'cinema', 'theatre', 'district'];
const DINING_PLATFORMS = ['dineout', 'eazydiner', 'district', 'magicpin', 'cafe', 'restaurant', 'diner', 'eatery', 'pub', 'bar', 'coffee'];
const FOOD_PLATFORMS = ['swiggy', 'zomato', 'toing', 'bistro', 'eatsure', 'fresh menu', 'box8', 'eat club', 'uber eats', 'domino', 'pizza hut', 'starbucks', 'mcdonald', 'kfc', 'burger king', 'haldiram', 'bikanervala'];




const MERCHANT_AGGREGATORS: Record<string, string[]> = {
  'district': ['movie', 'movies', 'dining', 'food', 'restaurant', 'cafe', 'bistro', 'diner', 'eatery', 'pizza', 'burger', 'coffee', 'cinema', 'theatre'],
  'bookmyshow': ['movie', 'movies', 'cinema', 'theatre', 'show', 'shows', 'concert', 'event', 'events'],
  'bms': ['movie', 'movies', 'cinema', 'theatre', 'show', 'shows', 'concert', 'event', 'events'],
  'paytm insider': ['movie', 'movies', 'cinema', 'theatre', 'show', 'shows', 'concert', 'event', 'events'],
  'townscript': ['show', 'shows', 'concert', 'event', 'events'],
  'mera event': ['show', 'shows', 'concert', 'event', 'events'],
  'pvr': ['movie', 'movies', 'cinema', 'theatre'],
  'inox': ['movie', 'movies', 'cinema', 'theatre'],
  'cinepolis': ['movie', 'movies', 'cinema', 'theatre'],

  'ajio': ['fashion', 'beauty', 'apparel', 'clothes', 'clothing', 'shopping', 'cosmetics', 'makeup', 'accessory', 'accessories'],
  'nykaa': ['fashion', 'beauty', 'apparel', 'clothes', 'clothing', 'shopping', 'cosmetics', 'makeup', 'fragrance', 'accessory', 'accessories'],
  'myntra': ['fashion', 'beauty', 'apparel', 'clothes', 'clothing', 'shopping', 'cosmetics', 'makeup', 'accessory', 'accessories'],
  'amazon': ['fashion', 'beauty', 'apparel', 'clothes', 'clothing', 'shopping', 'electronics', 'grocery', 'groceries', 'online', 'store'],
  'flipkart': ['fashion', 'beauty', 'apparel', 'clothes', 'clothing', 'shopping', 'electronics', 'grocery', 'groceries', 'online', 'store'],
  'meesho': ['fashion', 'beauty', 'apparel', 'clothes', 'clothing', 'shopping', 'accessory', 'accessories'],
  'tata cliq': ['fashion', 'beauty', 'apparel', 'clothes', 'clothing', 'shopping', 'electronics', 'accessory', 'accessories'],
  'purplle': ['beauty', 'cosmetics', 'cosmetic', 'makeup', 'fragrance'],
  'tira': ['beauty', 'cosmetics', 'cosmetic', 'makeup', 'fragrance'],
  'mac': ['beauty', 'cosmetics', 'cosmetic', 'makeup', 'fragrance'],
  'sephora': ['beauty', 'cosmetics', 'cosmetic', 'makeup', 'fragrance'],

  'eazydiner': ['dining', 'food', 'restaurant', 'cafe', 'bistro', 'diner', 'eatery', 'pizza', 'burger', 'coffee', 'tea'],
  'dineout': ['dining', 'food', 'restaurant', 'cafe', 'bistro', 'diner', 'eatery', 'pizza', 'burger', 'coffee', 'tea'],
  'magicpin': ['dining', 'food', 'restaurant', 'cafe', 'bistro', 'diner', 'eatery', 'pizza', 'burger', 'coffee', 'tea'],

  'swiggy': ['food delivery', 'delivery', 'food', 'dining', 'restaurant', 'cafe', 'bistro', 'diner', 'eatery', 'pizza', 'burger', 'coffee', 'tea'],
  'zomato': ['food delivery', 'delivery', 'food', 'dining', 'restaurant', 'cafe', 'bistro', 'diner', 'eatery', 'pizza', 'burger', 'coffee', 'tea'],
  'eatsure': ['food delivery', 'delivery', 'food', 'restaurant', 'pizza', 'burger'],
  'eat club': ['food delivery', 'delivery', 'food', 'restaurant', 'pizza', 'burger'],

  'cleartrip': ['travel', 'flight', 'flights', 'hotel', 'hotels', 'stay', 'trip', 'travels', 'vacation', 'air', 'airline', 'airlines', 'accommodation', 'booking'],
  'makemytrip': ['travel', 'flight', 'flights', 'hotel', 'hotels', 'stay', 'trip', 'travels', 'vacation', 'air', 'airline', 'airlines', 'accommodation', 'booking'],
  'mmt': ['travel', 'flight', 'flights', 'hotel', 'hotels', 'stay', 'trip', 'travels', 'vacation', 'air', 'airline', 'airlines', 'accommodation', 'booking'],
  'goibibo': ['travel', 'flight', 'flights', 'hotel', 'hotels', 'stay', 'trip', 'travels', 'vacation', 'air', 'airline', 'airlines', 'accommodation', 'booking'],
  'yatra': ['travel', 'flight', 'flights', 'hotel', 'hotels', 'stay', 'trip', 'travels', 'vacation', 'air', 'airline', 'airlines', 'accommodation', 'booking'],
  'ixigo': ['travel', 'flight', 'flights', 'hotel', 'hotels', 'stay', 'trip', 'travels', 'vacation', 'air', 'airline', 'airlines', 'accommodation', 'booking'],
  'agoda': ['travel', 'hotel', 'hotels', 'stay', 'trip', 'travels', 'vacation', 'accommodation', 'booking'],
  'booking.com': ['travel', 'hotel', 'hotels', 'stay', 'trip', 'travels', 'vacation', 'accommodation', 'booking'],
  'expedia': ['travel', 'flight', 'flights', 'hotel', 'hotels', 'stay', 'trip', 'travels', 'vacation', 'air', 'airline', 'airlines', 'accommodation', 'booking'],
  'skyscanner': ['travel', 'flight', 'flights', 'air', 'airline', 'airlines', 'booking'],

  'blinkit': ['grocery', 'groceries', 'supermarket', 'delivery', 'pharmacy', 'medicine'],
  'zepto': ['grocery', 'groceries', 'supermarket', 'delivery', 'pharmacy', 'medicine'],
  'instamart': ['grocery', 'groceries', 'supermarket', 'delivery'],
  'bigbasket': ['grocery', 'groceries', 'supermarket', 'delivery'],
  'dunzo': ['grocery', 'groceries', 'supermarket', 'delivery', 'pharmacy', 'medicine'],
  'jiomart': ['grocery', 'groceries', 'supermarket', 'delivery', 'shopping'],
  'amazon fresh': ['grocery', 'groceries', 'supermarket', 'delivery'],
  'flipkart grocery': ['grocery', 'groceries', 'supermarket', 'delivery']
};

const SPECIFIC_PLATFORMS = ['bookmyshow', 'district', 'swiggy', 'zomato', 'dineout', 'eazydiner', 'nykaa', 'cleartrip', 'ajio', 'amazon', 'flipkart', 'cinepolis', 'myntra', 'qmin', 'bigbasket', 'blinkit', 'zepto', 'instamart'];

const MERCHANT_AGGREGATOR_KEYS = Object.keys(MERCHANT_AGGREGATORS);



const SBI_CASHBACK_CARD = CARD_DATA.find(c => c.id === 'sbi-cashback')!;

const GROCERY_KEYWORDS = ['grocery', 'groce', 'bigbasket', 'blinkit', 'zepto', 'instamart', 'dunzo', 'jiomart'];
const FOOD_DELIVERY_KEYWORDS = ['food delivery', 'delivery', 'food', 'swig', 'zomat', ...FOOD_PLATFORMS];
const FOOD_DELIVERY_EXCLUSIONS = ['dineout', 'district', 'eazydiner'];
const DINING_KEYWORDS = ['dining', 'dine', 'restaurant', 'eatery', 'cafe', 'district', 'dineout', 'eazydiner'];
const MOVIE_KEYWORDS = ['movie', ...MOVIE_PLATFORMS];

const BMS_DISTRICT_REGEX = /bookmyshow|district/i;
const BMS_DISTRICT_BMS_REGEX = /bookmyshow|bms|district/i;




const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildRegex = (keywords: string[]) => new RegExp(keywords.map(escapeRegExp).join('|'), 'i');

const GROCERY_REGEX = buildRegex(GROCERY_KEYWORDS);
const FOOD_DELIVERY_REGEX = buildRegex(FOOD_DELIVERY_KEYWORDS);
const FOOD_DELIVERY_EXCLUSIONS_REGEX = buildRegex(FOOD_DELIVERY_EXCLUSIONS);
const DINING_REGEX = buildRegex(DINING_KEYWORDS);
const MOVIE_REGEX = buildRegex(MOVIE_KEYWORDS);

const hasKeyword = (targets: string[], regex: RegExp) => targets.some(target => regex.test(target));


export interface RecommendationContext {
  merchant: MerchantInfo;
  amount: number;
  isOnline: boolean;
  isIntl: boolean;
  isScanToPay: boolean;
  exhaustedCards: Record<string, boolean>;
  offerUsage: Record<string, number>;
  cardBillDates: Record<string, number>;

  nameL: string;
  catL: string;
  platL: string;

  isGrocery: boolean;
  isFoodDelivery: boolean;
  isDining: boolean;
  isMovie: boolean;
  isExcludedCatCache: string | undefined;

  isTataNeuAppMerchant: boolean;
  isTataNeuPartnerMerchant: boolean;
  isTataNeuUtility: boolean;

  isBmsOrDistrict: boolean;
  isBmsOrDistrictOrBms: boolean;

  isUtilityCat: boolean;
  isGamblingName: boolean;
  isGamblingCat: boolean;
  isNykaaOrBeauty: boolean;
  isHotelCatOrName: boolean;
  isCleartripOrTravel: boolean;
  isHdfcSwiggyExcludedCat: boolean;
  isBmsName: boolean;
  isDistrictName: boolean;
  isFoodName: boolean;
  isEazydiner: boolean;
  isAjioNameOrPlat: boolean;
  isAjio: boolean;
  isCinepolisName: boolean;
  isDistrictPlat: string | boolean;

  currentQuarterCycle: string;
  cinepolisDiscount: number;
  ajioDisc: number;

  shouldShowOffer: (plat: string) => boolean;
}

export function findBestBenefit(card: Card, cardCycle: string, ctx: RecommendationContext) {
  let matchedBenefitValue = -1;
  let usedBenefit = null;

  for (const benefit of card.benefits) {
    if (benefit.type === 'exclusion' || benefit.type === 'lounge' || (benefit.type as any) === 'milestone') continue;
    if (ctx.isIntl && benefit.type === 'offer' && benefit.category !== 'International') continue;
    let matchScore = -1;

    const bDescL = benefit.descriptionLower!;
    const isQuarterly = bDescL.includes('quarter') || bDescL.includes('qtr');
    const cycle = isQuarterly ? ctx.currentQuarterCycle : cardCycle;
    const usageKey = `${card.id}-${benefit.category}-${benefit.value}-${cycle}`;
    const usedCount = ctx.offerUsage[usageKey] || 0;
    if (benefit.usageLimit && usedCount >= benefit.usageLimit) {
      continue;
    }

    const descLForOnline = benefit.descLForOnline!;
    if (!ctx.isOnline && descLForOnline.includes('online') && !descLForOnline.includes('offline')) {
      continue;
    }

    if (benefit.type === 'offer') {
      const descL = bDescL;
      const valLower = benefit.value.toLowerCase();

      let skip = false;
      let isCustomMatched = false;

      // 1. Axis Swiggy 120 discount
      if ((card.id === 'axis-myzone' && benefit.category === 'Food' && benefit.value === 'Swiggy') && ctx.amount > 499) {
        isCustomMatched = true;
        if (!ctx.isFoodDelivery || ctx.isDining || !ctx.shouldShowOffer('swiggy')) {
          skip = true;
        } else {
          skip = false;
        }
      }
      // 2. Axis EazyDiner
      else if ((card.id === 'axis-myzone' && benefit.category === 'Dining' && benefit.value === 'EazyDiner') && ctx.amount > 2499) {
        isCustomMatched = true;
        if (!ctx.isDining || ctx.isFoodDelivery || ctx.isFoodName || !ctx.shouldShowOffer('eazydiner')) {
          skip = true;
        } else {
          skip = false;
        }
      }
      // 3. HDFC Imperia food
      else if (card.id === 'hdfc-imperia' && benefit.category === 'Food' && benefit.value === 'Swiggy') {
        isCustomMatched = true;
        if (!ctx.isFoodDelivery || ctx.isDining || !ctx.shouldShowOffer('swiggy')) {
          skip = true;
        } else {
          skip = false;
        }
      }
      // 4. HDFC Imperia Movies
      else if (card.id === 'hdfc-imperia' && benefit.category === 'Movies' && benefit.value === 'BookMyShow') {
        isCustomMatched = true;
        if (!ctx.isMovie || !ctx.shouldShowOffer('bookmyshow')) {
          skip = true;
        } else {
          skip = false;
        }
      }
      //5. Axis District
      else if (card.id === 'axis-myzone' && benefit.category === 'Movies' && benefit.value === 'District') {
        isCustomMatched = true;
        if (!ctx.isMovie || !ctx.shouldShowOffer('district')) {
          skip = true;
        } else {
          skip = false;
        }
      }

      if (!isCustomMatched) {
        for (const plat of SPECIFIC_PLATFORMS) {
          if (descL.includes(plat) || valLower.includes(plat)) {
            if (!ctx.shouldShowOffer(plat)) {
              skip = true;
            }
            break;
          }
        }
      }

      if (skip) continue;
    }

    const pLower = descLForOnline;
    if (ctx.platL && pLower.includes(ctx.platL)) matchScore = 100 + (benefit.percentValue || 0);
    else if (pLower.includes(ctx.catL) && ctx.catL !== 'other') matchScore = 50 + (benefit.percentValue || 0);
    else if (card.id === 'hsbc-live-plus' && !ctx.isIntl && (ctx.isGrocery || ctx.isFoodDelivery || ctx.isDining)) {
      if (pLower.includes('dining') || pLower.includes('grocery') || pLower.includes('groceries') || pLower.includes('food')) matchScore = 60;
    }
    else if ((ctx.isFoodDelivery || ctx.isDining) && (pLower.includes('swiggy') || pLower.includes('district') || pLower.includes('dining'))) {
      matchScore = 70;
    }
    else if (ctx.isMovie && (pLower.includes('movie') || pLower.includes('ticket'))) {
      matchScore = 70;
    }
    else if (card.id === 'axis-myzone' && ctx.isAjioNameOrPlat) {
      if (pLower.includes('fashion') || pLower.includes('ajio')) matchScore = 95;
    }
    else if ((card.id === 'axis-myzone' || card.id === 'kotak-811-infinity') && (ctx.isEazydiner || ctx.isDistrictName || ctx.isDistrictPlat)) {
      if (pLower.includes('dining') || pLower.includes('eazydiner') || pLower.includes('district')) matchScore = 95;
    }
    else if (ctx.isOnline && benefit.categoryLower!.includes('online')) matchScore = 20 + (benefit.percentValue || 0);
    else if (!ctx.isOnline && benefit.categoryLower!.includes('offline')) matchScore = 20 + (benefit.percentValue || 0);
    else if (ctx.isScanToPay && pLower.includes('scan')) matchScore = 30 + (benefit.percentValue || 0);
    else if (benefit.type === 'offer' && (benefit.descriptionLower!.includes(ctx.nameL) || (ctx.platL && benefit.descriptionLower!.includes(ctx.platL)))) {
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

  return usedBenefit;
}

export function calculateBenefitCashback(card: Card, usedBenefit: any, ctx: RecommendationContext): { cashbackAmount: number, benefitText: string } {
  let cashbackAmount = 0;
  let benefitText = '';

  if (usedBenefit.minSpend && ctx.amount < usedBenefit.minSpend) {
    cashbackAmount = (ctx.amount * card.baseRewardRate / 100);
    benefitText = `${card.baseRewardRate}% Base Rewards (Min ₹${usedBenefit.minSpend} not met)`;
  } else {
    const rate = usedBenefit.percentValue || 0;
    const limitAmt = usedBenefit.maxSpend || ctx.amount;
    const eligibleSpend = Math.min(ctx.amount, limitAmt);
    const overSpend = Math.max(0, ctx.amount - limitAmt);

    let calculatedCb = (eligibleSpend * rate / 100);
    if (usedBenefit.capPerTxn) {
      calculatedCb = Math.min(calculatedCb, usedBenefit.capPerTxn);
    }

    const fallbackRate = usedBenefit.fallbackRate !== undefined ? usedBenefit.fallbackRate : card.baseRewardRate;
    const baseCb = (overSpend * fallbackRate / 100);
    cashbackAmount = calculatedCb + baseCb;
    const capType = usedBenefit.type.charAt(0).toUpperCase() + usedBenefit.type.slice(1);

    if (card.id === 'axis-myzone') {
      if (usedBenefit.category === 'Food' || usedBenefit.category === 'Food Delivery') benefitText = `Flat ₹120 Off (Code: AXIS120)`;
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

  return { cashbackAmount, benefitText };
}

export function applyUniversalOffers(
  card: Card,
  isExcluded: boolean,
  cashbackAmount: number,
  benefitText: string,
  ctx: RecommendationContext
): { cashbackAmount: number, benefitText: string } {
  if (!isExcluded && !ctx.exhaustedCards[card.id] && !ctx.isIntl && ctx.isOnline) {
    if (ctx.isMovie) {
      let onlineRate = card.baseRewardRate;
      let onlineCap = ctx.amount;

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
      const eligibleAmt = Math.min(ctx.amount, onlineCap);
      const overSpend = Math.max(0, ctx.amount - onlineCap);

      let onlineCb = (eligibleAmt * onlineRate / 100);
      if (card.id === 'kotak-811-infinity') {
        onlineCb = Math.min(onlineCb, kotakCap);
      }
      onlineCb += (overSpend * card.baseRewardRate / 100);

      const totalCinepolisValue = ctx.cinepolisDiscount + onlineCb;

      if (totalCinepolisValue > cashbackAmount && !ctx.isBmsOrDistrict) {
        cashbackAmount = totalCinepolisValue;
        const dealDetail = `Swiggy Cinepolis Coupon (₹${ctx.cinepolisDiscount.toFixed(0)} off)`;
        if (benefitText.includes('Base Rewards') || benefitText.includes('Excluded')) {
          benefitText = `${onlineRate}% Online + ${dealDetail}`;
        } else if (!ctx.isCinepolisName) {
          benefitText = `${benefitText} (Better Deal: ${dealDetail})`;
        } else {
          benefitText = `${benefitText} with ${dealDetail}!`;
        }
      }
    }

    if (ctx.isAjio && ctx.amount >= 999) {
      cashbackAmount += ctx.ajioDisc;
      const ajioDetail = `Swiggy One Coupon (20% off)`;
      if (benefitText.includes('Base Rewards') || benefitText.includes('Excluded')) {
        const onlineRate = card.id === 'sbi-cashback' || card.id === 'hdfc-swiggy' || card.id === 'kotak-811-infinity' ? 5 : card.baseRewardRate;
        benefitText = `${onlineRate}% Online + ${ajioDetail}`;
      } else {
        benefitText += ` with ${ajioDetail}`;
      }
    }
  }
  return { cashbackAmount, benefitText };
}

const ALLOWED_UPI_CARDS = ['kiwi-neon', 'amazon-pay-upi', 'cred-pay-upi', 'kotak-811-infinity'];
const ALLOWED_INTL_CARDS = ['kotak-811-infinity', 'sbi-cashback', 'niyo-dcb'];
const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export function evaluateCard(card: Card, ctx: RecommendationContext, kiwiNeonEarnRate: number) {
  let cashbackAmount = 0;
  let benefitText = 'Base Rewards';
  let isExcluded = false;
  let discountAmount = 0;
  let cardToUse = card;

  if (ctx.merchant.isP2P) {
    if (!['amazon-pay-upi', 'cred-pay-upi', 'kotak-811-infinity'].includes(card.id)) {
      isExcluded = true;
      benefitText = card.id === 'kiwi-neon'
        ? "RuPay Credit Cards cannot be used for personal P2P transfers"
        : "Not supported for P2P transfers";
    }
    if (card.id === 'kotak-811-infinity') {
      cardToUse = { ...cardToUse, name: '811 Scan & Pay' };
    }
  } else if (ctx.isScanToPay) {
    if (!ALLOWED_UPI_CARDS.includes(card.id)) {
      isExcluded = true;
      benefitText = "Not a Scan & Pay option";
    }
    if (card.id === 'kotak-811-infinity') {
      cardToUse = { ...cardToUse, name: '811 Scan & Pay' };
    }
  }

  if (ctx.isIntl) {
    if (!ALLOWED_INTL_CARDS.includes(card.id)) {
      isExcluded = true;
      benefitText = "Not optimized for International spend";
    }
  }

  if (card.type === 'Credit' || card.type === 'Debit') {
    const isExcludedCat = ctx.isExcludedCatCache;
    if (isExcludedCat) {
      isExcluded = true;
      benefitText = `Excluded category (${isExcludedCat})`;

      if (isExcludedCat === 'gaming' && !ctx.isGamblingCat && !ctx.isGamblingName) {
        if (card.id === 'hsbc-live-plus' || card.id === 'kotak-811-infinity') {
          if (benefitText.includes('Excluded category')) {
            isExcluded = false;
            benefitText = 'Base Rewards';
          }
        }
      }
      if (card.id === 'hdfc-tata-neu-infinity') {
        if (ctx.isUtilityCat || isExcludedCat === 'toll' || isExcludedCat === 'tolls' ||
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
        isExcluded = false;
        benefitText = 'Base Rewards';
      }
    }
  }

  const exclusion = card.benefits.find(b => {
    if (b.type !== 'exclusion') return false;
    const bCatL = b.categoryLower!;
    return ctx.catL === bCatL || ctx.nameL.includes(bCatL) || ctx.platL === bCatL;
  });

  if (exclusion) {
    if (card.id === 'hsbc-live-plus' && ctx.catL === 'gaming') {
      isExcluded = false;
    } else {
      isExcluded = true;
      benefitText = 'Excluded from earning rewards';
    }
  } else if (ctx.exhaustedCards[card.id]) {
    cashbackAmount = ctx.amount * (card.baseRewardRate / 100);
    benefitText = `Monthly limit reached. Earning (${card.baseRewardRate}% base rewards.)`;
  } else if (card.id === 'hdfc-tata-neu-infinity' && !ctx.isIntl) {
    if (ctx.isTataNeuAppMerchant && ctx.isOnline) {
      if (ctx.isGrocery) {
        const eligibleSpend = Math.min(ctx.amount, 15000);
        cashbackAmount = (eligibleSpend * 0.035) + (ctx.amount * card.baseRewardRate / 100) + (ctx.amount * 0.05);
        benefitText = '10% NeuCoins on BigBasket';
      } else if (ctx.isFoodDelivery) {
        const eligibleSpend = Math.min(ctx.amount, 15000);
        cashbackAmount = (eligibleSpend * 0.035) + (ctx.amount * card.baseRewardRate / 100) + (ctx.amount * 0.05);
        benefitText = '10% NeuCoins on Qmin';
      } else {
        cashbackAmount = (ctx.amount * 0.035) + (ctx.amount * card.baseRewardRate / 100) + (ctx.amount * 0.05);
        benefitText = '10% NeuCoins on Tata Neu';
      }
    } else if (ctx.isTataNeuAppMerchant && !ctx.isOnline) {
      cashbackAmount = (ctx.amount * 0.035) + (ctx.amount * card.baseRewardRate / 100);
      benefitText = '5% NeuCoins at Offline Stores';
    } else if (((ctx.isGrocery && ctx.shouldShowOffer('bigbasket')) || (ctx.isFoodDelivery && ctx.shouldShowOffer('qmin'))) && ctx.isOnline) {
      const eligibleSpend = Math.min(ctx.amount, 15000);
      cashbackAmount = (eligibleSpend * 0.035) + (ctx.amount * card.baseRewardRate / 100) + (ctx.amount * 0.05);
      benefitText = ctx.isGrocery && ctx.shouldShowOffer('bigbasket')
        ? '10% NeuCoins on BigBasket'
        : '10% NeuCoins on Qmin';
    } else if (ctx.isTataNeuPartnerMerchant && ctx.isOnline) {
      cashbackAmount = (ctx.amount * 0.035) + (ctx.amount * card.baseRewardRate / 100) + (ctx.amount * 0.05);
      benefitText = '10% NeuCoins on Tata Neu';
    } else if (ctx.isTataNeuPartnerMerchant && !ctx.isOnline) {
      cashbackAmount = (ctx.amount * 0.035) + (ctx.amount * card.baseRewardRate / 100);
      benefitText = '5% NeuCoins at Offline Stores';
    } else if (ctx.isTataNeuUtility) {
      const eligibleSpend = Math.min(ctx.amount, 40000);
      cashbackAmount = (eligibleSpend * 0.035) + (eligibleSpend * card.baseRewardRate / 100);
      benefitText = '5% NeuCoins on Tata Neu';
    } else {
      cashbackAmount = ctx.amount * card.baseRewardRate / 100;
      benefitText = '1.5% NeuCoins';
    }
  } else if (isExcluded) {
    cashbackAmount = 0;
  } else if (card.id === 'hdfc-swiggy') {
    if (ctx.isIntl) {
      isExcluded = true;
      benefitText = 'Excluded from earning rewards on International';
    } else if ((ctx.isOnline || ctx.isDining) && (ctx.isFoodDelivery || ctx.isDining || ctx.isGrocery) && ctx.shouldShowOffer('swiggy')) {
      const eligible = Math.min(ctx.amount, 15000);
      cashbackAmount = (eligible * 0.10);
      benefitText = '10% Cashback';
    } else if (ctx.isOnline && ctx.isNykaaOrBeauty && ctx.shouldShowOffer('nykaa')) {
      const eligible = Math.min(ctx.amount, 30000);
      const over = Math.max(0, ctx.amount - 30000);
      cashbackAmount = (eligible * 0.05) + (over * 0.01);
      discountAmount = ctx.amount * 0.05;
      benefitText = `5% Cashback + 5% Instant Discount`;
      cashbackAmount += discountAmount;
    } else if (ctx.isOnline && ctx.isCleartripOrTravel && ctx.shouldShowOffer('cleartrip')) {
      const eligible = Math.min(ctx.amount, 30000);
      const over = Math.max(0, ctx.amount - 30000);
      cashbackAmount = (eligible * 0.05) + (over * 0.01);
      const ctDisc = ctx.isHotelCatOrName ? 0.20 : 0.0635;
      discountAmount = ctx.amount * ctDisc;
      cashbackAmount += discountAmount;
      benefitText = `5% Cashback + ${(ctDisc * 100).toFixed(2)}% Instant Discount (Code: CTSWHDFC)`;
    } else if (ctx.isOnline && !ctx.isHdfcSwiggyExcludedCat) {
      const eligible = Math.min(ctx.amount, 30000);
      const over = Math.max(0, ctx.amount - 30000);
      cashbackAmount = (eligible * 0.05) + (over * 0.01);
      benefitText = '5% Cashback';
    } else {
      cashbackAmount = ctx.amount * 0.01;
      benefitText = '1% Base Rewards';
    }
  } else if (card.id === 'kiwi-neon' && (ctx.isScanToPay || ctx.isOnline)) {
    let finalRate = ctx.isScanToPay ? kiwiNeonEarnRate : 0.5;
    cashbackAmount = ctx.amount * (finalRate / 100);
    benefitText = `${finalRate}% Cashback on ${ctx.isScanToPay ? 'Scan & Pay' : 'Online UPI'}`;
  } else if (card.id === 'kotak-811-infinity' && ctx.isScanToPay) {
    cashbackAmount = 3;
    benefitText = 'Mystery Cashback on Scan & Pay';
  } else if (card.id === 'sbi-cashback') {
    if (ctx.isOnline) {
      const eligible = Math.min(ctx.amount, 40000);
      cashbackAmount = eligible * 0.05;
      benefitText = '5% Cashback';
    } else {
      cashbackAmount = ctx.amount * 0.01;
      benefitText = '1% Base Rewards';
    }
  } else if (card.id === 'kotak-811-infinity' && !ctx.isScanToPay) {
    const kCycle = getOfferCycleForCard('kotak-811-infinity', ctx.cardBillDates);
    const movieUsed = ctx.offerUsage[`kotak-811-infinity-Movies-BMS-${kCycle}`] || 0;
    const diningUsed = ctx.offerUsage[`kotak-811-infinity-Dining-District-${kCycle}`] || 0;

    if (ctx.isIntl) {
      cashbackAmount = Math.min(ctx.amount * 0.05, 100);
      benefitText = '5% Cashback';
    } else if ((ctx.isMovie || ctx.isBmsName) && ctx.isOnline && movieUsed < 1 && ctx.amount > 399 && ctx.shouldShowOffer('bookmyshow')) {
      discountAmount = Math.min(ctx.amount * 0.5, 300);
      const remaining = ctx.amount - discountAmount;
      cashbackAmount = discountAmount + Math.min(remaining * 0.05, 100);
      benefitText = '1+1 Movie on BookMyShow + 5% Cashback';
    } else if ((ctx.isDining || ctx.isDistrictName) && (ctx.isOnline || ctx.isDining) && diningUsed < 1 && ctx.amount > 1999 && ctx.shouldShowOffer('district')) {
      discountAmount = Math.min(ctx.amount * 0.20, 750);
      const remaining = ctx.amount - discountAmount;
      cashbackAmount = discountAmount + Math.min(remaining * 0.05, 100);
      benefitText = '20% Off on District + 5% Cashback';
    } else {
      cashbackAmount = Math.min(ctx.amount * 0.05, 100);
      benefitText = '5% Cashback';
    }
  } else {
    if (!isExcluded) {
      const cardCycle = getOfferCycleForCard(card.id, ctx.cardBillDates);
      const usedBenefit = findBestBenefit(card, cardCycle, ctx);

      if (usedBenefit) {
        const benefitCalc = calculateBenefitCashback(card, usedBenefit, ctx);
        cashbackAmount = benefitCalc.cashbackAmount;
        benefitText = benefitCalc.benefitText;
      } else {
        cashbackAmount = (ctx.amount * card.baseRewardRate / 100);
        benefitText = `${card.baseRewardRate}% Base Rewards`;
      }
    }
  }

  const universalApplied = applyUniversalOffers(card, isExcluded, cashbackAmount, benefitText, ctx);
  cashbackAmount = universalApplied.cashbackAmount;
  benefitText = universalApplied.benefitText;

  const loadedForexMarkup = card.forexMarkup * 1.18;
  const forexFee = ctx.isIntl ? round2(ctx.amount * loadedForexMarkup / 100) : 0;
  const netValue = isExcluded ? -forexFee : round2(cashbackAmount - forexFee);

  return {
    card: cardToUse, netValue, cashbackEarned: isExcluded ? 0 : round2(cashbackAmount), feesPaid: forexFee, benefitText, isExcluded
  };
}

export function getQuarterCycle(): string {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${quarter}`;
}


export function getOfferCycleForCard(cardId: string, cardBillDates: Record<string, number>): string {
  let billDay = cardBillDates[cardId] || 1;
  const card = CARD_DICT[cardId];
  if (card && card.type === 'Debit') {
    billDay = 1;
  }
  if (cardId === 'axis-myzone') {
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

export function getCycleForCard(cardId: string, cardBillDates: Record<string, number>): string {
  let billDay = cardBillDates[cardId] || 1;
  const card = CARD_DICT[cardId];
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
  const isGrocery = hasKeyword(targets, GROCERY_REGEX);
  const isFoodDelivery = hasKeyword(targets, FOOD_DELIVERY_REGEX) && !hasKeyword([nameL], FOOD_DELIVERY_EXCLUSIONS_REGEX);
  const isDining = hasKeyword(targets, DINING_REGEX);
  const isMovie = hasKeyword(targets, MOVIE_REGEX);
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

  const isBmsOrDistrict = BMS_DISTRICT_REGEX.test(nameL);
  const isBmsOrDistrictOrBms = BMS_DISTRICT_BMS_REGEX.test(nameL);

  // Optimization: Precompute values that are constant across all cards
  const isUtilityCat = catL.includes('utility') || catL.includes('utilities');
  const isGamblingName = nameL.includes('gambling');
  const isGamblingCat = catL.includes('gambling');
  const isTataNeuUtility = catL.includes('utilities') || nameL.includes('internet') || nameL.includes('bill') || nameL.includes('bills') || nameL.includes('toll') || nameL.includes('tata play') || nameL.includes('fastag');
  const isNykaaOrBeauty = nameL.includes('nykaa') || platL.includes('nykaa') || catL.includes('beauty');
  const isHotelCatOrName = nameL.includes('hotel') || catL.includes('hotel');
  const isCleartripOrTravel = nameL.includes('cleartrip') || catL.includes('travel') || platL.includes('cleartrip') || nameL.includes('flight') || isHotelCatOrName;
  const isHdfcSwiggyExcludedCat = catL.includes('utility') || nameL.includes('utility') || catL.includes('fuel') || nameL.includes('fuel') || catL.includes('gaming') || nameL.includes('gaming') || catL.includes('gambling') || nameL.includes('gambling') || catL.includes('finance') || nameL.includes('finance') || catL.includes('education') || nameL.includes('education') || catL.includes('school') || nameL.includes('school') || catL.includes('rail') || nameL.includes('rail') || catL.includes('travel') || nameL.includes('travel') || catL.includes('flights') || nameL.includes('flights') || catL.includes('hotel') || nameL.includes('hotel');
  const isBmsName = nameL.includes('bookmyshow') || nameL.includes('bms');
  const isDistrictName = nameL.includes('district');
  const isFoodName = nameL.includes('food');
  const isEazydiner = nameL.includes('eazydiner') || platL.includes('eazydiner');
  const isAjioNameOrPlat = nameL.includes('ajio') || platL.includes('ajio');
  const isAjio = catL.includes('ajio') || isAjioNameOrPlat;
  const currentQuarterCycle = getQuarterCycle();
  const cinepolisDiscount = Math.min(amount * 0.25, 75);
  const ajioDisc = amount * 0.20;

  const isDistrictPlat = platL && platL.includes('district');
  const isCinepolisName = nameL.includes('cinepolis');

  const matchedSpecificPlatforms = new Set<string>();
  for (const plat of SPECIFIC_PLATFORMS) {
    if (nameL.includes(plat) || (platL && platL.includes(plat))) {
      matchedSpecificPlatforms.add(plat);
    }
  }


  const queryWordsList = [...nameL.split(/[\s,.-]+/), ...platL.split(/[\s,.-]+/)].filter(Boolean);
  const queryWordsWithCat = [...queryWordsList, catL].filter(Boolean);

  const isNameGeneric = (name: string, cat: string) => {
    if (name === cat) return true;
    const generics = [
      'flight', 'flights', 'hotel', 'hotels', 'travel', 'dining', 'food', 'grocery', 'groceries',
      'movie', 'movies', 'cinema', 'theatre', 'shopping', 'apparel', 'clothes', 'clothing', 'fashion',
      'electronics', 'pharmacy', 'health', 'medicine', 'utility', 'utilities', 'bill', 'bills', 'recharge',
      'rent', 'insurance', 'tax', 'jewellery', 'jewelry', 'fuel', 'petrol', 'diesel', 'gas',
      'cab', 'taxi', 'commute', 'transport', 'train', 'bus', 'delivery', 'supermarket',
      'online', 'booking', 'store', 'shop', 'ticket', 'tickets', 'restaurant', 'cafe',
      'bistro', 'diner', 'eatery', 'pizza', 'burger', 'coffee', 'tea', 'bakery', 'sweet', 'sweets',
      'show', 'shows', 'concert', 'event', 'events', 'stay', 'trip', 'travels', 'vacation', 'air',
      'airline', 'airlines', 'accommodation', 'beauty', 'cosmetics', 'cosmetic', 'makeup', 'fragrance',
      '&', 'and', 'or', 'in', 'of', 'for', 'to', 'the', 'a', 'an', 'at', 'on', 'with', 'accessory', 'accessories'
    ];
    const words = name.toLowerCase().split(/[\s,.-]+/);
    return words.every(w => !w || generics.includes(w) || w === cat.toLowerCase());
  };

  const isGenericQuery = isNameGeneric(nameL, catL);



  const determineQueryAggregators = () => {
    const aggregatorsInQuery = new Set<string>();
    // Look for aggregators even in generic queries, because the user could search "dineout" and the category could be "dining", making it generic.
    for (let i = 0, len = MERCHANT_AGGREGATOR_KEYS.length; i < len; i++) {
      const aggregator = MERCHANT_AGGREGATOR_KEYS[i];
      if (queryWordsList.includes(aggregator) || nameL === aggregator || platL === aggregator || (nameL.includes(aggregator) && aggregator.includes(' '))) {
        // use queryWordsList to avoid partial matches like 'mac' in 'pharmacy',
        // but still allow spaces if aggregator name has spaces e.g. 'paytm insider'
        let matched = false;
        if (aggregator.includes(' ')) {
          if (nameL.includes(aggregator) || platL.includes(aggregator)) matched = true;
        } else {
          if (queryWordsList.includes(aggregator)) matched = true;
        }

        if (matched) aggregatorsInQuery.add(aggregator);
      }
    }
    return aggregatorsInQuery;
  };


  const queryAggregators = determineQueryAggregators();

  const shouldShowOffer = (targetPlatform: string) => {
    let lowerTarget = targetPlatform.toLowerCase();
    if (lowerTarget === 'bms') lowerTarget = 'bookmyshow';

    const targetCategories = MERCHANT_AGGREGATORS[lowerTarget];

    if (matchedSpecificPlatforms.has(lowerTarget)) return true;

    if (targetCategories) {
      // Check if ANY aggregator in the query shares a category with the target aggregator
      let sharesCategoryWithAnotherAggregatorInQuery = false;
      for (const queryAgg of queryAggregators) {
        if (queryAgg === lowerTarget) continue; // Should have been caught by matchedSpecificPlatforms
        const queryAggCategories = MERCHANT_AGGREGATORS[queryAgg];
        if (queryAggCategories) {
          const intersection = targetCategories.filter(c => queryAggCategories.includes(c));
          if (intersection.length > 0) {
            sharesCategoryWithAnotherAggregatorInQuery = true;
            break;
          }
        }
      }

      // If a competing aggregator is explicitly in the query, DO NOT show this offer.
      if (sharesCategoryWithAnotherAggregatorInQuery) {
        return false;
      }

      // If we reach here, it means the query does NOT explicitly contain this target platform,
      // AND the query does NOT contain a competing aggregator.
      // Should we show it? Only if the query's generic parts match the target's categories,
      // or if it's a generic query.
      if (isGenericQuery) return true;

      const categoryMatch = targetCategories.some(tc => queryWordsWithCat.some(qw => tc.includes(qw) || qw.includes(tc)));
      if (categoryMatch) {
        return true;
      }
    } else {
      if (isGenericQuery) return true;
    }

    return false;
  };


  const cardsToEvaluate = walletCards
    ? CARD_DATA.filter(c => walletCards.includes(c.id) && !c.isDummy)
    : CARD_DATA.filter(c => !c.isDummy);


  const ctx: RecommendationContext = {
    merchant, amount, isOnline, isIntl, isScanToPay, exhaustedCards, offerUsage, cardBillDates,
    nameL, catL, platL,
    isGrocery, isFoodDelivery, isDining, isMovie, isExcludedCatCache,
    isTataNeuAppMerchant, isTataNeuPartnerMerchant, isTataNeuUtility,
    isBmsOrDistrict, isBmsOrDistrictOrBms,
    isUtilityCat, isGamblingName, isGamblingCat, isNykaaOrBeauty, isHotelCatOrName, isCleartripOrTravel,
    isHdfcSwiggyExcludedCat, isBmsName, isDistrictName, isFoodName, isEazydiner, isAjioNameOrPlat, isAjio,
    isCinepolisName, isDistrictPlat,
    currentQuarterCycle, cinepolisDiscount, ajioDisc,
    shouldShowOffer
  };

  const calculationResults = cardsToEvaluate.map(card => evaluateCard(card, ctx, kiwiNeonEarnRate));


  const validOptions = calculationResults
    .filter(s => !s.isExcluded && !(s.netValue <= 0 && s.card.baseRewardRate === 0 && s.card.benefits.length === 0))
    .sort((a, b) => b.netValue - a.netValue);

  if (validOptions.length === 0) return null;

  const bestResult = validOptions[0];

  let reason = '';
  if (merchant.isP2P) {
    reason = "Personal P2P UPI transfers are excluded from standard credit card rewards. Use bank account-linked UPI (CRED, Amazon) or Kotak 811 Scan & Pay.";
  }
  else if (isIntl) {
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

  // Fallback for offline Kiwi Neon
  let finalBestResult = bestResult;
  if (!isOnline && !isScanToPay && walletCards?.includes('kiwi-neon')) {
    const kiwiNeonNetValueScan = amount * (kiwiNeonEarnRate / 100);
    if (kiwiNeonNetValueScan > bestResult.netValue) {
      const kiwiCard = CARD_DICT['kiwi-neon'];
      if (kiwiCard) {
        finalBestResult = {
          card: kiwiCard,
          netValue: kiwiNeonNetValueScan,
          cashbackEarned: kiwiNeonNetValueScan,
          feesPaid: 0,
          benefitText: `${kiwiNeonEarnRate}% Cashback on Scan & Pay`,
          isExcluded: false
        };
        reason = `Instead of using a card normally, you will get better returns if you scan and pay using the Kiwi Neon card (${kiwiNeonEarnRate}% back).`;
      }
    }
  }

  const availableOffers: { id: string; icon: string; title: string; description: string; cardId?: string; category: string; }[] = [];

  const kCycle = getOfferCycleForCard('kotak-811-infinity', cardBillDates);
  const aCycle = getOfferCycleForCard('axis-myzone', cardBillDates);
  const iCycle = getOfferCycleForCard('hdfc-imperia', cardBillDates);

  if (!isIntl && isMovie && isOnline) {
    if ((offerUsage[`kotak-811-infinity-Movies-BMS-${kCycle}`] || 0) < 1 && shouldShowOffer('bookmyshow')) {
      availableOffers.push({ id: 'k-bms', icon: '🎬', title: 'Kotak 811', description: 'Buy 1 Get 1 Ticket up to ₹300', category: 'BMS', cardId: 'kotak-811-infinity' });
    }
    if ((offerUsage[`axis-myzone-Movies-District-${aCycle}`] || 0) < 1 && shouldShowOffer('district')) {
      availableOffers.push({ id: 'a-district', icon: '🍿', title: 'Axis MyZone', description: 'Buy 1 Get 1 Ticket up to ₹200', category: 'District', cardId: 'axis-myzone' });
    }
    if ((offerUsage[`hdfc-imperia-Movies-BMS-${iCycle}`] || 0) < 1 && shouldShowOffer('bookmyshow')) {
      availableOffers.push({ id: 'i-bms', icon: '🎟️', title: 'HDFC Imperia', description: '25% points up to ₹250', category: 'BMS', cardId: 'hdfc-imperia' });
    }
    if (!isBmsOrDistrictOrBms && shouldShowOffer('cinepolis')) {
      availableOffers.push({ id: 's-cine', icon: '🎥', title: 'Swiggy oneBLCK', description: '25% off up to ₹75', category: 'Cinepolis', cardId: 'hdfc-swiggy' });
    }
  }

  if (!isIntl && isDining) {
    if ((offerUsage[`kotak-811-infinity-Dining-District-${kCycle}`] || 0) < 1 && shouldShowOffer('district')) {
      availableOffers.push({ id: 'k-dist', icon: '🍽️', title: 'Kotak 811', description: '20% off up to ₹750', category: 'District', cardId: 'kotak-811-infinity' });
    }
    if ((offerUsage[`axis-myzone-Dining-EazyDiner-${aCycle}`] || 0) < 1 && !isFoodDelivery && !nameL.includes('food') && shouldShowOffer('eazydiner')) {
      availableOffers.push({ id: 'a-eazy', icon: '🥂', title: 'Axis MyZone', description: '15% off up to ₹500', category: 'EazyDiner', cardId: 'axis-myzone' });
    }
  }

  if (!isIntl && isFoodDelivery) {
    if ((offerUsage[`axis-myzone-Food-Swiggy-${aCycle}`] || 0) < 2 && !isDining && shouldShowOffer('swiggy')) {
      availableOffers.push({ id: 'a-swig', icon: '🍔', title: 'Axis MyZone', description: 'Flat ₹120 off (AXIS120)', category: 'Swiggy', cardId: 'axis-myzone' });
    }
    if ((offerUsage[`hdfc-imperia-Food-Swiggy-${iCycle}`] || 0) < 1 && !isDining && shouldShowOffer('swiggy')) {
      availableOffers.push({ id: 'i-swig', icon: '🍕', title: 'HDFC Imperia', description: '5% cashback up to ₹150', category: 'Swiggy', cardId: 'hdfc-imperia' });
    }
  }

  if (!isIntl && (nameL.includes('ajio') || platL.includes('ajio') || catL.includes('apparel') || catL.includes('shopping') || catL.includes('fashion') || catL.includes('beauty')) && amount >= 999 && shouldShowOffer('ajio')) {
    availableOffers.push({ id: 's-ajio', icon: '🛍️', title: 'Swiggy oneBLCK', description: 'Flat 20% off on select styles', category: 'Ajio', cardId: 'hdfc-swiggy' });
  }

  const tiedCards = validOptions
    .filter(o => Math.abs(o.netValue - finalBestResult.netValue) < 0.01)
    .map(o => ({ card: o.card, benefit: o.benefitText }));

  const excludedCardIds = new Set();
  for (let i = 0; i < calculationResults.length; i++) {
    const r = calculationResults[i];
    if (r.isExcluded) {
      excludedCardIds.add(r.card.id);
    }
  }

  return {
    bestCard: finalBestResult.card,
    tiedCards: tiedCards.length > 1 ? tiedCards : undefined,
    reason,
    expectedBenefit: finalBestResult.benefitText,
    netValue: finalBestResult.netValue,
    cashbackEarned: finalBestResult.cashbackEarned,
    feesPaid: finalBestResult.feesPaid,
    alternatives: validOptions.slice(tiedCards.length, tiedCards.length + 3).map(s => ({ card: s.card, benefit: s.benefitText, netValue: round2(s.netValue) })),
    availableOffers: availableOffers.filter(o => !o.cardId || !excludedCardIds.has(o.cardId))
  };
}
