# GEO Audit (Optimize) Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the frontend to the backend's async URL-audit API — a real `/optimize` page (submit URL → poll → 6-dimension findings + history) and a live "Analyze" button on the Overview hero.

**Architecture:** New `src/features/optimize/` feature slice mirroring the existing `files/` slice: a `queries.ts` data layer over `apiFetch` (infinite-query history, create mutation, polling detail query), presentational components (`FindingCard`, `AuditResult`, `AuditHistory`), and an orchestrating `OptimizePage`. The audit lifecycle is asynchronous: `POST /v1/audits` returns a `PENDING` row (202), the client polls `GET /v1/audits/:id` every 1.5s until `COMPLETED`/`FAILED`, then renders `findings[]`. "Optimize" is promoted from the sidebar's coming-soon list to a real route; the Overview "Analyze" button navigates into a pre-filled, auto-running audit.

**Tech Stack:** React 18 + TypeScript, React Router v6 (`RouteObject[]`), TanStack Query v5 (`useInfiniteQuery` / `useMutation` / `useQuery` with `refetchInterval`), Tailwind (design tokens), Vitest + Testing Library + MSW.

## Global Constraints

- **Single network chokepoint:** all backend calls go through `apiFetch` from `src/lib/api/client.ts`. Never call `fetch` directly. Plain-object `body` is JSON-encoded automatically (Content-Type set by `doFetch`) — pass `body: { url }`, no casts.
- **Envelope:** success responses are `{ data, requestId }`; `apiFetch<T>` already unwraps `data`, so type params are the inner shape (e.g. `apiFetch<Audit>` not `apiFetch<{data: Audit}>`).
- **Auth/tenancy:** `/v1/audits` is behind the same `JwtAuthGuard` as files — no extra headers needed; `apiFetch` attaches the bearer token and handles 401/refresh.
- **Pagination:** cursor-based, identical to files — `limit`/`cursor`/`sort`/`search` query params; response `{ items, nextCursor }` where `nextCursor: string | null`.
- **Design tokens only:** use existing token classes (`bg-card`, `border-line`, `text-muted`, `text-faint`, `text-hi-deep`, `bg-hi-soft`, `grad-primary`, `text-ink`, `bg-card-2`, `bg-bad`). Semantic finding colors: ok → teal `#12C7B6`, needs_work → amber `#E1893D` (inline style, matching `OverviewPage` engine palette). No new global CSS.
- **Backend caveat:** the GEO API in `ai-search-api` is uncommitted working-tree code (whole `src/modules/geo/` + `add_audits` migration). Integration tests that need a live backend (`e2e/flows.mjs`) require it running on :3000.
- **No commits** until the user explicitly asks. When committing eventually: single author (Gary Hu), NO `Co-Authored-By` trailer.

---

## File Structure

**Create:**
- `src/features/optimize/types.ts` — `AuditStatus`, `Finding`, `Audit`, `AuditsPageData`.
- `src/features/optimize/url.ts` — `normalizeUrl(input)` helper (prepend `https://`, validate).
- `src/features/optimize/queries.ts` — `useAudits`, `useCreateAudit`, `useAudit` hooks.
- `src/features/optimize/FindingCard.tsx` — one finding (dimension result) card.
- `src/features/optimize/AuditResult.tsx` — one audit's live state: polling spinner / findings grid / error.
- `src/features/optimize/AuditHistory.tsx` — cursor-paginated past-audit list, selectable.
- `src/features/optimize/OptimizePage.tsx` — page orchestrator (form + result + history).
- Tests: `url.test.ts`, `queries.test.tsx`, `AuditResult.test.tsx`, `OptimizePage.test.tsx`.

**Modify:**
- `src/router.tsx` — add `{ path: 'optimize', element: <OptimizePage /> }`.
- `src/layouts/AppShell.tsx` — move `Optimize` from `SOON` to `NAV`; add `/optimize` to `TITLES`.
- `src/features/overview/OverviewPage.tsx` — make the hero URL input a form that routes to `/optimize?url=…`.
- `src/test/msw/handlers.ts` — add default `GET /v1/audits`, `POST /v1/audits`, `GET /v1/audits/:id` handlers.

---

## Task 1: Data layer (types, url helper, queries)

**Files:**
- Create: `src/features/optimize/types.ts`
- Create: `src/features/optimize/url.ts`
- Create: `src/features/optimize/queries.ts`
- Test: `src/features/optimize/url.test.ts`, `src/features/optimize/queries.test.tsx`

**Interfaces:**
- Consumes: `apiFetch` from `src/lib/api/client.ts`; TanStack Query v5.
- Produces:
  - `types.ts`: `type AuditStatus = 'PENDING'|'PROCESSING'|'COMPLETED'|'FAILED'`; `interface Finding { dimension: string; title: string; status: 'ok'|'needs_work'; summary: string; detail: string; recommendation: string; basis: string; strength: 'hard'|'advisory' }`; `interface Audit { id: string; url: string; status: AuditStatus; findings: Finding[] | null; error: string | null; createdAt: string }`; `interface AuditsPageData { items: Audit[]; nextCursor: string | null }`.
  - `url.ts`: `normalizeUrl(input: string): string | null`.
  - `queries.ts`: `useAudits(params: { search?: string })` → infinite query of `AuditsPageData`; `useCreateAudit()` → mutation `(url: string) => Promise<Audit>`; `useAudit(id: string | null)` → query of `Audit`, polls until terminal.

- [ ] **Step 1: Write the failing test for `normalizeUrl`**

Create `src/features/optimize/url.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { normalizeUrl } from './url'

describe('normalizeUrl', () => {
  it('prepends https:// when no protocol is present', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com/')
    expect(normalizeUrl('  acme.io/blog ')).toBe('https://acme.io/blog')
  })
  it('keeps an existing http/https protocol', () => {
    expect(normalizeUrl('http://foo.com')).toBe('http://foo.com/')
    expect(normalizeUrl('https://foo.com/x')).toBe('https://foo.com/x')
  })
  it('returns null for empty or unparseable input', () => {
    expect(normalizeUrl('')).toBeNull()
    expect(normalizeUrl('   ')).toBeNull()
    expect(normalizeUrl('http://')).toBeNull()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm vitest run src/features/optimize/url.test.ts`
Expected: FAIL — cannot find module `./url`.

- [ ] **Step 3: Implement `types.ts` and `url.ts`**

Create `src/features/optimize/types.ts`:

```ts
export type AuditStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface Finding {
  dimension: string
  title: string
  status: 'ok' | 'needs_work'
  summary: string
  detail: string
  recommendation: string
  basis: string
  strength: 'hard' | 'advisory'
}

export interface Audit {
  id: string
  url: string
  status: AuditStatus
  findings: Finding[] | null
  error: string | null
  createdAt: string
}

export interface AuditsPageData {
  items: Audit[]
  nextCursor: string | null
}
```

Create `src/features/optimize/url.ts`:

```ts
// Normalize a user-typed site into a canonical absolute URL. The backend requires
// a protocol (@IsUrl({ require_protocol: true })), so we prepend https:// when the
// user omits it. Returns null when the input can't form a valid URL.
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const u = new URL(withProto)
    if (!u.hostname) return null
    return u.href
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run to confirm `normalizeUrl` passes**

Run: `pnpm vitest run src/features/optimize/url.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for `queries.ts`**

Create `src/features/optimize/queries.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '../../test/msw/server'
import { useAudits, useCreateAudit, useAudit } from './queries'

const BASE = 'http://localhost:3000'
function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useAudits', () => {
  it('passes search + limit as query params and returns items', async () => {
    let seen = ''
    server.use(
      http.get(`${BASE}/v1/audits`, ({ request }) => {
        seen = new URL(request.url).search
        return HttpResponse.json({ data: { items: [{ id: 'a1', url: 'https://x.com', status: 'COMPLETED', findings: [], error: null, createdAt: '2026-07-08T00:00:00Z' }], nextCursor: null }, requestId: 'r' })
      }),
    )
    const { result } = renderHook(() => useAudits({ search: 'x.com' }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.pages[0].items[0].id).toBe('a1'))
    expect(seen).toContain('search=x.com')
    expect(seen).toContain('limit=20')
  })
})

describe('useCreateAudit', () => {
  it('POSTs the url and returns the created audit', async () => {
    let body: unknown
    server.use(
      http.post(`${BASE}/v1/audits`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { id: 'new1', url: 'https://acme.io/', status: 'PENDING', findings: null, error: null, createdAt: '2026-07-09T00:00:00Z' }, requestId: 'r' }, { status: 202 })
      }),
    )
    const { result } = renderHook(() => useCreateAudit(), { wrapper: wrapper() })
    const audit = await result.current.mutateAsync('https://acme.io/')
    expect(body).toEqual({ url: 'https://acme.io/' })
    expect(audit.status).toBe('PENDING')
  })
})

describe('useAudit', () => {
  it('is disabled when id is null', async () => {
    const { result } = renderHook(() => useAudit(null), { wrapper: wrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
  it('fetches a terminal audit and stops polling', async () => {
    server.use(
      http.get(`${BASE}/v1/audits/a2`, () =>
        HttpResponse.json({ data: { id: 'a2', url: 'https://x.com', status: 'COMPLETED', findings: [{ dimension: 'metadata', title: 'Core metadata', status: 'ok', summary: 's', detail: 'd', recommendation: 'r', basis: 'b', strength: 'advisory' }], error: null, createdAt: '2026-07-08T00:00:00Z' }, requestId: 'r' })),
    )
    const { result } = renderHook(() => useAudit('a2'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.status).toBe('COMPLETED'))
    expect(result.current.data?.findings?.[0].title).toBe('Core metadata')
  })
})
```

- [ ] **Step 6: Run to confirm it fails**

Run: `pnpm vitest run src/features/optimize/queries.test.tsx`
Expected: FAIL — cannot find module `./queries`.

- [ ] **Step 7: Implement `queries.ts`**

Create `src/features/optimize/queries.ts`:

```ts
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api/client'
import type { Audit, AuditsPageData } from './types'

// Server-state hooks for the Optimize (GEO audit) feature, all built on apiFetch.
// The audit lifecycle is async: create returns a PENDING row, then useAudit polls
// the detail endpoint until the status is terminal (COMPLETED/FAILED).

export function useAudits(params: { search?: string }) {
  return useInfiniteQuery({
    queryKey: ['audits', params],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const q = new URLSearchParams({ limit: '20' })
      if (params.search) q.set('search', params.search)
      if (pageParam) q.set('cursor', pageParam)
      return apiFetch<AuditsPageData>(`/v1/audits?${q.toString()}`)
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
}

export function useCreateAudit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (url: string) => apiFetch<Audit>('/v1/audits', { method: 'POST', body: { url } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audits'] }),
  })
}

const isTerminal = (s?: string) => s === 'COMPLETED' || s === 'FAILED'

export function useAudit(id: string | null) {
  return useQuery({
    queryKey: ['audit', id],
    enabled: id != null,
    queryFn: () => apiFetch<Audit>(`/v1/audits/${id}`),
    // Poll every 1.5s while the backend is still working; stop once terminal.
    refetchInterval: (query) => (isTerminal(query.state.data?.status) ? false : 1500),
  })
}
```

- [ ] **Step 8: Run the optimize data-layer tests**

Run: `pnpm vitest run src/features/optimize/`
Expected: PASS (url + queries, ~6 tests).

- [ ] **Step 9: Commit** (only if the user has authorized committing; otherwise skip)

```bash
git add src/features/optimize/types.ts src/features/optimize/url.ts src/features/optimize/queries.ts src/features/optimize/url.test.ts src/features/optimize/queries.test.tsx
git commit -m "feat(optimize): GEO audit data layer (types, url helper, queries)"
```

---

## Task 2: Finding + AuditResult presentational components

**Files:**
- Create: `src/features/optimize/FindingCard.tsx`
- Create: `src/features/optimize/AuditResult.tsx`
- Test: `src/features/optimize/AuditResult.test.tsx`

**Interfaces:**
- Consumes: `Finding`, `Audit` from `./types`; `useAudit` from `./queries`; `Spinner` from `src/components/Spinner.tsx`; `formatDate` from `src/lib/format.ts`.
- Produces: `FindingCard({ finding }: { finding: Finding })`; `AuditResult({ id }: { id: string })`.

- [ ] **Step 1: Write the failing test**

Create `src/features/optimize/AuditResult.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '../../test/msw/server'
import { AuditResult } from './AuditResult'

const BASE = 'http://localhost:3000'
function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const finding = {
  dimension: 'crawler', title: 'AI crawler access', status: 'needs_work' as const,
  summary: 'GPTBot is blocked', detail: 'robots.txt disallows GPTBot', recommendation: 'Allow GPTBot',
  basis: 'robots.txt', strength: 'hard' as const,
}

describe('AuditResult', () => {
  it('shows findings when the audit is COMPLETED', async () => {
    server.use(http.get(`${BASE}/v1/audits/c1`, () =>
      HttpResponse.json({ data: { id: 'c1', url: 'https://x.com', status: 'COMPLETED', findings: [finding], error: null, createdAt: '2026-07-08T00:00:00Z' }, requestId: 'r' })))
    wrap(<AuditResult id="c1" />)
    await screen.findByText('AI crawler access')
    expect(screen.getByText('Allow GPTBot')).toBeInTheDocument()
  })

  it('shows a working state while PROCESSING', async () => {
    server.use(http.get(`${BASE}/v1/audits/p1`, () =>
      HttpResponse.json({ data: { id: 'p1', url: 'https://x.com', status: 'PROCESSING', findings: null, error: null, createdAt: '2026-07-08T00:00:00Z' }, requestId: 'r' })))
    wrap(<AuditResult id="p1" />)
    await waitFor(() => expect(screen.getByText(/Analyzing/i)).toBeInTheDocument())
  })

  it('shows the error when FAILED', async () => {
    server.use(http.get(`${BASE}/v1/audits/f1`, () =>
      HttpResponse.json({ data: { id: 'f1', url: 'https://x.com', status: 'FAILED', findings: null, error: 'Could not reach site', createdAt: '2026-07-08T00:00:00Z' }, requestId: 'r' })))
    wrap(<AuditResult id="f1" />)
    await screen.findByText(/Could not reach site/i)
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

Run: `pnpm vitest run src/features/optimize/AuditResult.test.tsx`
Expected: FAIL — cannot find module `./AuditResult`.

- [ ] **Step 3: Implement `FindingCard.tsx`**

Create `src/features/optimize/FindingCard.tsx`:

```tsx
import type { Finding } from './types'

const OK = '#12C7B6'
const WARN = '#E1893D'

// One GEO dimension result. Left status dot + title, a summary line, then the
// recommendation callout when the dimension needs work.
export function FindingCard({ finding }: { finding: Finding }) {
  const ok = finding.status === 'ok'
  const color = ok ? OK : WARN
  return (
    <div className="rounded-2xl border border-line bg-card p-[18px]">
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: color }} />
        <span className="text-[14.5px] font-semibold">{finding.title}</span>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide"
          style={{ background: `${color}1f`, color }}
        >
          {ok ? 'OK' : 'Needs work'}
        </span>
        {finding.strength === 'hard' && (
          <span className="rounded border border-line bg-card-2 px-1.5 py-px text-[9.5px] font-semibold uppercase text-faint">
            blocker
          </span>
        )}
      </div>
      <p className="text-[13.5px] text-muted">{finding.summary}</p>
      {!ok && (
        <div className="mt-3 rounded-xl bg-hi-soft px-3 py-2.5 text-[13px] text-hi-deep">
          <span className="font-semibold">Fix: </span>{finding.recommendation}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Implement `AuditResult.tsx`**

Create `src/features/optimize/AuditResult.tsx`:

```tsx
import { useAudit } from './queries'
import { FindingCard } from './FindingCard'
import { Spinner } from '../../components/Spinner'

// Live view of a single audit. Polls via useAudit; renders a working state while
// PENDING/PROCESSING, the six finding cards when COMPLETED, or the error on FAILED.
export function AuditResult({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useAudit(id)

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-card px-[18px] py-6 text-muted">
        <Spinner className="h-5 w-5 text-hi-deep" />
        <span className="text-sm">Loading audit…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-line bg-card px-[18px] py-6">
        <p className="font-semibold">Couldn't load this audit</p>
        <p className="text-sm text-muted">{error instanceof Error ? error.message : 'Something went wrong'}</p>
      </div>
    )
  }

  const working = data.status === 'PENDING' || data.status === 'PROCESSING'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-line bg-card px-[18px] py-4">
        <span className="truncate text-[15px] font-semibold">{data.url}</span>
        {working && (
          <span className="ml-auto flex items-center gap-2 text-[13px] text-muted">
            <Spinner className="h-4 w-4 text-hi-deep" /> Analyzing — checking 6 AI-visibility signals…
          </span>
        )}
        {data.status === 'COMPLETED' && data.findings && (
          <span className="ml-auto text-[13px] text-muted">
            <b className="text-ink">{data.findings.filter((f) => f.status === 'ok').length}</b> of {data.findings.length} signals look good
          </span>
        )}
      </div>

      {data.status === 'FAILED' && (
        <div className="rounded-2xl border border-line bg-card px-[18px] py-5">
          <p className="font-semibold">Audit failed</p>
          <p className="text-sm text-muted">{data.error ?? 'The site could not be analyzed.'}</p>
        </div>
      )}

      {data.status === 'COMPLETED' && data.findings && (
        <div className="grid gap-3 md:grid-cols-2">
          {data.findings.map((f) => (
            <FindingCard key={f.dimension} finding={f} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run to confirm the tests pass**

Run: `pnpm vitest run src/features/optimize/AuditResult.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit** (only if authorized)

```bash
git add src/features/optimize/FindingCard.tsx src/features/optimize/AuditResult.tsx src/features/optimize/AuditResult.test.tsx
git commit -m "feat(optimize): finding + audit-result components"
```

---

## Task 3: OptimizePage + history + route + nav promotion

**Files:**
- Create: `src/features/optimize/AuditHistory.tsx`
- Create: `src/features/optimize/OptimizePage.tsx`
- Modify: `src/router.tsx`
- Modify: `src/layouts/AppShell.tsx`
- Modify: `src/test/msw/handlers.ts`
- Test: `src/features/optimize/OptimizePage.test.tsx`

**Interfaces:**
- Consumes: `useAudits`, `useCreateAudit` from `./queries`; `AuditResult` from `./AuditResult`; `normalizeUrl` from `./url`; `formatDate` from `src/lib/format.ts`; `useToast` from `src/components/toast.tsx`; `useSearchParams` from `react-router-dom`.
- Produces: `OptimizePage()`; `AuditHistory({ activeId, onSelect }: { activeId: string | null; onSelect: (id: string) => void })`.

- [ ] **Step 1: Add default MSW handlers**

In `src/test/msw/handlers.ts`, add these three inside the `handlers` array (after the `/v1/files` handler):

```ts
  http.get(`${BASE}/v1/audits`, async () =>
    HttpResponse.json({ data: { items: [], nextCursor: null }, requestId: 'req_audits' })),
  http.post(`${BASE}/v1/audits`, async () =>
    HttpResponse.json({ data: { id: 'seed1', url: 'https://acme.io/', status: 'PENDING', findings: null, error: null, createdAt: '2026-07-09T00:00:00Z' }, requestId: 'req_audit_new' }, { status: 202 })),
  http.get(`${BASE}/v1/audits/:id`, async ({ params }) =>
    HttpResponse.json({ data: { id: params.id, url: 'https://acme.io/', status: 'COMPLETED', findings: [], error: null, createdAt: '2026-07-09T00:00:00Z' }, requestId: 'req_audit_one' })),
```

- [ ] **Step 2: Write the failing test**

Create `src/features/optimize/OptimizePage.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '../../test/msw/server'
import { OptimizePage } from './OptimizePage'

const BASE = 'http://localhost:3000'
function wrap(ui: ReactNode, initialEntries = ['/optimize']) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OptimizePage', () => {
  it('rejects an empty/invalid url without calling the API', async () => {
    wrap(<OptimizePage />)
    await userEvent.click(screen.getByRole('button', { name: /Analyze/i }))
    expect(await screen.findByText(/Enter a valid website/i)).toBeInTheDocument()
  })

  it('submits a normalized url and shows the result', async () => {
    let body: unknown
    server.use(
      http.post(`${BASE}/v1/audits`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { id: 'r1', url: 'https://acme.io/', status: 'PENDING', findings: null, error: null, createdAt: '2026-07-09T00:00:00Z' }, requestId: 'r' }, { status: 202 })
      }),
      http.get(`${BASE}/v1/audits/r1`, () =>
        HttpResponse.json({ data: { id: 'r1', url: 'https://acme.io/', status: 'COMPLETED', findings: [{ dimension: 'llms', title: 'llms.txt', status: 'ok', summary: 'present', detail: 'd', recommendation: 'r', basis: 'b', strength: 'advisory' }], error: null, createdAt: '2026-07-09T00:00:00Z' }, requestId: 'r' })),
    )
    wrap(<OptimizePage />)
    await userEvent.type(screen.getByLabelText(/Website URL/i), 'acme.io')
    await userEvent.click(screen.getByRole('button', { name: /Analyze/i }))
    expect(await screen.findByText('llms.txt')).toBeInTheDocument()
    expect(body).toEqual({ url: 'https://acme.io/' })
  })
})
```

- [ ] **Step 3: Run to confirm it fails**

Run: `pnpm vitest run src/features/optimize/OptimizePage.test.tsx`
Expected: FAIL — cannot find module `./OptimizePage`.

- [ ] **Step 4: Implement `AuditHistory.tsx`**

Create `src/features/optimize/AuditHistory.tsx`:

```tsx
import { useAudits } from './queries'
import { formatDate } from '../../lib/format'
import type { Audit } from './types'

const DOT: Record<string, string> = { COMPLETED: '#12C7B6', FAILED: '#e5484d', PENDING: '#9498B4', PROCESSING: '#3E7BFA' }

// Cursor-paginated list of past audits. Selecting a row loads it into the result view.
export function AuditHistory({ activeId, onSelect }: { activeId: string | null; onSelect: (id: string) => void }) {
  const query = useAudits({})
  const items: Audit[] = query.data?.pages.flatMap((p) => p.items) ?? []

  if (!query.isLoading && items.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="border-b border-line bg-card-2 px-[18px] py-3 text-[11.5px] font-semibold uppercase tracking-wider text-faint">
        Recent audits
      </div>
      {items.map((a) => (
        <button
          key={a.id}
          onClick={() => onSelect(a.id)}
          className={`flex w-full items-center gap-3 border-t border-line px-[18px] py-3 text-left first:border-t-0 hover:bg-card-2 ${a.id === activeId ? 'bg-hi-soft' : ''}`}
        >
          <span className="h-2 w-2 flex-none rounded-full" style={{ background: DOT[a.status] ?? '#9498B4' }} />
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{a.url}</span>
          <span className="text-[12px] text-faint">{formatDate(a.createdAt)}</span>
        </button>
      ))}
      {query.hasNextPage && (
        <div className="border-t border-line px-[18px] py-3">
          <button
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="rounded-lg border border-line-strong bg-card px-3 py-1.5 text-[13px] font-semibold hover:bg-card-2"
          >
            {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Implement `OptimizePage.tsx`**

Create `src/features/optimize/OptimizePage.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCreateAudit } from './queries'
import { normalizeUrl } from './url'
import { AuditResult } from './AuditResult'
import { AuditHistory } from './AuditHistory'
import { Spinner } from '../../components/Spinner'
import { useToast } from '../../components/toast'

const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')

// Optimize screen: submit a site URL, create a GEO audit, then poll + render its
// six-dimension findings. Arriving with ?url= (from the Overview "Analyze" button)
// pre-fills the field and auto-runs the audit once.
export function OptimizePage() {
  const [params] = useSearchParams()
  const [value, setValue] = useState(() => params.get('url') ?? '')
  const [invalid, setInvalid] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const toast = useToast()
  const create = useCreateAudit()

  function submit(raw: string) {
    const url = normalizeUrl(raw)
    if (!url) { setInvalid(true); return }
    setInvalid(false)
    create.mutate(url, {
      onSuccess: (audit) => setActiveId(audit.id),
      onError: (e) => toast('error', errorText(e)),
    })
  }

  // Auto-run once when landing with a valid ?url= from the Overview hero.
  const kicked = useRef(false)
  useEffect(() => {
    if (kicked.current) return
    const incoming = params.get('url')
    if (incoming && normalizeUrl(incoming)) { kicked.current = true; submit(incoming) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Optimize</h2>
        <p className="text-[14.5px] text-muted">Audit any page for how well AI answer engines can find, read, and cite it.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); submit(value) }}
        className="flex max-w-[620px] flex-col gap-1.5"
        noValidate
      >
        <div className="flex gap-2.5">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-line-strong bg-card px-3">
            <span className="text-[13px] text-faint">https://</span>
            <input
              value={value}
              onChange={(e) => { setValue(e.target.value); if (invalid) setInvalid(false) }}
              placeholder="yourdomain.com/page"
              aria-label="Website URL"
              aria-invalid={invalid}
              aria-describedby={invalid ? 'url-error' : undefined}
              className="w-full min-w-0 bg-transparent py-3 text-[14.5px] outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={create.isPending}
            className="grad-primary flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold disabled:opacity-70"
          >
            {create.isPending && <Spinner className="h-4 w-4" />}
            Analyze
          </button>
        </div>
        {invalid && <p id="url-error" className="text-[13px] text-bad">Enter a valid website, e.g. acme.com</p>}
      </form>

      {activeId && <AuditResult id={activeId} />}

      <AuditHistory activeId={activeId} onSelect={setActiveId} />
    </div>
  )
}
```

- [ ] **Step 6: Add the route**

In `src/router.tsx`: add the import and the child route.

Import (after the `FilesPage` import):

```tsx
import { OptimizePage } from './features/optimize/OptimizePage'
```

Child route (in the `children` array, after the `files` entry):

```tsx
      { path: 'optimize', element: <OptimizePage /> },
```

- [ ] **Step 7: Promote "Optimize" in the sidebar**

In `src/layouts/AppShell.tsx`:

Add `/optimize` to `TITLES`:

```ts
const TITLES: Record<string, string> = { '/': 'Overview', '/files': 'Files', '/optimize': 'Optimize', '/account': 'Account' }
```

Move `Optimize` from `SOON` into `NAV` (place it after Files):

```ts
const NAV = [
  { to: '/', label: 'Overview', Icon: IconOverview },
  { to: '/files', label: 'Files', Icon: IconFiles },
  { to: '/optimize', label: 'Optimize', Icon: IconOptimize },
  { to: '/account', label: 'Account', Icon: IconAccount },
]
const SOON = [
  { label: 'Visibility', Icon: IconVisibility },
  { label: 'Competitors', Icon: IconCompetitors },
]
```

(`IconOptimize` is already imported at the top of the file — leave the import line unchanged.)

- [ ] **Step 8: Run the optimize suite + confirm nav change compiles**

Run: `pnpm vitest run src/features/optimize/`
Expected: PASS (url + queries + AuditResult + OptimizePage, ~11 tests).

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Commit** (only if authorized)

```bash
git add src/features/optimize/AuditHistory.tsx src/features/optimize/OptimizePage.tsx src/router.tsx src/layouts/AppShell.tsx src/test/msw/handlers.ts src/features/optimize/OptimizePage.test.tsx
git commit -m "feat(optimize): page, history, route, sidebar promotion"
```

---

## Task 4: Wire the Overview "Analyze" button

**Files:**
- Modify: `src/features/overview/OverviewPage.tsx`
- Test: `src/features/overview/OverviewPage.test.tsx` (create if absent; otherwise extend)

**Interfaces:**
- Consumes: `useNavigate` from `react-router-dom`; `normalizeUrl` from `../optimize/url`.
- Produces: no new exports — the hero's input+button becomes a form that navigates to `/optimize?url=<encoded>`.

- [ ] **Step 1: Write the failing test**

Create `src/features/overview/OverviewPage.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { OverviewPage } from './OverviewPage'

// Minimal auth stub: OverviewPage reads useAuth().user for the greeting.
vi.mock('../../lib/auth/auth-context', () => ({
  useAuth: () => ({ user: { email: 'jane@acme.com', displayName: 'Jane' } }),
}))

function wrap() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/optimize" element={<div>OPTIMIZE {location.search}</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OverviewPage Analyze', () => {
  it('routes to /optimize with the typed url when Analyze is clicked', async () => {
    wrap()
    await userEvent.type(screen.getByLabelText('Website URL'), 'acme.io')
    await userEvent.click(screen.getByRole('button', { name: 'Analyze' }))
    expect(await screen.findByText(/OPTIMIZE/)).toBeInTheDocument()
    expect(window.location.search).toContain('url=')
  })
})
```

Note: add `import { vi } from 'vitest'` at the top if not auto-globalized (this repo uses globals; verify by checking an existing test — if others call bare `vi`, no import needed).

- [ ] **Step 2: Run to confirm it fails**

Run: `pnpm vitest run src/features/overview/OverviewPage.test.tsx`
Expected: FAIL — the current button does nothing / no `/optimize` navigation.

- [ ] **Step 3: Wire the hero form**

In `src/features/overview/OverviewPage.tsx`:

Add imports at the top:

```tsx
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { normalizeUrl } from '../optimize/url'
```

(Replace the existing `import { Link } from 'react-router-dom'` line with the combined one above.)

Inside `OverviewPage`, add local state + handler (after `const name = ...`):

```tsx
  const navigate = useNavigate()
  const [site, setSite] = useState('')
  function analyze(e: React.FormEvent) {
    e.preventDefault()
    const url = normalizeUrl(site)
    navigate(url ? `/optimize?url=${encodeURIComponent(url)}` : '/optimize')
  }
```

Replace the hero's input+button block. Change this:

```tsx
          <div className="flex max-w-[520px] gap-2.5">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-line-strong bg-card px-3">
              <span className="text-[13px] text-faint">https://</span>
              <input placeholder="yourdomain.com" className="w-full min-w-0 bg-transparent py-3 text-[14.5px] outline-none" aria-label="Website URL" />
            </div>
            <button className="grad-primary rounded-xl px-4 py-3 text-[14px] font-semibold">Analyze</button>
          </div>
```

to this:

```tsx
          <form onSubmit={analyze} className="flex max-w-[520px] gap-2.5" noValidate>
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-line-strong bg-card px-3">
              <span className="text-[13px] text-faint">https://</span>
              <input
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="yourdomain.com"
                className="w-full min-w-0 bg-transparent py-3 text-[14.5px] outline-none"
                aria-label="Website URL"
              />
            </div>
            <button type="submit" className="grad-primary rounded-xl px-4 py-3 text-[14px] font-semibold">Analyze</button>
          </form>
```

Also update the hero's "Coming soon" pill and copy so it no longer reads as unavailable — change the pill text from `✦ Coming soon` to `✦ New` and keep the rest.

- [ ] **Step 4: Run to confirm the test passes**

Run: `pnpm vitest run src/features/overview/OverviewPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit** (only if authorized)

```bash
git add src/features/overview/OverviewPage.tsx src/features/overview/OverviewPage.test.tsx
git commit -m "feat(overview): wire Analyze button into the audit flow"
```

---

## Task 5: End-to-end flow + full verification

**Files:**
- Modify: `e2e/flows.mjs`
- Modify: `docs/architecture.md` (add the Optimize feature to the feature list)

**Interfaces:**
- Consumes: live backend on :3000 (with the uncommitted GEO module running), dev server on :5173.

- [ ] **Step 1: Add an Optimize e2e flow**

In `e2e/flows.mjs`, add a new `try/catch` block inside `run()` (after the Account/display-name block, before logout). Insert:

```js
  try {
    await page.getByRole('link', { name: 'Optimize' }).click()
    await page.getByLabel('Website URL').fill('example.com')
    await page.getByRole('button', { name: 'Analyze' }).click()
    // Poll UI: either findings render or a FAILED state — both prove the round trip.
    await page.getByText(/signals look good|Audit failed/i).waitFor({ timeout: 30000 })
    ok('run GEO audit -> result renders')
  } catch (e) { fail('run GEO audit', e) }
```

- [ ] **Step 2: Ensure the backend is up, then run the e2e**

Confirm `curl -s -m3 http://localhost:3000/health/live -o /dev/null -w "%{http_code}"` returns `200` (start `ai-search-api` if not). Dev server on :5173.

Run: `pnpm test:e2e`
Expected: all flows PASS, including "run GEO audit -> result renders". If the backend GEO module isn't running, this flow fails — that's an environment gap, not a code defect; note it and move on.

- [ ] **Step 3: Full green gate**

Run: `pnpm test`
Expected: all unit tests pass (existing 45 + the new optimize/overview tests).

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

Run: `pnpm build`
Expected: `built in …`, no errors.

- [ ] **Step 4: Update the architecture doc**

In `docs/architecture.md`, add "Optimize (GEO audit)" to the feature list with a one-line description of the async create→poll→findings lifecycle and the `/v1/audits` endpoints. Keep it consistent with the existing Files/Account entries' style.

- [ ] **Step 5: Commit** (only if authorized)

```bash
git add e2e/flows.mjs docs/architecture.md
git commit -m "test(optimize): e2e audit flow + architecture doc"
```

---

## Self-Review Notes

- **Spec coverage:** all three `/v1/audits` endpoints are consumed — `POST` (Task 1 `useCreateAudit`), `GET :id` (Task 1 `useAudit`, polling), `GET` list (Task 1 `useAudits`, Task 3 `AuditHistory`). All six finding dimensions render generically via `findings.map` (no hardcoded dimension list), so backend check changes need no frontend change.
- **Type consistency:** `Audit`/`Finding`/`AuditStatus` defined once in `types.ts` (Task 1) and imported everywhere; hook names (`useAudits`/`useCreateAudit`/`useAudit`) are stable across Tasks 1–3.
- **Async correctness:** `useAudit` polls with `refetchInterval` returning `false` on terminal status — no infinite polling after COMPLETED/FAILED. `enabled: id != null` keeps it idle until an audit is selected.
- **Backend dependency:** unit tests are fully MSW-mocked and pass without a backend; only Task 5's e2e needs the live (uncommitted) GEO module. This is called out so a red e2e isn't misread as a frontend bug.
- **No placeholders:** every code step contains complete, real code; no TODO/TBD.
