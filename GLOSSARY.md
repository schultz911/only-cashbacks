# OnlyCashbacks

OnlyCashbacks helps cardholders maximize net financial return by recommending the optimal payment card for any purchase context, factoring in exclusions, reward caps, fees, and billing cycles.

## Language

### Cards & Wallet

**Card**:
A payment instrument (credit, debit, or prepaid) defined by its issuing bank, payment network, fee structure, and contractual reward terms.
_Avoid_: Payment method, plastic, account

**Wallet**:
The curated subset of cards owned by a specific user and eligible for recommendation evaluation.
_Avoid_: Card list, card portfolio, saved cards, collection

**All-Cards Sentinel**:
An empty wallet representation that directs the recommendation engine to evaluate across the entire card catalog for immediate discovery.
_Avoid_: Unconfigured wallet, empty state, default cards

**Card Catalog**:
The canonical repository of all supported cards, benefit structures, and fee definitions maintained by the system.
_Avoid_: Card database, card directory, master list

### Recommendations & Rewards

**Recommendation**:
The ranked evaluation identifying the optimal payment card and alternates for a specific merchant, spend amount, transaction channel, and currency.
_Avoid_: Suggestion, match, advice, search result

**Net Value**:
The realized rupee yield of a transaction, defined as gross reward value minus applicable processing fees, foreign-exchange markups, and surcharges.
_Avoid_: Cashback, savings, reward, profit, return

**Reward Allocation**:
The specific rule, tier, or partner multiplier applied to compute reward earnings on a qualified transaction.
_Avoid_: Benefit rule, earning rate, cashback rate, promo

**Exclusion**:
A spending category or merchant type contractually ineligible for credit card reward accrual under bank terms.
_Avoid_: Blacklist, blocked spend, ineligible category, non-reward spend

**Exhaustion**:
The operational state of a card that has consumed its maximum reward earnings or eligible spend cap for the current billing cycle.
_Avoid_: Cap reached, maxed out, limit exceeded, expired card

**Voucher Route**:
An indirect purchase path where procuring a discounted brand gift card or voucher yields higher net value than direct checkout.
_Avoid_: Gift card hack, voucher option, coupon, discount trick

### Billing & Cycles

**Statement Day**:
The recurring day of the month when a card issuer closes the billing period and issues the statement.
_Avoid_: Bill date, closing date, cycle day, cutoff date

**Due Date**:
The deadline by which a card statement balance must be settled to avoid interest charges and late payment penalties.
_Avoid_: Payment date, deadline, settlement day

**Billing Cycle**:
The recurring monthly interval between consecutive statement days governing reward cap utilization and exhaustion resets.
_Avoid_: Month, pay period, statement period

### Airport Benefits

**Lounge Pass**:
An individual entitlement granting admitted access to a domestic or international airport lounge.
_Avoid_: Lounge access, airport ticket, visit, lounge coupon

**Complimentary Lounge**:
An airport lounge entitlement granted unconditionally with card membership without spend prerequisites.
_Avoid_: Free lounge, unconditional pass, automatic lounge

**Spend-Based Lounge**:
An airport lounge entitlement that activates only upon achieving a specified milestone spend within a calendar quarter.
_Avoid_: Conditional lounge, spend milestone, locked lounge

### Operations & Privacy

**Savings Log**:
An immutable record of a completed transaction and its realized net reward value tracked in the user's personal dashboard.
_Avoid_: Cashback log, transaction history, expense record, audit entry

**BYOK (Bring Your Own Key)**:
The architectural pattern requiring users to provide their own OpenRouter API key for optional cloud merchant classification.
_Avoid_: Custom API key, user key, personal key

**P2P Transfer**:
A peer-to-peer money movement between individuals via personal UPI QR or VPA, universally excluded from credit card rewards.
_Avoid_: Personal payment, Splitwise payment, friend transfer

