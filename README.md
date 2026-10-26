# OnlyCashbacks — Make Your Credit Cards Pay

**OnlyCashbacks** is a **_fully open-source_**, privacy-first personal rewards co-pilot and card optimizer. It calculates the exact net return for every purchase across your credit, debit, and prepaid cards—factoring in real reward rates, merchant exclusions, monthly caps, spend tiers, and forex markups.

🌐 **Live Web App**: [OnlyCashbacks](https://only-cashbacks.up.railway.app/)  
🤖 **MCP Server**: `https://only-cashbacks.up.railway.app/mcp`

---

## 📋 Table of Contents

- [🚀 Key Features](#-key-features)
- [💳 Supported Cards](#-supported-cards)
- [🤖 Model Context Protocol (MCP) Integration](#-model-context-protocol-mcp-integration)
- [💖 Privacy & Security Architecture](#-privacy--security-architecture)
- [🛠️ How It Works](#️-how-it-works)
- [🎨 Design & User Experience](#-design--user-experience)
- [💻 Setup & Development](#-setup--development)
- [🧪 Testing & Verification](#-testing--verification)
- [📦 Deployment](#-deployment)
- [🗺️ Roadmap](#️-roadmap)

---

## 🚀 Key Features

- **🔍 Intelligent Multi-Mode Search**:
  - Instant merchant, category, and keyword matching across **Online**, **In-Store (Offline)**, **International (Forex)**, and **Scan & Pay (UPI)** modes.
  - Hybrid search architecture: deterministic regex pattern engine and client-side [Fuse.js](https://www.fusejs.io/) search with optional BYOK LLM classification.
- **💰 True Net-Value Calculation**:
  - Accounts for exact base and accelerated reward rates, per-transaction minimums, monthly caps, and platform-specific fees.
  - Automatically factors in RBI-mandated foreign currency markups and GST on forex spreads to determine true net profitability.
- **✈️ Offline-First PWA**:
  - Progressive Web App installable on iOS, Android, and Desktop with service worker caching.
  - Operates completely offline with zero network roundtrips required for recommendations.
- **🎟️ Offer & Limit Manager**:
  - Track monthly and quarterly recurring offers (e.g., Swiggy, BookMyShow, EazyDiner, District, Ajio).
  - Automatically disables exhausted cards and shifts recommendations to next-best alternatives.
- **📅 Smart Billing Cycle Reminders**:
  - Configure statement generation and payment due dates with push notifications.
  - Automatically resets monthly spend caps when billing cycles refresh.
- **🛫 Lounge & Milestone Tracker**:
  - Track domestic and international lounge visits per calendar quarter, half-year, or spend milestone.
  - Direct quick-action redemption portals (e.g., HDFC SmartBuy, Kiwi App).
- **🛍️ Voucher Stacking Strategies**:
  - Built-in recommendations for card-to-voucher portal routes (e.g., Gyftr, SmartBuy) to maximize reward yield.
- **📈 Personal Savings Logger**:
  - Log completed transactions with one click to monitor cumulative real-world savings over time.
- **🔄 Robust Multi-Device Cloud Sync**:
  - Optional Google Sign-In backed by Firebase Firestore.
  - Sophisticated revision tracking and offline queueing: preserves offline edits during connectivity interruptions without duplicate cloud save loops.

---

## 💳 Supported Cards

OnlyCashbacks comes pre-configured with detailed benefit hierarchies, reward caps, and exclusion lists for popular Indian payment instruments:

| Card | Issuer | Network / Type | Key Highlight |
| --- | --- | --- | --- |
| **Swiggy BLCK** | HDFC | Mastercard World (Credit) | 10% on Swiggy ecosystem, 5% on top online platforms |
| **Live+** | HSBC | Visa Infinite (Credit) | 10% cashback on dining, food delivery, and groceries |
| **Tata Neu Infinity** | HDFC | Visa / RuPay (Credit) | 10% NeuCoins on Tata Neu, 5% utility bills, 1.5% UPI |
| **Cashback** | SBI Card | Visa Platinum (Credit) | Flat 5% online retail cashback (forex-positive) |
| **811 Infinity Metal** | Kotak | Visa Signature (Debit) | 5% flat cashback, BOGO movie tickets, dining offers |
| **Kiwi Neon** | YES Bank | RuPay (Credit) | Up to 5% milestone cashback on UPI Scan & Pay |
| **OneCard** | IDIB | Visa Signature (Credit) | 5X rewards on top categories, low 1.0% forex markup |
| **Niyo** | DCB | Visa Platinum (Debit) | Zero forex markup debit card for international travel |
| **MyZone** | Axis | Visa Platinum (Credit) | Flat Swiggy discounts, BOGO movies, EazyDiner dining |
| **Imperia Platinum** | HDFC | Mastercard World (Debit) | BookMyShow & Swiggy cashback points + domestic lounge |
| **Amazon Pay** | ICICI | Visa Platinum (Credit) | Unlimited 5% for Prime members on Amazon, lifetime free |
| **Amazon Pay UPI / Cred** | Prepaid | UPI | Baseline UPI cashback & scratch card fallback rates |

---

## 🤖 Model Context Protocol (MCP) Integration

OnlyCashbacks includes a production-ready **MCP server** allowing AI assistants (Antigravity, Claude Desktop, Cursor, ChatGPT, and custom LLM agents) to query the recommendation engine and access user wallets.

### Available MCP Tools

| Tool | Purpose | Authenticated Behavior |
| --- | --- | --- |
| `find_best_card` | Recommends the highest-yielding card for a specific merchant, mode, and amount. | Uses the user's active wallet, accounting for exhausted offers and spend limits. |
| `list_cards` | Lists all supported credit/debit cards or wallet contents. | Displays user-owned cards when authenticated; displays system catalogue when unauthenticated. |
| `get_card_details` | Returns granular card benefits, fee structures, exclusions, and reward rules. | Provides full metadata and exclusion rules for any card ID. |
| `authenticate` | Initiates secure OAuth 2.0 or 15-minute pairing code authorization. | Links the MCP session to the user's personal Firestore wallet document. |

### Connecting to the MCP Server

#### Option 1: Streamable HTTP (Remote / Railway)

Add to your client configuration (e.g. `claude_desktop_config.json`, Antigravity, or Cursor settings):

```json
{
  "mcpServers": {
    "onlycashbacks": {
      "type": "streamable-http",
      "url": "https://only-cashbacks.up.railway.app/mcp"
    }
  }
}
```

#### Option 2: Local stdio (Development)

```json
{
  "mcpServers": {
    "onlycashbacks": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/path/to/only-cashbacks/mcp-server"
    }
  }
}
```

> [!NOTE]
> Remote MCP connections support OAuth 2.0 with Dynamic Client Registration, PKCE (S256), rotating refresh tokens, and configurable idle session timeouts (default: 60 minutes) to eliminate memory leaks.

---

## 💖 Privacy & Security Architecture

You should never have to sacrifice privacy or disclose personal financial details to maximize your card rewards.

- **🛡️ Zero Analytics & Zero Trackers**: No Google Analytics, no Meta Pixel, no Mixpanel, and no telemetry scripts.
- **🔒 True Client-Side Storage**: In local mode, your wallet settings, offer statuses, and history live solely in your browser's `localStorage` and `IndexedDB`.
- **🔑 BYOK (Bring Your Own Key)**: If you choose to enable AI-powered classification for unmapped merchants, supply your own OpenRouter or Gemini API key. Keys are saved locally and never sent to our servers.
- **🛡️ Hardened Security Posture**:
  - Strict Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
  - Firebase App Check with reCAPTCHA Enterprise enforcement to protect database backends.
  - Device-isolated session handling with cryptographic OAuth token verification.

---

## 🛠️ How It Works

```text
┌────────────────────────────────────────────────────────┐
│                      User Search                       │
│        (Merchant: "Swiggy", Mode: "Online", ₹800)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               Category & Merchant Parser               │
│  1. Deterministic Regex Lookup (Instant, Offline)      │
│  2. Fuzzy Search Fallback (Fuse.js)                    │
│  3. Optional LLM Cloud Categorization (BYOK)           │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Recommendation Engine                  │
│  - Filter owned cards from local wallet                │
│  - Check merchant exclusions (e.g., fuel, wallet load) │
│  - Check monthly reward caps & exhausted limits        │
│  - Compute net cashback minus forex/platform fees      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                Ranked Card Results                     │
│    #1 Swiggy HDFC (10% back = ₹80 net savings)         │
│    #2 HSBC Live+  (10% back = ₹80 net savings)         │
│    #3 SBI Cashback (5% back = ₹40 net savings)         │
└────────────────────────────────────────────────────────┘
```

---

## 🎨 Design & User Experience

Built with modern web standards and high visual polish:

- **Tailwind CSS v4 & Glassmorphism**: Tailored dark-mode palettes with glowing ambient gradients and card bank accents.
- **Framer Motion Micro-Interactions**: Smooth layout transitions, modal animations, and swipe gestures.
- **Adaptive Responsive Layout**: Unified touch-friendly experience across mobile screens, tablets, and desktop viewports.

---

## 💻 Setup & Development

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/schultz911/only-cashbacks.git
   cd only-cashbacks
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:

   ```bash
   cp .env.example .env
   ```

   Configure your Firebase credentials in `.env` if testing cloud synchronization or App Check.

4. **Start local development server**:

   ```bash
   npm run dev
   ```

   The application will start on `http://localhost:3000`.

---

## 🧪 Testing & Verification

The codebase includes comprehensive unit, integration, and security regression suites across both the React web application and the MCP server:

```bash
# Run all tests via Vitest
npm test

# Typecheck and lint codebase
npm run lint

# Build production bundle
npm run build
```

---

## 📦 Deployment

### Production Web Build

```bash
npm run build
```

Builds the Vite frontend to `dist/` and compiles the Node.js Express server to `dist/server.cjs`.

### Railway Deployment

The repository includes a multi-stage [Dockerfile](file:///c:/only-cashbacks/Dockerfile) and [railway.json](file:///c:/only-cashbacks/railway.json) that compiles both the frontend application and the backend MCP server into an optimized production container.

---

## 🗺️ Roadmap

- [ ] Expanded international and co-branded card database.
- [ ] User-contributed community merchant exclusions database.
- [ ] Direct statement SMS spend-pattern analyzer integration.
- [ ] Push notification alerts for upcoming card statement payment due dates.

---

_Crafted by vibes, with vibes, for vibes by [schultz911](https://github.com/schultz911)._
