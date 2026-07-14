import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/msw/server'
import { apiFetch, ApiError } from '../client'
import { setAccessToken, clearTokens } from '../token-store'

const BASE = 'http://localhost:3000'

describe('apiFetch', () => {
  beforeEach(() => {
    clearTokens()
    localStorage.clear()
  })

  it('unwraps the { data } envelope', async () => {
    server.use(http.get(`${BASE}/v1/users/me`, () => HttpResponse.json({ data: { id: 'u1' }, requestId: 'r' })))
    await expect(apiFetch('/v1/users/me')).resolves.toEqual({ id: 'u1' })
  })

  it('attaches the Bearer token when present', async () => {
    setAccessToken('tok-123')
    let seen: string | null = null
    server.use(
      http.get(`${BASE}/v1/users/me`, ({ request }) => {
        seen = request.headers.get('authorization')
        return HttpResponse.json({ data: {}, requestId: 'r' })
      }),
    )
    await apiFetch('/v1/users/me')
    expect(seen).toBe('Bearer tok-123')
  })

  it('throws ApiError with the error body on non-2xx', async () => {
    server.use(
      http.get(`${BASE}/v1/users/me`, () =>
        HttpResponse.json({ statusCode: 409, error: 'Conflict', message: 'nope', requestId: 'r' }, { status: 409 })),
    )
    await expect(apiFetch('/v1/users/me')).rejects.toBeInstanceOf(ApiError)
    await expect(apiFetch('/v1/users/me')).rejects.toMatchObject({ statusCode: 409, body: { message: 'nope' } })
  })

  it('throws on a failed raw (download) response instead of returning the error body', async () => {
    server.use(
      http.get(`${BASE}/v1/files/x/download`, () =>
        HttpResponse.json({ statusCode: 404, error: 'Not Found', message: 'File not found' }, { status: 404 })),
    )
    await expect(apiFetch('/v1/files/x/download', { raw: true })).rejects.toMatchObject({ statusCode: 404 })
  })

  it('JSON-encodes a plain object body and sets Content-Type: application/json', async () => {
    let seenContentType: string | null = null
    let seenBody = ''
    server.use(
      http.post(`${BASE}/v1/audits`, async ({ request }) => {
        seenContentType = request.headers.get('content-type')
        seenBody = await request.text()
        return HttpResponse.json({ data: { ok: true }, requestId: 'r' }, { status: 202 })
      }),
    )
    await apiFetch('/v1/audits', { method: 'POST', body: { url: 'https://example.com' } })
    expect(seenContentType).toContain('application/json')
    expect(JSON.parse(seenBody)).toEqual({ url: 'https://example.com' })
  })

  it('does not set Content-Type: application/json for a FormData body', async () => {
    let seenContentType: string | null = null
    server.use(
      http.post(`${BASE}/v1/files`, async ({ request }) => {
        seenContentType = request.headers.get('content-type')
        return HttpResponse.json({ data: { ok: true }, requestId: 'r' })
      }),
    )
    const fd = new FormData()
    fd.append('file', new Blob(['hello'], { type: 'text/plain' }), 'hello.txt')
    await apiFetch('/v1/files', { method: 'POST', body: fd })
    // doFetch must not force `application/json` for FormData — the runtime (browser
    // fetch/undici) is responsible for the multipart boundary Content-Type instead.
    // What exactly jsdom's fetch reports here (it surfaces the Blob part's own type
    // in this environment rather than a real multipart/form-data header) isn't the
    // thing under test; the important assertion is the absence of our JSON override.
    expect(seenContentType).not.toContain('application/json')
  })
})
