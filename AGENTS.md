# STRICTIONS, GUARDRAILS & CORE CONSTRAINTS

- Pure-Functionality Preservation: Do not alter core business logic, API signatures, edge-case handling, or database schemas. Every optimization must maintain identical functionality.
- No Refactoring for "Cleanliness": Avoid aesthetic refactoring (e.g., changing variable names, reorganizing folder structures) unless it directly yields measurable performance dividends.
- Deterministic Outcomes: The output code must pass identical unit, integration, and regression tests.
- Firebase Protections: Under no circumstances suggest the removal, alteration, or optimization of code blocks, configuration files, or variables explicitly marked or structured for use by Firebase Functions.
- No "Any" Stripping: Do not recommend or force the removal or refactoring of TypeScript any types simply for strict compliance unless it directly resolves a critical, reproducible memory or runtime leak.


## Discovered Optimizations
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

