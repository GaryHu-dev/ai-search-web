import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/msw/server'
import { apiFetch, setOnAuthFailure } from '../client'
import { setTokens, getAccessToken, getRefreshToken, clearTokens } from '../token-store'

const BASE = 'http://localhost:3000'

describe('apiFetch refresh flow', () => {
  beforeEach(() => {
    clearTokens()
    localStorage.clear()
    setTokens({ accessToken: 'stale', refreshToken: 'r-old', tokenType: 'Bearer', expiresIn: 900 })
  })

  it('refreshes on 401, rotates tokens, and retries once', async () => {
    let calls = 0
    server.use(
      http.get(`${BASE}/v1/users/me`, ({ request }) => {
        calls++
        return request.headers.get('authorization') === 'Bearer access-new'
          ? HttpResponse.json({ data: { id: 'u1' }, requestId: 'r' })
          : HttpResponse.json({ statusCode: 401, error: 'Unauthorized', message: 'expired' }, { status: 401 })
      }),
      http.post(`${BASE}/v1/auth/refresh`, () =>
        HttpResponse.json({ data: { accessToken: 'access-new', refreshToken: 'r-new', tokenType: 'Bearer', expiresIn: 900 } })),
    )
    await expect(apiFetch('/v1/users/me')).resolves.toEqual({ id: 'u1' })
    expect(getAccessToken()).toBe('access-new')
    expect(getRefreshToken()).toBe('r-new')
    expect(calls).toBe(2)
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

  it('does NOT refresh on a 401 from an auth endpoint (wrong-password must not log you out)', async () => {
    let refreshHits = 0
    server.use(
      http.post(`${BASE}/v1/auth/login`, () =>
        HttpResponse.json({ statusCode: 401, error: 'Unauthorized', message: 'Invalid email or password' }, { status: 401 })),
      http.post(`${BASE}/v1/auth/refresh`, () => {
        refreshHits++
        return HttpResponse.json({ data: { accessToken: 'x', refreshToken: 'y', tokenType: 'Bearer', expiresIn: 900 } })
      }),
    )
    await expect(apiFetch('/v1/auth/login', { method: 'POST', body: { email: 'a@b.co', password: 'nope' } })).rejects.toMatchObject({ statusCode: 401 })
    expect(refreshHits).toBe(0) // no refresh triggered
    expect(getRefreshToken()).toBe('r-old') // existing session left intact
  })

  it('clears tokens and calls onAuthFailure when the retried request is still 401 after a successful refresh', async () => {
    const onFail = vi.fn()
    setOnAuthFailure(onFail)
    server.use(
      // Every request is 401, regardless of token — the rotated access token is
      // rejected too, meaning the session itself is dead server-side.
      http.get(`${BASE}/v1/users/me`, () =>
        HttpResponse.json({ statusCode: 401, error: 'Unauthorized', message: 'expired' }, { status: 401 })),
      http.post(`${BASE}/v1/auth/refresh`, () =>
        HttpResponse.json({ data: { accessToken: 'access-new', refreshToken: 'r-new', tokenType: 'Bearer', expiresIn: 900 } })),
    )
    await expect(apiFetch('/v1/users/me')).rejects.toBeTruthy()
    // Refresh itself succeeded and rotated the token store, but the retried request
    // was still 401 — the session is treated as dead and everything is cleared.
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(onFail).toHaveBeenCalledOnce()
    setOnAuthFailure(() => {})
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
    setOnAuthFailure(() => {})
  })
})
