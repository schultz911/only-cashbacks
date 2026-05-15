# OnlyCashbacks - Make Your Credit Cards Pay

OnlyCashbacks is a smart web application that helps you maximize credit card rewards by providing real-time recommendations on which card to use for your specific purchases.

## Features

- **Interactive Offers Overlay**: A premium, glassmorphic swipeable interface that highlights exclusive deals (BMS BOGO, Dining discounts, etc.) based on your current search.
- **Hardened Recommendation Engine**: Advanced category-flag system (`isDining`, `isFoodDelivery`, `isMovie`, `isGrocery`) for precise merchant matching and high-value benefit prioritization.
- **Smart Merchant Categorization**: Hybrid approach using local regex matching and OpenRouter AI to instantly identify and categorize complex merchant queries.
- **Advanced Forex Precision**: Real-time exchange rate calculations including 18% GST on markup fees, ensuring 100% accuracy for international spend decisions.
- **Lounge Tracker**: Comprehensive domestic and international lounge pass tracking with automated spend-milestone monitoring.
- **Online vs Offline (Scan & Pay)**: Context-aware logic that adapts recommendations based on the transaction medium (Direct Online vs. UPI Scan & Pay).
- **Voucher Portals**: Seamless integration with voucher platforms (Tata Neu, HDFC SmartBuy) to find hidden "reward-on-reward" strategies.
- **Cloud Portfolio Sync**: Securely sync your cards, usage limits, and personalized settings across all devices using Firebase.

## Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion (`motion/react`), Lucide Icons.
- **Backend**: Express (Node.js) proxy for secure AI categorization.
- **Database & Auth**: Firebase Authentication & Firestore.
- **AI Integration**: OpenRouter SDK for intelligent LLM-driven merchant intent analysis.

## Design Aesthetics

OnlyCashbacks is built with a focus on **Premium Visual Excellence**:

- **Glassmorphic UI**: High-fidelity overlays using backdrop blurs and subtle gradients.
- **Fluid Animations**: Smooth transitions and micro-interactions powered by Framer Motion.
- **Mobile-First Design**: Optimized for on-the-go decision making with swipeable carousels and haptic-like responses.
- **Modern Typography**: Utilizing "Plus Jakarta Sans" for a clean, professional fintech feel.

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Environment Variables setup:
   Create a `.env` file in the root directory based on the `.env.example` file and add your keys (OpenRouter API key can also be configured within the UI):

   ```bash
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev`: Starts the Vite+Express server for local development.
- `npm run build`: Builds the client-side React app and bundles the Express server.
- `npm start`: Runs the production server from the `dist` directory.
- `npm run lint`: Runs TypeScript type checking.

## License

Apache-2.0 License
