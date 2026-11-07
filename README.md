# OnlyCashbacks

OnlyCashbacks is an open-source rewards optimizer and payment card recommendation engine. It calculates net returns for purchases across credit, debit, and prepaid cards by evaluating reward rates, merchant exclusions, monthly caps, spend tiers, and foreign-exchange markups.

🌐 **Live Web App**: [OnlyCashbacks](https://only-cashbacks.up.railway.app/)  
🤖 **MCP Server**: `https://only-cashbacks.up.railway.app/mcp`

---

## Table of Contents

- [Key Features](#key-features)
- [Supported Cards](#supported-cards)
- [Model Context Protocol (MCP) Integration](#model-context-protocol-mcp-integration)
- [Privacy & Security Architecture](#privacy--security-architecture)
- [How It Works](#how-it-works)
- [Interface & Styling](#interface--styling)
- [Setup & Development](#setup--development)
- [Testing & Verification](#testing--verification)
- [Documentation & Architecture](#documentation--architecture)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Key Features

- **Multi-Mode Search**:
  - Instant merchant, category, and keyword matching across **Online**, **In-Store (Offline)**, **International (Forex)**, and **Scan & Pay (UPI)** modes.
  - Hybrid search architecture: deterministic regex pattern engine and client-side [Fuse.js](https://www.fusejs.io/) search with optional BYOK LLM classification.
- **Net-Value Calculation**:
  - Accounts for exact base and accelerated reward rates, per-transaction minimums, monthly caps, and platform-specific fees.
  - Factors in foreign currency markups and GST on forex spreads to determine net returns.
- **Offline-First PWA**:
  - Progressive Web App installable on iOS, Android, and desktop with service worker caching.
  - Operates offline with zero network roundtrips required for recommendations.
- **Offer & Limit Manager**:
  - Track monthly and quarterly recurring offers (e.g., Swiggy, BookMyShow, EazyDiner, District, Ajio).
  - Automatically disables exhausted cards and shifts recommendations to next-best alternatives.
- **Billing Cycle Reminders**:
  - Configure statement generation and payment due dates with push notifications.
  - Automatically resets monthly spend caps when billing cycles refresh.
- **Lounge & Milestone Tracker**:
  - Track domestic and international lounge visits per calendar quarter, half-year, or spend milestone.
  - Direct redemption links for partner portals (e.g., HDFC SmartBuy, Kiwi App).
- **Voucher Stacking Strategies**:
  - Recommendations for card-to-voucher portal routes (e.g., Gyftr, SmartBuy) when purchasing vouchers yields higher net value than direct checkout.
- **Personal Savings Logger**:
  - Log completed transactions to track cumulative realized rewards over time.
- **Multi-Device Cloud Synchronization**:
  - Optional Google Sign-In backed by Firebase Firestore.
  - Partitioned client storage and offline queueing preserve local edits during connectivity drops without save loops.

---

## Supported Cards

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

## Model Context Protocol (MCP) Integration

OnlyCashbacks includes an MCP server allowing AI assistants (Antigravity, Claude Desktop, Cursor, ChatGPT, and custom LLM agents) to query the recommendation engine and access user wallets.

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
> Remote MCP connections support OAuth 2.0 with Dynamic Client Registration, PKCE (S256), rotating refresh tokens, and idle session timeouts (default: 60 minutes).

---

## Privacy & Security Architecture

OnlyCashbacks does not collect credit card numbers, bank credentials, or personal financial statements.

- **Monitoring**: The app initializes Firebase Analytics and Performance Monitoring where supported. It may report application errors to Firebase Analytics and, for signed-in users, Firestore.
- **Client-Side Storage**: In local mode, wallet settings, offer statuses, and savings history are stored in browser `localStorage` and `IndexedDB`.
- **BYOK (Bring Your Own Key)**: Optional AI classification uses your OpenRouter API key. The key is stored in your browser and, when signed in, synced to your Firestore wallet document.
- **Security Controls**:
  - Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
  - Firebase App Check with reCAPTCHA Enterprise verification on cloud requests.
  - Device-isolated session handling with cryptographic OAuth token verification.

---

## How It Works

```text
┌────────────────────────────────────────────────────────┐
│                      User Search                       │
│        (Merchant: "Swiggy", Mode: "Online", ₹800)       │
│                                                        │
│                           │                            │
│                           ▼                            │
│               Category & Merchant Parser               │
│  1. Deterministic Regex Lookup (Instant, Offline)      │
│  2. Fuzzy Search Fallback (Fuse.js)                    │
│  3. Optional LLM Cloud Categorization (BYOK)           │
│                                                        │
│                           │                            │
│                           ▼                            │
│                 Recommendation Engine                  │
│  - Filter owned cards from local wallet                │
│  - Check merchant exclusions (e.g., fuel, wallet load) │
│  - Check monthly reward caps & exhausted limits        │
│  - Compute net cashback minus forex/platform fees      │
│                                                        │
│                           │                            │
│                           ▼                            │
│                Ranked Card Results                     │
│    #1 Swiggy HDFC (10% back = ₹80 net savings)         │
│    #2 HSBC Live+  (10% back = ₹80 net savings)         │
│    #3 SBI Cashback (5% back = ₹40 net savings)         │
└────────────────────────────────────────────────────────┘
```

---

## Interface & Styling

- **Tailwind CSS v4**: Dark-mode palettes with ambient background styling and bank brand accents.
- **Motion Micro-Interactions**: Smooth layout transitions, modal animations, and swipe gestures.
- **Adaptive Layout**: Responsive layouts for mobile screens, tablets, and desktop viewports.

---

## Setup & Development

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

The codebase includes comprehensive unit, integration, browser E2E, and security regression suites across both the React web application and the MCP server:

```bash
# Run all unit and integration tests via Vitest (276 tests)
npm test

# Run browser end-to-end user journeys via Playwright (11 tests)
npm run test:e2e

# Run PWA protected routes and offline service worker test
npm run test:pwa-routes

# Typecheck and lint codebase
npm run lint

# Build production bundle
npm run build
```

---

## 📚 Documentation & Architecture

- **[Contributing Guide](docs/CONTRIBUTING.md)**: Development setup, script reference, and PR submission checklist.
- **[Environment Variables](docs/ENV.md)**: Comprehensive reference for client `.env` and server configuration.
- **[Operations Runbook](docs/RUNBOOK.md)**: Deployment steps, health checks, incident troubleshooting, and rollbacks.
- **[Domain Model & Glossary](GLOSSARY.md)**: Ubiquitous language, canonical terms, and definitions.
- **[Architecture Codemaps](docs/CODEMAPS/)**: Token-lean architecture blueprints for AI and developer context.
- **[Architecture Decision Records](docs/adr/)**: Permanent record of foundational design trade-offs.

---

## 📦 Deployment

### Production Web Build

```bash
npm run build
```

Builds the Vite frontend to `dist/` and compiles the Node.js Express server to `dist/server.cjs`.

### Railway Deployment

The repository includes a multi-stage [Dockerfile](Dockerfile) and [railway.json](railway.json) that compiles both the frontend application and the backend MCP server into an optimized production container. See the [Operations Runbook](docs/RUNBOOK.md) for step-by-step verification and rollback instructions.

---

## Roadmap

- [ ] Expanded international and co-branded card database.
- [ ] User-contributed community merchant exclusions database.
- [ ] Direct statement SMS spend-pattern analyzer integration.
- [ ] Push notification alerts for upcoming card statement payment due dates.

---

_Crafted by vibes, with vibes, for vibes by [schultz911](https://github.com/schultz911)._

### Protected-route offline regression

Run `npm run test:pwa-routes` to build the frontend in a temporary directory and check the generated service worker in Chromium. Install a Playwright-compatible Chromium browser (`npx playwright-core install chromium`), or set `CHROMIUM_PATH` to an existing Chromium executable. The test checks that the wallet shell loads offline, while protected routes with query strings are neither served that shell nor stored by runtime caching. It uses synthetic data and a local fixture server.
