import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch, setOnAuthFailure } from '../api/client'
import { setAccessToken, setRefreshToken, clearTokens, getRefreshToken } from '../api/token-store'
import type { AuthTokens } from '../api/types'

// Key AuthProvider's own bootstrap/logout effects watch on 'storage' events to
// propagate login/logout across tabs. Kept in sync with token-store's REFRESH_KEY.
const REFRESH_TOKEN_KEY = 'geo.refreshToken'

export interface User {
  id: string
  email: string
  displayName: string | null
  createdAt: string
}

type Status = 'loading' | 'authenticated' | 'anonymous'
// A type alias (not an interface) on purpose: TS only infers an implicit index
// signature for object type literals, not for interfaces, and `body` below needs
// to structurally satisfy `Record<string, unknown>` without an explicit `as` cast.
type RegisterInput = {
  email: string
  password: string
  displayName?: string
}

interface AuthValue {
  status: Status
  user: User | null
  googleError: string | null
  clearGoogleError(): void
  login(email: string, password: string): Promise<void>
  register(input: RegisterInput): Promise<void>
  logout(): Promise<void>
  setUser(user: User): void
}

const Ctx = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}

function me(): Promise<User> {
  return apiFetch<User>('/v1/users/me')
}

// After a backend-driven Google redirect, the session tokens (or an error) come
// back in the URL fragment. This only READS them — the fragment is stripped later
// (stripUrlFragment), once the session is actually established, so a React 18
// StrictMode double-invoke can't consume it on a run that then gets cancelled and
// leave the second run with nothing. Returns null when the URL isn't a Google return.
type GoogleReturn = { tokens: AuthTokens } | { error: string } | null
function readGoogleReturn(): GoogleReturn {
  if (typeof window === 'undefined') return null
  const raw = window.location.hash.replace(/^#/, '')
  if (!raw) return null
  const p = new URLSearchParams(raw)
  if (!p.has('error') && !(p.has('accessToken') && p.has('refreshToken'))) return null
  const error = p.get('error')
  if (error) return { error }
  return {
    tokens: {
      accessToken: p.get('accessToken')!,
      refreshToken: p.get('refreshToken')!,
      tokenType: p.get('tokenType') ?? 'Bearer',
      expiresIn: Number(p.get('expiresIn') ?? 0),
    },
  }
}

// Drop the URL fragment (keep path + query) so a reload doesn't reprocess it.
function stripUrlFragment(): void {
  if (typeof window === 'undefined') return
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  // Session identity (`status`/`user`) lives here, in React state, rather than in a
  // TanStack Query cache, for two reasons: (1) `ProtectedRoute` and the bootstrap
  // sequence need it synchronously, before any query has a chance to run — it's the
  // gate that decides whether the rest of the provider tree/routes even render; and
  // (2) it's the single source of truth that other mutations (e.g. account update)
  // sync back into via `setUser`, rather than each feature keeping its own copy.
  const [user, setUser] = useState<User | null>(null)
  // Set when returning from a failed Google redirect, so the login page can show it.
  const [googleError, setGoogleError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setOnAuthFailure(() => {
      if (cancelled) return
      setUser(null)
      setStatus('anonymous')
    })
    // Returning from the backend's Google redirect? Establish the session from the
    // fragment tokens (or surface the error) instead of the normal refresh bootstrap.
    const gret = readGoogleReturn()
    if (gret) {
      if ('error' in gret) {
        setGoogleError('Google sign-in failed. Please try again.')
        setStatus('anonymous')
        stripUrlFragment()
      } else {
        // Strip the fragment only once the session is established (or handling
        // failed) — never before, so a cancelled StrictMode run can't swallow it.
        afterTokens(gret.tokens, () => cancelled)
          .then(() => {
            if (!cancelled) stripUrlFragment()
          })
          .catch(() => {
            if (cancelled) return
            setGoogleError('Google sign-in failed. Please try again.')
            setStatus('anonymous')
            stripUrlFragment()
          })
      }
      return () => {
        cancelled = true
      }
    }
    if (!getRefreshToken()) {
      if (!cancelled) setStatus('anonymous')
      return () => {
        cancelled = true
      }
    }
    // A protected call triggers the client's refresh-on-401 to mint an access token.
    me()
      .then((u) => {
        if (cancelled) return
        setUser(u)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        clearTokens()
        setStatus('anonymous')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Cross-tab session propagation: another tab's logout removes
  // 'geo.refreshToken' in localStorage, which fires a 'storage' event in every
  // *other* tab (not the one that made the change). We mirror that here so this
  // tab's UI stays consistent with the actual session state.
  //
  // Logout-only, intentionally: this used to also have a login-adoption branch
  // (bootstrap via me() when another tab logged in while this tab was anonymous),
  // but that was removed. It relied on a stale `status` closure — a logout-then-
  // login event pair in another tab could race and drop the login — and, more
  // importantly, it let *any* same-origin write to that localStorage key (not just
  // a legitimate login) pivot every open tab into treating whatever refresh token
  // showed up as this user's session. Logout propagation is the low-risk, high-value
  // half: it can only ever move a tab towards anonymous. Login propagation across
  // tabs is intentionally not supported — a fresh tab still bootstraps from the
  // shared refresh token on load (see the bootstrap effect above), so opening a new
  // tab after logging in elsewhere works; it's only an *already-open* anonymous tab
  // that won't auto-adopt a login that happens in another tab.
  //
  // Known deferred edge (intentionally not implemented, YAGNI): concurrent refresh
  // *rotation* across tabs — two tabs racing to use the same refresh token — isn't
  // coordinated here. Fixing that would need a cross-tab lock (e.g. BroadcastChannel)
  // around refreshTokens(); the single-flight promise in client.ts only dedupes
  // within one tab.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== REFRESH_TOKEN_KEY) return
      if (e.newValue !== null) return
      // Another tab logged out.
      if (status !== 'authenticated') return
      clearTokens()
      setUser(null)
      setStatus('anonymous')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [status])

  // isCancelled lets the bootstrap effect abort applying state after an unmount /
  // StrictMode re-run; the user-triggered login/register paths pass the default.
  async function afterTokens(t: AuthTokens, isCancelled: () => boolean = () => false) {
    // Set the access token first (me() needs it), but only persist the refresh
    // token once me() succeeds — otherwise a failed login would still leave a
    // usable refresh token in localStorage and silently log the user in on reload.
    setAccessToken(t.accessToken)
    try {
      const u = await me()
      if (isCancelled()) return
      setRefreshToken(t.refreshToken)
      setUser(u)
      setStatus('authenticated')
    } catch (e) {
      setAccessToken(null)
      throw e
    }
  }

  const login = async (email: string, password: string) =>
    afterTokens(await apiFetch<AuthTokens>('/v1/auth/login', { method: 'POST', body: { email, password } }))

  const register = async (input: RegisterInput) =>
    afterTokens(await apiFetch<AuthTokens>('/v1/auth/register', { method: 'POST', body: input }))

  const logout = async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) await apiFetch('/v1/auth/logout', { method: 'POST', body: { refreshToken } })
    } catch {
      // Best-effort: the server may already have invalidated this session (e.g. right
      // after account deletion). Clearing local state below is what matters.
    } finally {
      clearTokens()
      setUser(null)
      setStatus('anonymous')
    }
  }

  return (
    <Ctx.Provider value={{ status, user, googleError, clearGoogleError: () => setGoogleError(null), login, register, logout, setUser }}>
      {children}
    </Ctx.Provider>
  )
}
