<!-- Generated: 2026-11-08 | Files scanned: 83 | Token estimate: ~650 -->

# Backend Architecture

## Services & Entry Points

```
server.ts                   → Production Express server & local Vite middleware host
functions/src/index.ts      → Firebase Cloud Functions (OpenRouter AI categorization)
mcp-server/src/index.ts     → MCP server exposing tools over Streamable HTTP & SSE
mcp-server/src/oauth.ts     → OAuth 2.0 PKCE authorization server for MCP clients
mcp-server/src/firebase.ts  → Firebase Admin SDK token verification & user data loader
```

## Routes & Endpoints

### Core App Server (`server.ts`)
- `GET *` → Static asset delivery from `dist/` with immutable caching (HTML & SW set to `no-cache`)
- Middleware: `compression()`, security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)

### Firebase Cloud Functions (`functions/src/index.ts`)
- `httpsCallable('categorize')` → Receives `{ query, apiKey }`, calls OpenRouter `google/gemini-2.5-flash` with prompt constraint, returns `MerchantInfo`.

### MCP Server (`mcp-server/src/index.ts`)

| Route | Method | Handler / Purpose |
| :--- | :--- | :--- |
| `/health` | GET | Health check returning status and server version |
| `/login` | GET/POST | Interactive OAuth login HTML page exchanging Firebase ID token |
| `/mcp` | POST/GET/DELETE | Streamable HTTP transport for Modern MCP clients (with idle session cleanup) |
| `/sse` | GET | Server-Sent Events transport for legacy MCP clients |
| `/messages` | POST | Inbound message handler for active SSE sessions |
| `/.well-known/oauth-authorization-server` | GET | RFC 8414 metadata for agent discovery |
| `/.well-known/oauth-protected-resource` | GET | Resource server metadata declaring OAuth scopes |
| `/authorize` | GET | RFC 7636 OAuth PKCE code authorization |
| `/token` | POST | Code-to-token & refresh-token exchange |
| `/register` | POST | Dynamic client registration |

## MCP Tools Registered

1. **`find_best_card`**:
   - Signature: `(merchant: string, amount: number, isOnline?: boolean, isIntl?: boolean, currency?: string)`
   - Context: Loads user's wallet cards, billing cycles, and exhaustion markers from Firestore.
   - Output: Best card, net reward value, reward allocation, reason, and alternative cards.

2. **`list_cards`**:
   - Signature: `(category?: string, network?: string, hasLounge?: boolean)`
   - Output: Formatted list of all cards in catalog matching filters with fees and benefits.

3. **`get_card_details`**:
   - Signature: `(cardId: string)`
   - Output: Comprehensive terms, reward programs, exclusions, and lounge rules for specific card.

## Security & Session Management

- **Idle Reclaim**: In-memory MCP sessions expire after configurable `MCP_SESSION_IDLE_TIMEOUT_MINUTES` (default 60 min).
- **Bearer Isolation**: User tokens are checked against Firebase Auth; sessions never cross-contaminate.

