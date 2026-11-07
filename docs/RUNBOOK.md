<!-- AUTO-GENERATED: Generated from railway.json, Dockerfile, and server architecture -->
# Operations & Deployment Runbook

## Deployment Architecture

OnlyCashbacks is containerized using multi-stage Docker and deployed to Railway. Railway hosts the unified server that provides both the PWA frontend static assets and the Model Context Protocol (MCP) server API.

### Service Overview
- **Deployment Platform**: Railway (`railway.json`)
- **Docker Image**: Multi-stage `node:20-slim` (`Dockerfile`)
- **Web App URL**: `https://only-cashbacks.up.railway.app/`
- **MCP Endpoint**: `https://only-cashbacks.up.railway.app/mcp`
- **Health Check**: `GET https://only-cashbacks.up.railway.app/health`

---

## Deployment Procedures

### Automated Deployment (Continuous Delivery)
1. Push validated commits to the `main` branch.
2. Railway detects the commit, triggers a Docker build using `Dockerfile`:
   - Stage 1: Builds the React SPA (`npm run build`) and compiles the MCP server.
   - Stage 2: Copies the static bundle to `/app/web` and serves it via the Node runtime on port 3001.
3. Health check validates `GET /health` returns HTTP 200 `{ status: "ok" }`.
4. Traffic automatically cut over to the new container.

### Manual Verification After Deploy
```bash
# 1. Verify healthcheck endpoint
curl -s -i https://only-cashbacks.up.railway.app/health | grep "HTTP/1.1 200"

# 2. Verify MCP discovery metadata
curl -s https://only-cashbacks.up.railway.app/.well-known/oauth-authorization-server | jq .

# 3. Verify PWA bundle SHA match
curl -s -I https://only-cashbacks.up.railway.app/index.html | grep "ETag\|Cache-Control"
```

---

## Monitoring & Health Checks

- **Health Endpoint**: `GET /health`
  - Expected response: `{"status":"ok","server":"onlycashbacks-mcp","version":"1.0.0"}`
- **Crash Telemetry**: Frontend unhandled exceptions are caught by `ErrorBoundary.tsx` and logged to Firestore `clientErrors` (capped at 5 errors per session to prevent flooding).

---

## Common Issues & Remediation

### 1. PWA Service Worker 404 on Protected Routes
- **Symptom**: User navigating to `/oauth` or `/mcp` receives the PWA SPA index shell instead of API response.
- **Root Cause**: Missing entries in `navigateFallbackDenylist` in `vite.config.ts`.
- **Fix**: Verify `navigateFallbackDenylist` in `vite.config.ts` includes `/^\/(?:oauth|authorize|token|register|mcp|sse|health|\.well-known|api|messages|login|__)/`. Run `npm run test:pwa-routes`.

### 2. High MCP Session Memory Retention
- **Symptom**: Memory usage steadily climbs under high agent connection volume.
- **Root Cause**: Abandoned Streamable HTTP connections not timing out.
- **Fix**: Verify `MCP_SESSION_IDLE_TIMEOUT_MINUTES` is active (default 60 mins). Test with `npx vitest run mcp-server/tests/sessionExpiry.test.ts`.

### 3. Missing Favicon or Asset 404
- **Symptom**: Console 404 for `favicon.ico` or assets on production domain.
- **Root Cause**: Hardcoded CDN URL in `vite.config.ts` `renderBuiltUrl`.
- **Fix**: Ensure `renderBuiltUrl` falls back to root `/` unless `VITE_CDN_URL` is explicitly provided.

---

## Rollback Procedures

If a bad deployment passes health checks but experiences runtime regressions:
1. Open the [Railway Dashboard](https://railway.com/).
2. Navigate to the `only-cashbacks` service -> **Deployments**.
3. Locate the previous stable deployment and select **Rollback**.
4. Railway will instantaneously spin up the previous image and redirect ingress traffic.

