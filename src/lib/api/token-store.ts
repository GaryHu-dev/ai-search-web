import type { AuthTokens } from './types'

const REFRESH_KEY = 'geo.refreshToken'
let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}
export function setAccessToken(t: string | null): void {
  accessToken = t
}
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}
export function setRefreshToken(t: string | null): void {
  if (t === null) localStorage.removeItem(REFRESH_KEY)
  else localStorage.setItem(REFRESH_KEY, t)
}
export function setTokens(t: AuthTokens): void {
  setAccessToken(t.accessToken)
  setRefreshToken(t.refreshToken)
}
export function clearTokens(): void {
  setAccessToken(null)
  setRefreshToken(null)
}
