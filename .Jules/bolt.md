## 2024-05-16 - Array Find Hoisting
**Learning:** In highly iterated loops like the recommendation engine's `CARD_DATA.map`, performing an `Array.find` or `Array.some` using variables that remain constant throughout the map execution (like user inputs or merchant details) adds unnecessary performance overhead.
**Action:** Always hoist invariant search operations out of loops to pre-calculate the result once.
