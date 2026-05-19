## 2024-05-18 - String and array lookups on constants in hot loops
**Learning:** Performing repeated string `.includes()` and array searches on loop-invariant variables (`nameL`, `catL`, `platL`) inside nested loops significantly impacts performance.
**Action:** Always hoist computations that rely exclusively on constants or loop-invariant variables outside of iterations.
