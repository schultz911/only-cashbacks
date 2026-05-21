## 2024-05-20 - Fix Exposed Firebase API Key
**Vulnerability:** A hardcoded API Key was left inside `firebase-applet-config.json`, which exposed the Firebase environment to any user with access to the source code.
**Learning:** Config files like `firebase-applet-config.json` shouldn't have secret keys hardcoded directly in the code repository to avoid leakage in the version control system.
**Prevention:** Keys should be loaded through an environment variable instead, which is exactly what the code `apiKey: import.meta.env.VITE_FIREBASE_API_KEY` achieved.
