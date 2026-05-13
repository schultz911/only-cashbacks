/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MerchantInfo } from "../types";

const EXHAUSTIVE_MERCHANT_MAPPINGS = [
  // Swiggy & Zomato Ecosystem
  { pattern: /swiggy|instamart|dineout/i, category: "Food Delivery", isOnline: true, isP2P: false, platform: "Swiggy" },
  { pattern: /zomato|blinkit/i, category: "Food Delivery", isOnline: true, isP2P: false, platform: "Zomato" },
  
  // Quick Commerce & Grocery
  { pattern: /zepto/i, category: "Grocery", isOnline: true, isP2P: false, platform: "Zepto" },
  { pattern: /bigbasket|jio ?mart|nature.?s basket|flipkart supermart|amazon fresh|dunzo|instacart|getir|flink|jokr/i, category: "Grocery", isOnline: true, isP2P: false },
  { pattern: /dmart|star bazaar|spencers|more retail|supermarket|grocery|kirana|provisions/i, category: "Grocery", isOnline: false, isP2P: false },

  // D2C Food, Beverage & Meat
  { pattern: /licious|the whole truth|slurrp farm|happilo|rage coffee|country delight|sleepy owl/i, category: "Grocery", isOnline: true, isP2P: false },

  // E-commerce & Shopping (Horizontal & Social)
  { pattern: /amazon|amzn/i, category: "E-commerce", isOnline: true, isP2P: false, platform: "Amazon" },
  { pattern: /flipkart|fkrt/i, category: "E-commerce", isOnline: true, isP2P: false, platform: "Flipkart" },
  { pattern: /myntra/i, category: "E-commerce", isOnline: true, isP2P: false, platform: "Myntra" },
  { pattern: /nykaa|nykaa fashion/i, category: "E-commerce", isOnline: true, isP2P: false, platform: "Nykaa" },
  { pattern: /ajio/i, category: "E-commerce", isOnline: true, isP2P: false, platform: "Ajio" },
  { pattern: /meesho|snapdeal|tata cliq|paytm mall|indiamart|shop101|glowroad|trell/i, category: "E-commerce", isOnline: true, isP2P: false },
  
  // D2C Beauty & Personal Care
  { pattern: /mamaearth|sugar cosmetics|plum goodness|minimalist|wow skin science|mcaffeine|dot & key|juicy chemistry|earth rhythm|the moms co|beardo|bombay shaving|innovist|house of em5|nua/i, category: "Beauty", isOnline: true, isP2P: false },

  // D2C Fashion, Apparel & Activewear
  { pattern: /snitch|flatheads|blissclub|damensch|bombay shirt company|twenty dresses/i, category: "Shopping", isOnline: true, isP2P: false },
  { pattern: /firstcry|zivame|lenskart|superbottoms/i, category: "Shopping", isOnline: true, isP2P: false },

  // Furniture & Home Decor
  { pattern: /pepperfry|hometown|saraf furniture|godrej interio|urban ladder|fabindia|home centre|chumbak|ikea|westside|nilkamal|baaya design|myntra home|wakefit/i, category: "Shopping", isOnline: true, isP2P: false },

  // Electronics & Hardware
  { pattern: /croma|reliance digital|vijay sales|lotus electronics|global electronics/i, category: "Shopping", isOnline: false, isP2P: false },
  { pattern: /boat|noise|candes|samsung|lg electronics|voltas|godrej|intex|samtel|simmtronics|sterlite|foxconn|wistron/i, category: "Shopping", isOnline: true, isP2P: false },
  { pattern: /reliance trends|reliance/i, category: "Shopping", isOnline: false, isP2P: false },
  
  // Pharmacies, Diagnostics & Health
  { pattern: /apollo|pharmeasy|1mg|medplus|netmeds|flipkart health|truemeds|medibuddy|healthians|dr lal pathlabs|practo|healthkart/i, category: "Health", isOnline: true, isP2P: false },
  
  // Travel, Hotels & Transport
  { pattern: /cleartrip|makemytrip|mmt|yatra|goibibo|ixigo|agoda|booking\.com|booking|easemytrip|airbnb/i, category: "Travel", isOnline: true, isP2P: false },
  { pattern: /redbus|irctc|indian railway|abhibus|ticketgoose/i, category: "Travel", isOnline: true, isP2P: false },
  { pattern: /uber|ola|olacabs|rapido|namma yatri/i, category: "Travel", isOnline: true, isP2P: false },
  { pattern: /flight|airways|airlines|indigo|spicejet|air india|vistara|akasa/i, category: "Travel", isOnline: true, isP2P: false },
  { pattern: /hotel|resort|taj|ihcl/i, category: "Hotel", isOnline: false, isP2P: false },

  // Entertainment, OTT & Events
  { pattern: /bookmyshow|bms|paytm insider|townscript|mera event/i, category: "Movies", isOnline: true, isP2P: false },
  { pattern: /pvr|inox|cinepolis|movie|cinema|theatre/i, category: "Movies", isOnline: false, isP2P: false },
  { pattern: /netflix|amazon prime|disney|hotstar|jiohotstar|sony|zee5|mx player|youtube|apple tv|spotify|apple music/i, category: "Entertainment", isOnline: true, isP2P: false },

  // Gaming (Storefronts, Top-Ups & Gray Markets)
  { pattern: /steam|playstation|xbox|epic games|nintendo|greenmangaming|fanatical|gamersgate/i, category: "Gaming", isOnline: true, isP2P: false },
  { pattern: /codashop|unipin|game kharido|lapakgaming|itemku|enjoygm|rushbuy|keygold|lootbar|kiosgamer|g2a|driffle|eneba|kinguin|gamivo|royalcdkeys|startselect|gameseal/i, category: "Gaming", isOnline: true, isP2P: false },

  // Education & EdTech
  { pattern: /internshala|edugorilla|infinity learn|toppr|unacademy|vedantu|physicswallah|upgrad|simplilearn|leverage edu|arivihan|udemy|next education|iquanta|imarticus|whitehat jr/i, category: "Education", isOnline: true, isP2P: false },
  { pattern: /scooboo/i, category: "Shopping", isOnline: true, isP2P: false },

  // Software, VPNs & Cloud
  { pattern: /nordvpn|surfshark|expressvpn|proton vpn|mullvad|cyberghost/i, category: "Software", isOnline: true, isP2P: false },
  { pattern: /microsoft onedrive|pcloud|sync\.com|icedrive|aws|azure|google cloud|iha cloud/i, category: "Software", isOnline: true, isP2P: false },
  { pattern: /google play|youtube premium|google storage/i, category: "App Store", isOnline: true, isP2P: false, platform: "Google Play" },
  { pattern: /apple/i, category: "App Store", isOnline: true, isP2P: false, platform: "Apple" },

  // Home Services & Utility
  { pattern: /urban company|housejoy|hometriangle|timesaverz|helpr|bro4u|quikreasy|snabbit|pronto|zimmber/i, category: "Services", isOnline: true, isP2P: false },
  { pattern: /fastag|nhai/i, category: "Utilities", isOnline: true, isP2P: false },
  { pattern: /act|act fibernet|jio fiber|airtel xstream/i, category: "Utilities", isOnline: true, isP2P: false },
  { pattern: /bescom|mahavitaran|mseb|adani electricity|tata power|cesc|electricity|power|jio|airtel|vi|vodafone|bsnl|mtnl|recharge|bill pay|telecom|dth|sun direct|tata play|tata sky|dish tv/i, category: "Utilities", isOnline: true, isP2P: false },
  
  // Fintech & Payments
  { pattern: /cred|cred\.club|phonepe|paytm|bajaj finserv|money view|airtel thanks|monefy|scripbox|kuvera|groww|siply|goodbudget/i, category: "Utilities", isOnline: true, isP2P: false },

  // Fuel & Gas
  { pattern: /hpcl|hindustan petroleum|indianoil|indian oil|iocl|bharat petroleum|bpcl|shell|nayara|petrol|fuel|gas station/i, category: "Fuel", isOnline: false, isP2P: false },

  // Dining
  { pattern: /domino|pizza hut|eat.?sure|box8|freshmenu|magicpin|starbucks|mcdonald|kfc|burger king|haldiram|bikanervala/i, category: "Dining", isOnline: true, isP2P: false },
  { pattern: /cafe|restaurant|diner|eatery|pub|bar|coffee/i, category: "Dining", isOnline: false, isP2P: false }
];

function categorizeLocal(merchantName: string): MerchantInfo | null {
  const norm = merchantName.toLowerCase();

  // Pattern matching
  for (const mapping of EXHAUSTIVE_MERCHANT_MAPPINGS) {
    if (mapping.pattern.test(norm)) {
      return {
        name: merchantName,
        category: mapping.category,
        isOnline: mapping.isOnline,
        isP2P: mapping.isP2P,
        platform: mapping.platform
      };
    }
  }

  // Common keywords fallback
  if (norm.includes('store') || norm.includes('shop') || norm.includes('mart') || norm.includes('retail')) {
    return { name: merchantName, category: "Shopping", isOnline: false, isP2P: false };
  }
  if (norm.includes('hospital') || norm.includes('clinic') || norm.includes('dr.') || norm.includes('doctor')) {
    return { name: merchantName, category: "Health", isOnline: false, isP2P: false };
  }
  if (norm.includes('paytm') || norm.includes('phonepe') || norm.includes('gpay') || norm.includes('upi') || norm.includes('bharatpe') || norm.includes('razorpay') || norm.includes('payu')) {
    return { name: merchantName, category: "General", isOnline: true, isP2P: false };
  }

  return null;
}

export async function categorizeMerchant(merchantName: string): Promise<MerchantInfo> {
  if (!merchantName) throw new Error("Merchant name is required");

  // First attempt local string/regex resolution to minimize API usages
  const localMatch = categorizeLocal(merchantName);
  if (localMatch) {
    return localMatch;
  }

  try {
    const response = await fetch("/api/categorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantName })
    });

    if (!response.ok) {
       throw new Error(`Server returned ${response.status}`);
    }

    const result = await response.json();
    return result as MerchantInfo;
  } catch (error) {
    console.error("API Error:", error);
    return {
      name: merchantName,
      category: "Other",
      isOnline: true,
      isP2P: false
    };
  }
}

