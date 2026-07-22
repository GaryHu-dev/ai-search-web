import { describe, it, expect, afterEach } from 'vitest'
import { startGoogleLogin } from '../google'

describe('startGoogleLogin', () => {
  const original = window.location
  afterEach(() => {
    Object.defineProperty(window, 'location', { value: original, writable: true, configurable: true })
  })

  it('navigates the browser to the backend Google entry point', () => {
    const loc = { href: '' } as Location
    Object.defineProperty(window, 'location', { value: loc, writable: true, configurable: true })
    startGoogleLogin()
    expect(loc.href).toMatch(/\/v1\/auth\/google$/)
  })
})
