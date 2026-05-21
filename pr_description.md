💡 **What:**
Created a precomputed `CARD_DICT` map using `CARD_DATA.reduce` in `src/data/cards.ts`. Replaced `CARD_DATA.find()` calls inside `walletCards` loops with O(1) dictionary lookups in `App.tsx`, `BillReminders.tsx`, and `recommendation.ts`.

🎯 **Why:**
The previous implementation used `Array.prototype.find()` inside loops, resulting in an O(M*N) time complexity where M is the number of wallet cards and N is the total number of cards. This becomes a noticeable performance bottleneck as the size of `CARD_DATA` scales up. An object mapping allows instant O(1) lookups.

📊 **Measured Improvement:**
Using Node's `perf_hooks` for a benchmark that executes 100,000 iterations finding the last 12 items of the array:
* Baseline (Array.find O(N)): 70.05ms
* Optimized (Object Map O(1)): 38.78ms
* Improvement: 44.64% reduction in execution time.
