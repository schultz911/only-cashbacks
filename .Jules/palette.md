## 2024-05-16 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Found several icon-only buttons (`X` close buttons, user profile toggle, alert circle) in the main interface lacking accessibility labels, meaning screen readers would just announce "button" with no context.
**Action:** Always verify icon-only buttons (`<button><Icon /></button>`) have `aria-label` or `title` attributes so screen reader users understand the button's action.

## 2024-05-17 - Add ARIA Labels to Search Inputs
**Learning:** Discovered that search and amount input fields lacked screen reader labels, and the clear search icon-only button lacked an aria-label and focus-visible styling.
**Action:** Added aria-label attributes to input fields without visual labels, and added aria-label, title, and focus ring to the icon-only clear button to improve screen reader and keyboard accessibility.
