**The Master Implementation Plan — OnlyCashbacks**

Audit date: November 5, 2026. Scope: the supplied local repository snapshot.

**Verdict: three new findings qualify.** Account data isolation should block release. Save-failure retries and premature chart loading offer measurable resource improvements. No repository deletion or dependency removal met the impact threshold. This is not yet a “We have reached a great MVP” result.

The application source remains unchanged. All implementation experiments ran in an isolated temporary copy. Only this report and its evidence files were added to the repository. No real account was accessed, no cloud data changed, and nothing was deployed.

**Audit coverage and historical checks**

The inventory contained 157 non-generated files before adding this report, including 49 application source files totaling 9,884 lines. The sweep covered the React components, contexts and hooks; merchant classification and recommendation paths; browser storage; MCP HTTP/SSE, OAuth and pairing; Firebase Functions source and rules; all three dependency manifests/lockfiles; assets; Docker/Railway/Vite/PWA configuration; plugin packaging and submission material.

Recommendations were checked against `AGENTS.md`, `.agents/rules/GEMINI.md`, `.Jules/bolt.md`, `.Jules/sentinel.md`, the Eternal integration audit, plugin readiness documentation, and accessible earlier chats including “Improve Card App Prompt” and “Cards and Partner Offers.” The supplied decision log is the detailed record of previous optimization approvals/rejections; accessible chat history is not a guarantee of every historical conversation.

The existing hydration-revision guards, persistence debounce, session expiry, cache eviction, precomputed recommendation values, chart aggregation and disabled chart animation are present. They are not new recommendations. Previously rejected regex combinations, substring-to-Set replacements, CSP changes, `any` cleanup, Firebase removal and server-owned BYOK fallback remain excluded. Earlier card/UI requests are not being repackaged as new work.

**Phase-wise execution roadmap**

| Phase | Work | Practical outcome and exit gate |
| --- | --- | --- |
| 0 — Preserve the baseline | Use the recorded source hashes and existing tests; implement each finding in its own reviewable change. | Baseline: 226 tests across 16 files pass; root and MCP TypeScript checks pass; frontend/PWA and standalone server compilation pass. |
| 1 — Isolate account data | Separate cached wallet/settings and offline queues by verified account identity; initialize the next account independently. | Neither reproduced cross-account transfer can occur. Existing offline edits survive under their original owner. Approval required for account-switch and local migration behavior. |
| 2 — Bound failed saves | Classify permanent/transient failures; stop automatic repetition for permanent failures and back off transient failures. | Permanent-failure probe: one attempt instead of 11 in 12 seconds, a 90.9% reduction target. Dirty edits and explicit retry remain available. Approval required for retry behavior. |
| 3 — Defer the savings chart | Keep the existing dashboard shell, totals and controls; load its Recharts view only when displayed. | Tested isolated prototype: initial JS falls from 416,177 to 345,612 gzip-equivalent bytes, a 16.96% reduction; the same 226 tests pass. |
| 4 — Verify and release | Run the unchanged regression suite plus focused ownership/retry/loading tests; stage and smoke-test the exact deployment artifact. | Validate real sign-in, switching accounts, offline recovery, save acknowledgements, statement reminders, dashboard opening/undo and MCP isolation. Release only after implementation approval and successful checks. |

No new library, paid service, subscription or external integration is needed. Firebase Functions, Firebase initialization, callable/tool signatures, cloud record shapes, reward rules and the existing empty-array wallet selection meaning are outside these changes.

**Phase 1 finding: another account can inherit a wallet, API key and queued savings**

Sources: [authentication and hydration](/Users/kiransaldanha/Documents/only-cashbacks/src/hooks/useAuthAndSync.ts:76), [global offline queue merge](/Users/kiransaldanha/Documents/only-cashbacks/src/hooks/useAuthAndSync.ts:120), [missing-document handling](/Users/kiransaldanha/Documents/only-cashbacks/src/hooks/useAuthAndSync.ts:196), [browser wallet persistence](/Users/kiransaldanha/Documents/only-cashbacks/src/hooks/useWalletState.ts:24), [BYOK persistence](/Users/kiransaldanha/Documents/only-cashbacks/src/hooks/useSearchAndCurrency.ts:21).

The account epoch guards prevent stale asynchronous completions. They do not establish ownership of the currently displayed state or the globally named browser caches. A missing second-account document leaves the previous state in place; a subsequent edit saves that state under the second UID. The offline queue also has no account identifier and is merged into whichever account hydrates next.

Two deterministic tests reproduced separate paths:

- Account A supplied one synthetic API key and one savings record. Switching to a new account B with no document, then changing the theme, wrote A’s key and record into B’s mocked document.
- An existing account B with its own wallet received A’s queued savings record during hydration and autosave.

This affects accounts used in the same browser profile or a browser profile carrying the shared queue. It is not evidence of arbitrary remote access to other users’ Firestore documents. Nevertheless, copying a BYOK secret and private records across account identities is a release-blocking confidentiality and integrity defect.

Implementation should clear the outgoing account’s visible state before exposing the next account, preserve pending edits in owner-specific storage, use independent defaults for absent fields/documents, and merge only the current owner’s queue. Keep guest data separate. Existing unowned legacy caches must remain recoverable until ownership is confirmed; do not silently attribute them to the next login or delete them. Preserve the current cloud schema and wallet sentinel.

Acceptance tests must include A→B, A→logout→B, missing B documents, partial B documents, queued A writes, in-flight A saves, interrupted hydration, reload, deletion and returning to A. This is distinct from the previously implemented asynchronous account-epoch protections.

**Phase 2 finding: a failed save starts another save indefinitely**

Sources: [autosave scheduling](/Users/kiransaldanha/Documents/only-cashbacks/src/App.tsx:265), [save failure and completion](/Users/kiransaldanha/Documents/only-cashbacks/src/hooks/useAuthAndSync.ts:268).

The dirty state remains true after failure. When an asynchronous request finishes, `isSyncing` returns to false and the autosave effect schedules another request after one second. A controlled persistent permission error with 100 ms simulated response latency produced **11 attempts in 12 simulated seconds**, with no additional user edits.

This is a failure-recovery loop, distinct from the fixed cloud-hydration echo loop. It wastes requests, serializations and logging during persistent failures. The `unavailable` branch can additionally append the entire savings history to the offline queue on each failure; this audit did not benchmark that storage amplification.

Preserve dirty revisions and local data. For permanent errors, stop automatic retries until an explicit retry or relevant recovery event. For transient errors, use one bounded retry scheduler with backoff; reset it safely on account changes and recovery. Keep manual synchronization available. The permanent-error acceptance target is one attempt in the same 12-second probe: **90.9% fewer application-level save attempts**. This is a target, not a measured implemented fix or a claim about Firestore billing.

**Phase 3 finding: the chart downloads before anyone opens savings**

Sources: [unconditional dashboard mounting](/Users/kiransaldanha/Documents/only-cashbacks/src/App.tsx:1533), [Recharts import](/Users/kiransaldanha/Documents/only-cashbacks/src/components/DashboardModal.tsx:6).

`React.lazy` already splits the modal files, but rendering a closed modal still resolves its module. The dashboard’s static Recharts import therefore requests the chart bundle during startup.

A fresh local browser context confirmed that the baseline loads eight JS files, including Recharts, before opening any modal. An isolated prototype moved only the chart view behind a display-time import. Startup then requested seven JS files; opening savings with a synthetic record loaded the chart and rendered its SVG successfully. Totals, undo controls and modal state remained in the existing dashboard.

| Metric | Baseline | Chart-only prototype | Improvement |
| --- | ---: | ---: | ---: |
| Initial JS, raw bytes | 1,495,707 | 1,249,137 | 246,570 bytes deferred |
| Initial JS, gzip-equivalent bytes | 416,177 | 345,612 | 70,565 bytes / 16.96% |
| Existing tests | 226 passing | 226 passing | Same suite preserved |

The prototype also passed TypeScript and production frontend/PWA builds. Gzip numbers were calculated from the browser-observed local chunk set using Node’s gzip implementation. They are not production wire measurements. Service workers were blocked for this comparison, external services were blocked, and both builds reported the same two expected external fetch failures. No FCP, INP, mobile CPU or heap improvement is claimed. Sessions that open the chart still fetch its code later; the gain is startup work and transfer avoided for sessions that do not use it.

An earlier prototype deferred all modals and failed one existing first-open savings assertion. It was discarded. The qualifying recommendation and figures above apply only to the narrower chart-only prototype, which passed all existing tests without editing them. If PWA precaching is restored separately, ensure its policy does not immediately download the deferred chart again.

**Separate product decision: restore offline PWA launch**

Source: [service-worker removal route](/Users/kiransaldanha/Documents/only-cashbacks/mcp-server/src/index.ts:603).

The repository’s Railway serving path deliberately returns a worker that deletes caches and unregisters itself. A six-second local browser observation saw that worker created and then **zero registered workers**. No reload loop was observed. The generated PWA cache is therefore not retained on this serving path. This is separate from the already implemented manifest and font changes.

Restoring offline launch could materially improve the mobile product, but it reverses an explicit legacy-worker workaround and changes authentication/cache behavior. Keep it outside the main optimization implementation unless separately approved. Retain OAuth/login/API navigation exclusions, prevent caching private responses, test old-worker migration and sign-in recovery, and prove offline reload on supported browsers. A service worker alone would not create closed-app reminder delivery; that remains a separate capability already documented as absent.

**Sanitization disposition and excluded work**

No high-impact orphan component, unused dependency or removable asset was established. Side-effect CSS imports and dynamically constructed card artwork paths are active; logo source metadata is provenance. The two plugin directories have documented private/public distribution roles. Firebase Functions and initialization are active protected code. Small unused imports, legacy prose and tiny files do not justify changes under the stated threshold.

The recommendation engine benchmark used four merchant scenarios, 500 warm-up calls, then seven samples of 1,000 calls. Median time was **0.0381 ms per recommendation** on this local runtime. It does not justify further small-array/regex refactoring. The dependency registry was queried for all three lockfiles, but advisory ratings without an established affected execution path were not promoted to confirmed production-critical findings. This is not a penetration-test certification.

**Evidence and limits**

[Measurement summary](/Users/kiransaldanha/Documents/only-cashbacks/docs/audit-evidence-2026-11-05/measurement-summary.json), [browser request evidence](/Users/kiransaldanha/Documents/only-cashbacks/docs/audit-evidence-2026-11-05/browser-results.json), [worker evidence](/Users/kiransaldanha/Documents/only-cashbacks/docs/audit-evidence-2026-11-05/worker-results.json), [synthetic reproductions](/Users/kiransaldanha/Documents/only-cashbacks/docs/audit-evidence-2026-11-05/isolation-and-retry-reproductions.tsx.txt), and [source hashes](/Users/kiransaldanha/Documents/only-cashbacks/docs/audit-evidence-2026-11-05/audited-source-sha256.json) are retained. Probe scripts are stored as non-executing text. Browser probes require the temporary compiled fixtures described in those scripts; they are not installed application dependencies.

The existing suite and three additional isolated reproductions passed. Root and MCP TypeScript checks, MCP temporary compilation, frontend/PWA build and standalone Express compilation passed. Firebase Functions were inspected but not rebuilt. The workspace has no Git metadata, so a commit identity and clean Git diff could not be verified. Current production deployment, real identity-provider behavior, account data, physical-device performance and a production soak were not tested.

Before implementation, the account-switch/local migration and retry-policy changes require explicit approval under Part 1 of the supplied preservation guardrail. The PWA change requires its own approval because it reverses an intentional workaround. No previously rejected optimization is proposed for reopening.
