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
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_sdk = require("@openrouter/sdk");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = Number(process.env.PORT) || 3e3;
  app.use(import_express.default.json());
  app.post("/api/categorize", async (req, res) => {
    console.log("--- Categorization Request Received ---");
    try {
      const { merchantName, apiKey } = req.body;
      console.log(`Merchant to categorize: "${merchantName}"`);
      const userOpenRouterKey = apiKey;
      const envOpenRouterKey = process.env.OPENROUTER_API_KEY;
      const envGeminiKey = process.env.GEMINI_API_KEY;
      const effectiveOpenRouterKey = userOpenRouterKey || envOpenRouterKey;
      const systemPrompt = `Analyze this transaction destination and categorize it. 
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
}`;
      let result = null;
      if (effectiveOpenRouterKey) {
        console.log("Calling OpenRouter API via SDK...");
        const openrouter = new import_sdk.OpenRouter({ apiKey: effectiveOpenRouterKey });
        const response = await openrouter.chat.send({
          chatRequest: {
            model: "google/gemini-2.0-flash-lite-001",
            temperature: 0,
            responseFormat: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: merchantName }
            ]
          }
        });
        console.log("OpenRouter Response Received.");
        result = JSON.parse(response.choices[0]?.message?.content || "{}");
      } else if (envGeminiKey) {
        console.log("Calling Google Gemini Environment API...");
        const ai = new import_genai.GoogleGenAI({ apiKey: envGeminiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: merchantName,
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
