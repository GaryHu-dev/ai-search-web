# GEO Web — Architecture

The frontend for **GEO**, a Generative Engine Optimization platform. This
milestone is a React SPA that exercises the existing backend end to end (auth,
account, files) and is built as the growable foundation for the GEO product.

- **Stack:** Vite · React 18 · TypeScript · React Router · TanStack Query ·
  react-hook-form + zod · Tailwind CSS · Vitest + Testing Library + MSW ·
  Playwright (e2e). Package manager: pnpm.
- **Backend:** `ai-search-api` (NestJS). Contract: `ai-search-api/docs/frontend-integration.md`.

---

## 1. Directory layout

```
src/
  main.tsx              App entry — mounts the provider tree
  App.tsx               RouterProvider (createBrowserRouter)
  router.tsx            Route table + ProtectedRoute gate
  vite-env.d.ts         Types for import.meta.env

  lib/
    api/
      types.ts          Envelope + auth token types (hand-written)
      token-store.ts    Plan-A storage: access in memory, refresh in localStorage
      client.ts         apiFetch — the single HTTP entry point
    auth/
      auth-context.tsx  AuthProvider + useAuth(): session state & actions
    theme/
      theme-context.tsx ThemeProvider + useTheme(): light/dark/system

  components/           App-wide UI primitives
    toast.tsx           ToastProvider + useToast()  (graceful no-op fallback)
    confirm.tsx         ConfirmProvider + useConfirm() (falls back to window.confirm)
    ErrorBoundary.tsx    Class component: catches render errors, shows a fallback
    ThemeToggle.tsx      Light/dark/system control, wired to useTheme()
    Spinner.tsx  icons.tsx

  layouts/
    AppShell.tsx        Authenticated shell: collapsible sidebar, topbar, notifications

  features/             One folder per product area (self-contained)
    auth/               login/register, Google sign-in, zod schemas
    overview/           dashboard landing + visibility preview card
    files/              upload / list / search / sort / download / delete
    account/            profile edit + delete account
    optimize/           GEO audit: URL form, create → poll → findings, history
    # visibility/ competitors/  ← future GEO features slot in here

  styles/
    tokens.css          Design tokens (light + dark), reduced-motion
    index.css           Tailwind layers, .grad-primary, tiles, keyframes, skeleton

  test/
    setup.ts            jsdom localStorage shim + MSW lifecycle
    msw/                request handlers modelling the backend envelope
```

**Rule of thumb:** feature code lives under `features/<area>/`; anything shared by
two+ areas graduates to `lib/` (logic) or `components/` (UI). Files that change
together live together.

---

## 2. Provider composition (`main.tsx`)

```
<ThemeProvider>              // applies data-theme; independent of everything else
  <QueryClientProvider>      // TanStack Query cache
    <AuthProvider>           // session; calls apiFetch on bootstrap
      <ToastProvider>        // transient feedback
        <ConfirmProvider>    // promise-based modal confirm
          <ErrorBoundary>    // catches render errors below it
            <App />          // RouterProvider
```

Order matters only where a provider consumes another: `AuthProvider` uses the
query client’s peers indirectly but not directly, so it sits inside
`QueryClientProvider`. `Toast`/`Confirm` are leaf providers used by feature pages.
`ErrorBoundary` sits innermost (just outside `App`) so it can catch render errors
from routed pages without also swallowing errors from the providers above it.

---

## 3. The API client (`lib/api/client.ts`)

`apiFetch<T>(path, init)` is the **only** way the app talks to the backend. It:

1. Prepends `VITE_API_BASE_URL` (default `http://localhost:3000`).
2. Attaches `Authorization: Bearer <access>` when an access token is in memory.
3. JSON-encodes plain-object bodies; passes `FormData` through untouched (so the
   browser sets the multipart boundary for uploads).
4. **Unwraps the success envelope** `{ data, requestId }` → returns `data`.
5. On a non-2xx, throws `ApiError` carrying the error envelope
   `{ statusCode, error, message, requestId, … }` (`message` may be `string[]`).
6. `raw: true` returns the `Response` (for binary downloads) and still throws
   `ApiError` on a failed status.

### 401 → refresh → retry (Plan A)

```
apiFetch(protected)
  └─ 401 and a refresh token exists?
       └─ refreshTokens()  ── single-flight (one shared promise for concurrent 401s)
            ├─ POST /v1/auth/refresh { refreshToken }
            ├─ success → setTokens(newPair)   // rotation: refresh is single-use
            └─ failure → clearTokens() + onAuthFailure()  (once)
       └─ retry the original request once with the rotated access token
            └─ still 401 → clearTokens() + onAuthFailure()  (dead session)
```

The refresh token **rotates** on every use (the backend 401s a reused one), so the
store always overwrites with the freshly issued pair. `setOnAuthFailure()` lets the
auth layer force a logout when refresh fails.

---

## 4. Auth (`lib/auth/auth-context.tsx`, Plan A)

- **Access token:** in-memory module variable (gone on reload).
- **Refresh token:** `localStorage['geo.refreshToken']` (survives reload).
- **Bootstrap on load:** if a refresh token exists, call `GET /v1/users/me`; the
  client’s 401→refresh path mints a fresh access token, so a reload stays signed in.
- **afterTokens():** set the access token first (needed by `me()`), then persist the
  refresh token **only after `me()` succeeds** — a login whose `me()` fails leaves
  no usable token behind.
- **logout():** best-effort `POST /v1/auth/logout`, then always clear local state
  (the network call is allowed to fail, e.g. right after account deletion).

`useAuth()` exposes `{ status: 'loading'|'authenticated'|'anonymous', user, login,
register, loginWithGoogle, logout, setUser }`.

---

## 5. Routing (`router.tsx`)

- `/login` → `LoginPage` (public).
- `/` → `ProtectedRoute` → `AppShell` with child routes: index `OverviewPage`,
  `files` `FilesPage`, `optimize` `OptimizePage`, `account` `AccountPage`.
- `ProtectedRoute` renders nothing while `status === 'loading'`, redirects to
  `/login` when `anonymous`, else renders children.

---

## 6. Server state (TanStack Query)

Feature data uses Query hooks in `features/<area>/queries.ts`, all built on
`apiFetch`:

- **Files:** `useFiles` is an **infinite query** for cursor pagination
  (`getNextPageParam: p => p.nextCursor ?? undefined`). `useUploadFile` /
  `useDeleteFile` mutate then `invalidateQueries(['files'])` (prefix match).
  `downloadFile` uses `raw:true` → blob → anchor click (revoke deferred).
- **Account:** `useUpdateProfile` (PATCH) / `useDeleteAccount` (DELETE). The updated
  user is written back into `AuthProvider` via `setUser` (single source of truth).
- **Optimize (GEO audit):** `useCreateAudit` (`POST /v1/audits`) kicks off an audit
  for a URL; `useAudit` (`GET /v1/audits/:id`) polls via `refetchInterval` until the
  status is terminal (`COMPLETED`/`FAILED`), then renders the six finding
  dimensions generically (`findings.map`, no hardcoded dimension list); `useAudits`
  (`GET /v1/audits`) is a cursor-paginated **infinite query**, like `useFiles`, and
  backs the run history list.

Local UI state (form values, search box, toggles) stays in components /
react-hook-form; server state stays in Query.

---

## 7. Design system & theming

- **Tokens** (`styles/tokens.css`) are CSS custom properties on `:root`, redefined
  under `@media (prefers-color-scheme: dark)` **and** `:root[data-theme="dark"|"light"]`
  so the in-app toggle overrides the OS preference in both directions.
- Components style **through tokens** (Tailwind maps `bg-card`, `text-ink`, `bg-hi`,
  … to the vars), so a palette change is a token edit, not a component sweep.
- Signature: electric-violet accent (`--hi` `#5B4BF0`), gradient primary actions
  (`.grad-primary`), and the `--c1/c2/c3` data colours (teal/blue/amber).
- **Typography:** self-hosted variable fonts via `@fontsource-variable` — **Inter**
  for body/UI, **Space Grotesk** for headings (`h1/h2/h3` and `.font-display`).
- **ThemeProvider** persists `light|dark|system` to `localStorage['geo.theme']`
  and toggles `data-theme`. `index.html` applies the saved theme **before first
  paint** to avoid a flash.

### UI primitives (graceful, provider-optional)

- **Toast** — `useToast()('success'|'error'|'info', msg)`. No provider ⇒ no-op
  (keeps unit tests provider-free).
- **Confirm** — `useConfirm()(opts): Promise<boolean>`, a styled modal. No provider
  ⇒ falls back to `window.confirm` (so existing tests that mock `window.confirm`
  still pass unchanged).

---

## 8. Google sign-in (`features/auth/google.ts`)

Enabled only when `VITE_GOOGLE_CLIENT_ID` is set. Loads Google Identity Services
once, initialises with the client id, and renders Google’s official button
transparently over our styled “Continue with Google” button (so styling is ours,
the ID-token flow is Google’s). The returned ID token goes to
`loginWithGoogle` → `POST /v1/auth/google`. Activation also requires the backend’s
`GOOGLE_CLIENT_ID` and the app origin in the client’s Authorized JavaScript origins.

---

## 9. Testing

- **Unit / component:** Vitest + Testing Library, jsdom. **MSW** models the backend
  envelope in `test/msw/handlers.ts`; per-test overrides via `server.use(...)`.
  `test/setup.ts` installs a deterministic in-memory `localStorage` and the MSW
  lifecycle. Priority coverage: client refresh/rotation/single-flight, auth
  bootstrap, form error mapping, files pagination, profile update.
- **Layout:** tests live next to the code they cover, in a per-directory
  `__tests__/` folder — e.g. `src/lib/api/__tests__/client.test.ts`,
  `src/lib/auth/__tests__/auth-context.test.tsx`,
  `src/features/optimize/__tests__/queries.test.tsx`. Shared test infrastructure
  (Vitest setup, MSW server + handlers) lives in `src/test/`, not next to any one
  feature.
- **End-to-end:** Playwright (`e2e/flows.mjs`, run via `pnpm test:e2e`) drives real
  Chrome against the running backend (register → login →
  upload/search/download/delete → rename → logout → error states). Needs a live
  backend and dev server; run ad hoc during integration, not part of `pnpm test`.

---

## 10. Environment & scripts

`.env` (see `.env.example`):
- `VITE_API_BASE_URL` — backend base URL (default `http://localhost:3000`).
- `VITE_GOOGLE_CLIENT_ID` — optional; enables the Google button.

Scripts: `pnpm dev` · `pnpm build` (tsc + vite) · `pnpm test` · `pnpm typecheck` ·
`pnpm gen:api` (regenerate `lib/api/generated.ts` from the live `docs-json`).

---

## 11. Conventions

- All network I/O goes through `apiFetch`; never call `fetch` from a component.
- Server state → TanStack Query; session → `useAuth`; theme → `useTheme`;
  transient feedback → `useToast`; destructive confirms → `useConfirm`.
- Style through tokens/Tailwind mapped colours; avoid hardcoded hex except in the
  fixed brand gradient and the theme-aware `.tile-*` / data-colour classes.
- New product areas: add `features/<area>/` and a nav entry; the sidebar reserves
  “coming soon” slots for the GEO features.
