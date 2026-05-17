## 2024-05-16 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Found several icon-only buttons (`X` close buttons, user profile toggle, alert circle) in the main interface lacking accessibility labels, meaning screen readers would just announce "button" with no context.
**Action:** Always verify icon-only buttons (`<button><Icon /></button>`) have `aria-label` or `title` attributes so screen reader users understand the button's action.

## 2026-05-17 - Keyboard Accessibility for Custom Toggle Components
**Learning:** Custom interactive components functioning as toggles (e.g., clickable `div` or `motion.div` cards) require specific semantic and keyboard event handling. Without `role="checkbox"`, `aria-checked`, `tabIndex={0}`, and an `onKeyDown` handler for 'Enter' and 'Space', keyboard and screen reader users cannot interact with or understand the component's state.
**Action:** When creating custom components that act as selections or toggles, always implement standard checkbox/button semantics (`role`, `aria-checked`, `tabIndex`, `onKeyDown`) and visible focus indicators (`focus-visible`).
