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

- **🔍 Smart Search**: Instantly identifies categories by merchant name, item, or category. Supports Online, In-Store, International, and UPI.
- **📂 Regex Offline DB**: An optimized regex merchant database that handles category matching entirely offline—no AI required.
- **✈️ Offline-First**: Once loaded, the app works completely without internet. Perfect for traveling or low-connectivity zones.
- **💰 Real Net Value**: Factor in real-world fees and taxes (like GST on Forex markups) to see your actual net profit instead of just basic cashback percentages.
- **🌍 Forex Precision**: Live exchange rate comparisons to check if your card's reward points outweigh its forex fees.
- **🎟️ Offer Manager**: Track monthly credit card offers (like Axis Swiggy or EazyDiner) and manage usage limits to see when they are most profitable.
- **⚡ Reward Caps & Wallet Filters**: Hide cards from suggestions once they reach monthly cashback limits, and filter suggestions based on cards you actually own.
- **📅 Bill Reminders**: Input your billing cycles to receive smart reminders when credit card payments are due.
- **🔗 Community SBI Link**: Built-in reference sheet linking to community-sourced eligible/excluded merchants for the popular SBI Cashback card.
- **📈 Savings Logger**: Easily log your transactions to see your cumulative cashback savings over time.
- **💡 Point Redemption**: Smart reminders telling you when and where to redeem voucher rewards into real-world cash.
- **🛫 Lounge & Milestone Tracker**: Automatically track your domestic and international lounge passes based on card milestones. Features a direct HDFC voucher redemption link.
- **🛍️ Voucher Optimizations**: Maximize your rewards using recommended "card-to-voucher-portal" stacking strategies.
- **📱 Multi-Device Sync**: Keep your wallet, offer limits, and lounge history secure and in sync via Google Sign-In.
- **🔒 Total Privacy**: No analytics, background trackers, or hidden telemetry. Wipe or sync your data manually whenever you choose.

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
