import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth/auth-context'
import { ThemeToggle } from '../components/ThemeToggle'
import { avatarInitial } from '../lib/format'
import { IconOverview, IconContent, IconOptimize, IconAccount, IconBell, IconPanel } from '../components/icons'
import { useUnreadCount } from '../features/notifications/queries'

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/content': 'Content',
  '/optimize': 'Optimize',
  '/notifications': 'Notifications',
  '/account': 'Account',
}
const SB_KEY = 'geo.sidebar'

const NAV = [
  { to: '/', label: 'Dashboard', Icon: IconOverview },
  { to: '/content', label: 'Content', Icon: IconContent },
  { to: '/optimize', label: 'Optimize', Icon: IconOptimize },
  { to: '/notifications', label: 'Notifications', Icon: IconBell },
  { to: '/account', label: 'Account', Icon: IconAccount },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const { data: unreadData } = useUnreadCount()
  const unread = unreadData?.count ?? 0
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const drawerRef = useRef<HTMLElement>(null)
  // `collapsed` only narrows the sidebar on desktop (md+); the mobile drawer always
  // shows full-width labels, so collapse-related classes are all md:-scoped below.
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SB_KEY) === 'collapsed' } catch { return false }
  })
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    try { localStorage.setItem(SB_KEY, collapsed ? 'collapsed' : 'expanded') } catch { /* ignore */ }
  }, [collapsed])

  // Close the mobile drawer on Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // Lock body scroll while the mobile drawer is open, and focus it so Tab starts
  // inside the drawer rather than the page behind it. Restore both on close.
  useEffect(() => {
    if (!menuOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawerRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [menuOpen])

  // Trap Tab within the mobile drawer while it's open.
  function onDrawerKeyDown(e: ReactKeyboardEvent) {
    if (!menuOpen || e.key !== 'Tab') return
    const container = drawerRef.current
    if (!container) return
    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const title = TITLES[location.pathname] ?? 'Omniport'
  const initial = avatarInitial(user?.displayName, user?.email)
  const close = () => setMenuOpen(false)
  const cols = collapsed ? 'md:grid-cols-[68px_1fr]' : 'md:grid-cols-[240px_1fr]'
  const hideMd = collapsed ? 'md:hidden' : ''
  const centerMd = collapsed ? 'md:justify-center' : ''

  return (
    <div className={`grid min-h-dvh grid-cols-1 transition-[grid-template-columns] duration-200 ease-out ${cols}`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:text-[13.5px] focus:font-semibold focus:text-ink focus:shadow-[0_20px_50px_-20px_rgba(14,19,48,.4)] focus:outline-none focus:ring-2 focus:ring-hi-deep"
      >
        Skip to content
      </a>
      <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-[3px]" style={{ background: 'linear-gradient(90deg,#5B4BF0,#7C6BFF,#3E7BFA,#12C7B6,#E1893D)' }} />
      {menuOpen && <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={close} aria-hidden />}

      <aside
        ref={drawerRef}
        tabIndex={-1}
        onKeyDown={onDrawerKeyDown}
        className={`${menuOpen ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-30 w-[240px] ${collapsed ? 'md:w-[68px]' : ''} flex-col gap-4 border-r border-line bg-sidebar p-3 outline-none md:static md:z-auto md:flex`}
      >
        <div className={`flex items-center gap-2 px-1.5 py-1.5 ${centerMd}`}>
          <span className="grid h-[26px] w-[26px] flex-none place-items-center grad-avatar rounded-lg">◆</span>
          <b className={`text-[17px] font-bold ${hideMd}`}>Omniport</b>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ to, label, Icon }) => {
            const badge = to === '/notifications' && unread > 0 ? unread : undefined
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={close}
                aria-label={label}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium ${centerMd} ${
                    isActive ? 'bg-hi-soft font-semibold text-ink' : 'text-muted hover:bg-card-2 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-[18px] w-[18px] flex-none ${isActive ? 'text-hi-deep' : ''}`} />
                    <span className={hideMd}>{label}</span>
                    {badge ? (
                      <span className={`grid h-[18px] min-w-[18px] place-items-center rounded-full bg-bad px-1.5 text-[11px] font-bold text-white ${collapsed ? 'md:absolute md:right-1.5 md:top-1.5 md:h-2 md:w-2 md:min-w-0 md:px-0 md:text-[0px]' : 'ml-auto'}`}>{badge}</span>
                    ) : null}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <div className={hideMd}><ThemeToggle /></div>
          <button
            onClick={() => void logout()}
            aria-label="Log out"
            className={`flex items-center gap-2.5 rounded-xl border border-line bg-card p-2 text-left hover:bg-card-2 ${centerMd}`}
          >
            <span className="grid h-[30px] w-[30px] flex-none place-items-center grad-avatar rounded-full text-[13px] font-bold">{initial}</span>
            <span className={`min-w-0 ${hideMd}`}>
              <span className="block text-[13px] font-semibold leading-tight">{user?.displayName ?? 'Account'}</span>
              <span className="block truncate text-[11.5px] text-faint">{user?.email}</span>
            </span>
            <span className={`ml-auto text-faint ${hideMd}`}>⎋</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex h-[60px] items-center gap-3 border-b border-line bg-bg px-4 md:px-6">
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-line-strong text-ink md:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
          <button
            className="hidden h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:bg-card-2 hover:text-ink md:grid"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((c) => !c)}
          >
            <IconPanel className="h-[17px] w-[17px]" />
          </button>
          <h1 className="text-[17px] font-bold tracking-tight">{title}</h1>
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative ml-auto grid h-9 w-9 place-items-center rounded-lg border border-line bg-card text-muted hover:bg-card-2 hover:text-ink"
          >
            <IconBell className="h-[17px] w-[17px]" />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-bad ring-2 ring-[var(--bg)]" />}
          </Link>
        </header>
        <div id="main" tabIndex={-1} className="w-full max-w-[1080px] px-4 py-7 outline-none md:px-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
