import express from "express";
import path from "path";
import { z } from "zod";

import dotenv from "dotenv";

dotenv.config();

const MerchantInfoSchema = z.object({
  name: z.string(),
  category: z.string(),
  isOnline: z.boolean(),
  isP2P: z.boolean().optional(),
  platform: z.string().optional(),
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.disable("x-powered-by"); // Security: Hide Express technology stack
  app.set("trust proxy", 1); // Security: Ensure req.ip works behind reverse proxies for rate limiting

  // Security headers middleware
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https: wss:; font-src 'self' data: https: https://fonts.gstatic.com;");
    next();
  });

  app.use(express.json({ limit: "10kb" })); // Add payload size limit for security


// Security: Custom in-memory rate limiter to protect external API calls
const rateLimitCache = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // Max requests per window per IP

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  if (!rateLimitCache.has(ip)) {
    rateLimitCache.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  const limitData = rateLimitCache.get(ip)!;

  if (now > limitData.resetTime) {
    // Reset window
    limitData.count = 1;
    limitData.resetTime = now + RATE_LIMIT_WINDOW_MS;
    return next();
  }

  limitData.count += 1;

  if (limitData.count > RATE_LIMIT_MAX_REQUESTS) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({ error: "Too many requests, please try again later." });
  }

  next();
}

// Optional: cleanup periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitCache.entries()) {
    if (now > data.resetTime) {
      rateLimitCache.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS).unref();


  // API Route for categorization
  app.post("/api/categorize", rateLimiter, async (req, res) => {
    console.log("--- Categorization Request Received ---");
    try {
      const { merchantName, apiKey } = req.body;

      // Security: Validate input to prevent DoS, huge prompts, or prompt injection risks
      if (!merchantName || typeof merchantName !== 'string' || merchantName.trim().length === 0) {
        return res.status(400).json({ error: "Valid merchantName is required" });
      }
      if (merchantName.length > 100) {
        return res.status(400).json({ error: "merchantName exceeds maximum length of 100 characters" });
      }
      if (apiKey && (typeof apiKey !== 'string' || /[\r\n]/.test(apiKey))) {
        return res.status(400).json({ error: "Invalid API key format" });
      }

      const sanitizedMerchantName = merchantName.trim();
      console.log(`Merchant to categorize: "${sanitizedMerchantName}"`);

      // Determine which API to use
      const userOpenRouterKey = apiKey;
      const envOpenRouterKey = process.env.OPENROUTER_API_KEY;
      
      const effectiveOpenRouterKey = userOpenRouterKey || envOpenRouterKey;

      const systemPrompt = `You are a professional merchant analyst for a critical data collection organization. Analyze this transaction destination and categorize it. 
Return the most relevant category for the query (Food, Grocery, E-commerce, Fuel, Travel, Utilities, Dining, Gaming, Entertainment, etc.).
Scrape google maps data if needed to categorize a merchant, particularly local stores and restaurants.
Determine if it is online or offline.
Also flag if it seems to be a personal P2P UPI payment (like paying a friend, a person's name, or unregistered store or shop) versus a business/merchant with online presence.
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
        console.log("Calling OpenRouter API (google/gemini-3.1-flash-lite) via fetch...");
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${effectiveOpenRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.URL || "http://localhost:3000",
            "X-Title": "Only Cashbacks"
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-lite",
            temperature: 0,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: sanitizedMerchantName }
            ]
          })
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
