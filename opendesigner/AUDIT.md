# Existing UI audit

This capture identifies component roles and a few source-level review items. It is not a completed accessibility audit.

| Where | Finding | Suggested follow-up | Basis |
| --- | --- | --- | --- |
| SearchSection.tsx merchant and amount fields, rendered guest desktop | Fields are 62 px high with 16 px corners, while Check is 36 px high with 12 px corners | Keep separate field and action roles in the system | Measured computed styles, 1706 × 890 |
| App.tsx Accelerated Limit Reached button | Source button lacks role=switch and aria-checked | Expose its name and current state programmatically in a separately scoped fix | WCAG 4.1.2 |
| SearchSection.tsx Recent Searches heading | text-gray-400 on a light surface may fall below normal-text contrast requirements | Measure the actual composite and adjust if required | WCAG 1.4.3, source-level candidate |
| src/index.css theme overrides | Light, dark and OLED are distinct, while the generator supports light/dark foundations | Keep an explicit OLED capture and avoid substituting the generator's default surfaces | Exact declared values |
| Global reduced-motion CSS and motion/react components | CSS reduction exists, but component animations need behavior testing | Check reduced-motion interactions before adopting motion defaults | WCAG 2.3.3 treated as required by the skill |

No application fixes are included in this documentation task. Live-account states, all dialogs, phone layouts and contrast on card artwork remain pending. No shipped-product comparison was performed.
