## 2024-06-04 - Hardcoded Secrets in Source Code

**Vulnerability:**
Hardcoding sensitive credentials (like ReCaptcha Enterprise site keys) in source files exposes them to version control and potential public leaks. While site keys are often used publicly, keeping them in environment variables improves configuration management and security posture, especially if the key should be rotated or changed based on environments (e.g., dev vs prod).

**Learning:**
Any configuration variable that resembles an API key or secret token must be managed via environment variables. Specifically for Vite projects, `import.meta.env` is required, and TypeScript needs to be configured correctly via a `.d.ts` file extending `ImportMetaEnv`.

**Prevention:**
Enforce pre-commit hooks or CI/CD checks (like secret scanning tools) that automatically flag strings matching known API key patterns in source files. Require all environment variables to be defined in a `.env.example` file and accessed strictly through the environment configuration framework.
## 2026-06-04 - Hardcoded API Keys in Example Environment Files
**Vulnerability:** Example environment files containing hardcoded credentials (like Firebase API keys or Recaptcha site keys) rather than placeholders.
**Learning:** Even if a key is considered 'public' in some contexts (like frontend config files), hardcoding it in a template or example file (like `.env.example`) is bad practice and can lead to unintentional leakage or reuse of environments. Example files should purely demonstrate the shape of the configuration, not the content.
**Prevention:** Always use obvious placeholders (e.g., `YOUR_API_KEY_HERE`) when creating or maintaining example environment files.

## 2025-02-24 - Unauthenticated Write Access to Firestore Client Errors
**Vulnerability:** The Firestore rules allowed anyone to write documents to the `clientErrors` collection because `allow create: if true;` was used. This is a vector for Denial of Service (DoS) and spam attacks, as unauthenticated users could flood the database with bogus records, incurring storage and operation costs.
**Learning:** Even for non-sensitive data like client error logs, write access should always be authenticated or strictly rate-limited. Giving open write access `allow create: if true;` exposes the database to abuse.
**Prevention:** Always require authentication (`if request.auth != null;`) for database writes unless the collection is explicitly designed for public submission, in which case rate-limiting, strict schema validation, and potentially CAPTCHA integration are necessary.
## 2026-06-05 - Removed unauthenticated server-side API key fallback

**Vulnerability:** The server was configured to fallback to the server's `OPENROUTER_API_KEY` if the user did not provide an `apiKey` in the payload for the `/api/categorize` endpoint. This means unauthenticated users could exploit the server's API key.
**Learning:** Never expose server-side secrets or fallbacks for endpoints that are publicly accessible without proper authentication/authorization and rate-limiting. This is essentially free resource consumption at the owner's expense.
**Prevention:** Removed the fallback to `process.env.OPENROUTER_API_KEY`, requiring all requests to this endpoint to provide their own valid `apiKey`.
