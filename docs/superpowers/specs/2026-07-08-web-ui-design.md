# GEO — Web Frontend Design Spec (Milestone 1)

> **Archived** — from the earlier GEO milestone, superseded by the Omniport
> content-operations platform. Kept for history; not the current design.

**Status:** approved design, ready for implementation plan
**Date:** 2026-07-08
**Repo:** `ai-search-web` (branch `dev`)
**Backend:** `ai-search-api` (`saas-api` foundation) — see its `docs/frontend-integration.md` + `http://localhost:3000/docs-json`

---

## 1. Product context

**GEO** (working name) is a *Generative Engine Optimization* platform. It does two things:

1. **Visibility tracking** — monitor how often a brand/website is mentioned or cited in AI-search answers (ChatGPT, Perplexity, Google AI Overviews): share of citations, competitors, change over time.
2. **Content optimization** — surface what's missing so the brand gets cited more often ("enter a website → see what's missing").

This web app is the **product foundation**, not a throwaway. It is built to grow into the full platform.

### Milestone 1 (this spec)

Build the app shell + the screens that **exercise and validate the existing backend API** end-to-end from a real browser: **auth, account, files**. The GEO features are represented only as a *coming-soon* entry point; they get their own spec later.

**In scope:** Login/Register, Overview (dashboard shell), Files (upload/list/search/sort/paginate/download/delete), Account (view/edit display name, delete account).
**Out of scope:** any GEO analysis backend/UI, marketing/SEO site, team/multi-user, billing.

---

## 2. Tech stack (decided)

| Layer | Choice | Rationale |
|---|---|---|
| Build/framework | **Vite + React + TypeScript** | Fast, standard SPA foundation |
| Routing | **React Router** | SPA routing; room for GEO routes later |
| Server state | **TanStack Query** | Request/cache/retry/invalidation; avoids hand-rolled state |
| API types | **openapi-typescript** generated from `docs-json` | Types always in sync with backend; regenerate on backend change |
| API client | **Typed `fetch` wrapper** | Envelope unwrap, Bearer header, 401→refresh→retry with rotation |
| Forms | **react-hook-form + zod** | Validation for auth/profile; scales as product adds forms |
| Styling | **Tailwind CSS + shadcn/ui** | Design control; shadcn components are copied into the repo (not a heavy dep) |
| Package manager | **pnpm** | Matches backend |
| Testing | **Vitest + React Testing Library + MSW** | TDD; MSW mocks the API envelope/refresh flows |
| Deploy target | **Cloudflare Pages** (later) | — |

---

## 3. Architecture

### Folder structure (feature-first, growable)

```
src/
  main.tsx
  App.tsx
  router.tsx
  lib/
    api/
      generated.ts        # openapi-typescript output (do not hand-edit)
      client.ts           # typed fetch: envelope unwrap + Bearer + 401 refresh/retry
      queries.ts          # TanStack Query hooks (useMe, useFiles, mutations)
    auth/
      token-store.ts      # Plan A: access in memory, refresh in localStorage
      auth-context.tsx    # session state, bootstrap-on-load, login/logout
  features/
    auth/                 # login, register, Google
    account/              # view/edit/delete self
    files/                # upload, list, download, delete
    # visibility/ competitors/ optimize/  <- future GEO features
  components/ui/          # shadcn components (Button, Input, Tabs, Card, ...)
  layouts/
    AppShell.tsx          # sidebar + topbar; nav has reserved GEO slots
  styles/
    tokens.css            # design tokens (below), imported by Tailwind config
```

### API client & auth (Plan A) — the part types don't capture

Full endpoint/envelope reference: backend `docs/frontend-integration.md`. Key client behavior:

- **Base URL** `http://localhost:3000`; all business routes under `/v1`; health unversioned.
- **Success envelope** `{ data, requestId }` → client returns `.data`. **Error envelope** `{ statusCode, error, message, requestId, path, timestamp }` (`message` may be `string[]`). **Raw (not enveloped):** file downloads (binary), health.
- **Auth tokens** `{ accessToken, refreshToken, tokenType, expiresIn }`.
- **Storage (Plan A):** access token in memory; refresh token in `localStorage`.
- **Every protected request:** `Authorization: Bearer <accessToken>`.
- **On 401:** call `/v1/auth/refresh` once → store the *new* pair (refresh is **single-use / rotating**, must overwrite) → retry original request. Use **single-flight** so concurrent 401s trigger one refresh. If refresh fails → clear tokens → redirect to `/login`.
- **On app load:** if a refresh token exists in `localStorage`, refresh once to get an access token before rendering protected routes (survives page reload). Reused/spent refresh token → 401 and whole session revoked (by design).
- **Logout:** `POST /v1/auth/logout { refreshToken }` then clear local state.
- **Strict validation:** backend rejects unknown body fields (`400`, `message: string[]`); send only documented fields. Download/delete `:id` must be a UUID (malformed → `400`, unknown → `404`).

### Routes

`/login` · `/` (Overview) · `/files` · `/account`. Unauthenticated access to protected routes → redirect `/login`. Health/GEO routes reserved.

---

## 4. Design system

Direction: **bright, friendly, user-facing product** (explicitly *not* a dark developer/terminal tool). Signature device: a **highlighter mark** — the brand's name is "highlighted" like a cited passage in an AI answer. One bold thing (the highlighter/citation motif); everything else quiet.

### Color tokens

**Light (default):**
```
--bg:#F4F6F5  --sidebar:#FFFFFF  --card:#FFFFFF  --card-2:#F5F7F8  --tint:#FBF6E4
--ink:#1B2230  --muted:#5B6674  --faint:#8A94A2
--line:#E4E8EC  --line-strong:#D6DCE2
--hi:#FFD24A          /* highlighter yellow — signature, highlights & active state */
--hi-soft:#FFF3CE     /* soft yellow fill (active nav, tags) */
--hi-deep:#EAB308     /* accessible yellow for text/icons/focus */
--primary:#1B2230     /* ink — primary buttons */   --primary-ink:#FFFFFF
--good:#12A36F  --good-soft:#E3F5EC     /* positive / "cited" */
--bad:#D5502E   --bad-soft:#FBE9E4      /* danger / destructive */
--focus:#EAB308
```
**Dark (via `prefers-color-scheme` + `data-theme` toggle):**
```
--bg:#12161D  --sidebar:#161B23  --card:#1B222C  --card-2:#161C24  --tint:#231F12
--ink:#EAEEF3  --muted:#9AA4B2  --faint:#6C7580  --line:#262E39  --line-strong:#333C48
--hi:#FFD24A  --hi-soft:#2C2717  --hi-deep:#FFDE6B
--primary:#FFD24A  --primary-ink:#1B2230   /* primary flips to yellow in dark */
--good:#3FC48A  --good-soft:#173226  --bad:#F0785A  --bad-soft:#331A12  --focus:#FFD24A
```
Both themes are first-class. Token-level theming: define on `:root`, override under `@media (prefers-color-scheme:dark)` **and** `:root[data-theme="dark"|"light"]` so the viewer toggle wins.

### Typography

- **Family:** General Sans (display + body); fallback `Satoshi, ui-sans-serif, system-ui, …`. **Self-host / embed** the font in production (no external CDN). No monospace — it read as "developer tool" and was dropped.
- **Scale:** display/H2 ~24–30px / 700–750 / letter-spacing −0.02em; section title ~15–17px / 680; body 14–15px; label 12.5px / 600; small 11.5–13px. Headings use `text-wrap: balance`.

### Shape, spacing, motion

- Radius: inputs/buttons 10–11px; cards 16px; pills 999px; file tiles 9px.
- Card shadow: soft, low (`0 10px 30px -20px rgba(27,34,48,.3)`).
- Motion: gentle load reveal (fade/rise, staggered); highlighter "swipe" wipes across the marked word on load. **Respect `prefers-reduced-motion`** (content visible without animation).
- Quality floor: responsive to mobile, visible keyboard focus (`--focus` ring), `min-width:0` on flex/grid children to prevent overflow. **Cascade rule:** responsive/override media queries go **after** base component rules (a media query adds no specificity).

### Core components

Button (`primary` ink / `ghost` outline / `danger` / `sm`), Input (+ password show/hide, search, url-prefix), Tabs (segmented), Card, Sidebar nav item (active = `--hi-soft` bg + `--hi-deep` icon; `soon` = greyed + "SOON" tag), User chip, Topbar, File type tile (PDF/DOC/ZIP/PNG/CSV color-coded), Pill (engine + green check), Chip (`✓ cited` green), Highlighter `<mark>`, Danger zone, Dropzone, File table.

---

## 5. Screens & behavior

### 5.1 Login / Register (`/login`)
- Split layout. **Left showcase:** brand + a friendly "AI Answer" card with the brand **highlighted** and a green `✓ cited` chip; a friendly stat ("42% of AI answers in your category mention your brand" + progress bar); engine pills (ChatGPT ✓ / Perplexity ✓ / AI Overviews); warm tagline. **Right:** auth card.
- Tabs **Sign in / Create account**. Sign in: email + password. Register: email + password (zod 8–128) + optional display name. **Continue with Google** (Google Identity Services → `idToken` → `/v1/auth/google`; hidden/disabled if backend has no `GOOGLE_CLIENT_ID`).
- **States:** field validation (zod); inline error from envelope `message` — `401` "Invalid email or password", `429` locked/too many attempts, `409` email already registered (register); submit loading; success → store tokens → redirect `/`.

### 5.2 Overview (`/`)
- App shell (sidebar + topbar). Greeting from `GET /v1/users/me`.
- **GEO entry (coming soon):** hero card "Start tracking your AI visibility" with `https:// yourdomain.com` input + Analyze, `✦ Coming soon` tag. Non-functional in M1 — the product's core loop, shown honestly as future.
- **Files card:** count + 3 most-recent files (from list) + "View all" → `/files`.
- **Account card:** avatar, email, plan, "Manage" → `/account`.

### 5.3 Files (`/files`) — richest working screen
- Toolbar: **search** (`?search=` filename, case-insensitive) + **sort** dropdown (Newest `-createdAt` / Name / Size — allowed sort fields: `createdAt`, `filename`, `size`).
- **Upload:** dropzone + button → `multipart/form-data`, field **`file`**, ≤10 MB; `400` if missing, `503` if storage unconfigured. Optimistic/refetch list on success.
- **List:** table (type tile, name, size, uploaded date, row actions). Cursor pagination: "Load more" using `nextCursor`; `nextCursor === null` = last page. "Showing N of …".
- **Row actions:** **Download** (raw binary, `Content-Disposition` attachment — not enveloped) · **Delete** (`204`, confirm first).
- **States:** empty ("No files yet — upload your first"), loading skeleton rows, upload error (size/type/503), download in-progress.

### 5.4 Account (`/account`)
- **Profile:** avatar, name/email; **display name** editable (`PATCH /v1/users/me { displayName }`, max 100); **email** read-only (backend can't change it). Save/Cancel; success toast; validation error inline.
- **Plan:** Free + member since (read-only in M1).
- **Danger zone:** **Delete account** (`DELETE /v1/users/me` → `204`, soft delete) — confirm modal, then clears session and redirects to `/login` (login is subsequently blocked for that account).

### Global
- Surface `requestId` (from `x-request-id` / error envelope) in error toasts for support tracing.
- Mobile: sidebar collapses (needs a menu/drawer + a way to reach logout — to handle in build).
- Toaster for success/error; confirm dialogs for destructive actions.

---

## 6. Testing (TDD)

Vitest + RTL; **MSW** mocks the backend per the envelope contract. Write tests first. Priority coverage:
- API client: envelope unwrap; 401 → **single-flight** refresh → retry; refresh **rotation** (store new pair); refresh-fail → logout.
- Auth: bootstrap-on-load refresh; login/register/logout flows; error mapping (401/409/429).
- Files: cursor pagination (`nextCursor`), search/sort params, upload field name, download not unwrapped.
- Account: display-name update, delete → session cleared.

---

## 7. References
- Backend API + envelope + auth contract: `ai-search-api/docs/frontend-integration.md`
- OpenAPI spec (types source): `http://localhost:3000/docs-json`
- Clickable UX prototypes: login + app (Overview/Files/Account) — Artifacts produced during design.
