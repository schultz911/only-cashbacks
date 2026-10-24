# OnlyCashbacks India plugin privacy policy

Draft for Kiran Saldanha's review and approval; not a published policy. Applies to the plugin. Confirm the broader website's separate practices before using this text as a site-wide policy.

## Who operates the plugin

OnlyCashbacks India is provided by Kiran Saldanha. Contact: **schultz911@gmail.com**.

## Data used for the requested service

Users authenticate through Google and Firebase. The service uses the verified account identifier to read that account's saved card selection, billing dates, offer usage, exhausted-card state and configured reward values. Merchant names, transaction amounts and payment-route choices supplied in a request are used to calculate card recommendations.

The plugin returns the requested wallet settings and recommendation results to ChatGPT. It does not return the user's stored OpenRouter/BYOK API key as wallet context. Google/Firebase, Railway hosting and ChatGPT/OpenAI process information needed to operate their respective authentication, storage, hosting and chat services under their own applicable terms and policies. Operational logs can contain request and diagnostic information.

App Check and reCAPTCHA Enterprise provide browser attestation for sign-in. The web app also uses browser storage for its saved state and Firebase services for synchronization and diagnostics. This plugin policy should not be presented as a claim that the whole website has no analytics, diagnostics or local storage.

## Account separation

Each installer authorizes their own OnlyCashbacks account. Personalized tool requests use the account bound to the authenticated connection. Another user's wallet is not an eligible substitute for missing account data. The plugin's distribution package contains no user wallet or login credential.

## Price research

The comparison workflow uses product and merchant information to research retailers. It instructs ChatGPT not to disclose wallet contents to retailers. Retailer terms, availability and prices are separate from OnlyCashbacks account data.

## Retention and deletion

Saved wallet data is retained until the user requests deletion. To request deletion, email **schultz911@gmail.com** from the email associated with the OnlyCashbacks account and identify the request. Account ownership must be verified before deletion. Never send passwords, OTPs, tokens or card numbers. The operator must implement and follow this manual request process; this policy does not claim an automated account-deletion endpoint or a fixed completion deadline.

The server uses short-lived access tokens and rotating refresh tokens. Its current authorization and session stores are in memory; a restart clears them. Disconnecting the plugin stops new access through that connection, but does not by itself delete data saved in OnlyCashbacks or prior ChatGPT conversations. Manage those conversations through ChatGPT's own controls.

## Questions

Contact **schultz911@gmail.com** about this policy, data access or deletion. Before publication, the operator should confirm any operational-log retention, legally required retention, or additional processing not established in the implementation reviewed for this draft.
