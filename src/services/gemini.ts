/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MerchantInfo } from "../types";

const EXHAUSTIVE_MERCHANT_MAPPINGS = [
  // Swiggy & Zomato Ecosystem
  { pattern: /swiggy|toing/i, category: "Food Delivery", isOnline: true, isP2P: false, platform: "Swiggy" },
  { pattern: /zomato|bistro/i, category: "Food Delivery", isOnline: true, isP2P: false, platform: "Zomato" },
  { pattern: /zepto ?cafe|eatsure|fresh ?menu|box8|eat ?club|uber ?eats|food ?delivery/i, category: "Food Delivery", isOnline: true, isP2P: false },

  // Quick Commerce & Grocery
  { pattern: /zepto/i, category: "Grocery", isOnline: true, isP2P: false, platform: "Zepto" },
  { pattern: /big ?basket|bbnow|jio ?mart|nature.?s basket|first ?club|supermart|grocery|groceries|amazon fresh|flipkart grocery|dmart ready|dunzo|insta ?mart|getir|flink|jokr/i, category: "Grocery", isOnline: true, isP2P: false },
  { pattern: /d ?mart|star ?bazaar|spencers|\bmore\b|supermarket|grocery|groceries|kirana|provisions|convenience|\bgeneral\b|household|\bproduce\b|\bretail\b|\boutlet\b|\bmart\b/i, category: "Grocery", isOnline: false, isP2P: false },

  // D2C Food, Beverage & Meat
  { pattern: /licious|whole truth|slurrp farm|happilo|\brage\b|country delight|sleepy owl/i, category: "Grocery", isOnline: true, isP2P: false },

  // E-commerce & Shopping (Horizontal & Social)
  { pattern: /amazon|amzn/i, category: "E-commerce", isOnline: true, isP2P: false, platform: "Amazon" },
  { pattern: /flipkart|fkrt/i, category: "E-commerce", isOnline: true, isP2P: false, platform: "Flipkart" },
  { pattern: /myntra|ajio|meesho|zivame|nobero|snitch|flatheads|blissclub|superbottoms|damensch|jockey|pant project|twenty dresses|souled store|pantaloons|westside|marks & spencer|forever 21|\bh ?& ?m\b|zara|van heusen|the collective|nykaa fashion/i, category: "Apparel", isOnline: true, isP2P: false },
  { pattern: /nykaa|mamaearth|\bsugar\b|\bplum\b|minimalist|wow skin|wow life|mcaffeine|dot ?& ?key|juicy chemistry|earth rhythm|moms co|beardo|bombay shaving|innovist|house of em5|nua|cosmetic|makeup|fragrance|perfume|skin ?care|hair ?care/i, category: "Beauty", isOnline: true, isP2P: false },
  { pattern: /snapdeal|lenskart|firstcry|\bcliq\b|paytm|indiamart|shop101|glowroad|trell|\bonline\b|\bshop\b|shopping|\bstore\b|\bbazaar\b|marketplace/i, category: "Shopping", isOnline: true, isP2P: false },

  // Furniture & Home Decor
  { pattern: /pepperfry|hometown|\bsaraf\b|furniture|\binterio\b|urban ladder|fabindia|home centre|chumbak|ikea|westside|nilkamal|baaya design|myntra home|wakefit/i, category: "Shopping", isOnline: true, isP2P: false },

  // Electronics & Hardware
  { pattern: /croma|reliance digital|vijay sales|lotus electronics|global electronics|electronics|appliance|gadget|computer|hardware|\bmobile\b|\bphone\b/i, category: "Shopping", isOnline: false, isP2P: false },
  { pattern: /\bboat\b|\bnoise\b|candes|samsung|\blg\b|voltas|godrej|intex|samtel|simmtronics|sterlite|foxconn|wistron|technology|\btech\b|digital/i, category: "Shopping", isOnline: true, isP2P: false },
  { pattern: /reliance trends|reliance|\bbrand\b|\bshowroom\b/i, category: "Shopping", isOnline: false, isP2P: false },

  // Pharmacies, Diagnostics & Health
  { pattern: /apollo|pharmeasy|\b1mg\b|medplus|netmeds|flipkart health|truemeds|medibuddy|healthians|dr ?lal|pathlabs|practo|healthkart/i, category: "Health", isOnline: true, isP2P: false },
 
  // Travel, Hotels & Transport
  { pattern: /cleartrip|makemytrip|redbus|abhibus|mmt|yatra|goibibo|ixigo|agoda|booking\.com|booking|easemytrip|airbnb|travel|\btour\b|trip|holiday|vacation/i, category: "Travel", isOnline: true, isP2P: false },
  { pattern: /irctc|indian railway|\brail\b|\brailway\b|\btrain\b|railway ticket|vande bharat|tejas|gatimaan|shatabdi|rajdhani|duronto|suyodhan|tejas express|tejas rajdhani|tejas shatabdi|tejas duronto/i, category: "Rail", isOnline: true, isP2P: false },
  { pattern: /uber|\bola\b|olacabs|rapido|namma yatri|\bcab\b|taxi|\bauto\b|commute|transport|drive ?u/i, category: "Commute", isOnline: true, isP2P: false },
  { pattern: /flight|airways|airlines|indigo|spicejet|air india|vistara|akasa|aviation/i, category: "Flights", isOnline: true, isP2P: false },
  { pattern: /hotel|resort|club mahindra|marriott|mariott|marriot|radisson|ibis|sheraton|hilton|hyatt|novotel|lemon tree|oyorooms|airbnb|\bstay\b|accommodation|lodging/i, category: "Hotel", isOnline: false, isP2P: false },
  { pattern: /\btaj\b|ihcl/i, category: "Hotel", isOnline: false, isP2P: false, platform: "Tata" },

  // Entertainment, OTT & Events
  { pattern: /bookmyshow|bms|paytm insider|townscript|mera event|pvr|inox|cinepolis|movie|cinema|theatre/i, category: "Movies", isOnline: true, isP2P: false },
  { pattern: /netflix|amazon prime|disney|hotstar|jiohotstar|sony|zee5|mx player|youtube|apple tv|spotify|apple music|streaming|\bott\b|podcast|audible|subscription|digital/i, category: "Entertainment", isOnline: true, isP2P: false },

  // Gaming (Storefronts, Top-Ups & Gray Markets)
  { pattern: /steam|playstation|xbox|blizzard|\bgog\b|ea ?play|ubisoft|rockstar|epic games|nintendo|greenmangaming|fanatical|gamersgate|game|games|gaming/i, category: "Gaming", isOnline: true, isP2P: false },
  { pattern: /codashop|unipin|game kharido|lapakgaming|itemku|enjoygm|rushbuy|keygold|lootbar|allkeyshop|kiosgamer|\bg2a\b|driffle|eneba|kinguin|gamivo|royalcdkeys|startselect|gameseal|relic play|instant-gaming|keysworlds|all keys|\bgmg\b|voidu/i, category: "Reseller", isOnline: true, isP2P: false },

  // Education & EdTech
  { pattern: /internshala|edugorilla|infinity learn|toppr|unacademy|vedantu|physicswallah|upgrad|simplilearn|leverage edu|arivihan|udemy|next education|iquanta|imarticus|whitehat jr|education|school|college|university|tuition|\bfees\b|course|training|learning/i, category: "Education", isOnline: true, isP2P: false },
  { pattern: /scooboo|stationery|book|\bpen\b|paper|office supply/i, category: "Shopping", isOnline: true, isP2P: false },

  // Software, VPNs & Cloud
  { pattern: /nordvpn|surfshark|eset|bitdefender|norton|adguard|expressvpn|proton vpn|mullvad|cyberghost/i, category: "Software", isOnline: true, isP2P: false },
  { pattern: /microsoft onedrive|pcloud|sync\.com|icedrive|\baws\b|azure|google cloud|claude|openai|chatgpt|grok|\bgpt\b|\bai\b|iha cloud/i, category: "Software", isOnline: true, isP2P: false },
  { pattern: /google|google play|youtube premium|google storage|play store|android store|gemini/i, category: "App Store", isOnline: true, isP2P: false, platform: "Google Play" },
  { pattern: /apple|icloud|app store|itunes|mac store/i, category: "App Store", isOnline: true, isP2P: false, platform: "Apple" },

  // Home Services & Utility
  { pattern: /urban company|housejoy|hometriangle|timesaverz|helpr|bro4u|quikreasy|snabbit|pronto|zimmber|urban|\bservice\b|cleaning|pest control|repair|plumber|electrician|appliance|handyman/i, category: "Services", isOnline: true, isP2P: false },
  { pattern: /fastag|nhai|toll|highway/i, category: "Utilities", isOnline: true, isP2P: false },
  { pattern: /act|act fibernet|jio fiber|airtel xstream|broadband|fiber|internet|wifi/i, category: "Utilities", isOnline: true, isP2P: false },
  { pattern: /bescom|bwssb|mahavitaran|mseb|adani electricity|tata power|cesc|electricity|power|jio|airtel|\bvi\b|vodafone|bsnl|mtnl|recharge|bill pay|telecom|dth|sun direct|tata play|tata sky|dish tv|\bwater\b|water bill|utility|\bbill\b|\bbills\b/i, category: "Utilities", isOnline: true, isP2P: false },

  // Fintech & Payments
  { pattern: /cred|cred\.club|\brent\b|\btax\b|phonepe|finance|fintech|emi|loan|etmoney|mutual fund|\bstocks\b|\bstock\b|crypto|cryptocurrency|coinbase|binance|wazirx|coinjar|kraken|paypal|paytm|bajaj finserv|money view|airtel thanks|monefy|scripbox|kuvera|groww|siply|goodbudget/i, category: "Finance", isOnline: true, isP2P: false },

  // Rent & Housing
  { pattern: /\brent\b|housing|society|maintenance|proptech|nobroker|magicbricks|99acres/i, category: "Rent", isOnline: true, isP2P: false },

  // Insurance
  { pattern: /\blic\b|insurance|policy|premium|hdfc life|ergo|even\.in|icici pru|max life|tata aia|bajaj allianz|policybazaar|godigit|acko/i, category: "Insurance", isOnline: true, isP2P: false },

  // Government & Taxes
  { pattern: /\btax\b|challan|government|municipal|bbmp|itax|income tax|gst|property tax|traffic challan/i, category: "Government", isOnline: true, isP2P: false },

  // Jewellery
  { pattern: /jewel|jewelry|jewellery|\bgold\b|\bsilver\b|\bplatinum\b|diamond|\bmia\b|tanishq|malabar|kalyan|joyalukkas|pc jeweller|caratlane/i, category: "Jewellery", isOnline: false, isP2P: false },
 
  // Fuel & Gas
  { pattern: /hpcl|hindustan petroleum|indianoil|indian oil|iocl|indane|bharat ?gas|bharat petroleum|bpcl|\bshell\b|nayara|jiobp|petrol|fuel|gas station|diesel|lpg|cng/i, category: "Fuel", isOnline: false, isP2P: false },
 
  // Dining
  { pattern: /domino|pizza.?hut|papa ?johns|mcdonald|kfc|burger.?king|subway|starbucks|faasos|behrouz|oven.?story|box8|freshmenu|eat.?sure|magicpin|haldiram|bikanervala|barbeque.?nation|cafe.?coffee.?day|\bccd\b|chaayos|chai.?point|wow.?momo|wow.?china|taco.?bell|dunkin|krispy.?kreme|mad.?over.?donuts|baskin.?robbin|natural.?ice.?cream|giani|cream.?stone|ibaco|polar.?bear|burger.?singh|wat.?a.?burger|jumbo.?king|goli.?vada.?pav|tibbs|rolls.?mania|kathi.?junction|khan.?chacha|sagar.?ratna|saravana.?bhavan|adyar.?ananda.?bhavan|a2b|mavalli.?tiffin|\bmtr\b|paradise.?biryani|biryani.?by.?kilo|bbk|charcoal.?eats|mojo.?pizza|la.?pino|chicago.?pizza|smokin.?joe|pizza.?corner|us.?pizza|papa.?john|slay.?coffee|barista|costa.?coffee|chai.?sutta|mba.?chai|tea.?post|chocolate.?room|cookie.?man|belgian.?waffle|monginis|mio.?amore|karachi.?bakery|theobroma|glen.?s.?bakehouse|nik.?baker|flurys|keventers|drunken.?monkey|lassi.?n.?shake|frozen.?bottle|mainland.?china|asia.?seven|mamagoto|punjab.?grill|moti.?mahal|copper.?chimney|rajdhani|absolute.?barbecue|pirates.?of.?grill|sigree|oh!.?calcutta|little.?italy|cream.?centre|kailash.?parbat|bikaner.?sweets|nathu|aggarwal.?sweets|om.?sweets|kanti.?sweets|anand.?sweets|hatti.?kaapi|indian.?coffee.?house|social|farzi.?cafe|smoke.?house.?deli|chili.?s|tgi.?friday|\bnando\b|cinnabon|auntie.?anne|pa.?pa.?ya|yauatcha|pind.?balluchi|sankalp|sangeetha|vasudev.?adiga|nandini|empire|meghana.?food|mani.?s.?dum.?biryani|leon.?s.?burger|truffles|toscano/i, category: "Dining", isOnline: true, isP2P: false },
  { pattern: /cafe|restaurant|diner|eatery|\bpub\b|\bbar\b|coffee|bistro|lounge|grill|steakhouse|dining|food|meal|feast/i, category: "Dining", isOnline: false, isP2P: false }
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
  if (norm.includes('swiggy') || norm.includes('zomato') || norm.includes('delivery') || norm.includes('food delivery')) {
    return { name: merchantName, category: "Food Delivery", isOnline: true, isP2P: false };
  }
  if (norm.includes('food') || norm.includes('restaurant') || norm.includes('dining') || norm.includes('cafe')) {
    return { name: merchantName, category: "Dining", isOnline: false, isP2P: false };
  }
  if (norm.includes('paytm') || norm.includes('phonepe') || norm.includes('gpay') || norm.includes('bharatpe') || norm.includes('razorpay') || norm.includes('payu')) {
    return { name: merchantName, category: "Finance", isOnline: true, isP2P: false };
  }

  return null;
}

export async function categorizeMerchant(merchantName: string, apiKey?: string): Promise<MerchantInfo> {
  if (!merchantName) throw new Error("Merchant name is required");

  // UX/Performance Polish: Check local exact/pattern matches FIRST to avoid 1-2s API latency for known merchants!
  const localMatch = categorizeLocal(merchantName);
  if (localMatch) {
    return localMatch;
  }

  const cacheKey = `oc_merchant_${merchantName.toLowerCase()}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as MerchantInfo;
    }
  } catch (e) {}

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
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) {}
        return data as MerchantInfo;
      }
    } else {
      const errText = await response.text();
      console.warn("Backend API Error:", errText);
    }
  } catch (error) {
    console.error("Backend API Fetch Error:", error);
  }

  // Final fallback if both local and API fail
  return {
    name: merchantName,
    category: "Other",
    isOnline: true,
    isP2P: false
  };
}

