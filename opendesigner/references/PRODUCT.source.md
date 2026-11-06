# OnlyCashbacks

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Indian cardholders choosing the best saved card before making a purchase.

## Product Purpose

Help users choose a payment card based on usable net rewards. Success means a recommendation that accounts for the user's cards, applicable rewards and exclusions, remaining limits, and purchase context.

## Positioning

Recommendations combine the user's saved wallet with card-specific reward rules, merchant exclusions, reward caps, spend tiers, and foreign-exchange costs.

## Operating Context

Users search for a merchant, category, or item and enter an amount before a purchase. They can manage saved cards, track reward usage and savings, and maintain billing and lounge-benefit information. Local recommendations remain available offline. Signed-in users can synchronize their wallet across devices.

## Capabilities and Constraints

- Preserve existing reward calculations, API contracts, edge-case handling, and database schemas.
- Preserve offline recommendations and account isolation across local storage, pending edits, and cloud synchronization.
- AI merchant classification is optional and uses the user's own OpenRouter API key. Preserve the BYOK requirement.
- Preserve Firebase Functions code, configuration, and variables under the project's Firebase protections.
- Changes must preserve existing callers and pass applicable unit, integration, and regression tests.
- Performance work requires measurable benefit. Avoid cosmetic refactoring and TypeScript `any` removal for compliance alone.

## Brand Commitments

The product name is OnlyCashbacks. Further voice and brand commitments remain open.

## Evidence on Hand

- `README.md` describes the product, supported payment instruments, architecture, and optional MCP integration.
- `src/data/cards.ts` and `src/data/cardDetails.ts` contain card data and supporting copy.
- `src/lib/recommendation.ts` implements recommendation rules.
- `src/App.tsx`, `src/components/`, and `src/index.css` provide the incumbent interface.
- `AGENTS.md` records project guardrails and prior implementation decisions.
- Automated tests provide local regression evidence. Production and real-account verification must be established for each relevant change.

## Product Principles

- Optimize for usable net rewards in the user's purchase context.
- Keep local recommendations usable offline.
- Keep each account's wallet and pending edits isolated.
- Preserve financial-rule correctness and user data through changes.
- Keep optional AI classification under the user's BYOK control.
