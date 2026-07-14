import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from 'react'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}
type Confirm = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<{ confirm: Confirm } | null>(null)

/** Promise-based confirm. Falls back to window.confirm when no provider is mounted (keeps unit tests simple). */
export function useConfirm(): Confirm {
  const ctx = useContext(ConfirmContext)
  return ctx?.confirm ?? ((o) => Promise.resolve(window.confirm(o.message)))
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const prevFocus = useRef<HTMLElement | null>(null)

  const confirm: Confirm = (o) =>
    new Promise<boolean>((resolve) => {
      // If a dialog is already open, treat the prior request as cancelled so its
      // awaiting caller never hangs.
      resolver.current?.(false)
      resolver.current = resolve
      setOpts(o)
    })

  const settle = (v: boolean) => {
    const r = resolver.current
    resolver.current = null
    setOpts(null)
    r?.(v)
  }

  // Focus the dialog on open, close on Escape, and restore focus to the trigger on close.
  useEffect(() => {
    if (!opts) return
    prevFocus.current = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        settle(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prevFocus.current?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts])

  // Minimal focus trap between the two buttons.
  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    const first = cancelRef.current
    const last = confirmRef.current
    if (!first || !last) return
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {opts && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4" onKeyDown={onKeyDown}>
          <div className="absolute inset-0 bg-black/40 animate-[fadein_.15s_ease]" onClick={() => settle(false)} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={opts.title ?? 'Confirm'}
            aria-describedby="confirm-dialog-message"
            className="relative w-full max-w-[380px] rounded-2xl border border-line bg-card p-5 shadow-[0_30px_70px_-20px_rgba(14,19,48,.5)] animate-[popin_.18s_ease]"
          >
            {opts.title && <h2 className="text-[16px] font-semibold">{opts.title}</h2>}
            <p id="confirm-dialog-message" className="mt-1 text-[13.5px] leading-relaxed text-muted">{opts.message}</p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button ref={cancelRef} onClick={() => settle(false)} className="rounded-xl border border-line-strong bg-card px-4 py-2 text-[13.5px] font-semibold hover:bg-card-2">
                {opts.cancelLabel ?? 'Cancel'}
              </button>
              <button
                ref={confirmRef}
                onClick={() => settle(true)}
                className={`rounded-xl px-4 py-2 text-[13.5px] font-semibold text-white ${opts.danger ? 'bg-bad' : 'grad-primary'}`}
              >
                {opts.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
