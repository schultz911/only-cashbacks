<!-- Generated: 2026-11-08 | Files scanned: 83 | Token estimate: ~550 -->

# External Dependencies & Shared Libraries

## Third-Party Services & Integrations

| Service / Provider | Purpose | Integration Method | Security & Privacy Scope |
| :--- | :--- | :--- | :--- |
| **Google Firebase Auth** | User authentication via Google Sign-In | Firebase Web SDK | Identity & ID tokens only; no PII stored |
| **Cloud Firestore** | Cloud wallet & settings persistence | Firebase Web SDK / Admin SDK | Rules enforce `request.auth.uid == userId` |
| **Firebase Cloud Functions** | Serverless AI proxy (`categorize`) | `httpsCallable` | Ephemeral; does not store search queries |
| **OpenRouter API** | LLM merchant categorization | Cloud Function HTTP call | BYOK (User supplied API key only) |
| **Model Context Protocol** | Agent tool integration (Claude / Codex) | Streamable HTTP (`/mcp`) & SSE | RFC 7636 OAuth PKCE with Firebase Auth |

## Production Runtime Dependencies

```
react / react-dom (^19.0.1)      → Core UI rendering framework
@tailwindcss/vite (^4.1.14)      → Utility-first CSS styling
motion (^12.23.24)               → Micro-interactions and card layout animations
lucide-react (^0.546.0)          → Accessible UI icons
recharts (^3.8.1)                → Donut charts (lazy-loaded in DashboardModal)
express (^4.21.2)                → Production SPA server & MCP host
compression (^1.8.1)             → Gzip/deflate response compression
firebase (^12.13.0)              → Client-side Auth, Firestore, and Functions SDK
fuse.js (^7.3.0)                 → Fuzzy card and bank search
idb-keyval (^6.2.5)              → Lightweight IndexedDB wrapper for merchant cache
clsx / tailwind-merge            → Class name utilities (src/lib/utils.ts)
```

## Developer & Build Tooling

```
vite (^6.2.3)                    → Fast bundler, HMR server, PWA builder
vite-plugin-pwa (^1.3.0)         → Workbox service worker generator & web manifest
esbuild (^0.28.0)                → Bundles server.ts to dist/server.cjs
typescript (~5.8.2)              → Static typing and linting (tsc --noEmit)
tsx (^4.21.0)                    → TypeScript execution for dev server
vitest (^3.0.0)                  → Unit & component testing (276 tests)
@playwright/test (^1.64.1)       → Browser end-to-end testing (11 tests)
```

## Shared Libraries Across Subsystems

- **`src/lib/recommendation.ts` ↔ `mcp-server/src/lib/recommendation.ts`**: Pure calculation logic mirrored between client and MCP server.
- **`src/data/cards.ts` ↔ `mcp-server/src/data/cards.ts`**: Canonical card catalog shared with MCP tool runner.
- **`src/lib/billingDates.ts` ↔ `mcp-server/src/lib/billingDates.ts`**: Unified Indian Standard Time (IST) statement date calculations.

