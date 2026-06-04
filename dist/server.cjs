var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_compression = __toESM(require("compression"), 1);
var import_path = __toESM(require("path"), 1);
var import_zod = require("zod");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var MerchantInfoSchema = import_zod.z.object({
  name: import_zod.z.string(),
  category: import_zod.z.string(),
  isOnline: import_zod.z.boolean(),
  isP2P: import_zod.z.boolean().optional(),
  platform: import_zod.z.string().optional()
});
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = Number(process.env.PORT) || 3e3;
  app.disable("x-powered-by");
  app.use((0, import_compression.default)());
  app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://apis.google.com/ https://www.gstatic.com/firebasejs/; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https: wss:; font-src 'self' data: https: https://fonts.gstatic.com; frame-src 'self' https://*.firebaseapp.com https://www.google.com/recaptcha/ https://apis.google.com/;");
    next();
  });
  app.use(import_express.default.json({ limit: "10kb" }));
  const rateLimitCache = /* @__PURE__ */ new Map();
  const RATE_LIMIT_WINDOW_MS = 60 * 1e3;
  const RATE_LIMIT_MAX_REQUESTS = 30;
  function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();
    if (!rateLimitCache.has(ip)) {
      if (rateLimitCache.size >= 1e4) {
        console.warn("Rate limit cache size exceeded (possible DoS attack). Rejecting new IP.");
        return res.status(429).json({ error: "Server under heavy load, please try again later." });
      }
      rateLimitCache.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
      return next();
    }
    const limitData = rateLimitCache.get(ip);
    if (now > limitData.resetTime) {
      limitData.count = 1;
      limitData.resetTime = now + RATE_LIMIT_WINDOW_MS;
      rateLimitCache.delete(ip);
      rateLimitCache.set(ip, limitData);
      return next();
    }
    limitData.count += 1;
    if (limitData.count > RATE_LIMIT_MAX_REQUESTS) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return res.status(429).json({ error: "Too many requests, please try again later." });
    }
    next();
  }
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimitCache.entries()) {
      if (now > data.resetTime) {
        rateLimitCache.delete(ip);
      } else {
        break;
      }
    }
  }, RATE_LIMIT_WINDOW_MS).unref();
  app.post("/api/categorize", rateLimiter, async (req, res) => {
    console.log("--- Categorization Request Received ---");
    try {
      const { merchantName, apiKey } = req.body;
      if (!merchantName || typeof merchantName !== "string" || merchantName.trim().length === 0) {
        return res.status(400).json({ error: "Valid merchantName is required" });
      }
      if (merchantName.length > 100) {
        return res.status(400).json({ error: "merchantName exceeds maximum length of 100 characters" });
      }
      if (apiKey && (typeof apiKey !== "string" || !/^sk-or-[a-zA-Z0-9_-]+$/.test(apiKey))) {
        return res.status(400).json({ error: "Invalid API key format. Key must start with 'sk-or-' and consist of only alphanumeric characters, dashes, and underscores." });
      }
      const sanitizedMerchantName = merchantName.trim();
      console.log(`Merchant to categorize: "${sanitizedMerchantName}"`);
      const userOpenRouterKey = apiKey;
      const envOpenRouterKey = process.env.OPENROUTER_API_KEY;
      const effectiveOpenRouterKey = userOpenRouterKey || envOpenRouterKey;
      const systemPrompt = `You are a professional merchant analyst for a critical data collection organization. Analyze this transaction destination and categorize it. 
Return the most relevant category for the query (Food Delivery, Grocery, E-commerce, Fuel, Travel, Fashion, Utilities, Dining, Gaming, Movies, Software, Services, Hobbies, Activities, Entertainment, etc.).
Scrape google maps data to categorize merchants, particularly local stores and restaurants. Be very precise - if a merchant is a cinema, the category should be movies, not entertainment.
Determine if it is online or offline.
Also flag if it seems to be a personal P2P payment (like paying a friend, a person's name, or unregistered store or shop) versus a business/merchant with online presence. Always check to see if a merchant is a registered business before categorizing.
IMPORTANT PLATFORM MATCHING:
- If it is part of the Tata ecosystem (e.g. Croma, Westside, Zudio, BigBasket, 1mg, Qmin, IHCL, Tata Cliq, Taj), set 'platform' exactly to "Tata Brands".
- If it is a Swiggy property (Swiggy, Instamart, Dineout), set 'platform' to "Swiggy".
- Otherwise, if it's a known platform (Amazon, Flipkart, Cleartrip, Nykaa, etc.), put that in 'platform'.

Output strictly a JSON object matching this TypeScript interface:
{
  name: string;
  category: string;
  isOnline: boolean;
  isP2P: boolean;
  platform?: string;
}`;
      let result = null;
      if (effectiveOpenRouterKey) {
        console.log("Calling OpenRouter API (google/gemini-3-flash-preview) via fetch...");
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${effectiveOpenRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.URL || "http://localhost:3000",
            "X-Title": "Only Cashbacks"
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            temperature: 0,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: sanitizedMerchantName }
            ]
          }),
          signal: AbortSignal.timeout(1e4)
          // 10 second timeout
        });
        if (!response.ok) {
          throw new Error(`OpenRouter API Error: ${response.status} ${await response.text()}`);
        }
        const data = await response.json();
        result = MerchantInfoSchema.parse(JSON.parse(data.choices[0]?.message?.content || "{}"));
      } else {
        console.warn("No OpenRouter API Key found.");
        return res.status(400).json({ error: "OpenRouter API Key is required" });
      }
      res.json(result);
    } catch (error) {
      console.error("Server-side Error during categorization:", error);
      res.status(500).json({ error: "Failed to categorize merchant" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
