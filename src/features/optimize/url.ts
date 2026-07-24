// Normalize a user-typed site into a canonical absolute URL. The backend requires
// a protocol (@IsUrl({ require_protocol: true })), so we prepend https:// when the
// user omits it. Returns null when the input can't form a valid URL.
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const u = new URL(withProto)
    if (!u.hostname) return null
    return u.href
  } catch {
    return null
  }
}
