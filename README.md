# OnlyCashbacks — Make Your Credit Cards Pay

![OC Logo](public/icon.png)

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

- **🧠 AI Merchant Search**: Just type a merchant name (e.g., "Swiggy", "Amazon", "Uber"). Our AI identifies the category and tells you which card to pull out.
- **📂 AI? Or ABye!**: If you don't like AI, no worries. I have built a thorough and comprehensive merchant database, you can search and find the best card for your needs.
- **✈️ Offline-First**: Once you load the app, you don't need internet to use it. Helps when you're traveling or in areas with no internet.
- **💰 Real Net Value**: We don't just show cashback %. We calculate the true net value by subtracting fees and taxes (like GST on Forex) so you see the real profit.
- **🌍 Forex Precision**: Traveling abroad? Get real-time exchange rate calculations to see if your card's rewards outweigh its forex markup.
- **🛫 Lounge Tracker**: Keep tabs on your lounge passes. Automatically tracks your domestic and international visits based on your card's spend milestones.
- **🎟️ Voucher Strategies**: Discover "reward-on-reward" opportunities. The app tells you when buying a voucher via portals like Tata Neu or SBI Amazon pays more than a direct swipe.
- **📱 Portfolio Sync**: Your cards, limits, and lounge usage stay synced across all your devices securely via your Google account.
- **🔒 Privacy First**: You're in control. Manually trigger cloud syncs, work in offline mode, or wipe all your data instantly from the profile menu.

> [!IMPORTANT]
> **This app doesn't use AI by default.**
> If you want to use AI you need to add an OpenRouter API key by clicking on the information symbol in the header.

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

- **No Data Hoarding**: We only store save states for you to track your offer usage.
- **Manual Sync**: Your data stays in your browser until you hit the "Sync" button. It never pings the cloud in the background unless you log in, and you can delete all your data anytime.
- **No Ads, Ever**: This is a passion project. I'm not here to sell your data, make money, or bug you with ads.
- **Also**: Fuck SaveSage and their garbage bullshit.

Think of it like a super-powered calculator that remembers your card settings. Nothing more. It's just for you.

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

_Crafted with vibes, for vibes by schultz911._
