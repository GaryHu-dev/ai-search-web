import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

describe('design tokens', () => {
  const css = readFileSync('src/styles/tokens.css', 'utf8')
  it('defines the signature accent token', () => {
    expect(css).toMatch(/--hi:\s*#5B4BF0/i)
  })
  it('defines a dark override for background', () => {
    expect(css).toMatch(/\[data-theme="dark"\][\s\S]*--bg:\s*#0C0F1E/i)
  })
})
