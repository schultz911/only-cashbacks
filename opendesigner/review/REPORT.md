# Review report: OnlyCashbacks

Made 2026-11-06 · http://localhost:3000 · 0 probe run(s) · system: OnlyCashbacks

## Verdict: INCOMPLETE

0 of 18 planned cells were not checked and 11 were blocked. No errors found so far.

0 errors · 0 warnings · 0 notes · coverage 4/18 cells done

## What was not checked

**Blocked** (11)
- `/opendesigner/captured-ui.html|320x844|light`: Dimensions and overflow measured, but full retained screenshot and probe capture coverage is incomplete.
- `/opendesigner/captured-ui.html|390x844|light`: Dimensions and overflow measured, but full retained screenshot and probe capture coverage is incomplete.
- `/opendesigner/captured-ui.html|768x900|light`: Dimensions and overflow measured, but full retained screenshot and probe capture coverage is incomplete.
- `/opendesigner/captured-ui.html|1024x900|light`: Dimensions and overflow measured, but full retained screenshot and probe capture coverage is incomplete.
- `/opendesigner/captured-ui.html|1440x900|light`: Dimensions and overflow measured, but full retained screenshot and probe capture coverage is incomplete.
- `task:/opendesigner/captured-ui.html|scroll-walk`: Dimensions and overflow measured, but full retained screenshot and probe capture coverage is incomplete.
- `task:/opendesigner/captured-ui.html|hover-and-press`: Dimensions and overflow measured, but full retained screenshot and probe capture coverage is incomplete.
- `task:/opendesigner/captured-ui.html|stress-text`: Dimensions and overflow measured, but full retained screenshot and probe capture coverage is incomplete.
- `task:/opendesigner/captured-ui.html|console-and-network`: Dimensions and overflow measured, but full retained screenshot and probe capture coverage is incomplete.
- `task:/opendesigner/captured-ui.html|text-pixels`: Dimensions and overflow measured, but full retained screenshot and probe capture coverage is incomplete.
- `task:/opendesigner/captured-ui.html|floating-bars`: Dimensions and overflow measured, but full retained screenshot and probe capture coverage is incomplete.

**Skipped on purpose** (3)
- `task:/opendesigner/captured-ui.html|motion`: Static specimen has no animation or letter reveals; browser reported0 animations.
- `task:/opendesigner/captured-ui.html|letter-reveals`: Static specimen has no animation or letter reveals; browser reported0 animations.
- `task:/opendesigner/captured-ui.html|toggles`: All themes are simultaneous specimens. No switches or theme toggles exist.

## Coverage

| Cell | Status | Evidence |
|---|---|---|
| `/opendesigner/captured-ui.html|320x844|light` | blocked | opendesigner/review/probes/observations.json |
| `/opendesigner/captured-ui.html|390x844|light` | blocked | opendesigner/review/probes/observations.json |
| `/opendesigner/captured-ui.html|768x900|light` | blocked | opendesigner/review/probes/observations.json |
| `/opendesigner/captured-ui.html|1024x900|light` | blocked | opendesigner/review/probes/observations.json |
| `/opendesigner/captured-ui.html|1440x900|light` | blocked | opendesigner/review/probes/observations.json |
| `task:/opendesigner/captured-ui.html|scroll-walk` | blocked | opendesigner/review/probes/observations.json |
| `task:/opendesigner/captured-ui.html|focus-walk` | done | opendesigner/review/verifier/independent.json |
| `task:/opendesigner/captured-ui.html|hover-and-press` | blocked | opendesigner/review/probes/observations.json |
| `task:/opendesigner/captured-ui.html|states-and-data` | done | opendesigner/review/verifier/independent.json |
| `task:/opendesigner/captured-ui.html|motion` | skipped | opendesigner/review/probes/observations.json |
| `task:/opendesigner/captured-ui.html|stress-text` | blocked | opendesigner/review/probes/observations.json |
| `task:/opendesigner/captured-ui.html|reduced-motion` | done | opendesigner/review/probes/observations.json |
| `task:/opendesigner/captured-ui.html|forced-colors` | done | opendesigner/review/probes/observations.json |
| `task:/opendesigner/captured-ui.html|console-and-network` | blocked | opendesigner/review/probes/observations.json |
| `task:/opendesigner/captured-ui.html|letter-reveals` | skipped | opendesigner/review/probes/observations.json |
| `task:/opendesigner/captured-ui.html|text-pixels` | blocked | opendesigner/review/probes/observations.json |
| `task:/opendesigner/captured-ui.html|floating-bars` | blocked | opendesigner/review/probes/observations.json |
| `task:/opendesigner/captured-ui.html|toggles` | skipped | opendesigner/review/probes/observations.json |

## Re-run

Fix, then run the same cells again and `review.py check` on the new probe files: it prints what was resolved and what is new. Do not mark a cell done from memory.

## Approved fixes verified

The prior placeholder-contrast error and touch-target warning are resolved in the preview. Existing inputs use the captured secondary-text token with full opacity. Existing buttons use the OpenDesigner touch-target token for minimum width and height.

Computed browser styles confirmed all six buttons are44px high. Placeholder contrast is7.56 to1 in light,5.71 to1 in dark and7.76 to1 in OLED. Exact ratios and source assertions are in fix-verification.json. Original findings are retained in findings.before-fix.json.

This focused verification does not close the earlier coverage gaps. HTML preflight reports no errors and one typography warning. Captured24px and28px heading roles are intentionally retained despite the generated foundation's different type scale.
