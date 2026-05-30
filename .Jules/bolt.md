## 2025-02-18 - Optimize Card Object Lookups

**Learning:** `Array.prototype.find()` operations inside loops over potentially large arrays can cause performance bottlenecks. In the `usePushNotifications` hook, `CARD_DATA.find()` was executed in a loop for each wallet card, creating an O(N) lookup.

**Action:** Created a precomputed `CARD_DICT` map (an Object mapping card ID to the card object) in `src/data/cards.ts` to enable O(1) lookups. This significantly improved performance for iterative lookups and avoids redundant list traversal.
