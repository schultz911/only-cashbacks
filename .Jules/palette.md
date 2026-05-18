## 2024-05-16 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Found several icon-only buttons (`X` close buttons, user profile toggle, alert circle) in the main interface lacking accessibility labels, meaning screen readers would just announce "button" with no context.
**Action:** Always verify icon-only buttons (`<button><Icon /></button>`) have `aria-label` or `title` attributes so screen reader users understand the button's action.
## 2024-05-18 - Add ARIA Labels to Number Picker Icons
**Learning:** Found icon-only buttons (`ChevronLeft` and `ChevronRight` for date selection) in `BillDateSelector.tsx` lacking accessibility labels, meaning screen readers would just announce "button" without context for what the button decreases or increases. Added `focus-visible` styling to ensure clear keyboard navigation visibility.
**Action:** Always verify icon-only buttons acting as controls (`<button><ChevronLeft /></button>`) have `aria-label` or `title` attributes so screen reader users understand the button's action. Also ensure `focus-visible` states are defined.
