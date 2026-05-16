## 2024-05-18 - Fix Safari Render Glitches
**Learning:**
Safari requires `backface-visibility: hidden` and `transform: translateZ(0)` to prevent flickering and rendering artifacts when using `overflow: hidden` on animated elements with rounded corners. In addition, using an absolute inner `div` to paint a background gradient under an `overflow: hidden` parent can exacerbate rendering issues and using a CSS `maskImage` might break bounds during animation.

**Action:**
- Applied `WebkitBackfaceVisibility`, `backfaceVisibility: 'hidden'`, and `transform: 'translateZ(0)'` directly to animated `.motion-div` container elements (`CardItem.tsx` and details modal in `App.tsx`).
- Moved background gradient logic and utility classes directly to the parent containers instead of using inner absolute `div` layers.
- Avoided using `maskImage: linear-gradient(...)` in favor of standard `text-ellipsis` utility class.
