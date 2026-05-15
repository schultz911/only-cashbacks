/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MerchantInfo } from "../types";

const EXHAUSTIVE_MERCHANT_MAPPINGS = [
  // Swiggy & Zomato Ecosystem
  { pattern: /swiggy|toing|dineout/i, category: "Food Delivery", isOnline: true, isP2P: false, platform: "Swiggy" },
  { pattern: /zomato|bistro|blinkit/i, category: "Food Delivery", isOnline: true, isP2P: false, platform: "Zomato" },
  { pattern: /zepto ?cafe|eatsure|fresh ?menu|box8|eat ?club|uber ?eats/i, category: "Food Delivery", isOnline: true, isP2P: false },

  // Quick Commerce & Grocery
  { pattern: /zepto/i, category: "Grocery", isOnline: true, isP2P: false, platform: "Zepto" },
  { pattern: /big ?basket|jio ?mart|nature.?s basket|supermart|amazon fresh|dunzo|insta ?mart|getir|flink|jokr/i, category: "Grocery", isOnline: true, isP2P: false },
  { pattern: /d ?mart|star ?bazaar|spencers|more|supermarket|grocery|groceries|kirana|provisions|convenience|general|household|produce|retail|outlet|mart/i, category: "Grocery", isOnline: false, isP2P: false },

  // D2C Food, Beverage & Meat
  { pattern: /licious|whole truth|slurrp farm|happilo|rage|country delight|sleepy owl/i, category: "Grocery", isOnline: true, isP2P: false },

  // E-commerce & Shopping (Horizontal & Social)
  { pattern: /amazon|amzn/i, category: "E-commerce", isOnline: true, isP2P: false, platform: "Amazon" },
  { pattern: /flipkart|fkrt/i, category: "E-commerce", isOnline: true, isP2P: false, platform: "Flipkart" },
  { pattern: /myntra|ajio|meesho|zivame|nobero|snitch|flatheads|blissclub|superbottoms|damensch|jockey|pant project|twenty dresses|souled store|pantaloons|westside|marks & spencer|forever 21|h ?& ?m|zara|van heusen|the collective|nykaa fashion/i, category: "Apparel", isOnline: true, isP2P: false },
  { pattern: /nykaa|mamaearth|sugar|plum|minimalist|wow|mcaffeine|dot ?& ?key|juicy chemistry|earth rhythm|moms co|beardo|bombay shaving|innovist|house of em5|nua|cosmetic|makeup|fragrance|perfume|skin ?care|hair ?care/i, category: "Beauty", isOnline: true, isP2P: false },
  { pattern: /snapdeal|lenskart|firstcry|cliq|paytm|indiamart|shop101|glowroad|trell|online|shop|shopping|store|bazaar|marketplace/i, category: "Shopping", isOnline: true, isP2P: false },

  // Furniture & Home Decor
  { pattern: /pepperfry|hometown|saraf|furniture|interio|urban ladder|fabindia|home centre|chumbak|ikea|westside|nilkamal|baaya design|myntra home|wakefit/i, category: "Shopping", isOnline: true, isP2P: false },

  // Electronics & Hardware
  { pattern: /croma|reliance digital|vijay sales|lotus electronics|global electronics|electronics|appliance|gadget|computer|hardware|mobile|phone/i, category: "Shopping", isOnline: false, isP2P: false },
  { pattern: /boat|noise|candes|samsung|lg|voltas|godrej|intex|samtel|simmtronics|sterlite|foxconn|wistron|technology|tech|digital/i, category: "Shopping", isOnline: true, isP2P: false },
  { pattern: /reliance trends|reliance|brand|showroom/i, category: "Shopping", isOnline: false, isP2P: false },

  // Pharmacies, Diagnostics & Health
  { pattern: /apollo|pharmeasy|1mg|medplus|netmeds|flipkart health|truemeds|medibuddy|healthians|dr ?lal|pathlabs|practo|healthkart/i, category: "Health", isOnline: true, isP2P: false },

  // Travel, Hotels & Transport
  { pattern: /cleartrip|makemytrip|redbus|abhibus|mmt|yatra|goibibo|ixigo|agoda|booking\.com|booking|easemytrip|airbnb|travel|tour|trip|holiday|vacation/i, category: "Travel", isOnline: true, isP2P: false },
  { pattern: /irctc|indian railway|rail|railway|train|railway ticket|vande bharat|tejas|gatimaan|shatabdi|rajdhani|duronto|suyodhan|tejas express|tejas rajdhani|tejas shatabdi|tejas duronto/i, category: "Rail", isOnline: true, isP2P: false },
  { pattern: /uber|ola|olacabs|rapido|namma yatri|cab|taxi|auto|commute|transport/i, category: "Commute", isOnline: true, isP2P: false },
  { pattern: /flight|airways|airlines|indigo|spicejet|air india|vistara|akasa|aviation/i, category: "Flights", isOnline: true, isP2P: false },
  { pattern: /hotel|resort|club mahindra|radisson|lemon tree|oyorooms|airbnb|stay|accommodation|lodging/i, category: "Hotel", isOnline: false, isP2P: false },
  { pattern: /taj|ihcl/i, category: "Hotel", isOnline: false, isP2P: false, platform: "Tata" },

  // Entertainment, OTT & Events
  { pattern: /bookmyshow|bms|paytm insider|townscript|mera event|pvr|inox|cinepolis|movie|cinema|theatre/i, category: "Movies", isOnline: true, isP2P: false },
  { pattern: /netflix|amazon prime|disney|hotstar|jiohotstar|sony|zee5|mx player|youtube|apple tv|spotify|apple music|streaming|ott|podcast|audible|subscription|digital/i, category: "Entertainment", isOnline: true, isP2P: false },

  // Gaming (Storefronts, Top-Ups & Gray Markets)
  { pattern: /steam|playstation|xbox|blizzard|gog|ea ?play|ubisoft|rockstar|epic games|nintendo|greenmangaming|fanatical|gamersgate|game|games|gaming/i, category: "Gaming", isOnline: true, isP2P: false },
  { pattern: /codashop|unipin|game kharido|lapakgaming|itemku|enjoygm|rushbuy|keygold|lootbar|allkeyshop|kiosgamer|g2a|driffle|eneba|kinguin|gamivo|royalcdkeys|startselect|gameseal|relic play|instant-gaming|keysworlds|all keys|gmg|voidu/i, category: "Reseller", isOnline: true, isP2P: false },

  // Education & EdTech
  { pattern: /internshala|edugorilla|infinity learn|toppr|unacademy|vedantu|physicswallah|upgrad|simplilearn|leverage edu|arivihan|udemy|next education|iquanta|imarticus|whitehat jr|education|school|college|university|tuition|fees|course|training|learning/i, category: "Education", isOnline: true, isP2P: false },
  { pattern: /scooboo|stationery|book|pen|paper|office supply/i, category: "Shopping", isOnline: true, isP2P: false },

  // Software, VPNs & Cloud
  { pattern: /nordvpn|surfshark|expressvpn|proton vpn|mullvad|cyberghost/i, category: "Software", isOnline: true, isP2P: false },
  { pattern: /microsoft onedrive|pcloud|sync\.com|icedrive|aws|azure|google cloud|iha cloud/i, category: "Software", isOnline: true, isP2P: false },
  { pattern: /google|google play|youtube premium|google storage|play store|android store/i, category: "App Store", isOnline: true, isP2P: false, platform: "Google Play" },
  { pattern: /apple|icloud|app store|itunes|mac store/i, category: "App Store", isOnline: true, isP2P: false, platform: "Apple" },

  // Home Services & Utility
  { pattern: /urban company|housejoy|hometriangle|timesaverz|helpr|bro4u|quikreasy|snabbit|pronto|zimmber|urban|service|cleaning|pest control|repair|plumber|electrician|appliance|handyman/i, category: "Services", isOnline: true, isP2P: false },
  { pattern: /fastag|nhai|toll|highway/i, category: "Utilities", isOnline: true, isP2P: false },
  { pattern: /act|act fibernet|jio fiber|airtel xstream|broadband|fiber|internet|wifi/i, category: "Utilities", isOnline: true, isP2P: false },
  { pattern: /bescom|bwssb|mahavitaran|mseb|adani electricity|tata power|cesc|electricity|power|jio|airtel|vi|vodafone|bsnl|mtnl|recharge|bill pay|telecom|dth|sun direct|tata play|tata sky|dish tv|water|water bill|utility|bill|bills/i, category: "Utilities", isOnline: true, isP2P: false },

  // Fintech & Payments
  { pattern: /cred|cred\.club|rent|tax|phonepe|finance|fintech|emi|loan|etmoney|mutual fund|stocks|stock|crypto|cryptocurrency|coinbase|binance|wazirx|coinjar|kraken|paypal|paytm|bajaj finserv|money view|airtel thanks|monefy|scripbox|kuvera|groww|siply|goodbudget/i, category: "Finance", isOnline: true, isP2P: false },

  // Rent & Housing
  { pattern: /rent|housing|society|maintenance|proptech|nobroker|magicbricks|99acres/i, category: "Rent", isOnline: true, isP2P: false },

  // Insurance
  { pattern: /lic|insurance|policy|premium|hdfc life|icici pru|max life|tata aia|bajaj allianz|policybazaar/i, category: "Insurance", isOnline: true, isP2P: false },

  // Government & Taxes
  { pattern: /tax|challan|government|municipal|bbmp|itax|income tax|gst|property tax|traffic challan/i, category: "Government", isOnline: true, isP2P: false },

  // Jewellery
  { pattern: /jewel|jewelry|gold|silver|tanishq|malabar|kalyan|joyalukkas|pc jeweller|caratlane/i, category: "Jewellery", isOnline: false, isP2P: false },

  // Fuel & Gas
  { pattern: /hpcl|hindustan petroleum|indianoil|indian oil|iocl|bharat petroleum|bpcl|shell|nayara|petrol|fuel|gas station|diesel|cng/i, category: "Fuel", isOnline: false, isP2P: false },

  // Dining
  { pattern: /domino|pizza hut|eat.?sure|box8|freshmenu|magicpin|starbucks|mcdonald|kfc|burger king|haldiram|bikanervala|dining|food|meal|feast/i, category: "Dining", isOnline: true, isP2P: false },
  { pattern: /cafe|restaurant|diner|eatery|pub|bar|coffee|bistro|lounge|grill|steakhouse/i, category: "Dining", isOnline: false, isP2P: false }
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
  if (norm.includes('courier') || norm.includes('logistics') || norm.includes('urban company') || norm.includes('uber')) {
    return { name: merchantName, category: "Services", isOnline: true, isP2P: false };
  }
  if (norm.includes('swiggy') || norm.includes('zomato') || norm.includes('food') || norm.includes('delivery') || norm.includes('restaurant')) {
    return { name: merchantName, category: "Dining", isOnline: true, isP2P: false };
  }
  if (norm.includes('paytm') || norm.includes('phonepe') || norm.includes('gpay') || norm.includes('bharatpe') || norm.includes('razorpay') || norm.includes('payu')) {
    return { name: merchantName, category: "Finance", isOnline: true, isP2P: false };
  }

  return null;
}

export async function categorizeMerchant(merchantName: string, apiKey?: string): Promise<MerchantInfo> {
  if (!merchantName) throw new Error("Merchant name is required");

  try {
    const response = await fetch("/api/categorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ merchantName, apiKey })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.category) {
        return data as MerchantInfo;
      }
    } else {
      const errText = await response.text();
      console.warn("Backend API Error:", errText);
    }
  } catch (error) {
    console.error("Backend API Fetch Error:", error);
  }

  // Fallback to local string/regex resolution if API fails or returns invalid data
  const localMatch = categorizeLocal(merchantName);
  if (localMatch) {
    return localMatch;
  }

  // Final fallback
  return {
    name: merchantName,
    category: "Other",
    isOnline: true,
    isP2P: false
  };
}

