# Eternal SBI integration research and architecture audit

Research checked 3 November 2026, before implementation. Sources are public official documents, not personalized account data.

## Sources and verified terms

1. [SBI product page](https://www.sbicard.com/en/personal/credit-cards/eternal-sbi-card.html)
2. [SBI product booklet, cashback FAQs and cardholder agreement](https://www.sbicard.com/sbi-card-en/assets/docs/pdf/eternal-sbi-card/Eternal-SBI-Card-T-and-C-Booklet.pdf)
3. [SBI preferred-partner conditions](https://www.sbicard.com/sbi-card-en/assets/docs/pdf/eternal-sbi-card/Eternal-Card-Cashback-Preferred-Partners.pdf)
4. [Eternal product page and FAQs](https://www.eternal.com/credit-card)
5. [SBI MITC](https://www.sbicard.com/en/most-important-terms-and-conditions.page)

The product is Eternal SBI Credit Card, issued by SBI Cards and Payment Services Limited with Eternal, on Mastercard. No verified network tier is assigned. The issuer's black card face and existing shared gradient/card layout supply branding.

- Joining and yearly renewal cost: INR 499 plus GST; renewal reversal at INR 200,000 annual spending (issuer says at least this amount). Add-on fee is nil; family add-ons are available to adults over 18. Approval depends on SBI underwriting. Eternal lists salaried applicants aged 21–60 and self-employed applicants aged 25–65, an Indian permanent address and serviceable PIN code. It currently reports early access closed and a 5,000-card initial allocation; these are availability disclosures, not permanent benefits.
- Instant reductions: 10% at Zomato and District, 10% for Blinkit beauty/electronics and 5% for other eligible Blinkit categories; one INR 2,000 calendar-month pool. Eternal additionally documents 10% at Bistro. These are checkout discounts, not statement credits.
- Preferred merchants: 5% statement cashback at Uber, Urban Company and Apollo. SBI specifically makes eligibility dependent on approved merchant identifiers. Transactions below INR 100 do not qualify under the partner conditions. The partner PDF specifies a shared INR 1,000 statement-cycle cashback pool.
- ixigo is not 5% statement cashback: flights/hotels have a 4% checkout reduction using IXIGOSBI and 1% statement cashback. Train/bus bookings are not documented for that checkout offer. No verified coupon minimum or transaction cap was found, so the INR 100 cashback minimum does not become a coupon minimum. The calculator shows the coupon condition. Applying the 1% to the amount charged after the discount is a conservative calculation inference, explicitly labelled as an estimate; the retrieved terms do not specify a gross-versus-net illustration. Checkout and the actual statement determine the final amount.
- Other eligible spending: 1% statement cashback, capped at INR 500 per month according to Eternal.
- District movies: one two-ticket BOGO transaction per month; maximum saving INR 200 on the second ticket. Unequal ticket prices and checkout validation matter. The app exposes this as a conditional offer and does not assume a two-ticket cart or that BOGO stacks with 10%.
- Welcome: six months of Zomato Gold after activation. Fuel has no cashback; a separate 1% surcharge waiver applies to INR 500–4,000 transactions, capped at INR 200 per statement cycle. A surcharge reversal is not modeled as ordinary cashback.
- Cashback posts automatically to the card account within two working days after statement generation. Returns/cancellations reverse it. Ordinary credited cashback has no expiry; conversion to a different SBI co-brand forfeits accrued cashback. Replacement/renewal preserves it. These are issuer settlement rules; the app records estimates and user-confirmed savings, not issuer settlement.
- Eternal excludes fuel, wallet/prepaid loads, gift cards/vouchers, cash advances, rent, government/utility payments, education, insurance, jewellery, gaming, EMI (including Eternal app purchases), Flexipay, card dues/fees, baby food/feeding essentials and tobacco/Paan Corner. Restrictions apply inside Eternal apps too. These exclusions take precedence over merchant rates.
- MITC: general foreign-currency markup is 3.5% plus applicable taxes for this product; no special lower Eternal rate is listed. Interest-free credit is generally 20–50 days subject to prior balances, with none on cash advances. Due dates and balances are on the customer's statement, not fixed product dates. Digital settlement can take 24–48 hours. Never infer a customer's limit, outstanding, statement date or payment deadline.

## Conflicts and unverified details

- The SBI FAQ says partner cap “per month”; its specific partner PDF says statement cycle. The calculator follows the specific document. A separately configured statement day is needed to know that cycle accurately; otherwise partner estimates are withheld and the UI asks for the setting.
- Eternal calls ixigo 5% in its summary; SBI specifies the 4% coupon/1% cashback split. Use the issuer's split.
- Only Eternal explicitly states the base INR 500/month cap and Bistro benefit. Both are documented, source-linked and retained.
- The product page's marketing phrase “1% fuel surcharge” omits “waiver”; its heading and booklet establish that it is a waiver.
- No authoritative Eternal-specific MCC exclusion schedule, exact reward-rounding policy, launch effective date, annual-waiver exclusion schedule, confirmed stacking of BOGO with 10%, or international partner-MID coverage was found. General MITC MCCs identify fees, not proof of Eternal reward eligibility. Do not invent MCCs or transplant another SBI card's cashback rules. Amounts are estimates rounded to paise, subject to actual eligible MID, item mix and issuer settlement. No temporary campaign is embedded as a permanent reward.

## Architecture findings and compatibility

- `src/data/cards.ts` and `mcp-server/src/data/cards.ts` are parallel catalogues; both precompute metadata and `CARD_DICT`. Shared new product data and pure rules avoid divergent Eternal definitions.
- Selection, portfolio filters, card/detail views and lounge filtering derive from the catalogue. `CardItem`, wallet management and details are reused. No lounge benefit is asserted.
- `useWalletState` stores card identifiers, numeric `cardBillDates`/`offerUsage` maps, paid-cycle markers and cashback logs. `useAuthAndSync` persists the same shapes using existing account-isolated hydration/revision protections. New settings use namespaced entries in the existing numeric maps, with no new collection, schema, rules, mandatory field, or data migration.
- Existing `cardBillDates[id]` values remain intact and supply the payment day. A separately entered `id:statement` supplies statement-cycle reset information. Legacy cards retain their existing reward-cycle fallback until the user supplies a distinct statement day. `id:reminderDays` is an optional lead time, default zero. Unconfigured cards do not acquire a fabricated payment day.
- Configurable reward rules extend catalogue metadata only. Existing cards retain their calculation paths. Numeric cap accounting uses the existing usage map, supports actual-used adjustments, and links logged allocations to existing log timestamps for undo/reset. Credit limits, balances, statement imports and issuer feeds are not existing app features and are not invented for Eternal.
- The MCP service consumes the same saved wallet/usage maps. Authentication and API argument signatures remain unchanged. Firebase Functions and configuration are protected and untouched.
- No independent backend reminder scheduler, push subscription or closed-app push service exists. Browser notifications run when the app is open with permission; the service worker provides caching, not alarm delivery. Shared date calculations are exercised independently from display and storage, and the UI explains this runtime limit.
- Short-month policy: user explicitly selected the last valid day of that month. Preserve the configured number and recover it in later months. Calendar math uses Asia/Kolkata and date-only UTC arithmetic to avoid host timezone/DST shifts.

## Amazon Pay ICICI defect reproduction

Before the fix, the new component regression failed: at 1 November 2026 with persisted `icici-amazon-pay: 3`, `BillReminders` rendered its Ready payment button. The code added every unpaid card without checking its configured date, and `getCycleForCard` returned the previous cycle before that date. The same input was labelled Bill Generation Date while also driving payment reminders; notification code waited until `billDay + 2`, which failed near month boundaries. Missing settings defaulted to day 1 across several consumers. No Amazon-specific override or evidence that a saved numeric 3 was rewritten to 1 was found. This is a reminder-state/date-semantics defect; the exact historical user session was not inspected.

Validation results are recorded after implementation below.

## Final implementation audit

| Surface | Integration and verification |
| --- | --- |
| Product registration | Shared `mcp-server/src/data/eternal.ts` defines `sbi-eternal` (Mastercard); both catalogues consume it. No new card database or fabricated account record. |
| Portfolio and presentation | Existing wallet manager, catalogue filters, `CardItem` and detail overlay. Official issuer artwork is a 17,453-byte local PNG. Shared layout, fonts, responsive styles and interactions retained. The thumbnail is height-bounded for landscape space. |
| Rewards and offers | Shared pure `rewardRules.ts` evaluates catalogue rules; existing cards retain their prior scoring paths. Explicit merchant/item exclusions, independent cap pools, conditional movie offer and coupon disclosure. Offer results are restricted to the selected wallet. |
| Merchant discovery | Search suggestions include District, Bistro, Urban Company, ixigo and Apollo 24\|7. Exact local District/Bistro mappings prevent unnecessary BYOK calls. Existing Firebase callable/import code is unchanged. |
| Usage and savings | Existing numeric `offerUsage` records hold pool adjustments and timestamp-linked allocations. Logging updates caps; dashboard undo/reset removes linked allocations and restores capacity. Manual actual-used adjustments account for spending outside the app. No new persisted field or log schema. |
| Billing and notifications | Shared India-date helper, separate statement/payment settings, configurable reminder lead days, last-day short-month policy and common display/notification source. No fabricated due day for an unconfigured card. Paid markers use the actual payment month. Date changes reschedule open-app checks; midnight/focus/visibility updates refresh the UI. |
| Persistence and sync | Existing wallet maps, 500 ms debounce, cloud revision guards and account isolation retained. Page exit/hidden-state flush closes a reproduced immediate-refresh loss window. Canonical saved dates and unrelated settings are not rewritten. Add/remove selection retains settings for re-add. |
| MCP / backend | Same product data and date/reward modules; unchanged tool argument signatures. Authenticated Streamable HTTP tests exercise saved selection, statement cycle and remaining cap; authentication/isolation regression suite passes. |
| Non-applicable facilities | No issuer statement/limit/balance feed, import/export workflow, closed-app notification service or Eternal lounge benefit exists in the audited app/product. No fabricated substitute was added. Annual waiver, welcome membership and fuel surcharge waiver are disclosed; the app does not pretend to verify issuer activation, yearly qualifying spend or settlement. |

## Validation results, 3 November 2026

- Baseline before implementation: 51 tests passed. Final suite: **292 tests passed across 14 files**, including all original tests and 241 new cases. TypeScript (`npm run lint`), MCP TypeScript build and production frontend/PWA/server build passed.
- The 137 date/notification tests passed independently under host `TZ=UTC`, `TZ=Asia/Kolkata` and `TZ=America/Los_Angeles`. Coverage includes days 1, 3, 15, 28, 30, 31; leap/non-leap February; 30-day months; December/January; lead windows across months/years; edits, paid status, missing/invalid settings and India midnight.
- Storage tests independently save/reload each requested day for Amazon Pay ICICI and Eternal, preserving statement/lead-day/unrelated entries. Component tests independently assert payment date, early-reminder date, Ready status and payment action. Notification hook tests independently observe the browser Notification constructor, delivery date, deduplication, editing/rescheduling, background open-app behavior, all-selected wallet handling and timer cleanup.
- Integration tests exercise actual App search, savings logging, dashboard totals/undo, local persistence, mocked cloud hydration/acknowledgement and re-add behavior. Authenticated MCP HTTP tests load the saved Eternal Mastercard card, verify card details, calculate partner cashback and enforce a remaining INR 20 pool. These use mocked identities/Firestore; no real-account cloud writes were made.
- Manual compiled-production browser checks: native portfolio selection and removal, the Mastercard card, edit/reload payment day 3 / separate statement day / lead time 2, immediate-refresh persistence, payment-versus-reminder labels, and savings logging/undo. A INR 19,000 Zomato purchase estimated INR 1,900; after logging, a further same-sized purchase was capped at INR 100; the dashboard showed INR 1,900 and undo restored the pool and zeroed the dashboard.
- Layout checks covered 390×844 mobile portrait, 844×390 landscape, 768×1024 tablet and 1280×900 desktop. Document scroll width matched the available width. The landscape check identified excessive header height from vertical issuer artwork; its shared thumbnail is now bounded to 48 px, verified against the compiled build. Screenshots were captured in the local validation artifact folder, not in a customer account. Temporary browser viewport/cache testing overrides were restored afterward.
- Local compiled index, current JS bundle and card artwork each returned HTTP 200; artwork size is 17,453 bytes. No dependency was added. Firebase Functions, Firebase initialization/configuration, Firestore rules and database record shapes remain unchanged.

### Limits and observations

- Actual issuer MID eligibility, item-level checkout acceptance, coupon acceptance, bank posting/rounding and real OS notification delivery were not tested. The estimates and UI disclose these conditions. Movie BOGO remains a separately tracked conditional offer, not an assumed two-ticket discount.
- No deployment or live production-account test was performed. Browser notifications require a running app and permission; this task does not add a background service the architecture lacks.
- The in-app browser development preview reported `net::ERR_ABORTED` for Vite's `firebase_analytics.js` module and did not render. Compiled production-mode browser validation passed. Protected Firebase code was not changed to work around the preview environment.
- Existing build warnings remain: Firebase static/dynamic import overlap, a large Firebase bundle and old Browserslist data. The headless chart test reports missing physical dimensions; the actual browser dashboard rendered and its logging/undo checks passed. These warnings are not compile/test failures.
- Audit found a pre-existing frontend/MCP HDFC Imperia benefit-label difference (`BMS` versus `BookMyShow`); unrelated card data was preserved. New Eternal data and calculations have explicit cross-runtime parity tests.

Within the app's supported workflows, Eternal has native functional parity across registration, selection, management, display, recommendations, conditional offers, cap tracking, savings, synchronization, billing and open-app reminders. External issuer settlement and facilities absent from the app are explicitly outside what was verified.
