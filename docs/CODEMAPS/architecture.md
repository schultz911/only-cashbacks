<!-- Generated: 2026-11-08 | Files scanned: 83 | Token estimate: ~550 -->

# System Architecture

## High-Level Topology

```
+----------------------------------------------------------------------------------+
|                                    Clients                                       |
|  +-------------------------------------+    +---------------------------------+  |
|  |     Desktop / Mobile Browser PWA     |    |   AI Agents / Claude / Codex    |  |
|  | (React 19 + Tailwind v4 + Workbox)  |    |        (MCP Client / SSE)       |  |
|  +------------------+------------------+    +----------------+----------------+  |
+---------------------|----------------------------------------|-------------------+
                      | HTTPS                                  | JSON-RPC (HTTP/SSE)
+---------------------v----------------------------------------v-------------------+
|                              Server Layer (Node / Express)                       |
|  +-------------------------------------+    +---------------------------------+  |
|  |       server.ts (SPA & Static)      |    |  mcp-server/src/index.ts (MCP)  |  |
|  |  - Security Headers & Compression   |    |  - Tools: find_best_card, etc.  |  |
|  |  - Vite Middleware / Static Dist    |    |  - OAuth 2.0 & Session Cleanup  |  |
|  +-------------------------------------+    +----------------+----------------+  |
+--------------------------------------------------------------|-------------------+
                                                               |
+--------------------------------------------------------------v-------------------+
|                              Cloud Services (Firebase)                           |
|  +-----------------------------+  +-------------------+  +--------------------+  |
|  |      Firebase Auth          |  |  Firestore DB     |  | Cloud Functions    |  |
|  |  Google Sign-in / ID Tokens |  |  users/{uid}      |  | categorize (BYOK)  |  |
|  +-----------------------------+  +-------------------+  +--------------------+  |
+----------------------------------------------------------------------------------+
```

## System Boundaries & Data Flow

1. **Local-First Recommendation Path (Zero Latency / Offline Capable)**:
   - User inputs merchant + amount in `SearchSection.tsx`.
   - `gemini.ts` checks in-memory `EXHAUSTIVE_MERCHANT_MAPPINGS` or `idb-keyval` cache.
   - `recommendation.ts` runs deterministic rule engine using user's active wallet cards.
   - Zero network round-trips needed for all standard Indian merchants.

2. **Cloud Merchant Classification Path (Optional BYOK)**:
   - If merchant is unrecognized locally and user supplied an OpenRouter API key:
   - Client calls Firebase Function `categorize(query, apiKey)`.
   - Returns structured `MerchantInfo` and caches in IndexedDB for 30 days.

3. **Multi-User State Partitioning & Synchronization**:
   - `useAuthAndSync.ts` partitions local edits by `wallet:${uid}` and `settings:${uid}`.
   - Debounced (500ms) sync pushes local state to Firestore `users/{uid}`.
   - Offline mutation queue buffers transactions and flushes upon network reconnection.

4. **Agentic MCP Integration Path**:
   - External LLMs connect via `POST /mcp` (Streamable HTTP) or `GET /sse`.
   - Authenticated via OAuth 2.0 PKCE exchange for user's Firebase ID token.
   - Exposes personalized wallet recommendations via `find_best_card`.

