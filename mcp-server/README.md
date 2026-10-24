# OnlyCashbacks MCP Server

An MCP (Model Context Protocol) server that exposes the OnlyCashbacks card recommendation engine to AI assistants like Claude, Cursor, Antigravity, and more.

Ask your AI assistant questions like:
- *"Which card should I use for ₹3,000 on Swiggy?"*
- *"What's my best card for Amazon purchases?"*
- *"I'm paying ₹1,500 at Blinkit — best card?"*

## 🔧 Tools

| Tool | Description |
|------|-------------|
| `authenticate` | Sign in with your OnlyCashbacks Google account for personalized recommendations |
| `find_best_card` | Get the optimal card recommendation for any merchant + amount |
| `list_cards` | List all supported credit and debit cards |
| `get_card_details` | View detailed info about a specific card's benefits and exclusions |

## 🚀 Setup

### Local (stdio)

1. Install dependencies:
   ```bash
   cd mcp-server
   npm install
   ```

2. Set up Firebase credentials (for personalized recommendations):
   ```bash
   cp .env.example .env
   # Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path
   ```

3. Add to your MCP client config (e.g., Claude Desktop `claude_desktop_config.json`):
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

### Remote (Railway / Streamable HTTP)

1. Deploy to Railway:
   - Push to GitHub
   - Create a new Railway project → Deploy from GitHub
   - Build from the repository root with the root Dockerfile to include the wallet web app and MCP server. Building only `mcp-server/` omits the wallet web app.
   - Add environment variables:
     - `MCP_TRANSPORT=streamable-http` (the legacy value `sse` also serves both transports)
     - `FIREBASE_SERVICE_ACCOUNT_JSON=<your service account JSON>`

2. Connect your MCP client:
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

## 🔐 Authentication

Use the host's OAuth connection when available. Discovery is available at `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource/mcp`. The server supports public-client registration, registered callback validation, S256 PKCE, single-use authorization codes and rotating refresh tokens.

Otherwise, call `authenticate` without arguments, open its Google sign-in link, then call `authenticate` with the returned pairing code in the same MCP connection. Pairing codes expire after 15 minutes and can only be claimed once by the requesting connection. Never paste Firebase tokens or credentials into chat.

Personalized tools load the current saved wallet from the configured named Firestore database on every call, including exhausted cards, offer usage, billing dates and the Kiwi rate. A saved `walletCards: []` is the web app's all-cards-selected setting. Authenticated tools preserve that meaning and explicitly report `cardSelection.mode: all_supported_cards`; they do not present it as an independently verified list of owned cards. A missing selection or unavailable user document blocks recommendations. An unauthenticated `list_cards` response is explicitly the system catalogue; authenticated results include wallet settings and card IDs, excluding BYOK credentials.

Keep `only-cashbacks.up.railway.app` in Firebase Authentication's authorized domains. OAuth metadata and account links are pinned to this origin; `PUBLIC_URL` does not override it. Server credentials must have access to the named database selected by `FIREBASE_DATABASE_ID`.

The standalone sign-in page also initializes App Check with reCAPTCHA Enterprise before making Auth requests. Configure `VITE_RECAPTCHA_SITE_KEY` with the same public key registered for the wallet app, and allow the Railway domain on that key. Missing or invalid App Check tokens can cause Google sign-in to surface `auth/internal-error` when Authentication enforcement is enabled.

OAuth access tokens expire after one hour. Refresh tokens rotate within a maximum 24-hour login period. Clients must include the bearer token on every request to an OAuth-authenticated session. Anonymous connections can use manual pairing.

Registrations, tokens, pairing codes and MCP sessions are in memory. Run one replica; a restart requires reconnecting and signing in again. Multiple replicas require a shared authorization and session store.

After deploying changes, reconnect the plugin, complete Google sign-in, and verify `authenticate` and `list_cards` in the same connection. Local regression tests mock identity and database calls; real sign-in is still required to validate production credentials and domain configuration.

## 🏗 Development

```bash
cd mcp-server
npm install
npm run dev     # Runs with tsx in stdio mode
npm run build   # Compiles TypeScript
npm start       # Runs compiled JS
```

## 📁 Structure

```
mcp-server/
├── src/
│   ├── index.ts          # MCP server entrypoint & tool definitions
│   ├── types.ts          # Type definitions (standalone)
│   ├── firebase.ts       # Firebase Admin SDK helper
│   ├── data/
│   │   └── cards.ts      # Card database (mirrors frontend)
│   └── lib/
│       └── recommendation.ts  # Recommendation engine (mirrors frontend)
├── Dockerfile            # Railway deployment
├── railway.json          # Railway config
├── package.json
└── tsconfig.json
```
