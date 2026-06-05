## 2026-06-04 - Precompute lowercased strings on static objects
**Learning:** Calling `.toLowerCase()` or string concatenation repeatedly inside hot loops causes excessive garbage collection and unnecessary overhead. This is especially true in evaluation functions applied iteratively (e.g., scoring algorithms).
**Action:** Precompute these values directly on the static objects during module initialization (e.g., in a  loop directly after the array is defined) to eliminate runtime overhead. Ensure to update TypeScript interfaces accordingly.
## 2024-05-18 - Precompute lowercased strings on static objects
**Learning:** Calling `.toLowerCase()` or string concatenation repeatedly inside hot loops causes excessive garbage collection and unnecessary overhead. This is especially true in evaluation functions applied iteratively (e.g., scoring algorithms).
**Action:** Precompute these values directly on the static objects during module initialization (e.g., in a `.forEach()` loop directly after the array is defined) to eliminate runtime overhead. Ensure to update TypeScript interfaces accordingly.

## 2024-05-18 - Optimize array lookups in offer filtering
**Learning:** Nested array `.find()` lookups inside `.filter()` operations can lead to O(N*M) time complexity, which scales poorly when calculating complex list relationships (e.g., checking if an offer's card ID is excluded among all evaluated cards).
**Action:** Always pre-calculate lookups by storing the relevant keys in a `Set` or `Map` before iterating, allowing O(1) existence checks (`.has()`) inside the filter loop.
## 2025-02-28 - LocalStorage Cache Eviction Loop Bug and Inefficiency
**Learning:** When evicting specific items from `localStorage` within a loop, using `localStorage.length` and `localStorage.key(i)` while calling `localStorage.removeItem(key)` dynamically mutates the collection. This leads to skipped items (leaving half of the old data intact) and is inefficient because it shifts internal pointers on every deletion.
**Action:** Gather keys statically first using `Object.keys(localStorage)` and iterate over that array to safely and predictably remove items. Vitest benchmarking confirmed this approach is fully correct (doesn't skip) and executes 1.18x faster than the buggy original implementation.
## 2025-03-09 - O(1) Cache Sweep using Map Insertion Order
**Learning:** JavaScript `Map` objects strictly maintain their insertion order. When using a `Map` for rate limiting or caching with expiration, you can keep the map perfectly ordered by expiration time if you `delete` and `set` (re-insert) the entry whenever its expiration is updated.
**Action:** The cleanup loop (`setInterval`) can then simply iterate from the beginning and `break` as soon as it encounters the first unexpired entry, changing the cleanup complexity from O(N) to an amortized O(1).

## 2026-06-05 - [Optimize array filtering and mapping using reduce]
**Learning:** For performance-critical array transformations involving both filtering and element extraction, a single-pass `.reduce()` is significantly faster than chained `.filter().map()` operations, as it avoids redundant array traversals and nested lookups.
**Action:** Replaced chained `.filter().some()` and `.map().find()` operations in LoungeTrackerModal with a single `.reduce()`.
