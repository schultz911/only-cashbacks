# Connection and account isolation

This personal OnlyCashbacks plugin bundles the comparison skill with its own registered MCP app and OAuth connection. It does not depend on any previous OnlyCashbacks plugin or connector. Preserve the app mapping generated for this plugin. Each signed-in account supplies its own saved wallet.

Server: https://only-cashbacks.up.railway.app/mcp. OAuth metadata and OnlyCashbacks account operations must use that origin. Each installer authorizes their own OnlyCashbacks account through Google sign-in; no user ID, wallet, access token or service-account credential is packaged.

## Current account

Call authenticate and list_cards in the current connection. Only use that account's cardSelection.cardIds and saved usage/settings. The app's displayed selected cards are owned by that account. Explicit walletCards: [] selects all supported cards and is not an empty wallet. No additional ownership confirmation is required for the displayed selection.

Do not disclose or infer another account's cards, billing dates or usage. A new login, expired token or redeploy requires fresh account verification. A card-specific offer outside the authenticated selection is not eligible.

## Recover correctly

- No tools exposed by the host: verify that the plugin's registered MCP app is connected and that the current chat loaded the plugin.
- Authentication required: use the returned sign-in flow and verify again.
- Saved wallet could not be loaded: tools are reachable, but server credentials, database access or the account document need checking. Do not report tool unavailability.
- Missing saved selection: ask the user to save card selection in the app.
- walletCards: [] plus all_supported_cards: the authenticated all-cards-selected wallet is valid. Use its displayed cards and settings.

Do not weaken security rules, bypass token verification, or fall back to another account. netValue is benefit minus fees, not the product's final price. Prices, issuer/retailer offer terms, stacking and remaining usage require the comparison checks in the skill.
