import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { OpenRouter } from "@openrouter/sdk";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for categorization
  app.post("/api/categorize", async (req, res) => {
    try {
      const { merchantName, apiKey } = req.body;

      // Input Validation
      if (typeof merchantName !== 'string' || merchantName.trim().length === 0 || merchantName.length > 100) {
        return res.status(400).json({ error: "Invalid merchantName. Must be a string between 1 and 100 characters." });
      }

      if (apiKey && (typeof apiKey !== 'string' || apiKey.length > 255)) {
        return res.status(400).json({ error: "Invalid apiKey." });
      }
      
      const authKey = apiKey || process.env.OPENROUTER_API_KEY;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openrouter/auto",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `Analyze this transaction destination and categorize it. 
Return the broad category (Food, Grocery, E-commerce, Fuel, Travel, Utilities, Dining, Gaming, Entertainment, etc.).
Determine if it is online or offline.
Also flag if it seems to be a personal P2P UPI payment (like paying a friend, a person's name) versus a business/merchant.
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
}`
            },
            {
              role: "user",
              content: merchantName
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API returned ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0]?.message?.content || "{}");
      res.json(result);
    } catch (error) {
      console.error("OpenRouter API Error:", error);
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
