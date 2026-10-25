# STRICTIONS, GUARDRAILS & CORE CONSTRAINTS

- Pure-Functionality Preservation: Do not alter core business logic, API signatures, edge-case handling, or database schemas. Every optimization must maintain identical functionality.
- No Refactoring for "Cleanliness": Avoid aesthetic refactoring (e.g., changing variable names, reorganizing folder structures) unless it directly yields measurable performance dividends.
- Deterministic Outcomes: The output code must pass identical unit, integration, and regression tests.
- Firebase Protections: Under no circumstances suggest the removal, alteration, or optimization of code blocks, configuration files, or variables explicitly marked or structured for use by Firebase Functions.
- No "Any" Stripping: Do not recommend or force the removal or refactoring of TypeScript any types simply for strict compliance unless it directly resolves a critical, reproducible memory or runtime leak.

## Discovered Optimizations

- (2026-10-25 sweep, Phase 1) Cloud hydration clears its suppression flag after 100 ms, but the 500 ms wallet persistence timer marks that cloud data dirty again; controlled reproduction: 8 writes in 12 seconds without user edits. Distinct from the already-implemented Phase 6 storage debounce.
- (2026-10-25 sweep, Phase 2) Streamable HTTP MCP sessions remain referenced without idle expiry after clients abandon them; 1,000 local sessions retained 72.7 MB, with explicit cleanup reclaiming 70.4 MB.

- (Phase 8) `src/services/gemini.ts:167` Iterating over EXHAUSTIVE_MERCHANT_MAPPINGS with regex `.test()` sequentially.
- (Phase 8) `src/lib/recommendation.ts:699` Calling `DEFAULT_EXCLUSIONS.find` dynamically during recommendation calculation.
- (Phase 8) `server.ts:28` Content Security Policy uses 'unsafe-inline' for script-src and style-src.
- (Phase 8) `src/App.tsx:455` Catching `error` as `any` in error handler.
- (Phase 8) `src/App.tsx:200` Catching `error` as `any` in catch block.
- (Phase 8) `src/lib/recommendation.ts:459` Calling `card.benefits.find` inside `calculateCardRecommendation`.
- (Phase 7) `src/components/ErrorBoundary.tsx:1` React import is declared but never read.
- (Phase 7) `src/components/DashboardModal.tsx:34` Calling `map.get` immediately followed by `map.set` inside a loop can be optimized by storing the get result.
- (Phase 7) `src/hooks/usePushNotifications.ts:50` Checking `localStorage.getItem` for each notification key inside a loop or timer can cause main thread blocking.
- (Phase 7) `src/services/gemini.ts:168` Iterating over EXHAUSTIVE_MERCHANT_MAPPINGS and executing regex `.test()` sequentially is O(N).
- (Phase 7) `src/lib/recommendation.ts:695` Using `.some()` and `.includes()` repeatedly for membership checks on arrays is O(N).
- (Phase 7) `src/components/LoungeTrackerModal.tsx:77` Calling `card.benefits.find` inside a `reduce` loop during every render is O(N*M).
- (Phase 7) `src/App.tsx:274` Calling `filter` multiple times on `CARD_DATA` inside a `useMemo` can be combined into a single pass.
- (Phase 7) `src/App.tsx:81` Variable 'isDirtyRef' is destructured from context but never used in App.tsx.
- (Phase 7) `src/components/DashboardModal.tsx:155` Parameter 'entry' is defined in the map function but only 'index' is used.
- (Phase 7) `src/App.tsx:540` Variable 'activeAmountRaw' is calculated but never used.
- (Phase 7) `src/lib/recommendation.ts:12` Constant 'DINING_PLATFORMS' is declared but never used in the recommendation logic.
- (Phase 7) `src/components/BillReminders.tsx:1` React is imported but not used.
- (Phase 7) `src/App.tsx:61` The state setter 'setNeedRefresh' is destructured but never used.
- (Phase 7) `src/components/BillDateSelector.tsx:1` React is imported but not used, causing a linter/TypeScript warning.
- (Phase 7) `server.ts:20` Express 'req' parameter is declared but never read.
- (Phase 7) `src/lib/recommendation.ts:834` Using nested `.some()` loops with `.includes()` for category matching is O(N^2) or worse.
- (Phase 7) `src/lib/recommendation.ts:864` Mapping over cardsToEvaluate calls evaluateCard for each card sequentially, performing duplicate computations.
- (Phase 6) `.env.example` and `.env` contain dead environment variables: `OPENROUTER_MODEL`, `APP_URL`, `URL`, `GEMINI_API_KEY`.
- (Phase 6) Root directory contains an orphan `metadata.json` declaring unused geolocation capabilities.
- (Phase 6) `package.json` contains unused devDependency `workbox-build`.
- (Phase 6) `App.tsx` contains duplicate inline definitions of `mockRates` with stale 2024 exchange rates.
- (Phase 6) `useWalletState.ts` performs 9 synchronous `localStorage.setItem` calls on every state change, blocking the main thread.
- (Phase 6) `DashboardModal.tsx` recomputes `chartData` on every render using an O(N²) find-inside-reduce pattern.
- (Phase 6) `gemini.ts` uses dynamic imports of `httpsCallable` and `functions` on every search call, adding microtask overhead.
- (Phase 6) `ErrorBoundary.tsx` lacks a limit on error logging to the Firestore `clientErrors` collection, exposing the app to billing spikes.
- (Phase 6) `vite.config.ts` includes `woff2` in `globPatterns` but no local font files exist in the project.
- (Phase 5) `useAuthAndSync.ts` uses a naive offline queue strategy that drops logs if multiple transactions occur offline.
- (Phase 5) `functions/src/index.ts` strictly requires a BYOK OpenRouter key, causing friction during onboarding.
- (Phase 5) `DashboardModal.tsx` Recharts `PieChart` leaves idle animation frames active, causing memory bloat on mobile.
- (Phase 4) `server.ts` is missing the `X-Permitted-Cross-Domain-Policies` security header.
- (Phase 4) `gemini.ts` stores cached IDB entries indefinitely without an active eviction strategy, leading to unbounded storage bloat.
- (Phase 4) `App.tsx` has a heavy, synchronous calculation loop inside a `useEffect` causing main thread hydration stutter.
- (Phase 4) Dead local Express `/api/categorize` endpoint and `zod` dependency leftover from Phase 1.
- (Phase 4) `App.tsx`'s test connection hitting deprecated local route instead of Firebase.
- Orphan functions folder found, but user instructed to pivot and implement Firebase Functions instead.
- Dead code in firebase.ts identified.

## Previously Suggested

- (2026-10-25 sweep, Phase 1) Track local wallet/settings revisions at setter time; suppress tracking only during synchronous hydration, preserve edits across acknowledgements and account changes, and retain the 500 ms local persistence debounce.
- (2026-10-25 sweep, Phase 2) Reclaim abandoned MCP sessions with a configurable 60-minute idle timeout, protect active requests/streams, close associated resources and preserve reconnection/account isolation. User approved the timeout policy, then explicitly approved all phases, push and deployment.

- (Phase 8) Combining RegExp patterns in `src/services/gemini.ts`.
- (Phase 8) Replacing `DEFAULT_EXCLUSIONS.find` with a pre-computed Set or Map in `src/lib/recommendation.ts`.
- (Phase 8) Removing 'unsafe-inline' from script-src and style-src headers in `server.ts`.
- (Phase 8) Refactoring `error: any` to `error: unknown` in `src/App.tsx:455`.
- (Phase 8) Refactoring `error: any` to `error: unknown` in `src/App.tsx:200`.
- (Phase 8) Indexing `card.benefits` to avoid `.find` in `src/lib/recommendation.ts:459`.
- (Phase 7) Removal of unused React import from `src/components/ErrorBoundary.tsx`.
- (Phase 7) Avoiding double map lookup in `src/components/DashboardModal.tsx`.
- (Phase 7) Optimizing `localStorage` reads in `src/hooks/usePushNotifications.ts`.
- (Phase 7) Combining RegExp patterns in `src/services/gemini.ts`.
- (Phase 7) Converting array checks to Set lookups in `src/lib/recommendation.ts:695`.
- (Phase 7) Optimizing `benefits.find` inside reduce in `src/components/LoungeTrackerModal.tsx`.
- (Phase 7) Combining filters in `src/App.tsx:274`.
- (Phase 7) Removing unused destructuring of `isDirtyRef` in `src/App.tsx`.
- (Phase 7) Removing unused parameter `entry` in `src/components/DashboardModal.tsx`.
- (Phase 7) Removing unused variable `activeAmountRaw` in `src/App.tsx`.
- (Phase 7) Removing unused constant `DINING_PLATFORMS` in `src/lib/recommendation.ts`.
- (Phase 7) Removing unused React import in `src/components/BillReminders.tsx`.
- (Phase 7) Removing unused destructuring of `setNeedRefresh` in `src/App.tsx`.
- (Phase 7) Removing unused React import in `src/components/BillDateSelector.tsx`.
- (Phase 7) Prefixing/removing unused parameter `req` in `server.ts`.
- (Phase 7) Precomputing intersections using Sets in `src/lib/recommendation.ts:834`.
- (Phase 7) Hoisting evaluateCard computations in `src/lib/recommendation.ts:864`.
- (Phase 6) Removal of dead environment variables (`OPENROUTER_MODEL`, `APP_URL`, `URL`) from `.env.example` and `.env`.
- (Phase 6) Deletion of orphan root file `metadata.json`.
- (Phase 6) Uninstalling unused `workbox-build` devDependency.
- (Phase 6) Extraction of duplicate `mockRates` maps into a module-scoped `FALLBACK_EXCHANGE_RATES` constant in `App.tsx`.
- (Phase 6) Debouncing `localStorage` writes in `useWalletState.ts` with a 500ms trailing debounce.
- (Phase 6) Memoizing `chartData` and optimizing the aggregation logic to O(N) using a `Map` in `DashboardModal.tsx`.
- (Phase 6) Statically importing `httpsCallable` and `functions` at the top of `gemini.ts`.
- (Phase 6) Capping Firestore client error logging at 5 errors per session in `ErrorBoundary.tsx`.
- (Phase 6) Removing `woff2` from PWA `globPatterns` in `vite.config.ts`.
- (Phase 5) Robust offline queue logic replacing naive single-log queue in `useAuthAndSync.ts`.
- (Phase 5) Server-side fallback API key in `functions/src/index.ts` to gracefully handle missing BYOK setup.
- (Phase 5) Adding `isAnimationActive={false}` to `DashboardModal.tsx` to halt idle Recharts animations.
- (Phase 4) Addition of `X-Permitted-Cross-Domain-Policies` to the local Express server.
- (Phase 4) Implementation of an asynchronous `evictStaleCache` routine in `gemini.ts` to prune old IDB entries on idle.
- (Phase 4) Deferring the massive string/regex calculation in `App.tsx` using a 100ms `setTimeout` to push it off the critical rendering path.
- (Phase 4) Removal of `/api/categorize` endpoint, rate-limit cache, and `zod` schema from `server.ts`.
- (Phase 4) Uninstall `zod` from `package.json`.
- (Phase 4) Migration of `handleTestConnection` in `App.tsx` to Firebase `httpsCallable`.
- Deletion of functions/ directory.
- Cleanup of unused getFunctions in src/firebase.ts.

## Approved and Implemented

- (2026-10-25 sweep, Phase 3 release) Pushed implementation commits 26c15e0 and 3410da3 to origin/main. Railway deployed code revision 3410da354b5a539816b5665c41c71de782b2c68e successfully: primary deployment 31677918-0772-43e8-b8ec-abb00bd70ece (secondary source deployment df8498d1-dbc6-4114-8573-4a0bd4e2230c also completed). Verified primary health/discovery HTTP 200, exact frontend bundle SHA-256 match to the tested build, MCP initialize/tools-list HTTP 200 with all four tools, invalid-token HTTP 401 with challenge, and session DELETE HTTP 200. 51 tests and all compilation/build checks passed. No real-account writes, one-hour production soak or new penetration test were performed; controlled tests establish the optimization results. Pre-existing local dist/index.html and dist/sw.js edits were excluded from commits.

- (2026-10-25 sweep, Phase 2) Added configurable MCP_SESSION_IDLE_TIMEOUT_MINUTES (default 60), one shared unref cleanup timer, request/stream activity protection, protocol/server/pairing-code cleanup, and HTTP/process shutdown disposal. Preserved SDK close-handler chaining and existing OAuth/account isolation. Validation: 51 tests passed (7 new session tests plus 13 Phase 1 regressions); controlled 1,000-session idle-expiry probe reclaimed 77,771,960 of 79,959,448 bytes (97.3%); expired sessions return 404 and fresh initialization works. Timing used a controlled clock, not a production one-hour soak.

- (2026-10-25 sweep, Phase 1) Implemented local-edit tracking for wallet, theme and BYOK settings; cloud hydration no longer schedules echo saves. Guarded delayed hydration, visibility refreshes and save acknowledgements against newer edits/account changes; merged offline logs remain pending for upload. Validation: 44 tests passed (13 new sync regressions); zero writes over 60 simulated idle seconds, including repeated snapshots, plus manual sync, offline/reconnect, paused sync, in-flight edits and deletion coverage. Root TypeScript and production frontend/PWA build passed. Firebase Functions, schemas and recommendation logic unchanged.

- (Phase 9) Preconnected Google Fonts and preloaded stylesheet in `index.html` while removing render-blocking `@import` from `src/index.css` to eliminate the network waterfall and accelerate FCP.
- (Phase 9) Added static `<link rel="manifest">` in `index.html` to guarantee automated PWA install prompt triggers across modern mobile viewports.
- (Phase 8) None.
- (Phase 7) None.
- (Phase 6) Removed dead environment variables from `.env.example` and `.env`.
- (Phase 6) Deleted the orphan root file `metadata.json`.
- (Phase 6) Uninstalled unused `workbox-build` devDependency.
- (Phase 6) Extracted duplicate `mockRates` maps into a module-scoped `FALLBACK_EXCHANGE_RATES` constant in `App.tsx`.
- (Phase 6) Debounced `localStorage` writes in `useWalletState.ts` with a 500ms trailing debounce.
- (Phase 6) Memoized `chartData` and optimized the aggregation logic to O(N) using a `Map` in `DashboardModal.tsx`.
- (Phase 6) Statically imported `httpsCallable` and `functions` at the top of `gemini.ts`.
- (Phase 6) Capped Firestore client error logging at 5 errors per session in `ErrorBoundary.tsx`.
- (Phase 6) Removed `woff2` from PWA `globPatterns` in `vite.config.ts`.
- (Phase 5) Implemented robust offline array queuing in `useAuthAndSync.ts` preventing offline data loss.
- (Phase 5) Added `isAnimationActive={false}` to `DashboardModal.tsx` to eliminate mobile memory bloat.
- (Phase 4) Added `X-Permitted-Cross-Domain-Policies: none` to `server.ts` to harden cross-domain security posture.
- (Phase 4) Implemented `evictStaleCache` inside `gemini.ts` leveraging `idb-keyval` keys and timestamps.
- (Phase 4) Deferred the heavy synchronous `useEffect` calculation in `App.tsx` reducing the First Contentful Paint block.
- (Phase 4) Removed the dead `/api/categorize` endpoint, `rateLimiter`, and `MerchantInfoSchema` from `server.ts`.
- (Phase 4) Uninstalled `zod` from `package.json`.
- (Phase 4) Migrated `handleTestConnection` in `App.tsx` to use Firebase Functions instead of local fetch.
- Phase 1: Migrated gemini.ts to use Firebase Functions (httpsCallable(functions, 'categorize')) instead of local Express fetch API. (User pivoted from deletion).

## Denied or Not Implemented

- (2026-10-25 sweep, final implementation status) User explicitly approved all phases, pushing code and deployment, superseding the earlier per-phase approval wait. Both scoped optimizations are implemented and locally validated; no scoped optimization was rejected. The earlier pending Phase 2 note below records its prior status. Production deployment verification will be recorded after release.

- (2026-10-25 sweep) No approved optimization rejected. Extra compression was excluded after live Brotli delivery was verified; micro-optimizations and cosmetic deletions failed the impact threshold. Historical decisions below remain in force. Phase 2 implementation/release validation is pending.

- (Phase 8) Combining RegExp patterns in `src/services/gemini.ts` (Rejected: Previously rejected in Phase 7; reduces code readability and maintainability).
- (Phase 8) Replacing `DEFAULT_EXCLUSIONS.find` with Set in `src/lib/recommendation.ts:699` (Rejected: Already hoisted out of card loop; Set lookups break substring matching).
- (Phase 8) Removing 'unsafe-inline' from CSP in `server.ts:28` (Rejected: High operational risk of breaking Vite inline scripts and dynamic component styles without measurable performance gain).
- (Phase 8) Refactoring `error: any` to `error: unknown` in `src/App.tsx:455` (Rejected: Violates 'No Any Stripping' constraint; cleanliness-only).
- (Phase 8) Refactoring `error: any` to `error: unknown` in `src/App.tsx:200` (Rejected: Violates 'No Any Stripping' constraint; cleanliness-only).
- (Phase 8) Indexing `card.benefits` in `src/lib/recommendation.ts:459` (Rejected: Micro-optimization on 2-5 element static arrays; indexing adds memory overhead).
- (Phase 7) Removal of unused React import from `src/components/ErrorBoundary.tsx` (Rejected: low merit, aesthetic-only).
- (Phase 7) Avoiding double map lookup in `src/components/DashboardModal.tsx` (Rejected: micro-optimization, negligible benefit).
- (Phase 7) Optimizing `localStorage` reads in `src/hooks/usePushNotifications.ts` (Rejected: false positive, already outside loop).
- (Phase 7) Combining RegExp patterns in `src/services/gemini.ts` (Rejected: would reduce code readability and maintainability).
- (Phase 7) Converting array checks to Set lookups in `src/lib/recommendation.ts:695` (Rejected: Set has fails substring checking).
- (Phase 7) Optimizing `benefits.find` inside reduce in `src/components/LoungeTrackerModal.tsx` (Rejected: already memoized via useMemo, tiny static dataset).
- (Phase 7) Combining filters in `src/App.tsx:274` (Rejected: false positive, ternary evaluations evaluate only one filter).
- (Phase 7) Removing unused destructuring of `isDirtyRef` in `src/App.tsx` (Rejected: cleanliness-only).
- (Phase 7) Removing unused parameter `entry` in `src/components/DashboardModal.tsx` (Rejected: cleanliness-only).
- (Phase 7) Removing unused variable `activeAmountRaw` in `src/App.tsx` (Rejected: cleanliness-only).
- (Phase 7) Removing unused constant `DINING_PLATFORMS` in `src/lib/recommendation.ts` (Rejected: cleanliness-only).
- (Phase 7) Removing unused React import in `src/components/BillReminders.tsx` (Rejected: cleanliness-only).
- (Phase 7) Removing unused destructuring of `setNeedRefresh` in `src/App.tsx` (Rejected: cleanliness-only).
- (Phase 7) Removing unused React import in `src/components/BillDateSelector.tsx` (Rejected: cleanliness-only).
- (Phase 7) Prefixing/removing unused parameter `req` in `server.ts` (Rejected: cleanliness-only).
- (Phase 7) Precomputing intersections using Sets in `src/lib/recommendation.ts:834` (Rejected: Set intersection breaks substring matching).
- (Phase 7) Hoisting evaluateCard computations in `src/lib/recommendation.ts:864` (Rejected: false positive, duplicate computations already hoisted to ctx).
- (Phase 6) None.
- (Phase 5) Graceful server-side fallback API key rejected to strictly enforce BYOK policy.
- (Phase 4) None.
- Phase 1: Deletion of functions/ directory rejected.
- Phase 1: Cleanup of src/firebase.ts rejected.

## Discovered Optimizations (Phase 2)

- localStorage quota loops freeze the main thread for UI.
- Concurrent searches block input and lock up the UI.

## Previously Suggested (Phase 2)

- Migration to IndexedDB for merchant caching.
- AbortController network cancellation.

## Approved and Implemented (Phase 2)

- Migrated gemini.ts caching to idb-keyval to eliminate UI stutter.
- Added AbortController to handleSearch in App.tsx to free up pending UX states and bandwidth.

## Discovered Optimizations (Phase 3)

- Unauthenticated crash telemetry was missing, violating visibility goals but securing the database.

## Previously Suggested (Phase 3)

- Analytics Integration in Error Boundary.

## Approved and Implemented (Phase 3)

- Imported Firebase Analytics and added logEvent('exception') inside ErrorBoundary to securely monitor all client crashes.
