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
