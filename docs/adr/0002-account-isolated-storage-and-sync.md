# Account-Partitioned Client Storage and Offline Queues

Local persistence for saved cards, BYOK API keys, and offline pending transaction logs is strictly partitioned by user identity UID with a fallback quarantine for unauthenticated legacy data. We decided against global storage keys or clearing data on account switch to prevent credential leakage and accidental cross-account data merging while preserving uninterrupted offline PWA capability.

