## 2025-05-16 - Input Validation Missing on API Server

**Vulnerability:** The API endpoint `/api/categorize` accepted user input (`merchantName`) without length restrictions or strict type validation, passing it directly to third-party AI models (OpenRouter/Google Gemini SDKs) in the system prompt payload. It also did not limit JSON payload size globally.

**Learning:** This missing input validation presented multiple risks:
1.  **Prompt Injection / Large Payload Denial of Service (DoS):** An attacker could send extremely large strings as `merchantName`, exhausting memory and server limits or dramatically increasing third-party API costs.
2.  **Bypass logic flaws:** A non-string or whitespace-only value could cause downstream failures or unexpected behaviors in the prompt execution.

**Prevention:** Always validate all user input on API endpoints (length checks, type checks, and content sanitation) before processing, especially before injecting into LLM contexts or making third party external API requests. Added `express.json({ limit: "10kb" })` for base payload protection and explicit bounds checking on `merchantName` and `apiKey`.
## 2026-05-27 - Prevent HTTP Header Injection (CRLF)
**Vulnerability:** User-provided input (`apiKey`) was being passed directly to API requests without checking for carriage return or newline characters. This can allow an attacker to inject arbitrary headers or split HTTP requests.
**Learning:** Always sanitize or validate data that is placed directly into HTTP headers (e.g., using regex `[\r\n]`) to ensure it does not contain CRLF characters.
**Prevention:** Implement strict input validation on all user-supplied data used in HTTP headers, rejecting inputs that contain `\r` or `\n`.
