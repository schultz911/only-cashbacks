import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

// Ensure the function is deployed in a region closest to the user for optimal latency
export const categorize = onCall(
  {
    maxInstances: 10, // Prevent runaway costs
    region: "asia-south1", // Mumbai region for Indian app
  },
  async (request) => {
    const data = request.data;
    const { merchantName, apiKey } = data;

    if (!merchantName || typeof merchantName !== "string" || merchantName.trim().length === 0) {
      throw new HttpsError("invalid-argument", "Valid merchantName is required");
    }
    if (merchantName.length > 100) {
      throw new HttpsError("invalid-argument", "merchantName exceeds maximum length of 100 characters");
    }
    if (apiKey && (typeof apiKey !== "string" || !/^sk-or-[a-zA-Z0-9_-]+$/.test(apiKey))) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid API key format. Key must start with 'sk-or-'."
      );
    }

    const sanitizedMerchantName = merchantName.trim();

    if (!apiKey) {
      throw new HttpsError("unauthenticated", "A valid user OpenRouter API Key is required to categorize merchants.");
    }

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

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://only-cashbacks.web.app",
          "X-Title": "Only Cashbacks",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: sanitizedMerchantName },
          ],
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new HttpsError("internal", `OpenRouter API Error: ${response.status}`);
      }
      
      const responseData = await response.json();
      const content = responseData.choices[0]?.message?.content || "{}";
      return JSON.parse(content);
    } catch (error: any) {
      console.error("Server-side Error during categorization:", error);
      throw new HttpsError("internal", "Failed to categorize merchant");
    }
  }
);
