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

### Remote (Railway / SSE)

1. Deploy to Railway:
   - Push to GitHub
   - Create a new Railway project → Deploy from GitHub
   - Set the root directory to `mcp-server/`
   - Add environment variables:
     - `MCP_TRANSPORT=sse`
     - `FIREBASE_SERVICE_ACCOUNT_JSON=<your service account JSON>`

2. Connect your MCP client:
   ```json
   {
     "mcpServers": {
       "onlycashbacks": {
         "url": "https://your-service.up.railway.app/sse"
       }
     }
   }
   ```

## 🔐 Authentication

The MCP server supports **Google sign-in** via Firebase to personalize recommendations:

1. Sign into the [OnlyCashbacks app](https://only-cashbacks.web.app) with Google
2. Go to **Settings → Developer → Copy ID Token**
3. Use the `authenticate` MCP tool with your token
4. All subsequent `find_best_card` calls will use your wallet configuration

Without authentication, recommendations use all available cards in the database.

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
