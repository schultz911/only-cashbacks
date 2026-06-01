## 2025-02-18 - Optimize Card Object Lookups

**Learning:** `Array.prototype.find()` operations inside loops over potentially large arrays can cause performance bottlenecks. In the `usePushNotifications` hook, `CARD_DATA.find()` was executed in a loop for each wallet card, creating an O(N) lookup.

**Action:** Created a precomputed `CARD_DICT` map (an Object mapping card ID to the card object) in `src/data/cards.ts` to enable O(1) lookups. This significantly improved performance for iterative lookups and avoids redundant list traversal.
## 2024-11-20 - Memoizing Expensive Replacements in Render Loops
**Learning:** During React renders, executing multiple string replacements (`.replace()`) and regular expressions within `Array.map()` operations can be surprisingly expensive and cause unnecessary GC pressure and CPU overhead, especially when the underlying data source is mostly static (e.g., parsing constant card benefit objects).
**Action:** Implement module-level Maps (e.g., `BENEFIT_CACHE`) to memoize the results of these string manipulations based on the input values, effectively converting O(N) regex operations per render into O(1) dictionary lookups. Additionally, use `.includes()` checks to guard string replacement operations to avoid unnecessary string allocations when no match is found.
