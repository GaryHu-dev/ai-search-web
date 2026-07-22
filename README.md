# GEO Web

The frontend for **GEO**, a Generative Engine Optimization platform:
visibility tracking and content optimization for how sites show up in AI
answers. This app exercises the existing backend end to end (auth, account,
files, GEO audits).

See [`docs/architecture.md`](docs/architecture.md) for the design (routing,
provider composition, API client, auth, testing conventions, etc.).

## Stack

- Vite · React 18 · TypeScript · React Router
- TanStack Query (server state) · react-hook-form + zod
- Tailwind CSS
- Vitest + Testing Library + MSW (unit/component tests)
- Playwright (e2e)
- Package manager: **pnpm**

## Prerequisites

- Node.js (see `package.json` / your local toolchain for the exact version)
- pnpm
- The backend, [`ai-search-api`](../ai-search-api), running locally on `:3000`
  (required for `pnpm dev` to have anything to talk to, and for `pnpm test:e2e`)

## Setup

```bash
pnpm install
cp .env.example .env
```

Then edit `.env`:

- `VITE_API_BASE_URL` — backend base URL. `http://localhost:3000` for local dev
  (`.env.example`); the production value (`https://omniport.online/api`) lives in
  the committed `.env.production`, baked into the bundle by `vite build`.
- Google sign-in is **backend-driven** (OAuth redirect flow) — the frontend needs
  no Google config. The "Continue with Google" button navigates to the backend;
  enable it by setting `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` /
  `GOOGLE_CALLBACK_URL` / `GOOGLE_POST_LOGIN_REDIRECT` on the backend.

## Commands

```bash
pnpm dev        # start the Vite dev server
pnpm build      # tsc --noEmit && vite build
pnpm test       # run the Vitest unit/component suite (jsdom + MSW)
pnpm test:e2e   # Playwright e2e — needs the backend AND the dev server running
pnpm gen:api    # regenerate src/lib/api/generated.ts from the live backend's docs-json
```

Other useful scripts: `pnpm typecheck` (`tsc --noEmit` alone), `pnpm test:watch`,
`pnpm preview` (preview a production build).
