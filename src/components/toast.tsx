import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: number; type: ToastType; message: string }
type Add = (type: ToastType, message: string) => void

const ToastContext = createContext<{ add: Add } | null>(null)

/** Returns a function to show a toast. No-op when no ToastProvider is mounted (e.g. unit tests). */
export function useToast(): Add {
  const ctx = useContext(ToastContext)
  return ctx?.add ?? (() => {})
}

const ACCENT: Record<ToastType, string> = { success: 'var(--good)', error: 'var(--bad)', info: 'var(--hi-deep)' }
const DISMISS_MS = 3800

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  // Remaining ms left on a toast's timer when it gets paused (hover/focus), so resuming
  // continues from where it left off rather than restarting the full duration.
  const remaining = useRef(new Map<number, number>())
  const startedAt = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id)
    if (t) {
      clearTimeout(t)
      timers.current.delete(id)
    }
    remaining.current.delete(id)
    startedAt.current.delete(id)
    setToasts((list) => list.filter((x) => x.id !== id))
  }, [])

  const schedule = useCallback((id: number, ms: number) => {
    startedAt.current.set(id, Date.now())
    timers.current.set(id, setTimeout(() => dismiss(id), ms))
  }, [dismiss])

  const pause = useCallback((id: number) => {
    const t = timers.current.get(id)
    if (!t) return
    clearTimeout(t)
    timers.current.delete(id)
    const started = startedAt.current.get(id) ?? Date.now()
    const already = Date.now() - started
    const left = (remaining.current.get(id) ?? DISMISS_MS) - already
    remaining.current.set(id, Math.max(left, 0))
  }, [])

  const resume = useCallback((id: number) => {
    if (timers.current.has(id)) return
    const left = remaining.current.get(id)
    if (left == null) return
    schedule(id, left)
  }, [schedule])

  const add = useCallback<Add>(
    (type, message) => {
      const id = ++idRef.current
      setToasts((list) => [...list, { id, type, message }])
      remaining.current.set(id, DISMISS_MS)
      schedule(id, DISMISS_MS)
    },
    [schedule],
  )

  // Clear any pending timers if the provider unmounts.
  useEffect(() => {
    const map = timers.current
    return () => map.forEach(clearTimeout)
  }, [])

  return (
    <ToastContext.Provider value={{ add }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,340px)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            aria-live={t.type === 'error' ? 'assertive' : 'polite'}
            onMouseEnter={() => pause(t.id)}
            onMouseLeave={() => resume(t.id)}
            onFocus={() => pause(t.id)}
            onBlur={() => resume(t.id)}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-card px-3.5 py-3 shadow-[0_16px_40px_-16px_rgba(14,19,48,.45)] animate-[toastin_.25s_ease]"
          >
            <span className="mt-1.5 h-2 w-2 flex-none rounded-full" style={{ background: ACCENT[t.type] }} />
            <p className="flex-1 text-[13px] leading-snug text-ink">{t.message}</p>
            <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="text-faint hover:text-ink">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
