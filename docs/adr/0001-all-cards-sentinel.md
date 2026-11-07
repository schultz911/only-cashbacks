# Empty Wallet Acts as All-Cards Sentinel

When a user's wallet contains no selected cards (`walletCards` is empty), the recommendation engine and MCP tools evaluate all supported cards in the catalog rather than returning empty results. We chose this sentinel convention so first-time and unauthenticated users immediately experience recommendation discovery without a mandatory onboarding step, while preserving the ability for established users to restrict recommendations to their owned payment cards.

