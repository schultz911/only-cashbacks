# OnlyCashbacks: Make Your Credit Cards Pay

OnlyCashbacks is an intelligent credit card recommendation engine that helps you maximize your rewards and minimize fees on every purchase. Powered by Google Gemini AI, it automatically categorizes merchants and identifies the best card in your wallet for maximum net value.

## ✨ Features

- **Smart Recommendations:** Enter a merchant and amount to instantly find the best credit card for the transaction.
- **AI Categorization:** Uses Google Gemini to accurately categorize merchants and match them with your card benefits.
- **Context-Aware:** Handles Online, International, and Scan-to-Pay (UPI) transactions with precise calculations.
- **Smart Voucher Hacks:** Recommends when to buy vouchers through portals (e.g., Tata Neu, SBI Cashback) for boosted returns.
- **Lounge Tracker:** Keep track of your complimentary domestic and international lounge passes and their milestones.
- **Card Management:** Keep track of your active cards, benefits, monthly usage limits, and max spends.

## 🚀 Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in `.env` (or `.env.local`) to your Gemini API key:

   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, Framer Motion
- **Icons:** Lucide React
- **AI:** Google GenAI (Gemini)
- **IDE:** Antigravity, Google AI Studio
