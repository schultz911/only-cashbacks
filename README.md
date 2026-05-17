# OnlyCashbacks — Make Your Credit Cards Pay

**OnlyCashbacks** is a **_fully open-source_** personal rewards co-pilot. It uses AI to instantly tell you which credit card in your wallet will give you the most value for every purchase you make.

[OnlyCashbacks](https://onlycashbacks.in)

## 📋 Table of Contents

- [📋 Table of Contents](#-table-of-contents)
- [🚀 Key Features](#-key-features)
- [🎨 Premium Experience](#-premium-experience)
- [💖 Privacy-First](#-privacy-first)
- [🛠️ How it Works](#️-how-it-works)
- [🗺️ Roadmap \& To-Dos](#️-roadmap--to-dos)
- [💻 Setup for Developers](#-setup-for-developers)

---

## 🚀 Key Features

- **🔍 Smart Search & Categorization**: Just type a merchant name, category, or item, and the app instantly identifies the category and tells you which card to pull out. Works seamlessly for online, in-store, international, and UPI spends.
- **📂 Comprehensive Offline DB**: While it can use an AI API to resolve merchant names, if you don't want AI, no worries! We have built a thorough and comprehensive merchant database using optimized regexes that works entirely offline.
- **✈️ Offline-First**: Once you load the app, you don't need the internet to use it. Perfect when you're traveling or in areas with spotty connectivity.
- **💰 Real Net Value Calculations**: It doesn't just show a raw cashback %. It calculates the true net value by subtracting fees and taxes (like GST on Forex markups) so you see the real profit.
- **🌍 Real-Time Forex Calculator**: Get real-time exchange rate calculations to see if your card's rewards outweigh its foreign currency markup.
- **🎟️ Exclusive Offer Management**: Keeps track of exclusive card offers and tells you when it's best to use them based on the amount and category. Easily manage your offer usage history so you know exactly what you've used in a given month.
- **⚡ Accelerated Limit Filters**: Exclude cards automatically once you hit their monthly cashback limits, and customize your wallet so it only shows the cards you actually own.
- **📅 Bill Reminders**: Set your credit card bill generation date to get smart reminders when your bill is approaching and track if you've marked it as paid.
- **🔗 Community SBI DB Link**: Direct, quick-access link to the community-maintained database of confirmed merchants and cashback eligibility for the popular SBI Cashback card.
- **📈 Transaction Logging & Savings Tracker**: Log transactions to the savings tab to track exactly how much real money you have saved in cashback.
- **💡 Reward Redemption Reminders**: Never lose points! Get handy reminders of all the platforms where you need to manually turn rewards into real cash.
- **🛫 Milestone-based Lounge Tracker**: Keep tabs on your lounge passes. Automatically tracks your domestic and international visits based on your card's spend milestones, with a direct link to the HDFC voucher redemption portal right on the app so no more looking for your email or SMS.
- **🛍️ Voucher Strategies**: Discover "reward-on-reward" opportunities. The app tells you which cards work best with which voucher portals.
- **📱 Portfolio Sync**: Your cards, limits, and lounge usage stay synced across all your devices securely via your Google account.
- **🔒 Privacy First**: You're in control. Manually trigger cloud syncs, work in offline mode, or wipe all your data instantly from the profile menu.

> [!IMPORTANT]
> **This app doesn't use AI by default.**
>
> If you want to use AI you need to add an OpenRouter API key by clicking on the information symbol in the header.
<!-- -->
> [!CAUTION]
> If you use the app in local mode, your usage states are saved in your `localStorage`.
>
> If you delete your browser data you will lose all your save states.

---

## 🎨 Premium Experience

Built for a **premium, glassmorphic feel**, OnlyCashbacks offers:

- **Swipeable Offer Cards**: A beautiful, gesture-based interface for browsing exclusive card deals.
- **Fluid Animations**: Smooth transitions and micro-interactions that make the app feel alive.
- **Adaptive UI**: Optimized for both quick swipes on mobile and detailed tracking on desktop.

---

You shouldn't need to add your personal, financial details or spending habits to get the best deals.

**This app collects nothing**

**_AT ALL_**
### ZERO!

## 💖 Privacy-First

- **No Data Hoarding**: The app only stores save states for you to track your offer usage.
- **Manual Sync**: Your data stays in your browser until you hit the "Sync" button. It never pings the cloud in the background unless you log in, and you can delete all your data anytime.
- **No Ads, Ever**: This is a passion project. I'm not here to sell your data, make money, or bug you with ads.

Think of it like a super-powered calculator that remembers your card settings. Nothing more. It's just for you.

- **Also**: Fuck SaveSage and their garbage bullshit.

---

## 🛠️ How it Works

1. **Enter Search**: Type a merchant and the amount.
2. **Select Mode**: Toggle between Online, Offline, International, or Scan & Pay.
3. **Get Recommendation**: The engine analyzes your wallet and ranks cards by their true value.
4. **Track Usage**: Mark spend milestones or lounge visits to keep your tracking accurate.

---

## 🗺️ Roadmap & To-Dos

- [ ] **Expanded Card Library**: Adding support for more high-value rewards and cashback cards.
- [ ] **Community Merchant Database**: Implement a user-contributed regex system to manage "Confirmed" vs "Excluded" merchants based on real-world community submissions.

---

## 💻 Setup for Developers

1. **Clone & Install**: `npm install`
2. **Environment**: Copy `.env.example` to `.env` and add your `GEMINI_API_KEY` or `OPENROUTER_API_KEY`.
3. **Run**: `npm run dev`

---

_Crafted by vibes, with vibes, for vibes by schultz911._
