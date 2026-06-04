## 2024-06-04 - Hardcoded Secrets in Source Code

**Vulnerability:**
Hardcoding sensitive credentials (like ReCaptcha Enterprise site keys) in source files exposes them to version control and potential public leaks. While site keys are often used publicly, keeping them in environment variables improves configuration management and security posture, especially if the key should be rotated or changed based on environments (e.g., dev vs prod).

**Learning:**
Any configuration variable that resembles an API key or secret token must be managed via environment variables. Specifically for Vite projects, `import.meta.env` is required, and TypeScript needs to be configured correctly via a `.d.ts` file extending `ImportMetaEnv`.

**Prevention:**
Enforce pre-commit hooks or CI/CD checks (like secret scanning tools) that automatically flag strings matching known API key patterns in source files. Require all environment variables to be defined in a `.env.example` file and accessed strictly through the environment configuration framework.
