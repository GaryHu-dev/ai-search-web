import { useState } from 'react'
import { Link } from 'react-router-dom'

type Notif = {
  color: string
  icon: JSX.Element
  title: string
  body: string
  time?: string
  action?: { label: string; to: string }
  unread?: boolean
  group: 'Today' | 'This week'
  bucket: 'action' | 'published' | 'other'
}

const bell = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
const pen = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
const star = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 8.7l5.4-.8z" strokeLinejoin="round" /></svg>
const check = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
const arrow = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 17 17 7M17 7h-6M17 7v6" /></svg>
const cal = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /></svg>

const NOTIFS: Notif[] = [
  { group: 'Today', bucket: 'action', color: 'var(--c3)', icon: pen, title: '1 post needs your review', body: '“How to Store Coffee Beans for Freshness” is ready to approve.', action: { label: 'Review', to: '/content' }, unread: true },
  { group: 'Today', bucket: 'other', color: 'var(--c1)', icon: star, title: 'New AI citation on ChatGPT', body: 'Your pour-over guide was cited for “what grind size for pour over”.', time: '2h ago', unread: true },
  { group: 'Today', bucket: 'published', color: 'var(--good)', icon: check, title: 'Published to Brew & Co', body: '“The Complete Guide to Pour-Over Coffee” is now live.', time: '5h ago' },
  { group: 'This week', bucket: 'other', color: 'var(--c2)', icon: arrow, title: 'Keyword “pour over coffee” moved to #7', body: 'Up 4 positions this week.', time: 'Mon' },
  { group: 'This week', bucket: 'other', color: 'var(--hi)', icon: cal, title: '3 posts scheduled for next week', body: 'Across Brewing guides & Sustainability themes.', time: 'Mon' },
]

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'action', label: 'Needs action' },
  { key: 'published', label: 'Published' },
] as const
type TabKey = (typeof TABS)[number]['key']

export function NotificationsPage() {
  const [tab, setTab] = useState<TabKey>('all')
  const [readAll, setReadAll] = useState(false)

  const shown = NOTIFS.filter((n) => tab === 'all' || n.bucket === tab)
  const groups: Notif['group'][] = ['Today', 'This week']

  return (
    <div className="flex flex-col">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold ${tab === t.key ? 'border-transparent bg-hi-soft text-hi-deep' : 'border-line bg-card text-muted hover:bg-card-2 hover:text-ink'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setReadAll(true)} className="ml-auto rounded-lg border border-line-strong bg-card px-2.5 py-1.5 text-[12.5px] font-semibold hover:bg-card-2">Mark all read</button>
      </div>

      {groups.map((g) => {
        const rows = shown.filter((n) => n.group === g)
        if (rows.length === 0) return null
        return (
          <div key={g}>
            <div className="mx-1 mb-2 mt-[18px] text-[11.5px] font-bold uppercase tracking-wider text-faint">{g}</div>
            <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
              {rows.map((n, i) => (
                <div key={i} className={`flex items-start gap-3 border-t border-line px-4 py-3.5 first:border-t-0 ${n.unread && !readAll ? 'bg-[color-mix(in_srgb,var(--hi)_4%,transparent)]' : ''}`}>
                  <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-xl text-white" style={{ background: n.color }}>{n.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold leading-snug">{n.title}</p>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{n.body}</p>
                  </div>
                  {n.action ? (
                    <Link to={n.action.to} className="rounded-lg border border-line-strong bg-card px-3 py-1.5 text-[12.5px] font-semibold hover:bg-card-2">{n.action.label}</Link>
                  ) : (
                    <span className="whitespace-nowrap text-[11.5px] text-faint">{n.time}</span>
                  )}
                  {n.unread && !readAll && <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-hi" />}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
