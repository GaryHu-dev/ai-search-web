import { describe, it, expect } from 'vitest'
import { isGoogleEnabled } from '../google'

describe('isGoogleEnabled', () => {
  it('is false when no client id is configured', () => {
    expect(isGoogleEnabled()).toBe(false)
  })
})
