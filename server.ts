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
    console.log("--- Categorization Request Received ---");
    try {
      const { merchantName, apiKey } = req.body;
      console.log(`Merchant: "${merchantName}", API Key provided: ${!!apiKey}`);

      // Input Validation
      if (typeof merchantName !== 'string' || merchantName.trim().length === 0 || merchantName.length > 100) {
        return res.status(400).json({ error: "Invalid merchantName. Must be a string between 1 and 100 characters." });
      }

      if (apiKey && (typeof apiKey !== 'string' || apiKey.length > 255)) {
        return res.status(400).json({ error: "Invalid apiKey." });
      }

      const authKey = apiKey || process.env.OPENROUTER_API_KEY;
      if (!authKey) {
        console.error("No OpenRouter API key found in request or environment.");
        return res.status(401).json({ error: "No API key configured." });
      }

      console.log("Calling OpenRouter API via SDK...");
      const openrouter = new OpenRouter({
        apiKey: authKey,
      });

      const response = await (openrouter.chat.send as any)({
        chatRequest: {
          model: "google/gemini-2.0-flash-lite-001",
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
- If it is part of the Swiggy ecosystem (Swiggy, Instamart, Dineout), set 'platform' to "Swiggy".
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
        },
        session_id: "only-cashbacks-categorization"
      });

      console.log("OpenRouter Response Received Successfully.");
      const content = (response as any).choices?.[0]?.message?.content || (response as any).content || "{}";
      const result = JSON.parse(content);
      res.json(result);
    } catch (error) {
      console.error("Server-side Categorization Error:", error);
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
