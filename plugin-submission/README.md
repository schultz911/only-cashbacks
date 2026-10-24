# OnlyCashbacks India public distribution preparation

## One install, each user's own account

The public source is `plugin/onlycashbacks-india`. Its portable `plugin.json`, `mcp.json`, skill and icon form one plugin. The bundled server uses OAuth with dynamic client registration and the wallet scope. Each installer signs into their own OnlyCashbacks account; the server reads `users/<verified OAuth UID>` on every personalized request.

The upload contains no private `.app.json`, personal ChatGPT app mapping, user UID, access token, account fixture or service-account key. During public submission the portal converts the remote server into the registered app integration for this plugin. Preserve that generated integration in the finalized release. The separately named private development connection is not a prerequisite in this upload.

Selected/displayed cards are authoritative ownership data. An explicit card list belongs to that signed-in user; the app's saved empty-array sentinel means all supported cards are selected and owned. No additional ownership confirmation is needed. The authenticated wallet list does not display excluded cards. Missing account data never falls back to another account or an unauthenticated catalogue.

## Build

Run `python scripts/package_onlycashbacks_plugin.py`. It writes `artifacts/onlycashbacks-india-0.2.0.zip` and checks the archive, OAuth settings, absence of private bindings/credential patterns, case counts, and icon dimensions. The existing OnlyCashbacks 512-pixel icon is reused.

## Listing draft

- Name: OnlyCashbacks India
- Publisher requested by the creator: Kiran Saldanha. Confirm the selected verified publisher identity in the submission portal before submission.
- Availability: India only (`IN`).
- Homepage: https://only-cashbacks.up.railway.app
- Support and deletion contact approved by the creator: schultz911@gmail.com.
- Saved wallet retention approved by the creator: until the user requests deletion.
- No purchases, card applications, payment execution, or wallet editing through plugin tools.

Support, privacy and terms drafts are in this directory. They have not been approved or published. Do not populate their listing URL fields until those exact pages are hosted and verified. Do not use the homepage as a substitute for all three pages. No submission has been uploaded or submitted for review.

## Evidence and limits

Local integration tests use two independent OAuth accounts and different wallet fixtures. They verify separate selected cards, rates, bill dates and usage; account-bound refresh; rejection of another account's session; exclusion of unowned cards from authenticated wallet output; and rejection of a fixed engine route that would recommend an unowned card. These are automated fixtures, not two real production users.

The live development connection and the creator's wallet have been exercised in the host. The changed server annotations and wallet filtering still require deploying the current repository changes. Public review cases are drafted in the manifest, with five positive and three negative cases. Their complete end-to-end host runs are not yet recorded and must be tested against the exact submission draft.

The OAuth registrations, tokens and transport sessions currently reside in process memory. The server supports multiple isolated users on one replica. A restart requires reconnecting; horizontal replicas require a shared authorization/session store. This is an operational limitation, not a per-user hardcoding of the plugin.

## Next preparation stages

1. Creator reviews the support/privacy/terms drafts. Publish approved pages on the owned website, verify their contents, then add their real URLs to the manifest.
2. Prepare a dedicated reviewer account with sample cards and usage. Provide access only through secure portal fields, never in this package.
3. Record the walkthrough in `DEMO.md`, inspect playback for real results and absence of secrets, and host it at a reviewer-accessible URL. Screenshots and scripts are not a recording.
4. Add the verified recording URL, rebuild the ZIP, then upload the completed package as a draft when authorized. Complete OAuth/tool scans and run the review cases against that exact draft. The authorized developer completes legal/policy attestations. Review submission and eventual publication are separate actions.
