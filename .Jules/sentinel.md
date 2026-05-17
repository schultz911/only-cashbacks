## 2025-05-16 - Input Validation Missing on API Server

**Vulnerability:** The API endpoint `/api/categorize` accepted user input (`merchantName`) without length restrictions or strict type validation, passing it directly to third-party AI models (OpenRouter/Google Gemini SDKs) in the system prompt payload. It also did not limit JSON payload size globally.

**Learning:** This missing input validation presented multiple risks:
1.  **Prompt Injection / Large Payload Denial of Service (DoS):** An attacker could send extremely large strings as `merchantName`, exhausting memory and server limits or dramatically increasing third-party API costs.
2.  **Bypass logic flaws:** A non-string or whitespace-only value could cause downstream failures or unexpected behaviors in the prompt execution.

**Prevention:** Always validate all user input on API endpoints (length checks, type checks, and content sanitation) before processing, especially before injecting into LLM contexts or making third party external API requests. Added `express.json({ limit: "10kb" })` for base payload protection and explicit bounds checking on `merchantName` and `apiKey`.

## 2024-05-18 - Missing Rate Limiting on External API Proxy Endpoint
**Vulnerability:** The `/api/categorize` endpoint proxied requests to expensive/limited external APIs (OpenRouter, Gemini) but lacked any rate-limiting, making it vulnerable to brute force and DoS attacks which could result in high billing costs or API blocking.
**Learning:** External API integrations via proxy endpoints must always be protected with rate limiting to ensure availability and cost-control, especially when client-provided keys are not exclusively relied upon.
**Prevention:** Implement custom, memory-based rate limiting middlewares using `Map` to track request counts over a time window for specific IPs, to maintain security without adding unapproved third-party dependencies like `express-rate-limit`.
