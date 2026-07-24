import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconBell } from '../../components/icons'
import { useNotifications, useUnreadCount, useMarkAllRead, useMarkRead } from './queries'
import { accentFor, relativeTime } from './format'

// Topbar notification bell: a red unread badge, and a click-to-open popover
// previewing the most recent notifications, with a link to the full page.
export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const { data: countData } = useUnreadCount()
  const unread = countData?.count ?? 0

  // Only fetch the preview list while the popover is open.
  const list = useNotifications({})
  const markAll = useMarkAllRead()
  const markRead = useMarkRead()
  const items = (list.data?.pages.flatMap((p) => p.items) ?? []).slice(0, 6)

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="relative ml-auto">
      <button
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-line bg-card text-muted hover:bg-card-2 hover:text-ink"
      >
        <IconBell className="h-[17px] w-[17px]" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-bad px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[var(--bg)]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 z-40 mt-2 w-[340px] overflow-hidden rounded-xl border border-line bg-card shadow-[0_20px_50px_-20px_rgba(14,19,48,.45)] animate-[popin_.15s_ease]"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  disabled={markAll.isPending}
                  className="text-xs font-semibold text-hi-deep hover:underline disabled:opacity-60"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[340px] overflow-y-auto">
              {list.isLoading ? (
                <div className="px-4 py-6 text-center text-[13px] text-muted">Loading…</div>
              ) : items.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full bg-hi-soft text-hi-deep"><IconBell className="h-[17px] w-[17px]" /></div>
                  <p className="text-[13px] font-semibold">You're all caught up</p>
                </div>
              ) : (
                items.map((n) => {
                  const isUnread = n.readAt === null
                  return (
                    <button
                      key={n.id}
                      onClick={() => isUnread && markRead.mutate(n.id)}
                      className={`flex w-full items-start gap-2.5 border-b border-line px-4 py-3 text-left last:border-b-0 ${isUnread ? 'bg-[color-mix(in_srgb,var(--hi)_4%,transparent)] hover:bg-[color-mix(in_srgb,var(--hi)_8%,transparent)]' : 'hover:bg-card-2'}`}
                    >
                      <span className="mt-1 h-2 w-2 flex-none rounded-full" style={{ background: isUnread ? accentFor(n.type) : 'var(--line-strong)' }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold">{n.title}</span>
                        <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-muted">{n.body}</span>
                        <span className="mt-1 block text-[11px] text-faint">{relativeTime(n.createdAt)}</span>
                      </span>
                    </button>
                  )
                })
              )}
            </div>

            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-line px-4 py-2.5 text-center text-[13px] font-semibold text-hi-deep hover:bg-card-2"
            >
              See all
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
