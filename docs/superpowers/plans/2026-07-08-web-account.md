# GEO Web — Account Implementation Plan (Plan 3 of 3)

> **Archived** — from the earlier GEO milestone, superseded by the Omniport
> content-operations platform. Kept for history; not the current design.

> Builds on Plan 1 (`apiFetch`, `useAuth`, `AppShell`). REQUIRED SUB-SKILL: subagent-driven-development or executing-plans.

**Goal:** Ship the Account screen: view profile, edit display name, delete account.

## Global Constraints
Inherit Plan 1. Endpoints: `GET /v1/users/me`, `PATCH /v1/users/me { displayName }` (max 100), `DELETE /v1/users/me` (204, soft delete). Email is read-only. Delete → clear session → redirect `/login`.

## File Structure
```
src/features/account/
  queries.ts        # useUpdateProfile, useDeleteAccount
  AccountPage.tsx
  AccountPage.test.tsx
```

### Task 1: Account mutations
**Files:** Create `src/features/account/queries.ts`, `queries.test.tsx`
**Produces:** `useUpdateProfile()` → `PATCH /v1/users/me { displayName }`, updates `['me']`/refetches; `useDeleteAccount()` → `DELETE /v1/users/me`.
- [ ] **Step 1: Failing test** — update sends the displayName in the body:
```tsx
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { useUpdateProfile } from './queries'
const BASE = 'http://localhost:3000'
const wrap = () => { const qc = new QueryClient(); return ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
it('PATCHes the display name', async () => {
  let body: any
  server.use(http.patch(`${BASE}/v1/users/me`, async ({ request }) => { body = await request.json(); return HttpResponse.json({ data: { id: 'u1', email: 'j@a.com', displayName: 'New', createdAt: 'x' }, requestId: 'r' }) }))
  const { result } = renderHook(() => useUpdateProfile(), { wrapper: wrap() })
  await act(async () => { await result.current.mutateAsync({ displayName: 'New' }) })
  expect(body).toEqual({ displayName: 'New' })
})
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement**
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api/client'
import type { User } from '../../lib/auth/auth-context'
export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { displayName: string }) => apiFetch<User>('/v1/users/me', { method: 'PATCH', body: input as any }),
    onSuccess: (u) => qc.setQueryData(['me'], u),
  })
}
export function useDeleteAccount() {
  return useMutation({ mutationFn: () => apiFetch<void>('/v1/users/me', { method: 'DELETE' }) })
}
```
- [ ] **Step 4: Run → PASS.**

### Task 2: AccountPage
**Files:** Create `AccountPage.tsx`, `AccountPage.test.tsx`
**Consumes:** `useAuth` (user), `useUpdateProfile`, `useDeleteAccount`.
**Produces:** route `/account`: Profile section (avatar, name/email), display-name input (react-hook-form + zod max 100) + Save/Cancel; email read-only; Plan section; Danger zone Delete (confirm → `useDeleteAccount` → `useAuth().logout()`-style clear → navigate `/login`).
- [ ] **Step 1: Failing test**
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { AuthProvider } from '../../lib/auth/auth-context'
import { AccountPage } from './AccountPage'
import { setRefreshToken, clearTokens } from '../../lib/api/token-store'
const BASE = 'http://localhost:3000'
const ui = () => { const qc = new QueryClient(); return render(<QueryClientProvider client={qc}><MemoryRouter><AuthProvider><AccountPage /></AuthProvider></MemoryRouter></QueryClientProvider>) }
it('saves a new display name', async () => {
  clearTokens(); setRefreshToken('r'); let body: any
  server.use(http.patch(`${BASE}/v1/users/me`, async ({ request }) => { body = await request.json(); return HttpResponse.json({ data: { id: 'u1', email: 'jane@acme.com', displayName: 'Janet', createdAt: 'x' }, requestId: 'r' }) }))
  ui()
  const input = await screen.findByLabelText(/display name/i)
  await userEvent.clear(input); await userEvent.type(input, 'Janet')
  await userEvent.click(screen.getByRole('button', { name: /save/i }))
  await waitFor(() => expect(body).toEqual({ displayName: 'Janet' }))
})
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** `AccountPage.tsx` per spec §5.4 (Profile form, read-only email with hint, Save/Cancel, Plan card, Danger zone with `window.confirm` → delete → clear session → `navigate('/login')`). Success toast optional.
- [ ] **Step 4: Run → PASS.**

### Task 3: Wire route + nav
Modify `src/router.tsx` (`account` child → `<AccountPage/>`) and `AppShell` nav. Full suite → PASS. (no commit)

## Self-Review
Covers spec §5.4 (edit displayName via PATCH, email read-only, delete → session cleared → login). `User` type reused from auth-context. No placeholders.
