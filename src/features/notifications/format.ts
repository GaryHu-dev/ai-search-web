// Shared presentation helpers for notifications (used by the page and the bell).

// Deterministic accent per notification type, so the same kind always looks the
// same without hard-coding the (open-ended) type strings the backend emits.
const ACCENTS = ['var(--hi)', 'var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--good)']
export function accentFor(type: string): string {
  let h = 0
  for (let i = 0; i < type.length; i++) h = (h + type.charCodeAt(i)) % ACCENTS.length
  return ACCENTS[h]
}

export function relativeTime(iso: string): string {
  const d = new Date(iso).getTime()
  if (Number.isNaN(d)) return ''
  const s = Math.max(0, Math.floor((Date.now() - d) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
