## 2024-05-16 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Found several icon-only buttons (`X` close buttons, user profile toggle, alert circle) in the main interface lacking accessibility labels, meaning screen readers would just announce "button" with no context.
**Action:** Always verify icon-only buttons (`<button><Icon /></button>`) have `aria-label` or `title` attributes so screen reader users understand the button's action.
