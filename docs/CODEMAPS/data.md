<!-- Generated: 2026-11-08 | Files scanned: 83 | Token estimate: ~600 -->

# Data Models & Storage Architecture

## Storage Layers

```
+-------------------------------------------------------------------------------+
| Client Browser                                                                |
|  - localStorage[`wallet:${uid}`]       → Local wallet state & cycle markers   |
|  - localStorage[`settings:${uid}`]     → Theme & BYOK OpenRouter API key      |
|  - localStorage[`offline_queue:${uid}`]→ Buffered writes during disconnect    |
|  - IndexedDB (idb-keyval)              → Merchant classifications (30-day TTL)|
+---------------------------------------+---------------------------------------+
                                        | Sync (debounced 500ms)
+---------------------------------------v---------------------------------------+
| Cloud Data Store (Google Cloud Firestore)                                     |
|  - users/{uid}                         → User document                        |
|  - clientErrors/{errorId}              → Client exception telemetry           |
+-------------------------------------------------------------------------------+
```

## Schema Definitions

### Firestore: `users/{uid}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `walletCards` | `string[]` | Selected card IDs (e.g. `["sbi-cashback", "hdfc-swiggy"]`). Empty `[]` is sentinel for all cards. |
| `exhaustedCards` | `Record<string, string>` | Map of `cardId` to billing cycle key (e.g. `"2026-11"`) where reward cap is exhausted. |
| `cardBillDates` | `Record<string, number>` | Map of `${cardId}:statement` to statement calendar day (`1` to `31`). |
| `paidBills` | `Record<string, string>` | Map of `cardId` to billing cycle key marked as paid. |
| `loungePassesUsed` | `Record<string, number>` | Map of `${cardId}-${type}` to number of passes consumed this quarter. |
| `loungeMilestonesVerified` | `Record<string, boolean>` | Verification flag for spend-based lounge access. |
| `offerUsage` | `Record<string, number>` | Usage counters for capped platform offers. |
| `cashbackLogs` | `CashbackLog[]` | Array of confirmed transactions with realized net reward values. |
| `openRouterApiKey` | `string` | User's personal OpenRouter API key (BYOK). |
| `kiwiNeonEarnRate` | `number` | Active tier rate for Kiwi Neon card. |
| `theme` | `'light' \| 'dark' \| 'oled'` | User interface theme preference. |

### Core Domain Entity: `Card` (`src/types.ts`)

```typescript
export interface Card {
  id: string;               // e.g., 'sbi-cashback', 'hdfc-swiggy'
  name: string;             // Display name
  bank: string;             // Issuing bank code (SBI, HDFC, ICICI, etc.)
  type: 'Credit' | 'Debit' | 'Prepaid';
  network: 'Visa' | 'Mastercard' | 'RuPay' | 'Amex' | 'Other';
  baseRewardRate: number;   // Default percentage return (e.g. 1.0 or 1.5)
  forexMarkup: number;      // Base forex surcharge percentage (e.g. 3.5 or 0.0)
  benefits: CardBenefit[];  // Category rates, merchant rules, caps, exclusions
  hasLounge?: boolean;      // Airport lounge access benefit flag
  isZeroForex?: boolean;    // Zero forex markup flag
}
```

### IndexedDB Cache: `oc_merchant_*`

Keyed as `oc_merchant_${normalizedQuery}`:
```typescript
interface CachedMerchant {
  data: MerchantInfo;       // { name, category, isOnline, platform, isP2P }
  timestamp: number;        // Epoch millis for 30-day TTL eviction
}
```
Eviction runs during `requestIdleCallback` to prevent garbage build-up.

