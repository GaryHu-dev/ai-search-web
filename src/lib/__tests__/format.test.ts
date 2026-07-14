import { describe, it, expect } from 'vitest'
import { formatBytes, fileExt, formatDate } from '../format'

describe('formatBytes', () => {
  it('formats bytes, KB, MB and GB', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(88 * 1024)).toBe('88 KB')
    expect(formatBytes(2_400_000)).toMatch(/MB$/)
    expect(formatBytes(5 * 1024 ** 3)).toBe('5.0 GB')
  })
  it('uses one decimal below 10 and rounds above', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(15 * 1024)).toBe('15 KB')
  })
})

describe('fileExt', () => {
  it('returns the uppercase extension with FILE fallbacks', () => {
    expect(fileExt('brand-guidelines.pdf')).toBe('PDF')
    expect(fileExt('noext')).toBe('FILE')
    expect(fileExt('trailing.')).toBe('FILE')
  })
})

describe('formatDate', () => {
  it('formats an ISO date and returns empty string for garbage', () => {
    expect(formatDate('2026-07-06T00:00:00.000Z')).toMatch(/2026/)
    expect(formatDate('not-a-date')).toBe('')
  })
})
