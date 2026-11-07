<!-- AUTO-GENERATED: Generated from package.json and repository conventions -->
# Contributing to OnlyCashbacks

Thank you for contributing to OnlyCashbacks! This guide covers setup, commands, testing, and development guidelines.

## Development Setup

### Prerequisites
- Node.js 20+
- npm 10+
- Modern browser (Chromium recommended for E2E tests)

### Quick Start
```bash
# 1. Clone repository
git clone https://github.com/schultz911/only-cashbacks.git
cd only-cashbacks

# 2. Install dependencies
npm install

# 3. Setup environment configuration
cp .env.example .env

# 4. Start local development server
npm run dev
```

The application will be accessible at `http://localhost:3000`.

---

## Available Scripts

<!-- AUTO-GENERATED: Source package.json -->
| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express server with Vite middleware in development mode (`http://localhost:3000`) |
| `npm test` | Runs the full Vitest unit, component, and security regression suite (`vitest run`) |
| `npm run test:e2e` | Runs browser end-to-end user journeys using Playwright (`playwright test`) |
| `npm run test:pwa-routes` | Verifies PWA protected route exclusions and cache handling |
| `npm run lint` | Typechecks the entire TypeScript codebase (`tsc --noEmit`) |
| `npm run build` | Compiles Vite production bundle (`dist/`) and bundles `server.ts` to `dist/server.cjs` |
| `npm start` | Boots the bundled production Node.js server (`node dist/server.cjs`) |
| `npm run preview` | Starts Vite local preview server for built assets |
| `npm run clean` | Deletes the `dist/` directory |

---

## Testing Procedures

### Unit & Component Tests
- Engine calculation tests live alongside source files: `src/**/*.test.ts*` and `mcp-server/tests/**/*.test.ts*`.
- Run once: `npm test`
- Interactive watch mode: `npx vitest`

### End-to-End Tests
- Browser flows live in `tests/e2e/features/*.spec.ts` using Page Object Models in `tests/e2e/pages/`.
- Run headless: `npm run test:e2e`
- Run headed / interactive: `npx playwright test --headed`
- View report: `npx playwright show-report`

---

## Core Guardrails & Code Style

As recorded in `AGENTS.md` and `PRODUCT.md`:
1. **Pure Functionality Preservation**: Keep all credit card reward rules, edge-case math, and Firebase Functions untouched.
2. **Deterministic Outcomes**: All 276 Vitest tests and 11 Playwright E2E tests must pass cleanly.
3. **Account Isolation**: Any new persisted client state must be partitioned by user identity UID (`${key}:${uid}`).
4. **No Unused Code**: Clean up unused imports, dead variables, and dangling parameters before committing (`npm run lint`).
5. **No Cosmetic Refactoring**: Only introduce refactoring when there is a direct, measurable dividend.

---

## Pull Request Checklist

Before submitting a PR:
- [ ] `npm run lint` passes with 0 errors.
- [ ] `npm test` passes all 276 unit/component tests.
- [ ] `npm run test:e2e` passes all 11 browser journeys.
- [ ] `npm run build` generates production assets without warnings.
- [ ] Documentation and codemaps updated (`/update-docs` and `/update-codemaps`).

