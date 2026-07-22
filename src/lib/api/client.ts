import type { ApiErrorBody, AuthTokens } from './types'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './token-store'

const BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:3000')
if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL must be set for production builds')
}

// Absolute URL for a backend path — used for full-page navigations (e.g. the
// backend-driven Google OAuth redirect) that can't go through apiFetch.
export const apiUrl = (path: string): string => `${BASE}${path}`

export class ApiError extends Error {
  statusCode: number
  body: ApiErrorBody
  constructor(body: ApiErrorBody) {
    super(Array.isArray(body.message) ? body.message.join(', ') : body.message)
    this.name = 'ApiError'
    this.statusCode = body.statusCode
    this.body = body
  }
}

// body is widened to also accept a plain object/array, which doFetch JSON-encodes —
// so callers can pass `body: { email, password }` without casting. Narrower than
// `object` on purpose: `object` also admits arbitrary class instances (e.g. `Date`,
// custom errors) that silently fail doFetch's plain-object check and get forwarded
// to fetch() as an invalid body instead of being JSON-encoded or rejected.
export interface Options extends Omit<RequestInit, 'body'> {
  raw?: boolean
  body?: BodyInit | Record<string, unknown> | unknown[] | null
}

let onAuthFailure: () => void = () => {}
export function setOnAuthFailure(fn: () => void): void {
  onAuthFailure = fn
}

let refreshPromise: Promise<void> | null = null

export async function apiFetch<T>(path: string, init: Options = {}): Promise<T> {
  let res = await doFetch(path, init)
  // Only protected calls should trigger a refresh. Auth endpoints (login/register/
  // google/refresh/logout) must NOT — otherwise a wrong-password 401 would rotate a
  // still-valid session and log the user out.
  if (res.status === 401 && getRefreshToken() && !path.startsWith('/v1/auth/')) {
    try {
      await refreshTokens() // single-flight; clears tokens + fires onAuthFailure once on failure
    } catch {
      return finish<T>(res, init)
    }
    res = await doFetch(path, init) // retry once with the rotated token
    if (res.status === 401) {
      // The freshly rotated access token was still rejected: the session is dead.
      clearTokens()
      onAuthFailure()
    }
  }
  return finish<T>(res, init)
}

async function doFetch(path: string, init: Options): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  // Only treat plain `{}`-literal objects and arrays as JSON; everything else
  // (FormData, Blob, URLSearchParams, ArrayBuffer, string, ...) passes through
  // to fetch untouched.
  const bodyProto = init.body == null ? null : Object.getPrototypeOf(init.body)
  const bodyIsPlainObject =
    init.body != null && (bodyProto === Object.prototype || bodyProto === null || Array.isArray(init.body))
  if (bodyIsPlainObject) headers.set('Content-Type', 'application/json')
  return fetch(`${BASE}${path}`, {
    ...init,
    headers,
    body: bodyIsPlainObject ? JSON.stringify(init.body) : (init.body as BodyInit | undefined),
  })
}

async function refreshTokens(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken()
      const r = await fetch(`${BASE}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!r.ok) throw new Error('refresh failed')
      const { data } = (await r.json()) as { data: AuthTokens }
      setTokens(data) // rotation: overwrite with the new pair
    })()
      .catch((e) => {
        // Handle the failure once, inside the shared promise, so concurrent
        // callers don't each clear tokens / redirect.
        clearTokens()
        onAuthFailure()
        throw e
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function finish<T>(res: Response, init: Options): Promise<T> {
  if (init.raw) {
    if (!res.ok) throw new ApiError(await errorBody(res))
    return res as unknown as T
  }
  if (res.status === 204) return undefined as T
  const json = await res.json()
  if (!res.ok) throw new ApiError(json as ApiErrorBody)
  return (json as { data: T }).data
}

async function errorBody(res: Response): Promise<ApiErrorBody> {
  return res
    .json()
    .then((j) => j as ApiErrorBody)
    .catch(() => ({ statusCode: res.status, error: 'Error', message: 'Request failed' }))
}
