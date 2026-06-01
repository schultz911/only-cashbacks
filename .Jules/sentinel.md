## 2025-05-16 - Input Validation Missing on API Server

**Vulnerability:** The API endpoint `/api/categorize` accepted user input (`merchantName`) without length restrictions or strict type validation, passing it directly to third-party AI models (OpenRouter/Google Gemini SDKs) in the system prompt payload. It also did not limit JSON payload size globally.

**Learning:** This missing input validation presented multiple risks:
1.  **Prompt Injection / Large Payload Denial of Service (DoS):** An attacker could send extremely large strings as `merchantName`, exhausting memory and server limits or dramatically increasing third-party API costs.
2.  **Bypass logic flaws:** A non-string or whitespace-only value could cause downstream failures or unexpected behaviors in the prompt execution.

**Prevention:** Always validate all user input on API endpoints (length checks, type checks, and content sanitation) before processing, especially before injecting into LLM contexts or making third party external API requests. Added `express.json({ limit: "10kb" })` for base payload protection and explicit bounds checking on `merchantName` and `apiKey`.

## 2025-05-18 - HTTP Header Injection via API Key

**Vulnerability:** The API endpoint `/api/categorize` allowed newline (\n) and carriage return (\r) characters in the `apiKey` property of the JSON body. This key was directly inserted into an HTTP Authorization header in an outgoing fetch request, which could allow an attacker to inject custom HTTP headers or modify the request payload.

**Learning:** Any user-supplied data used to construct HTTP headers must be strictly sanitized to prevent HTTP Header Injection (CRLF injection).

**Prevention:** Always validate that user-provided keys, tokens, or other header values do not contain carriage return (\r) or newline (\n) characters before setting them in HTTP requests.

## 2026-06-01 - Fix XSS Vulnerability in Confetti Animation

**Vulnerability:** Cross-Site Scripting (XSS) vulnerability via `innerHTML` assignment when generating confetti elements in `App.tsx`.

**Learning:** Direct assignment to `innerHTML` can lead to XSS vulnerabilities, especially if the content being assigned is derived from user input or external sources. Even for static content, it's a poor security practice.

**Prevention:** Always prefer `textContent` or `innerText` when assigning text to DOM elements to prevent script injection.
