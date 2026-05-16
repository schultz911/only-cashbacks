import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { OpenRouter } from "@openrouter/sdk";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "10kb" })); // Add payload size limit for security

  // API Route for categorization
  app.post("/api/categorize", async (req, res) => {
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
      if (apiKey && typeof apiKey !== 'string') {
        return res.status(400).json({ error: "Invalid API key format" });
      }

      const sanitizedMerchantName = merchantName.trim();
      console.log(`Merchant to categorize: "${sanitizedMerchantName}"`);

      // Determine which API to use
      const userOpenRouterKey = apiKey;
      const envOpenRouterKey = process.env.OPENROUTER_API_KEY;
      const envGeminiKey = process.env.GEMINI_API_KEY;
      
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
        console.log("Calling OpenRouter API via fetch...");
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${effectiveOpenRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.URL || "http://localhost:3000",
            "X-Title": "Only Cashbacks"
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-lite-001",
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
        console.log("OpenRouter Response Received.");
        result = JSON.parse(data.choices[0]?.message?.content || "{}");
      } else if (envGeminiKey) {
        console.log("Calling Google Gemini Environment API...");
        const ai = new GoogleGenAI({ apiKey: envGeminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: sanitizedMerchantName,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0,
            responseMimeType: "application/json"
          }
        });
        console.log("Gemini Response Received.");
        result = JSON.parse(response.text || "{}");
      } else {
        console.warn("No valid API Key found (User Input APIs or Environment API).");
        return res.status(400).json({ error: "API Key is required" });
      }

      res.json(result);
    } catch (error) {
      console.error("Server-side Error during categorization:", error);
      res.status(500).json({ error: "Failed to categorize merchant" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
