# OnlyCashbacks - Agent Instructions & Context

Welcome to OnlyCashbacks! This file provides the context, structure, and standards for AI coding assistants (like Jules) working on this codebase.

## 🚀 Tech Stack & Core Libraries

- **Frontend:** React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide React, Recharts
- **Backend:** Express.js (running with `tsx` in `server.ts`)
- **Database & Sync:** Firebase
- **Search & Matching:** Fuse.js and customized Regex merchant matching
- **Validation:** Zod

## 📂 Project Architecture & Key Files

- [package.json](file:///c:/only-cashbacks/package.json): Lists all dependencies, scripts, and package information.
- [server.ts](file:///c:/only-cashbacks/server.ts): Express.js backend server.
- [vite.config.ts](file:///c:/only-cashbacks/vite.config.ts): Configuration for Vite bundler, PWA features, and tailwind.
- [firestore.rules](file:///c:/only-cashbacks/firestore.rules): Security rules defining read/write permissions for Firestore databases.
- [src/](file:///c:/only-cashbacks/src/): Source code of the frontend React application.

## 🛠️ Environment Configuration

The app relies on environment variables defined in `.env` (copied from `.env.example`).
Ensure the following variables are set for fully functioning integrations:
- `GEMINI_API_KEY` or `OPENROUTER_API_KEY`: API key for AI-driven recommendations.

## 🧪 Development Workflow

- **Install dependencies:** `npm install`
- **Start development server:** `npm run dev`
- **Build production bundle:** `npm run build`
- **Run tests:** `npm run test` (uses Vitest)
- **Lint / Typecheck:** `npm run lint` (uses `tsc --noEmit`)
