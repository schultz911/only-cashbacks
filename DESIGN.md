# OnlyCashbacks design system

<!-- od:keep -->

## Authority and scope

PRODUCT.md owns product truth. This document captures the existing wallet interface for Indian cardholders choosing a card before purchase. The main surface supports completing a task. Preserve reward rules, content, account isolation, offline behavior, optional BYOK and Firebase protections.

The source UI and `opendesigner/references/captured-values.json` own captured values. `opendesigner/build/css/captured-wallet.css` exposes these values as reusable CSS variables. It is opt-in. The app currently uses Tailwind utilities and CSS overrides.

OpenDesigner also generated a foundation library in `opendesigner/tokens/`, CSS and Tailwind exports, and `opendesigner/overview.html`. Unmeasured values in that library are defaults. Its generated color ramps, motion and component recipes require review before adoption. Its light/dark themes do not model the app's OLED theme. Use captured-wallet.css for that theme.

The captured visual sheet is `opendesigner/captured-ui.html`. The generated overview is a separate foundation preview.

## Identity

Keep OnlyCashbacks, its existing logo and the tagline “Make your credit cards pay.” Plus Jakarta Sans is the interface family, loaded by the existing Google Fonts stylesheet. Preserve the system fallback stack. This capture establishes no new font hosting or embedding licence.

Issuer artwork and network marks belong to individual cards. They remain separate from application action colors. The login-page blue is a separate surface value.

## Color and themes

| Role | Light | Dark | OLED |
| --- | --- | --- | --- |
| Page | #f5f5f7 | #0f172a | #000000 |
| Surface | #ffffff | #1e293b | #09090b |
| Muted surface | #f9fafb | #334155 | #18181b |
| Main text | #1d1d1f | #f8fafc | #f8fafc |
| Secondary text | #4b5563 | #94a3b8 | #a1a1aa |
| Border | #e5e7eb | #334155 | #27272a |

The Check action uses #006bb3 with white text. Online selection uses blue-600, represented as #2563eb in the capture. Focus uses blue-500, represented as #3b82f6. Tailwind v4 renders palette colors in OKLCH, so the hex representations are sRGB equivalents.

International selection uses indigo, scan-to-pay uses emerald, and offline action feedback uses amber. Preserve these existing meanings and pair color with text or checked state. Per-card colors remain data-driven.

## Typography

| Role | Existing size | Existing weight |
| --- | --- | --- |
| Search section heading | 24 px | 700 |
| Search and amount input | 18 px | 500 / 700 |
| Main labels and controls | 14 px | 600 |
| Supporting search copy | 14 px | 400 |
| Small metadata | 10–12 px | Varies by component |

These are roles observed in source and the rendered guest wallet. Keep explicit labels for money and merchant inputs. Review the smallest metadata at actual device sizes before reuse. Use INR formatting and existing financial formatting logic. Aligned numeric displays should use tabular figures when supported.

## Layout and spacing

Use the existing 4 px spacing base. The main container is max-w-6xl with 24 px horizontal padding and 32 px top padding. The search/results region is a 12-column grid from the md breakpoint with a 32 px gap. Smaller screens stack the content. Wallet cards use a horizontal, snapping row on phones and an auto-fit grid with a 310 px minimum on larger screens. Preserve existing responsive variants, including landscape and portrait rules.

## Shape and depth

Action controls use 12 px corners. Search fields use 16 px corners. Detail dialogs use 24 px corners. Utility actions such as Sign In and Edit use pill corners. Avoid converting all controls to one corner value.

Keep the existing shadow hierarchy, subtle field shadows, stronger menus and overlays, and card-specific artwork. Backdrop treatments are component-specific. Dark and OLED surfaces use the explicit overrides in src/index.css.

## Components and states

- SearchSection owns labeled merchant and amount inputs, Check, purchase-mode selections, suggestions and recent searches. Keep loading, offline and validation states.
- CardItem owns issuer artwork, network mark, benefit summary and exhaustion indication. Preserve card identity and keyboard entry points.
- Card details own billing controls, reward usage and Accelerated Limit Reached. The toggle must retain its off state through cloud synchronization.
- CustomSelect remains the shared choice control. Preserve its existing keyboard behavior and labels.
- DashboardModal and SavingsChart own savings totals, transaction history, undo and chart display. Keep the chart failure boundary and deferred load.
- LoungeTrackerModal, LoungeTrackerItem and BillReminders keep their existing benefit and statement semantics.
- Header owns identity, authentication and account controls. Preserve guest, loading, signed-in and sync-status states.

## Interaction and accessibility

WCAG 2.2 AA is the review target. Require text contrast of 4.5 to 1, large text and meaningful non-text contrast of 3 to 1, visible keyboard focus and at least 24 by 24 CSS px targets. Aim for 44 px touch areas where layout allows. Keep text labels, dialog dismissal and 200% text scaling.

The app already has a global reduced-motion CSS rule. Motion components need a separate behavior check. OpenDesigner motion exports are proposed foundation defaults. They do not certify the incumbent animation behavior.

## Verification and open decisions

The current guest wallet was visually inspected at 1706 by 890. Computed styles confirmed the font, control sizes, corners and action colors. Source inspection covered light/dark/OLED overrides and shared components. Phone layouts, signed-in screens, every overlay and full keyboard interaction remain unverified in this capture.

OpenDesigner validation passed with no errors or warnings across its generated token library. That result covers the generated library, not all existing UI combinations. No comparison against three shipped products was performed.

Keep voice and brand strategy open as recorded in PRODUCT.md. Treat potential accessibility issues in opendesigner/AUDIT.md as review items. New design directions and application-wide migration require a separate scope decision.

## Maintenance

Use opendesigner-extend for changes. Read PRODUCT.md, this document, the captured values and the decision log first. Preserve these captured roles when rebuilding. The engine can regenerate root documents, so retain PRODUCT.md and this captured record before running build. Record newly adopted values with their source and approval.

<!-- /od:keep -->
