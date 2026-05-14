# OnlyCashbacks - Make Your Credit Cards Pay

OnlyCashbacks is a smart web application that helps you maximize credit card rewards by providing real-time recommendations on which card to use for your specific purchases. 

[View your app in AI Studio](https://ai.studio/apps/9dfa3f2d-5762-4049-a6c8-583bd3c24948)

## Features

- **Smart Merchant Categorization**: Powered by OpenRouter AI to analyze and categorize your merchant queries (e.g., Swiggy, Amazon, Uber) to identify the best card pairing.
- **Card Recommendations**: Get instant card recommendations optimized for the highest net value (cashback and rewards) based on your active cards.
- **Lounge Tracker**: Track your complimentary lounge passes and spend-based milestones for domestic and international lounges.
- **Smart Voucher Hacks**: Uncover hidden value by comparing card pairings with voucher portals.
- **Multi-Currency & International Support**: Real-time exchange rate calculations to help you choose the best card with minimal forex markup.
- **Online vs Offline (Scan & Pay)**: Adaptive recommendations based on whether the transaction is an online checkout or an offline Scan & Pay/UPI transfer.
- **Cloud Sync**: Securely sync your card portfolio, milestones, and settings across devices using Firebase.

## Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Motion, Lucide Icons.
- **Backend**: Express (Node.js) to securely handle AI categorization routes.
- **Database & Auth**: Firebase Authentication and Firestore.
- **AI Integration**: OpenRouter SDK (`openrouter/auto`) for intelligent merchant matching.

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Environment Variables setup:
   Create a `.env` file in the root directory based on the `.env.example` file and add your keys (OpenRouter API key can also be configured within the UI):
   ```
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
