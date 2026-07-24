import { useState } from 'react'
import { useNotifications, useMarkAllRead, useMarkRead } from './queries'
import { accentFor, relativeTime } from './format'
import type { Notification } from './types'

function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const bell = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
)

function Row({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  const unread = n.readAt === null
  return (
    <button
      onClick={() => unread && onRead(n.id)}
      className={`flex w-full items-start gap-3 border-t border-line px-4 py-3.5 text-left first:border-t-0 ${unread ? 'bg-[color-mix(in_srgb,var(--hi)_4%,transparent)] hover:bg-[color-mix(in_srgb,var(--hi)_7%,transparent)]' : 'hover:bg-card-2'}`}
    >
      <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-xl text-white" style={{ background: accentFor(n.type) }}>{bell}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold leading-snug">{n.title}</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{n.body}</p>
      </div>
      <span className="whitespace-nowrap text-[11.5px] text-faint">{relativeTime(n.createdAt)}</span>
      {unread && <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-hi" />}
    </button>
  )
}

export function NotificationsPage() {
  const [unread, setUnread] = useState(false)
  const query = useNotifications({ unread })
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const items = query.data?.pages.flatMap((p) => p.items) ?? []
  const today = startOfToday()
  const groups: { label: string; rows: Notification[] }[] = [
    { label: 'Today', rows: items.filter((n) => new Date(n.createdAt).getTime() >= today) },
    { label: 'Earlier', rows: items.filter((n) => new Date(n.createdAt).getTime() < today) },
  ]

  return (
    <div className="flex flex-col">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex gap-1.5">
          {([['All', false], ['Unread', true]] as const).map(([label, val]) => (
            <button
              key={label}
              onClick={() => setUnread(val)}
              className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold ${unread === val ? 'border-transparent bg-hi-soft text-hi-deep' : 'border-line bg-card text-muted hover:bg-card-2 hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
          className="ml-auto rounded-lg border border-line-strong bg-card px-2.5 py-1.5 text-[12.5px] font-semibold hover:bg-card-2 disabled:opacity-60"
        >
          Mark all read
        </button>
      </div>

      {query.isLoading ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 border-t border-line px-4 py-3.5 first:border-t-0">
              <div className="skeleton h-[34px] w-[34px] rounded-xl" />
              <div className="flex-1"><div className="skeleton mb-1.5 h-3 w-2/5" /><div className="skeleton h-3 w-3/5" /></div>
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <p role="alert" className="rounded-2xl border border-bad-soft bg-card px-4 py-6 text-center text-sm text-bad">
          Couldn't load notifications. Please try again.
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card px-4 py-12 text-center">
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-hi-soft text-hi-deep">{bell}</div>
          <p className="text-sm font-semibold">You're all caught up</p>
          <p className="mt-1 text-[13px] text-muted">{unread ? 'No unread notifications.' : 'Notifications about your content and audits will show up here.'}</p>
        </div>
      ) : (
        <>
          {groups.map((g) =>
            g.rows.length === 0 ? null : (
              <div key={g.label}>
                <div className="mx-1 mb-2 mt-[18px] text-[11.5px] font-bold uppercase tracking-wider text-faint">{g.label}</div>
                <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
                  {g.rows.map((n) => <Row key={n.id} n={n} onRead={(id) => markRead.mutate(id)} />)}
                </div>
              </div>
            ),
          )}
          {query.hasNextPage && (
            <button
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="mx-auto mt-4 rounded-lg border border-line-strong bg-card px-4 py-2 text-[13px] font-semibold hover:bg-card-2 disabled:opacity-60"
            >
              {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
