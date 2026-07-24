# Omniport Web

The frontend for **Omniport**, a **content-operations platform** for Shopify &
WordPress stores. Omniport runs a store's content end to end — set a strategy,
generate and optimize posts, publish on a schedule, and report on results. Search
and AI-answer (GEO/SEO) optimization is one capability inside that workflow, not
the whole product.

Auth (Google sign-in), account, notifications, and the Optimize audit are wired to
the backend end to end. Dashboard and the Content workbench are currently
**presentational (mock data)**, pending their content APIs; they share the real
app shell, routing, design system, and tests.

See [`docs/product.md`](docs/product.md) for the product overview (what it is, who
it's for, the capability map, and what's built vs planned), and
[`docs/architecture.md`](docs/architecture.md) for the engineering design (routing,
provider composition, API client, auth, testing conventions, etc.).

## Stack

- Vite · React 18 · TypeScript · React Router
- TanStack Query (server state) · react-hook-form + zod
- Tailwind CSS
- Vitest + Testing Library + MSW (unit/component tests)
- Playwright (e2e smoke)
- Package manager: **pnpm**

## Prerequisites

- Node.js (see `package.json` / your local toolchain for the exact version)
- pnpm
- The backend, [`ai-search-api`](../ai-search-api), running locally on `:3000`
  (needed for real Google sign-in and the account area; the mock-data surfaces
  render without it)

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
  `GOOGLE_CALLBACK_URL` / `GOOGLE_POST_LOGIN_REDIRECT` on the backend. For local
  login the backend's `GOOGLE_CALLBACK_URL` must point at `localhost:3000` and be
  an authorized redirect URI in the Google Cloud OAuth client.

## Commands

```bash
pnpm dev        # start the Vite dev server
pnpm build      # tsc --noEmit && vite build
pnpm test       # run the Vitest unit/component suite (jsdom + MSW)
pnpm test:e2e   # Playwright smoke — needs the dev server running (Google-only auth)
pnpm gen:api    # regenerate src/lib/api/generated.ts from the live backend's docs-json
```

Other useful scripts: `pnpm typecheck` (`tsc --noEmit` alone), `pnpm test:watch`,
`pnpm preview` (preview a production build).
