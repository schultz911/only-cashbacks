import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { OpenRouter } from "@openrouter/sdk";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check for debugging Render deployments
  app.get("/api/health", (req, res) => {
    res.json({
      status: "running",
      hasApiKey: !!process.env.OPENROUTER_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      port: PORT
    });
  });

  // API Route for categorization
  app.post("/api/categorize", async (req, res) => {
    console.log("--- Categorization Request Received ---");
    try {
      const { merchantName, apiKey } = req.body;
      console.log(`Merchant: "${merchantName}", Custom API Key: ${!!apiKey}`);

      const authKey = apiKey || process.env.OPENROUTER_API_KEY;
      if (!authKey) {
        console.error("No API key available.");
        return res.status(401).json({ error: "API key required. Provide one in UI or set OPENROUTER_API_KEY on server." });
      }

      const openrouter = new OpenRouter({
        apiKey: authKey,
      });

      if (!process.env.OPENROUTER_API_KEY) {
        console.warn("WARNING: OPENROUTER_API_KEY is not set in process.env");
      }

      console.log("Calling OpenRouter API via SDK...");
      
      const response = await (openrouter.chat.send as any)({
        chatRequest: {
          model: "openrouter/auto", // Use openrouter/auto as requested
          temperature: 0, // Deterministic output for categorization
          responseFormat: { type: "json_object" },
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
        }
      });

      console.log("OpenRouter Response Received.");
      const content = (response as any).choices?.[0]?.message?.content || (response as any).content || "{}";
      const result = JSON.parse(content);
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
