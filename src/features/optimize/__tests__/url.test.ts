import { describe, it, expect } from 'vitest'
import { normalizeUrl } from '../url'

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
