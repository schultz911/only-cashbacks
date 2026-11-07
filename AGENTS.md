# STRICTIONS, GUARDRAILS & CORE CONSTRAINTS

- Pure-Functionality Preservation: Keep core business logic, API signatures, edge-case handling, database schemas. Every optimization keep identical functionality.
- No Refactoring for "Cleanliness": No aesthetic refactoring (variable names, folder structures) unless direct measurable performance dividend.
- Deterministic Outcomes: Output code must pass identical unit, integration, regression tests.
- Firebase Protections: Never remove, alter, or optimize code blocks, configuration files, or variables for Firebase Functions.
- No "Any" Stripping: Never remove or refactor TypeScript any types for strict compliance unless resolving critical, reproducible memory or runtime leak.

## Discovered Optimizations

- (2026-11-05 PWA restoration) Workbox navigation exclusions match query strings; prevent OAuth aliases receiving app shell. Uncached chart imports need local failure boundary for offline savings controls.
- (2026-11-05 readiness sweep) Account switch can carry cached BYOK key and savings into new account; global offline queue can merge records across accounts. Both reproduced.
- (2026-11-05 readiness sweep) Persistent async save failure caused 11 attempts in 12s without new edits.
- (2026-11-05 readiness sweep) Savings chart loaded on initial render when dashboard closed; chart-only prototype cut initial JS 16.96% gzip-equivalent.
- (2026-11-05 readiness sweep) Railway service-worker removal route unregisters worker, preventing retained offline PWA caching.
- (2026-10-25 sweep, Phase 1) Cloud hydration cleared suppression flag after 100ms; 500ms wallet persistence timer marked cloud data dirty again (8 writes in 12s idle). Distinct from Phase 6 storage debounce.
- (2026-10-25 sweep, Phase 2) Streamable HTTP MCP sessions retained without idle expiry after abandonment; 1,000 sessions retained 72.7MB, explicit cleanup freed 70.4MB.
- (Phase 8) `src/services/gemini.ts:167` Sequential regex `.test()` over EXHAUSTIVE_MERCHANT_MAPPINGS.
- (Phase 8) `src/lib/recommendation.ts:699` Calling `DEFAULT_EXCLUSIONS.find` dynamically in recommendation loop.
- (Phase 8) `server.ts:28` CSP uses 'unsafe-inline' for script-src and style-src.
- (Phase 8) `src/App.tsx:455` Catching `error` as `any` in error handler.
- (Phase 8) `src/App.tsx:200` Catching `error` as `any` in catch block.
- (Phase 8) `src/lib/recommendation.ts:459` Calling `card.benefits.find` inside `calculateCardRecommendation`.
- (Phase 7) `src/components/ErrorBoundary.tsx:1` Unread React import.
- (Phase 7) `src/components/DashboardModal.tsx:34` Redundant `map.get` before `map.set` in loop.
- (Phase 7) `src/hooks/usePushNotifications.ts:50` `localStorage.getItem` per key in loop blocks main thread.
- (Phase 7) `src/services/gemini.ts:168` Sequential regex `.test()` is O(N).
- (Phase 7) `src/lib/recommendation.ts:695` Repeated `.some()` and `.includes()` array checks are O(N).
- (Phase 7) `src/components/LoungeTrackerModal.tsx:77` `card.benefits.find` in render reduce loop is O(N*M).
- (Phase 7) `src/App.tsx:274` Multiple `filter` calls on `CARD_DATA` in `useMemo`.
- (Phase 7) `src/App.tsx:81` Unused `isDirtyRef` destructuring.
- (Phase 7) `src/components/DashboardModal.tsx:155` Unused `entry` parameter in map.
- (Phase 7) `src/App.tsx:540` Unused `activeAmountRaw`.
- (Phase 7) `src/lib/recommendation.ts:12` Unused constant `DINING_PLATFORMS`.
- (Phase 7) `src/components/BillReminders.tsx:1` Unused React import.
- (Phase 7) `src/App.tsx:61` Unused `setNeedRefresh` destructuring.
- (Phase 7) `src/components/BillDateSelector.tsx:1` Unused React import.
- (Phase 7) `server.ts:20` Unread Express `req` parameter.
- (Phase 7) `src/lib/recommendation.ts:834` Nested `.some()` with `.includes()` category matching is O(N^2).
- (Phase 7) `src/lib/recommendation.ts:864` Sequential duplicate evaluateCard calls.
- (Phase 6) `.env.example` and `.env` contain dead vars: `OPENROUTER_MODEL`, `APP_URL`, `URL`, `GEMINI_API_KEY`.
- (Phase 6) Root directory contains orphan `metadata.json`.
- (Phase 6) `package.json` contains unused devDependency `workbox-build`.
- (Phase 6) `App.tsx` contains duplicate inline `mockRates` maps with stale 2024 rates.
- (Phase 6) `useWalletState.ts` performs 9 synchronous `localStorage.setItem` calls per state change.
- (Phase 6) `DashboardModal.tsx` recomputes `chartData` on render with O(N^2) find-in-reduce.
- (Phase 6) `gemini.ts` dynamic imports of `httpsCallable` and `functions` on every search call.
- (Phase 6) `ErrorBoundary.tsx` lacks write limit to Firestore `clientErrors` collection.
- (Phase 6) `vite.config.ts` includes `woff2` in `globPatterns` without local font files.
- (Phase 5) `useAuthAndSync.ts` naive single-log queue drops logs on multiple offline transactions.
- (Phase 5) `functions/src/index.ts` strictly requires BYOK OpenRouter key.
- (Phase 5) `DashboardModal.tsx` Recharts `PieChart` leaves idle animations active on mobile.
- (Phase 4) `server.ts` missing `X-Permitted-Cross-Domain-Policies` security header.
- (Phase 4) `gemini.ts` unbounded IDB cache growth without eviction.
- (Phase 4) `App.tsx` synchronous calculation in `useEffect` causes hydration stutter.
- (Phase 4) Dead local Express `/api/categorize` endpoint and `zod` dependency.
- (Phase 4) `App.tsx` test connection hits deprecated local route instead of Firebase.
- Orphan functions folder found; user pivoted to implement Firebase Functions.
- Dead code in firebase.ts identified.

## Previously Suggested

- (2026-11-05 readiness plan) Isolate account-local wallet/settings and queued edits by owner; retain unowned legacy data.
- (2026-11-05 readiness plan) Stop retries on permanent save errors; back off transient failures; retain dirty edits.
- (2026-11-05 readiness plan) Defer savings chart until displayed; preserve dashboard shell.
- (2026-11-05 readiness plan) Restore offline PWA launch after approval and regression checks.
- (2026-10-25 sweep, Phase 1) Track local wallet/settings revisions at setter; suppress tracking during synchronous hydration; retain 500ms persistence debounce.
- (2026-10-25 sweep, Phase 2) Reclaim abandoned MCP sessions with 60-min idle timeout; protect active requests; clean protocol/pairing resources.
- (Phase 8) Combine RegExp patterns in `src/services/gemini.ts`.
- (Phase 8) Replace `DEFAULT_EXCLUSIONS.find` with Set/Map in `src/lib/recommendation.ts`.
- (Phase 8) Remove 'unsafe-inline' from script-src and style-src in `server.ts`.
- (Phase 8) Refactor `error: any` to `error: unknown` in `src/App.tsx:455`.
- (Phase 8) Refactor `error: any` to `error: unknown` in `src/App.tsx:200`.
- (Phase 8) Index `card.benefits` in `src/lib/recommendation.ts:459`.
- (Phase 7) Remove unused React import from `src/components/ErrorBoundary.tsx`.
- (Phase 7) Avoid double map lookup in `src/components/DashboardModal.tsx`.
- (Phase 7) Optimize `localStorage` reads in `src/hooks/usePushNotifications.ts`.
- (Phase 7) Combine RegExp patterns in `src/services/gemini.ts`.
- (Phase 7) Convert array checks to Set lookups in `src/lib/recommendation.ts:695`.
- (Phase 7) Optimize `benefits.find` in reduce in `src/components/LoungeTrackerModal.tsx`.
- (Phase 7) Combine filters in `src/App.tsx:274`.
- (Phase 7) Remove unused destructuring of `isDirtyRef` in `src/App.tsx`.
- (Phase 7) Remove unused parameter `entry` in `src/components/DashboardModal.tsx`.
- (Phase 7) Remove unused variable `activeAmountRaw` in `src/App.tsx`.
- (Phase 7) Remove unused constant `DINING_PLATFORMS` in `src/lib/recommendation.ts`.
- (Phase 7) Remove unused React import in `src/components/BillReminders.tsx`.
- (Phase 7) Remove unused destructuring of `setNeedRefresh` in `src/App.tsx`.
- (Phase 7) Remove unused React import in `src/components/BillDateSelector.tsx`.
- (Phase 7) Prefix/remove unused parameter `req` in `server.ts`.
- (Phase 7) Precompute intersections using Sets in `src/lib/recommendation.ts:834`.
- (Phase 7) Hoist evaluateCard computations in `src/lib/recommendation.ts:864`.
- (Phase 6) Remove dead environment variables (`OPENROUTER_MODEL`, `APP_URL`, `URL`) from `.env.example` and `.env`.
- (Phase 6) Delete orphan root file `metadata.json`.
- (Phase 6) Uninstall unused `workbox-build` devDependency.
- (Phase 6) Extract duplicate `mockRates` maps into module-scoped `FALLBACK_EXCHANGE_RATES` constant in `App.tsx`.
- (Phase 6) Debounce `localStorage` writes in `useWalletState.ts` with 500ms trailing debounce.
- (Phase 6) Memoize `chartData` and optimize aggregation to O(N) using `Map` in `DashboardModal.tsx`.
- (Phase 6) Statically import `httpsCallable` and `functions` in `gemini.ts`.
- (Phase 6) Cap Firestore client error logging at 5 errors per session in `ErrorBoundary.tsx`.
- (Phase 6) Remove `woff2` from PWA `globPatterns` in `vite.config.ts`.
- (Phase 5) Robust offline array queue in `useAuthAndSync.ts`.
- (Phase 5) Server-side fallback API key in `functions/src/index.ts`.
- (Phase 5) Set `isAnimationActive={false}` in `DashboardModal.tsx`.
- (Phase 4) Add `X-Permitted-Cross-Domain-Policies` to Express server.
- (Phase 4) Implement async `evictStaleCache` routine in `gemini.ts` using `idb-keyval`.
- (Phase 4) Defer heavy calculation in `App.tsx` via 100ms `setTimeout`.
- (Phase 4) Remove `/api/categorize` endpoint, rate-limit cache, and `zod` schema from `server.ts`.
- (Phase 4) Uninstall `zod` from `package.json`.
- (Phase 4) Migrate `handleTestConnection` in `App.tsx` to Firebase `httpsCallable`.
- Delete functions/ directory.
- Clean up unused getFunctions in src/firebase.ts.

## Approved and Implemented

- (2026-11-05 readiness sweep, PWA enhancement) Restored service worker delivery and retained caches through sign-in; excluded protected paths and query strings from navigation fallback; migrated old caches; contained chart failures. Validated offline launch, Swiggy recommendation, and legacy worker migration. 244 tests passed.
- (2026-11-05 readiness sweep, Phase 3) Deferred savings chart until displayed. Reduced initial JS gzip-equivalent 417,593 to 347,035 bytes (16.90% reduction). 241 tests passed.
- (2026-11-05 readiness sweep, Phase 2) Implemented permanent-error retry blocking and exponential backoff for transient failures (2, 4, 8, 16, 32, 60s); preserved dirty edits, manual retry, and paused sync. Cut permanent-error attempts 90.9% (1 in 12s vs 11). 241 tests passed.
- (2026-11-05 readiness sweep, Phase 1) Account-scoped wallet/settings and offline queues; preserved unowned legacy data; protected pending edits across switches. 236 tests passed.
- (2026-10-25 sweep, Phase 3 release) Pushed commits 26c15e0 and 3410da3. Railway deployed 3410da354b5a539816b5665c41c71de782b2c68e. Verified health HTTP 200, frontend bundle SHA-256 match, MCP tools list HTTP 200, 401 challenge, session DELETE HTTP 200.
- (2026-10-25 sweep, Phase 2) Added configurable `MCP_SESSION_IDLE_TIMEOUT_MINUTES` (default 60), shared unref cleanup timer, activity protection, and shutdown disposal. 1,000-session probe reclaimed 77.7MB of 79.9MB (97.3%). 51 tests passed.
- (2026-10-25 sweep, Phase 1) Local-edit tracking for wallet, theme, BYOK; stopped hydration echo saves. 44 tests passed; zero writes across 60s idle.
- (Phase 9) Preconnected Google Fonts, preloaded stylesheet in `index.html`, removed render-blocking `@import` from `src/index.css`.
- (Phase 9) Added static `<link rel="manifest">` in `index.html`.
- (Phase 6) Removed dead env vars from `.env.example` and `.env`.
- (Phase 6) Deleted orphan `metadata.json`.
- (Phase 6) Uninstalled unused `workbox-build`.
- (Phase 6) Extracted duplicate `mockRates` maps into `FALLBACK_EXCHANGE_RATES` constant in `App.tsx`.
- (Phase 6) Debounced `localStorage` writes in `useWalletState.ts` (500ms trailing).
- (Phase 6) Memoized `chartData` to O(N) using `Map` in `DashboardModal.tsx`.
- (Phase 6) Statically imported `httpsCallable` and `functions` in `gemini.ts`.
- (Phase 6) Capped Firestore client error logging at 5 per session in `ErrorBoundary.tsx`.
- (Phase 6) Removed `woff2` from PWA `globPatterns` in `vite.config.ts`.
- (Phase 5) Implemented offline array queue in `useAuthAndSync.ts`.
- (Phase 5) Added `isAnimationActive={false}` in `DashboardModal.tsx`.
- (Phase 4) Added `X-Permitted-Cross-Domain-Policies: none` in `server.ts`.
- (Phase 4) Implemented `evictStaleCache` in `gemini.ts` using `idb-keyval`.
- (Phase 4) Deferred heavy synchronous `useEffect` calculation in `App.tsx`.
- (Phase 4) Removed dead `/api/categorize` endpoint, `rateLimiter`, and schema from `server.ts`.
- (Phase 4) Uninstalled `zod` from `package.json`.
- (Phase 4) Migrated `handleTestConnection` in `App.tsx` to Firebase `httpsCallable`.
- Phase 1: Migrated `gemini.ts` to Firebase Functions (`httpsCallable(functions, 'categorize')`).

## Denied or Not Implemented

- (Phase 8) Combine RegExp patterns in `src/services/gemini.ts` (Rejected: reduces readability).
- (Phase 8) Replace `DEFAULT_EXCLUSIONS.find` with Set in `src/lib/recommendation.ts:699` (Rejected: breaks substring matching).
- (Phase 8) Remove 'unsafe-inline' from CSP in `server.ts:28` (Rejected: operational risk of breaking Vite inline scripts).
- (Phase 8) Refactor `error: any` to `error: unknown` in `src/App.tsx:455` (Rejected: violates 'No Any Stripping').
- (Phase 8) Refactor `error: any` to `error: unknown` in `src/App.tsx:200` (Rejected: violates 'No Any Stripping').
- (Phase 8) Index `card.benefits` in `src/lib/recommendation.ts:459` (Rejected: micro-optimization on 2-5 element static arrays).
- (Phase 7) Remove unused React import from `src/components/ErrorBoundary.tsx` (Rejected: aesthetic-only).
- (Phase 7) Avoid double map lookup in `src/components/DashboardModal.tsx` (Rejected: negligible benefit).
- (Phase 7) Optimize `localStorage` reads in `src/hooks/usePushNotifications.ts` (Rejected: false positive).
- (Phase 7) Combine RegExp patterns in `src/services/gemini.ts` (Rejected: reduces maintainability).
- (Phase 7) Convert array checks to Set lookups in `src/lib/recommendation.ts:695` (Rejected: Set breaks substring checking).
- (Phase 7) Optimize `benefits.find` in `src/components/LoungeTrackerModal.tsx` (Rejected: already memoized, tiny dataset).
- (Phase 7) Combine filters in `src/App.tsx:274` (Rejected: false positive).
- (Phase 7) Remove unused destructuring of `isDirtyRef` in `src/App.tsx` (Rejected: cleanliness-only).
- (Phase 7) Remove unused parameter `entry` in `src/components/DashboardModal.tsx` (Rejected: cleanliness-only).
- (Phase 7) Remove unused variable `activeAmountRaw` in `src/App.tsx` (Rejected: cleanliness-only).
- (Phase 7) Remove unused constant `DINING_PLATFORMS` in `src/lib/recommendation.ts` (Rejected: cleanliness-only).
- (Phase 7) Remove unused React import in `src/components/BillReminders.tsx` (Rejected: cleanliness-only).
- (Phase 7) Remove unused destructuring of `setNeedRefresh` in `src/App.tsx` (Rejected: cleanliness-only).
- (Phase 7) Remove unused React import in `src/components/BillDateSelector.tsx` (Rejected: cleanliness-only).
- (Phase 7) Prefix/remove unused parameter `req` in `server.ts` (Rejected: cleanliness-only).
- (Phase 7) Precompute intersections using Sets in `src/lib/recommendation.ts:834` (Rejected: breaks substring matching).
- (Phase 7) Hoist evaluateCard computations in `src/lib/recommendation.ts:864` (Rejected: duplicate computations already hoisted).
- (Phase 5) Graceful server-side fallback API key rejected to strictly enforce BYOK policy.
- Phase 1: Deletion of functions/ directory rejected.
- Phase 1: Cleanup of src/firebase.ts rejected.

## Discovered Optimizations (Phase 2)

- localStorage quota loops freeze main thread.
- Concurrent searches block input and lock UI.

## Previously Suggested (Phase 2)

- Migration to IndexedDB for merchant caching.
- AbortController network cancellation.

## Approved and Implemented (Phase 2)

- Migrated `gemini.ts` caching to `idb-keyval` to eliminate UI stutter.
- Added AbortController to `handleSearch` in `App.tsx` to cancel pending requests.

## Discovered Optimizations (Phase 3)

- Unauthenticated crash telemetry missing.

## Previously Suggested (Phase 3)

- Analytics integration in Error Boundary.

## Approved and Implemented (Phase 3)

- Imported Firebase Analytics and added `logEvent('exception')` inside `ErrorBoundary`.

## Design system

- Before UI or styling changes, read `PRODUCT.md` and `DESIGN.md`.
- Use `opendesigner/references/captured-values.json` and `opendesigner/captured-wallet.css` for captured roles.
- For system changes, use `opendesigner-extend` and read `opendesigner/PROTOCOL.md`, `opendesigner/decisions.md` and `opendesigner/RULES.md`.
- Review affected screens at desktop and phone sizes, including themes, keyboard focus and reduced motion.
