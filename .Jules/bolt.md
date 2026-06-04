## 2026-06-04 - Precompute lowercased strings on static objects
**Learning:** Calling `.toLowerCase()` or string concatenation repeatedly inside hot loops causes excessive garbage collection and unnecessary overhead. This is especially true in evaluation functions applied iteratively (e.g., scoring algorithms).
**Action:** Precompute these values directly on the static objects during module initialization (e.g., in a  loop directly after the array is defined) to eliminate runtime overhead. Ensure to update TypeScript interfaces accordingly.
## 2024-05-18 - Precompute lowercased strings on static objects
**Learning:** Calling `.toLowerCase()` or string concatenation repeatedly inside hot loops causes excessive garbage collection and unnecessary overhead. This is especially true in evaluation functions applied iteratively (e.g., scoring algorithms).
**Action:** Precompute these values directly on the static objects during module initialization (e.g., in a `.forEach()` loop directly after the array is defined) to eliminate runtime overhead. Ensure to update TypeScript interfaces accordingly.
