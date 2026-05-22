## 2024-05-20 - Fix Exposed Firebase API Key
**Vulnerability:** A hardcoded API Key was left inside `firebase-applet-config.json`, which exposed the Firebase environment to any user with access to the source code.
**Learning:** Config files like `firebase-applet-config.json` shouldn't have secret keys hardcoded directly in the code repository to avoid leakage in the version control system.
**Prevention:** Keys should be loaded through an environment variable instead, which is exactly what the code `apiKey: import.meta.env.VITE_FIREBASE_API_KEY` achieved.
## 2025-02-23 - Express trust proxy IP Spoofing
**Vulnerability:** Rate limit bypass via IP spoofing. Express's `trust proxy: 1` setting causes `req.ip` to blindly trust the `X-Forwarded-For` header. If the application is accessible directly without going through the expected reverse proxy, an attacker can spoof the `X-Forwarded-For` header to bypass rate limits.
**Learning:** `req.ip` is only secure if the direct connection originates from a trusted proxy. If `trust proxy: 1` is globally configured (often required for platforms like Cloud Run), any direct connection is treated as a trusted proxy.
**Prevention:** Explicitly validate the immediate upstream proxy. Ensure `req.socket.remoteAddress` is a private or local IP (e.g., using `10.x.x.x`, `172.16.x.x`, `192.168.x.x`, `127.0.0.1`, `169.254.x.x`) before trusting `req.ip` for security-sensitive operations like rate limiting.
