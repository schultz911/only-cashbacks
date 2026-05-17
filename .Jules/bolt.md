## 2024-05-16 - Array Find Hoisting
**Learning:** In highly iterated loops like the recommendation engine's `CARD_DATA.map`, performing an `Array.find` or `Array.some` using variables that remain constant throughout the map execution (like user inputs or merchant details) adds unnecessary performance overhead.
**Action:** Always hoist invariant search operations out of loops to pre-calculate the result once.

## 2024-05-24 - Array Map Recomputation Bottleneck
**Learning:** Running .includes() string methods and Regex.test() evaluations on identical constants inside an array.map() loop causes severe performance overhead due to redundant checks for every card evaluated.
**Action:** Hoist pure values, string checks, static calculations, and object property initializations out of inner map() loops so they are evaluated exactly once.
