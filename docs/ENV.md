<!-- AUTO-GENERATED: Generated from .env.example and server configuration -->
# Environment Variables Reference

OnlyCashbacks uses client-side Vite environment variables (prefixed with `VITE_`) for Firebase public configuration and App Check, as well as optional Node.js server environment variables.

## Client Environment Variables (`.env`)

Source of truth: `.env.example`

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Yes (for Sync) | Firebase Web API key for authentication and Firestore | `AIzaSyA...` |
| `VITE_FIREBASE_PROJECT_ID` | Yes (for Sync) | Google Cloud / Firebase project identifier | `only-cashbacks-prod` |
| `VITE_FIREBASE_APP_ID` | Yes (for Sync) | Firebase Web application identifier | `1:1234567890:web:...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes (for Sync) | Domain for Firebase Authentication redirect flows | `only-cashbacks.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_ID` | No | Named Firestore database ID (defaults to `(default)`) | `(default)` |
| `VITE_FIREBASE_STORAGE_BUCKET`| No | Cloud Storage bucket name | `only-cashbacks.appspot.com` |
| `VITE_FIREBASE_SENDER_ID` | No | Cloud Messaging sender ID | `123456789012` |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | Google Analytics measurement ID | `G-XXXXXXXXXX` |
| `VITE_RECAPTCHA_SITE_KEY` | No | Firebase App Check reCAPTCHA v3 site key | `6LeIxacZAAAAA...` |
| `VITE_CDN_URL` | No | Optional CDN base path prefix for static assets | `https://cdn.example.com` |

## Server Environment Variables (`server.ts` & `mcp-server/`)

| Variable | Required | Description | Default |
| :--- | :---: | :--- | :--- |
| `PORT` | No | HTTP listening port for Express and MCP server | `3000` (`3001` for standalone MCP) |
| `NODE_ENV` | No | Runtime environment (`development` \| `production`) | `development` |
| `MCP_TRANSPORT` | No | MCP transport mode (`stdio` \| `streamable-http` \| `sse`) | `streamable-http` |
| `MCP_SESSION_IDLE_TIMEOUT_MINUTES` | No | Idle minutes before unreferenced MCP sessions are reclaimed | `60` |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | Path to Firebase service account JSON file (MCP Admin SDK) | None |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | No | Inline JSON string of Firebase service account credentials | None |
| `FIREBASE_DATABASE_ID` | No | Firestore database identifier override | `ai-studio-onlycashbacks-9dfa3f2d-5762-4049-a6c8-583bd3c24948` |
| `OAUTH_CLIENT_SIGNING_KEY` | No | Cryptographic key (32+ bytes) for signing dynamic OAuth client registrations | In-memory ephemeral |
| `OAUTH_REGISTERED_CLIENTS_JSON` | No | JSON mapping existing client IDs to authorized callback URLs | None |
| `DISABLE_HMR` | No | Disables Vite Hot Module Replacement in sandboxed web agents | `false` |

