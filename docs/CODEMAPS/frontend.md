<!-- Generated: 2026-11-08 | Files scanned: 83 | Token estimate: ~700 -->

# Frontend Architecture

## Component Hierarchy & Context Tree

```
src/main.tsx
└── ErrorBoundary (catches crashes, logs to Firestore & Analytics)
    └── AuthSyncProvider (useAuthAndSync: Firebase Auth, account-partitioned persistence, sync queue)
        └── SearchProvider (useSearchState: merchant query, amount, currency, mode toggles)
            └── WalletProvider (useWalletState: card selection, exhaustion, bill dates, lounge passes)
                └── App.tsx
                    ├── Header.tsx (branding, auth status, manual sync CTA, theme switch)
                    ├── SearchSection.tsx (merchant input, amount, online/intl/scan toggles)
                    ├── CardItem.tsx (recommendation banner, net value display, log button)
                    ├── My Cards Carousel (CardItem cards from active wallet)
                    ├── BillReminders.tsx (statement countdowns, due dates, mark as paid)
                    ├── Modals (Code-Split / Lazy Loaded):
                    │   ├── WalletManagerModal.tsx (card selection checklist, bank/network filter)
                    │   ├── DashboardModal.tsx (savings history, totals, reset/undo)
                    │   │   └── SavingsChart.tsx (Recharts donut chart with failure boundary)
                    │   ├── LoungeTrackerModal.tsx (domestic/intl passes, milestone verification)
                    │   └── ApiKeyModal (BYOK OpenRouter key configuration)
```

## State Management Flow

```
User Action (e.g. toggle card in WalletManagerModal)
   │
   ▼
useWalletState / useWalletContext (updates React state immediately)
   │
   ├─► debounced (500ms) write to localStorage[`wallet:${user.uid}`]
   │
   └─► pendingEditsRef marks state as dirty
         │
         ▼
       useAuthAndSync sync loop (automatic cloud sync to Firestore `users/${uid}`)
         ├─ Transient Failure: Exponential backoff (2s, 4s, 8s, 16s, 32s, 60s)
         └─ Permanent Failure (400/403): Stops retrying, retains dirty edits for manual retry
```

## Key Files & Responsibilities

- **`src/App.tsx`**: Central screen orchestrating inputs, recommendation triggers, and modal displays.
- **`src/lib/recommendation.ts`**: Pure calculation engine evaluating cards, exclusions, caps, and foreign markup.
- **`src/lib/billingDates.ts`**: IST timezone-aware statement and due date calculations (`statementReminder`, `indiaDate`).
- **`src/services/gemini.ts`**: Hybrid merchant categorization (Regex heuristics + `idb-keyval` cache + Cloud Function fallback).
- **`src/hooks/usePushNotifications.ts`**: Local notification scheduling for upcoming statement dates with daily key pruning.
- **`src/hooks/useDialogFocus.ts`**: Accessible modal focus trapping, Tab cycling, and Escape key handling.

## PWA & Service Worker

- Configured via `VitePWA` in `vite.config.ts`.
- Auto-updates service worker, precaches application bundle, and routes navigation requests through `index.html`.
- Protected endpoints (`/oauth`, `/mcp`, `/api`, `/health`) are explicitly excluded from navigation fallback.

