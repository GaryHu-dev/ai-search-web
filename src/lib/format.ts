export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function fileExt(filename: string): string {
  const dot = filename.lastIndexOf('.')
  const ext = dot >= 0 ? filename.slice(dot + 1).toUpperCase() : ''
  return ext || 'FILE'
}

// Human-readable message from an unknown thrown value. ApiError.message is already
// the joined backend message, so this surfaces the real error text when present.
export function errorText(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong'
}

// Avatar initial from a display name or email, falling back to '?'.
export function avatarInitial(name?: string | null, email?: string | null): string {
  return (name?.trim()?.[0] ?? email?.trim()?.[0] ?? '?').toUpperCase()
}
