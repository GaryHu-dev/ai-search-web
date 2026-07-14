import { describe, it, expect, beforeEach } from 'vitest'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../token-store'

describe('token store (Plan A)', () => {
  beforeEach(() => {
    clearTokens()
    localStorage.clear()
  })

  it('keeps the access token in memory only (not localStorage)', () => {
    setTokens({ accessToken: 'a1', refreshToken: 'r1', tokenType: 'Bearer', expiresIn: 900 })
    expect(getAccessToken()).toBe('a1')
    expect(localStorage.getItem('geo.refreshToken')).toBe('r1')
    expect(Object.values(localStorage).some((v) => v === 'a1')).toBe(false)
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
