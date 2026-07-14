# GEO Web — Foundation + Auth Implementation Plan (Plan 1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the GEO React+Vite SPA and ship a working Login/Register flow against the existing backend, with a typed API client that handles the response envelope and Plan-A auth (single-flight refresh + rotation + bootstrap-on-load).

**Architecture:** Vite + React + TypeScript SPA. A single typed `fetch` wrapper (`lib/api/client.ts`) unwraps the `{data}` envelope, attaches the Bearer token, and transparently refreshes on 401. Auth state lives in a React context; the access token is held in memory and the rotating refresh token in `localStorage`. React Router gates protected routes. TanStack Query owns server state; react-hook-form + zod own form state. TDD throughout with Vitest + React Testing Library + MSW.

**Tech Stack:** Vite, React 18, TypeScript, React Router, TanStack Query, openapi-typescript, react-hook-form, zod, Tailwind CSS, shadcn/ui, Vitest, React Testing Library, MSW, pnpm.

## Global Constraints

- **Package manager:** pnpm. Node 20+.
- **API base URL:** `import.meta.env.VITE_API_BASE_URL` (default `http://localhost:3000`). All business routes are prefixed `/v1`.
- **Success envelope:** `{ data, requestId }` → client returns `.data`. **Error envelope:** `{ statusCode, error, message, requestId, path, timestamp }`; `message` may be `string | string[]`.
- **Not enveloped:** binary downloads, `/health/*` (not used in this plan).
- **Auth tokens shape:** `{ accessToken: string; refreshToken: string; tokenType: string; expiresIn: number }`.
- **Plan A storage:** access token in memory only; refresh token in `localStorage` key `geo.refreshToken`.
- **Auth rules:** send `Authorization: Bearer <access>` on protected calls; on `401` refresh **once** via `/v1/auth/refresh` (single-flight for concurrent 401s), **overwrite** stored tokens (refresh is single-use/rotating), retry once; on refresh failure clear tokens and force logout. Reused refresh → 401 revokes session.
- **Strict payloads:** send only documented DTO fields (backend rejects unknown fields with `400`).
- **Endpoints used here:** `POST /v1/auth/register`, `POST /v1/auth/login`, `POST /v1/auth/google`, `POST /v1/auth/refresh`, `POST /v1/auth/logout`, `GET /v1/users/me`.
- **Design tokens:** use the exact hex values from the design spec (`docs/superpowers/specs/2026-07-08-web-ui-design.md` §4). Both light and dark themes; respect `prefers-reduced-motion`; visible focus ring.
- **Commits:** author is the repo owner only; **no `Co-Authored-By` trailer**. Conventional-commit messages.

---

## File Structure

```
package.json, pnpm-lock.yaml, vite.config.ts, tsconfig.json, tailwind.config.ts, postcss.config.js
index.html
.env.example
src/
  main.tsx                     # React root, providers
  App.tsx                      # RouterProvider
  router.tsx                   # routes + ProtectedRoute
  styles/tokens.css            # design tokens (light/dark), base layer
  styles/index.css             # tailwind directives + tokens import
  lib/api/
    types.ts                   # hand-written envelope + auth types (until generated.ts exists)
    token-store.ts             # Plan A storage
    client.ts                  # apiFetch, ApiError, refresh single-flight
  lib/auth/
    auth-context.tsx           # AuthProvider + useAuth
  features/auth/
    schemas.ts                 # zod schemas
    LoginPage.tsx              # split layout: Showcase + AuthCard
    Showcase.tsx               # left brand/answer panel
    AuthCard.tsx               # tabs + forms + Google
    google.ts                  # Google Identity Services loader (conditional)
  layouts/AppShell.tsx         # minimal shell (sidebar+topbar) as post-login target
  components/ui/               # shadcn: button, input, tabs, label, card
  test/setup.ts                # vitest + jsdom + MSW server
  test/msw/handlers.ts         # default MSW handlers for the backend
```

---

### Task 1: Scaffold project + test harness

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.env.example`, `src/main.tsx`, `src/App.tsx`, `src/styles/index.css`, `src/test/setup.ts`, `src/smoke.test.ts`

**Interfaces:**
- Produces: a bootable Vite app and a working `pnpm test` (Vitest + jsdom).

- [ ] **Step 1: Create the project and install deps**

```bash
pnpm create vite@latest . --template react-ts
pnpm add react-router-dom @tanstack/react-query react-hook-form zod
pnpm add -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom msw tailwindcss postcss autoprefixer openapi-typescript
```

- [ ] **Step 2: Configure Vitest (jsdom + setup file)**

`vite.config.ts`:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

`src/test/setup.ts` (MSW server wired in Task 6; start with jest-dom only):
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Add the `.env.example` and test script**

`.env.example`:
```
VITE_API_BASE_URL=http://localhost:3000
```

Add to `package.json` `scripts`: `"test": "vitest run"`, `"test:watch": "vitest"`, `"gen:api": "openapi-typescript http://localhost:3000/docs-json -o src/lib/api/generated.ts"`.

- [ ] **Step 4: Write the smoke test**

`src/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs the test harness', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Run it to verify it passes**

Run: `pnpm test`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite react-ts app with vitest harness"
```

---

### Task 2: Design tokens + Tailwind theme

**Files:**
- Create: `src/styles/tokens.css`, `tailwind.config.ts`, `postcss.config.js`
- Modify: `src/styles/index.css`

**Interfaces:**
- Produces: CSS variables `--bg, --card, --ink, --muted, --line, --hi, --hi-soft, --hi-deep, --primary, --primary-ink, --good, --bad, --focus` (etc.) on `:root`, flipped for dark; Tailwind colors mapped to them.

- [ ] **Step 1: Write the failing test**

`src/styles/tokens.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

describe('design tokens', () => {
  const css = readFileSync('src/styles/tokens.css', 'utf8')
  it('defines the signature highlighter token', () => {
    expect(css).toMatch(/--hi:\s*#FFD24A/i)
  })
  it('defines a dark override for background', () => {
    expect(css).toMatch(/\[data-theme="dark"\][\s\S]*--bg:\s*#12161D/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/styles/tokens.test.ts`
Expected: FAIL (file not found / no match).

- [ ] **Step 3: Create tokens.css (values verbatim from spec §4)**

`src/styles/tokens.css`:
```css
:root{
  --bg:#F4F6F5; --sidebar:#FFFFFF; --card:#FFFFFF; --card-2:#F5F7F8; --tint:#FBF6E4;
  --ink:#1B2230; --muted:#5B6674; --faint:#8A94A2;
  --line:#E4E8EC; --line-strong:#D6DCE2;
  --hi:#FFD24A; --hi-soft:#FFF3CE; --hi-deep:#EAB308;
  --primary:#1B2230; --primary-ink:#FFFFFF;
  --good:#12A36F; --good-soft:#E3F5EC; --bad:#D5502E; --bad-soft:#FBE9E4; --focus:#EAB308;
}
@media (prefers-color-scheme:dark){
  :root{
    --bg:#12161D; --sidebar:#161B23; --card:#1B222C; --card-2:#161C24; --tint:#231F12;
    --ink:#EAEEF3; --muted:#9AA4B2; --faint:#6C7580; --line:#262E39; --line-strong:#333C48;
    --hi:#FFD24A; --hi-soft:#2C2717; --hi-deep:#FFDE6B; --primary:#FFD24A; --primary-ink:#1B2230;
    --good:#3FC48A; --good-soft:#173226; --bad:#F0785A; --bad-soft:#331A12; --focus:#FFD24A;
  }
}
:root[data-theme="light"]{ --bg:#F4F6F5; --sidebar:#FFFFFF; --card:#FFFFFF; --card-2:#F5F7F8; --tint:#FBF6E4; --ink:#1B2230; --muted:#5B6674; --faint:#8A94A2; --line:#E4E8EC; --line-strong:#D6DCE2; --hi:#FFD24A; --hi-soft:#FFF3CE; --hi-deep:#EAB308; --primary:#1B2230; --primary-ink:#FFFFFF; --good:#12A36F; --good-soft:#E3F5EC; --bad:#D5502E; --bad-soft:#FBE9E4; --focus:#EAB308; }
:root[data-theme="dark"]{ --bg:#12161D; --sidebar:#161B23; --card:#1B222C; --card-2:#161C24; --tint:#231F12; --ink:#EAEEF3; --muted:#9AA4B2; --faint:#6C7580; --line:#262E39; --line-strong:#333C48; --hi:#FFD24A; --hi-soft:#2C2717; --hi-deep:#FFDE6B; --primary:#FFD24A; --primary-ink:#1B2230; --good:#3FC48A; --good-soft:#173226; --bad:#F0785A; --bad-soft:#331A12; --focus:#FFD24A; }

@media (prefers-reduced-motion:reduce){ *{ animation:none !important; transition:none !important; } }
```

- [ ] **Step 4: Map tokens in Tailwind + wire CSS**

`tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', card: 'var(--card)', ink: 'var(--ink)', muted: 'var(--muted)',
        line: 'var(--line)', hi: 'var(--hi)', 'hi-soft': 'var(--hi-soft)', 'hi-deep': 'var(--hi-deep)',
        primary: 'var(--primary)', good: 'var(--good)', bad: 'var(--bad)',
      },
      fontFamily: { sans: ['"General Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config
```
`postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```
`src/styles/index.css`:
```css
@import './tokens.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
body{ background:var(--bg); color:var(--ink); font-family:theme('fontFamily.sans'); }
```
Import `./styles/index.css` in `src/main.tsx`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/styles/tokens.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add design tokens and tailwind theme"
```

---

### Task 3: API types + token store (Plan A)

**Files:**
- Create: `src/lib/api/types.ts`, `src/lib/api/token-store.ts`, `src/lib/api/token-store.test.ts`

**Interfaces:**
- Produces: `AuthTokens`, `ApiErrorBody` types; and token-store functions:
  `getAccessToken(): string | null`, `setAccessToken(t: string | null): void`,
  `getRefreshToken(): string | null`, `setTokens(t: AuthTokens): void`, `clearTokens(): void`.

- [ ] **Step 1: Write the failing test**

`src/lib/api/token-store.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './token-store'

describe('token store (Plan A)', () => {
  beforeEach(() => { clearTokens(); localStorage.clear() })

  it('keeps the access token in memory only (not localStorage)', () => {
    setTokens({ accessToken: 'a1', refreshToken: 'r1', tokenType: 'Bearer', expiresIn: 900 })
    expect(getAccessToken()).toBe('a1')
    expect(localStorage.getItem('geo.refreshToken')).toBe('r1')
    expect(Object.values(localStorage).some(v => v === 'a1')).toBe(false)
  })

  it('reads the refresh token back from localStorage', () => {
    localStorage.setItem('geo.refreshToken', 'persisted')
    expect(getRefreshToken()).toBe('persisted')
  })

  it('clears both on clearTokens', () => {
    setTokens({ accessToken: 'a', refreshToken: 'r', tokenType: 'Bearer', expiresIn: 900 })
    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/api/token-store.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write types and implementation**

`src/lib/api/types.ts`:
```ts
export interface AuthTokens { accessToken: string; refreshToken: string; tokenType: string; expiresIn: number }
export interface ApiErrorBody { statusCode: number; error: string; message: string | string[]; requestId?: string; path?: string; timestamp?: string }
export interface Envelope<T> { data: T; requestId?: string }
```
`src/lib/api/token-store.ts`:
```ts
import type { AuthTokens } from './types'

const REFRESH_KEY = 'geo.refreshToken'
let accessToken: string | null = null

export function getAccessToken(): string | null { return accessToken }
export function setAccessToken(t: string | null): void { accessToken = t }
export function getRefreshToken(): string | null { return localStorage.getItem(REFRESH_KEY) }
export function setRefreshToken(t: string | null): void {
  if (t === null) localStorage.removeItem(REFRESH_KEY)
  else localStorage.setItem(REFRESH_KEY, t)
}
export function setTokens(t: AuthTokens): void { setAccessToken(t.accessToken); setRefreshToken(t.refreshToken) }
export function clearTokens(): void { setAccessToken(null); setRefreshToken(null) }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/lib/api/token-store.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add api types and Plan A token store"
```

---

### Task 4: MSW test server + backend handlers

**Files:**
- Create: `src/test/msw/handlers.ts`, `src/test/msw/server.ts`
- Modify: `src/test/setup.ts`

**Interfaces:**
- Produces: `server` (MSW `setupServer`) started in test setup; default handlers for `POST /v1/auth/login`, `/register`, `/refresh`, `/logout`, `GET /v1/users/me` returning the envelope shape. Later tasks override per-test with `server.use(...)`.

- [ ] **Step 1: Write the handlers**

`src/test/msw/handlers.ts`:
```ts
import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:3000'
const tokens = (n: string) => ({ accessToken: `access-${n}`, refreshToken: `refresh-${n}`, tokenType: 'Bearer', expiresIn: 900 })

export const handlers = [
  http.post(`${BASE}/v1/auth/login`, async () => HttpResponse.json({ data: tokens('1'), requestId: 'req_login' })),
  http.post(`${BASE}/v1/auth/register`, async () => HttpResponse.json({ data: tokens('1'), requestId: 'req_reg' }, { status: 201 })),
  http.post(`${BASE}/v1/auth/google`, async () => HttpResponse.json({ data: tokens('1'), requestId: 'req_g' })),
  http.post(`${BASE}/v1/auth/refresh`, async () => HttpResponse.json({ data: tokens('2'), requestId: 'req_ref' })),
  http.post(`${BASE}/v1/auth/logout`, async () => new HttpResponse(null, { status: 204 })),
  http.get(`${BASE}/v1/users/me`, async () =>
    HttpResponse.json({ data: { id: 'u1', email: 'jane@acme.com', displayName: 'Jane Doe', createdAt: '2026-07-01T00:00:00.000Z' }, requestId: 'req_me' })),
]
```

`src/test/msw/server.ts`:
```ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
export const server = setupServer(...handlers)
```

- [ ] **Step 2: Wire the server into setup**

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

- [ ] **Step 3: Verify the suite still passes**

Run: `pnpm test`
Expected: PASS (existing tests still green; MSW active).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: add MSW server and default backend handlers"
```

---

### Task 5: API client — envelope unwrap + errors

**Files:**
- Create: `src/lib/api/client.ts`, `src/lib/api/client.test.ts`

**Interfaces:**
- Consumes: token-store `getAccessToken`.
- Produces: `class ApiError extends Error { statusCode: number; body: ApiErrorBody }`;
  `apiFetch<T>(path: string, init?: RequestInit & { raw?: boolean }): Promise<T>` — prepends base URL, sets `Authorization` when an access token exists, JSON-encodes object bodies, returns `data` from the envelope, throws `ApiError` on non-2xx. `raw: true` returns the `Response` (for downloads).

- [ ] **Step 1: Write the failing test**

`src/lib/api/client.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { apiFetch, ApiError } from './client'
import { setAccessToken, clearTokens } from './token-store'

const BASE = 'http://localhost:3000'

describe('apiFetch', () => {
  beforeEach(() => { clearTokens() })

  it('unwraps the { data } envelope', async () => {
    server.use(http.get(`${BASE}/v1/users/me`, () => HttpResponse.json({ data: { id: 'u1' }, requestId: 'r' })))
    await expect(apiFetch('/v1/users/me')).resolves.toEqual({ id: 'u1' })
  })

  it('attaches the Bearer token when present', async () => {
    setAccessToken('tok-123')
    let seen: string | null = null
    server.use(http.get(`${BASE}/v1/users/me`, ({ request }) => {
      seen = request.headers.get('authorization')
      return HttpResponse.json({ data: {}, requestId: 'r' })
    }))
    await apiFetch('/v1/users/me')
    expect(seen).toBe('Bearer tok-123')
  })

  it('throws ApiError with the error body on non-2xx', async () => {
    server.use(http.get(`${BASE}/v1/users/me`, () =>
      HttpResponse.json({ statusCode: 409, error: 'Conflict', message: 'nope', requestId: 'r' }, { status: 409 })))
    await expect(apiFetch('/v1/users/me')).rejects.toMatchObject({ statusCode: 409, body: { message: 'nope' } })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/api/client.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the client core (refresh added in Task 6)**

`src/lib/api/client.ts`:
```ts
import type { ApiErrorBody } from './types'
import { getAccessToken } from './token-store'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  statusCode: number
  body: ApiErrorBody
  constructor(body: ApiErrorBody) {
    super(Array.isArray(body.message) ? body.message.join(', ') : body.message)
    this.statusCode = body.statusCode
    this.body = body
  }
}

interface Options extends RequestInit { raw?: boolean }

export async function apiFetch<T>(path: string, init: Options = {}): Promise<T> {
  const res = await doFetch(path, init)
  if (init.raw) return res as unknown as T
  if (res.status === 204) return undefined as T
  const json = await res.json()
  if (!res.ok) throw new ApiError(json as ApiErrorBody)
  return (json as { data: T }).data
}

async function doFetch(path: string, init: Options): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const bodyIsObject = init.body && typeof init.body === 'object' && !(init.body instanceof FormData)
  if (bodyIsObject) headers.set('Content-Type', 'application/json')
  return fetch(`${BASE}${path}`, {
    ...init,
    headers,
    body: bodyIsObject ? JSON.stringify(init.body) : (init.body as BodyInit | undefined),
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/lib/api/client.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: typed api client with envelope unwrap and ApiError"
```

---

### Task 6: 401 → single-flight refresh → retry (rotation)

**Files:**
- Modify: `src/lib/api/client.ts`
- Create: `src/lib/api/client.refresh.test.ts`

**Interfaces:**
- Consumes: token-store `getRefreshToken`, `setTokens`, `clearTokens`.
- Produces: on `401`, `apiFetch` calls `POST /v1/auth/refresh { refreshToken }` **once** (shared promise for concurrent calls), stores the returned pair, and retries the original request once. On refresh failure it clears tokens and calls `onAuthFailure()`. Exports `setOnAuthFailure(fn: () => void)` so the auth layer can force logout.

- [ ] **Step 1: Write the failing tests**

`src/lib/api/client.refresh.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { apiFetch, setOnAuthFailure } from './client'
import { setTokens, getAccessToken, getRefreshToken, clearTokens } from './token-store'

const BASE = 'http://localhost:3000'

describe('apiFetch refresh flow', () => {
  beforeEach(() => {
    clearTokens()
    setTokens({ accessToken: 'stale', refreshToken: 'r-old', tokenType: 'Bearer', expiresIn: 900 })
  })

  it('refreshes on 401, rotates tokens, and retries once', async () => {
    let calls = 0
    server.use(
      http.get(`${BASE}/v1/users/me`, ({ request }) => {
        const auth = request.headers.get('authorization')
        calls++
        if (auth === 'Bearer access-new') return HttpResponse.json({ data: { id: 'u1' }, requestId: 'r' })
        return HttpResponse.json({ statusCode: 401, error: 'Unauthorized', message: 'expired' }, { status: 401 })
      }),
      http.post(`${BASE}/v1/auth/refresh`, () =>
        HttpResponse.json({ data: { accessToken: 'access-new', refreshToken: 'r-new', tokenType: 'Bearer', expiresIn: 900 } })),
    )
    await expect(apiFetch('/v1/users/me')).resolves.toEqual({ id: 'u1' })
    expect(getAccessToken()).toBe('access-new')
    expect(getRefreshToken()).toBe('r-new') // rotated + stored
    expect(calls).toBe(2) // original 401 + retry
  })

  it('refreshes only once for concurrent 401s (single-flight)', async () => {
    let refreshCount = 0
    server.use(
      http.get(`${BASE}/v1/users/me`, ({ request }) =>
        request.headers.get('authorization') === 'Bearer access-new'
          ? HttpResponse.json({ data: { ok: true }, requestId: 'r' })
          : HttpResponse.json({ statusCode: 401, error: 'Unauthorized', message: 'x' }, { status: 401 })),
      http.post(`${BASE}/v1/auth/refresh`, () => {
        refreshCount++
        return HttpResponse.json({ data: { accessToken: 'access-new', refreshToken: 'r-new', tokenType: 'Bearer', expiresIn: 900 } })
      }),
    )
    await Promise.all([apiFetch('/v1/users/me'), apiFetch('/v1/users/me'), apiFetch('/v1/users/me')])
    expect(refreshCount).toBe(1)
  })

  it('clears tokens and calls onAuthFailure when refresh fails', async () => {
    const onFail = vi.fn()
    setOnAuthFailure(onFail)
    server.use(
      http.get(`${BASE}/v1/users/me`, () => HttpResponse.json({ statusCode: 401, error: 'Unauthorized', message: 'x' }, { status: 401 })),
      http.post(`${BASE}/v1/auth/refresh`, () => HttpResponse.json({ statusCode: 401, error: 'Unauthorized', message: 'bad' }, { status: 401 })),
    )
    await expect(apiFetch('/v1/users/me')).rejects.toBeTruthy()
    expect(getAccessToken()).toBeNull()
    expect(onFail).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/lib/api/client.refresh.test.ts`
Expected: FAIL (`setOnAuthFailure` not exported; no retry logic).

- [ ] **Step 3: Add refresh + retry + single-flight to the client**

Replace the body of `apiFetch` and add helpers in `src/lib/api/client.ts`:
```ts
import type { ApiErrorBody, AuthTokens } from './types'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './token-store'

// ...ApiError unchanged...

let onAuthFailure: () => void = () => {}
export function setOnAuthFailure(fn: () => void) { onAuthFailure = fn }

let refreshPromise: Promise<void> | null = null

export async function apiFetch<T>(path: string, init: Options = {}): Promise<T> {
  let res = await doFetch(path, init)
  if (res.status === 401 && getRefreshToken() && path !== '/v1/auth/refresh') {
    try {
      await refreshTokens()
    } catch {
      clearTokens(); onAuthFailure()
      return finish<T>(res, init)
    }
    res = await doFetch(path, init) // retry once with the new token
  }
  return finish<T>(res, init)
}

async function refreshTokens(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken()
      const r = await fetch(`${BASE}/v1/auth/refresh`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }),
      })
      if (!r.ok) throw new Error('refresh failed')
      const { data } = (await r.json()) as { data: AuthTokens }
      setTokens(data) // rotation: overwrite with the new pair
    })().finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

async function finish<T>(res: Response, init: Options): Promise<T> {
  if (init.raw) return res as unknown as T
  if (res.status === 204) return undefined as T
  const json = await res.json()
  if (!res.ok) throw new ApiError(json as ApiErrorBody)
  return (json as { data: T }).data
}
```
(Keep `doFetch` from Task 5.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/lib/api/client.refresh.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: single-flight token refresh with rotation and retry"
```

---

### Task 7: Auth context + bootstrap-on-load

**Files:**
- Create: `src/lib/auth/auth-context.tsx`, `src/lib/auth/auth-context.test.tsx`

**Interfaces:**
- Consumes: `apiFetch`, `setOnAuthFailure`, token-store, `AuthTokens`.
- Produces: `AuthProvider`, and `useAuth(): { user, status, login, register, loginWithGoogle, logout }` where
  `status: 'loading' | 'authenticated' | 'anonymous'`,
  `user: { id: string; email: string; displayName: string | null; createdAt: string } | null`,
  `login(email, password): Promise<void>`, `register(input): Promise<void>`, `loginWithGoogle(idToken): Promise<void>`, `logout(): Promise<void>`.
  On mount: if a refresh token exists, refresh then load `/v1/users/me`; else `anonymous`.

- [ ] **Step 1: Write the failing test**

`src/lib/auth/auth-context.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './auth-context'
import { clearTokens, setRefreshToken } from '../api/token-store'

function Probe() {
  const { status, user, login } = useAuth()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.email ?? '-'}</span>
      <button onClick={() => login('jane@acme.com', 'password123')}>login</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => { clearTokens(); localStorage.clear() })

  it('starts anonymous with no refresh token', async () => {
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
  })

  it('bootstraps to authenticated when a refresh token exists', async () => {
    setRefreshToken('r-old')
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(screen.getByTestId('user')).toHaveTextContent('jane@acme.com')
  })

  it('login sets the user and authenticated status', async () => {
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
    await act(async () => { screen.getByText('login').click() })
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/auth/auth-context.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the provider**

`src/lib/auth/auth-context.tsx`:
```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch, setOnAuthFailure } from '../api/client'
import { setTokens, clearTokens, getRefreshToken } from '../api/token-store'
import type { AuthTokens } from '../api/types'

export interface User { id: string; email: string; displayName: string | null; createdAt: string }
type Status = 'loading' | 'authenticated' | 'anonymous'
interface RegisterInput { email: string; password: string; displayName?: string }

interface AuthValue {
  status: Status; user: User | null
  login(email: string, password: string): Promise<void>
  register(input: RegisterInput): Promise<void>
  loginWithGoogle(idToken: string): Promise<void>
  logout(): Promise<void>
}
const Ctx = createContext<AuthValue | null>(null)
export function useAuth(): AuthValue {
  const v = useContext(Ctx); if (!v) throw new Error('useAuth outside AuthProvider'); return v
}

async function me(): Promise<User> { return apiFetch<User>('/v1/users/me') }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setOnAuthFailure(() => { setUser(null); setStatus('anonymous') })
    if (!getRefreshToken()) { setStatus('anonymous'); return }
    // A protected call triggers the client's refresh-on-401 to mint an access token.
    me().then(u => { setUser(u); setStatus('authenticated') })
      .catch(() => { clearTokens(); setStatus('anonymous') })
  }, [])

  async function afterTokens(t: AuthTokens) { setTokens(t); setUser(await me()); setStatus('authenticated') }
  const login = async (email: string, password: string) =>
    afterTokens(await apiFetch<AuthTokens>('/v1/auth/login', { method: 'POST', body: { email, password } as any }))
  const register = async (input: RegisterInput) =>
    afterTokens(await apiFetch<AuthTokens>('/v1/auth/register', { method: 'POST', body: input as any }))
  const loginWithGoogle = async (idToken: string) =>
    afterTokens(await apiFetch<AuthTokens>('/v1/auth/google', { method: 'POST', body: { idToken } as any }))
  const logout = async () => {
    const refreshToken = getRefreshToken()
    try { if (refreshToken) await apiFetch('/v1/auth/logout', { method: 'POST', body: { refreshToken } as any }) }
    finally { clearTokens(); setUser(null); setStatus('anonymous') }
  }

  return <Ctx.Provider value={{ status, user, login, register, loginWithGoogle, logout }}>{children}</Ctx.Provider>
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/lib/auth/auth-context.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: auth context with bootstrap-on-load and session actions"
```

---

### Task 8: Router + ProtectedRoute + minimal AppShell

**Files:**
- Create: `src/router.tsx`, `src/layouts/AppShell.tsx`, `src/router.test.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`

**Interfaces:**
- Consumes: `useAuth`.
- Produces: routes `/login` → `LoginPage` (Task 9), `/` → `AppShell` (protected). `ProtectedRoute` redirects to `/login` when `status === 'anonymous'`, renders nothing while `loading`.

- [ ] **Step 1: Write the failing test**

`src/router.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { routes } from './router'
import { AuthProvider } from './lib/auth/auth-context'
import { clearTokens, setRefreshToken } from './lib/api/token-store'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<AuthProvider><RouterProvider router={router} /></AuthProvider>)
}

describe('routing', () => {
  beforeEach(() => { clearTokens(); localStorage.clear() })

  it('redirects anonymous users from / to /login', async () => {
    renderAt('/')
    await waitFor(() => expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument())
  })

  it('renders the shell for authenticated users', async () => {
    setRefreshToken('r-old')
    renderAt('/')
    await waitFor(() => expect(screen.getByText(/overview/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/router.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement router, ProtectedRoute, minimal shell**

`src/layouts/AppShell.tsx`:
```tsx
export function AppShell() {
  return (
    <div className="min-h-dvh grid grid-cols-[246px_1fr]">
      <aside className="border-r border-line p-4"><nav>Overview</nav></aside>
      <main className="p-6"><h1 className="text-xl font-bold">Overview</h1></main>
    </div>
  )
}
```
`src/router.tsx`:
```tsx
import { Navigate, type RouteObject } from 'react-router-dom'
import { useAuth } from './lib/auth/auth-context'
import { AppShell } from './layouts/AppShell'
import { LoginPage } from './features/auth/LoginPage'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { status } = useAuth()
  if (status === 'loading') return null
  if (status === 'anonymous') return <Navigate to="/login" replace />
  return children
}

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <ProtectedRoute><AppShell /></ProtectedRoute> },
]
```
`src/App.tsx`:
```tsx
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { routes } from './router'
const router = createBrowserRouter(routes)
export function App() { return <RouterProvider router={router} /> }
```
`src/main.tsx` wraps `<App/>` in `<AuthProvider>` and `<QueryClientProvider>`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/auth/auth-context'
import { App } from './App'
import './styles/index.css'

const qc = new QueryClient()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}><AuthProvider><App /></AuthProvider></QueryClientProvider>
  </StrictMode>,
)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/router.test.tsx`
Expected: PASS (2 tests). (Depends on Task 9's `LoginPage` heading "Welcome back".)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: router with protected route and minimal app shell"
```

---

### Task 9: Login/Register page (forms + validation + wiring)

**Files:**
- Create: `src/features/auth/schemas.ts`, `src/features/auth/AuthCard.tsx`, `src/features/auth/Showcase.tsx`, `src/features/auth/LoginPage.tsx`, `src/features/auth/AuthCard.test.tsx`

**Interfaces:**
- Consumes: `useAuth`, zod, react-hook-form, `ApiError`.
- Produces: `LoginPage` with heading "Welcome back"; tabs Sign in / Create account; email+password (+display name on register); maps `ApiError` to an inline message; success navigates to `/`.

- [ ] **Step 1: Write the zod schemas**

`src/features/auth/schemas.ts`:
```ts
import { z } from 'zod'
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1, 'Password is required') })
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters').max(128),
  displayName: z.string().max(100).optional(),
})
export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
```

- [ ] **Step 2: Write the failing test**

`src/features/auth/AuthCard.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { server } from '../../test/msw/server'
import { AuthProvider } from '../../lib/auth/auth-context'
import { LoginPage } from './LoginPage'
import { clearTokens } from '../../lib/api/token-store'

const BASE = 'http://localhost:3000'
const ui = () => render(<MemoryRouter><AuthProvider><LoginPage /></AuthProvider></MemoryRouter>)

describe('LoginPage', () => {
  beforeEach(() => { clearTokens(); localStorage.clear() })

  it('shows a validation error for a bad email', async () => {
    ui()
    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument()
  })

  it('maps a 401 to an inline "invalid email or password" message', async () => {
    server.use(http.post(`${BASE}/v1/auth/login`, () =>
      HttpResponse.json({ statusCode: 401, error: 'Unauthorized', message: 'Invalid email or password' }, { status: 401 })))
    ui()
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@acme.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test src/features/auth/AuthCard.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement AuthCard, Showcase, LoginPage**

`src/features/auth/AuthCard.tsx`:
```tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth/auth-context'
import { ApiError } from '../../lib/api/client'
import { loginSchema, registerSchema, type LoginValues, type RegisterValues } from './schemas'

type Tab = 'signin' | 'register'

export function AuthCard() {
  const [tab, setTab] = useState<Tab>('signin')
  const [formError, setFormError] = useState<string | null>(null)
  const { login, register: registerUser } = useAuth()
  const navigate = useNavigate()
  const isRegister = tab === 'register'
  const form = useForm<RegisterValues>({ resolver: zodResolver(isRegister ? registerSchema : loginSchema) })

  async function onSubmit(values: LoginValues | RegisterValues) {
    setFormError(null)
    try {
      if (isRegister) await registerUser(values as RegisterValues)
      else await login(values.email, values.password)
      navigate('/')
    } catch (e) {
      setFormError(e instanceof ApiError ? (Array.isArray(e.body.message) ? e.body.message.join(', ') : e.body.message) : 'Something went wrong')
    }
  }

  return (
    <div className="w-full max-w-[392px]">
      <div role="tablist" className="inline-flex gap-1 p-1 rounded-xl bg-card border border-line mb-6">
        <button role="tab" aria-selected={!isRegister} onClick={() => setTab('signin')} className="px-4 py-2 rounded-lg text-sm">Sign in</button>
        <button role="tab" aria-selected={isRegister} onClick={() => setTab('register')} className="px-4 py-2 rounded-lg text-sm">Create account</button>
      </div>
      <h2 className="text-2xl font-bold">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
      <p className="text-muted text-sm mb-6">Pick up your AI-visibility tracking where you left off.</p>

      {formError && <div role="alert" className="mb-4 text-sm text-bad">{formError}</div>}

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">Email
          <input type="email" {...form.register('email')} className="rounded-xl border border-line px-3 py-3" />
          {form.formState.errors.email && <span className="text-bad text-xs">{form.formState.errors.email.message}</span>}
        </label>
        <label className="flex flex-col gap-1.5 text-sm">Password
          <input type="password" {...form.register('password')} className="rounded-xl border border-line px-3 py-3" />
          {form.formState.errors.password && <span className="text-bad text-xs">{form.formState.errors.password.message}</span>}
        </label>
        {isRegister && (
          <label className="flex flex-col gap-1.5 text-sm">Display name (optional)
            <input {...form.register('displayName')} className="rounded-xl border border-line px-3 py-3" />
          </label>
        )}
        <button type="submit" disabled={form.formState.isSubmitting}
          className="rounded-xl bg-primary text-[var(--primary-ink)] py-3 font-semibold">
          {isRegister ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
```
`src/features/auth/Showcase.tsx`:
```tsx
export function Showcase() {
  return (
    <section className="hidden md:flex flex-col gap-6 p-11 bg-[var(--sidebar)]">
      <div className="flex items-center gap-2 font-bold text-lg"><span className="w-6 h-6 grid place-items-center rounded-lg bg-hi text-ink">◆</span>GEO</div>
      <div className="rounded-2xl bg-card border border-line p-5 shadow-sm max-w-[520px]">
        <p className="text-[16.5px] leading-relaxed">
          The best tools for tracking AI-search visibility include{' '}
          <mark className="bg-hi rounded px-1 font-semibold text-ink">GEO</mark>, which shows how often your brand appears in AI answers.
        </p>
      </div>
      <div className="mt-auto">
        <h1 className="text-3xl font-bold tracking-tight">See your brand the way AI does.</h1>
        <p className="text-muted mt-2">Track every answer that mentions you — and win back the ones that don't.</p>
      </div>
    </section>
  )
}
```
`src/features/auth/LoginPage.tsx`:
```tsx
import { Showcase } from './Showcase'
import { AuthCard } from './AuthCard'
export function LoginPage() {
  return (
    <div className="min-h-dvh grid md:grid-cols-2">
      <Showcase />
      <div className="flex items-center justify-center p-8"><AuthCard /></div>
    </div>
  )
}
```
Install the resolver: `pnpm add @hookform/resolvers`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/features/auth/AuthCard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: login/register page with validation and error mapping"
```

---

### Task 10: Google sign-in (conditional) + full green run

**Files:**
- Create: `src/features/auth/google.ts`
- Modify: `src/features/auth/AuthCard.tsx`, `.env.example`
- Create: `src/features/auth/google.test.ts`

**Interfaces:**
- Consumes: `useAuth().loginWithGoogle`.
- Produces: `isGoogleEnabled(): boolean` (true when `import.meta.env.VITE_GOOGLE_CLIENT_ID` is set); a "Continue with Google" button rendered only when enabled.

- [ ] **Step 1: Write the failing test**

`src/features/auth/google.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { isGoogleEnabled } from './google'

describe('isGoogleEnabled', () => {
  it('is false when no client id is configured', () => {
    expect(isGoogleEnabled()).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/features/auth/google.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the gate and button**

`src/features/auth/google.ts`:
```ts
export function isGoogleEnabled(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)
}
```
In `AuthCard.tsx`, after the form, render the divider + button only when enabled:
```tsx
import { isGoogleEnabled } from './google'
// ...inside the returned JSX, after </form>:
{isGoogleEnabled() && (
  <>
    <div className="flex items-center gap-3 text-muted text-xs my-1"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
    <button type="button" className="rounded-xl border border-line py-3 font-semibold">Continue with Google</button>
  </>
)}
```
Add `# VITE_GOOGLE_CLIENT_ID=` to `.env.example`. (Wiring the Google Identity Services token exchange to `loginWithGoogle` is deferred until a client id exists; the gate keeps the button hidden meanwhile — matching the backend, which returns errors without `GOOGLE_CLIENT_ID`.)

- [ ] **Step 4: Run the whole suite**

Run: `pnpm test`
Expected: PASS (all tasks green).

- [ ] **Step 5: Typecheck + build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: no type errors; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: conditional Google sign-in button"
```

---

## Self-Review

**Spec coverage (§ from the design spec):**
- §2 Tech stack — Tasks 1–2, 9 (Vite/TS/Router/Query/RHF/zod/Tailwind/Vitest/MSW). shadcn/ui components are introduced as needed; Task 9 uses plain Tailwind inputs (swap for shadcn during build if desired). ✓
- §3 API client + Plan-A auth — Tasks 3, 5, 6, 7 (envelope unwrap, Bearer, single-flight refresh, rotation, bootstrap). ✓
- §4 Design system — Task 2 (full light/dark tokens, reduced-motion). Full component library is fleshed out across Plans 1–3. ✓
- §5.1 Login/Register — Tasks 9, 10 (tabs, validation, error mapping 401/409/429 via `ApiError`, conditional Google). ✓
- §5.2–5.4 Overview/Files/Account — **out of scope for Plan 1** (Plan 2 = Files, Plan 3 = Account). AppShell here is a minimal post-login target (Task 8). ✓
- §6 Testing — MSW harness (Task 4); client refresh, auth bootstrap, form error-mapping all TDD'd. ✓

**Placeholder scan:** No "TBD"/"handle errors"/"similar to". Google token-exchange wiring is explicitly deferred with a stated reason (no client id), not a hidden gap.

**Type consistency:** `AuthTokens`, `apiFetch<T>`, `ApiError.body`, `setOnAuthFailure`, token-store names, and `useAuth()` shape are used identically across Tasks 3–10.

**Note for Plans 2 & 3:** build on `apiFetch`, `useAuth`, and `AppShell`; add `lib/api/queries.ts` (TanStack Query hooks) there. Files uses `apiFetch('/v1/files', { raw:true })` for downloads and `FormData` for upload.
