import { Link } from 'react-router-dom'

// Status pill shared with the content pipeline.
type PillKind = 'sch' | 'rev' | 'pub'
const PILL: Record<PillKind, { label: string; cls: string }> = {
  sch: { label: 'Scheduled', cls: 'text-c2 bg-[color-mix(in_srgb,var(--c2)_15%,transparent)]' },
  rev: { label: 'In review', cls: 'text-c3 bg-[color-mix(in_srgb,var(--c3)_16%,transparent)]' },
  pub: { label: 'Published', cls: 'text-good bg-good-soft' },
}
function Pill({ kind }: { kind: PillKind }) {
  const p = PILL[kind]
  return <span className={`rounded-full px-2.5 py-[3px] text-[10.5px] font-bold uppercase tracking-wide ${p.cls}`}>{p.label}</span>
}

function Metric({ label, value, delta, color, d }: { label: string; value: string; delta: string; color: string; d: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-[17px] shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
      <div className="text-[12px] font-semibold text-muted">{label}</div>
      <div className="flex items-end justify-between">
        <div>
          <div className="mt-1.5 text-[26px] font-bold leading-none tracking-[-.03em]">{value}</div>
          <span className="text-[11.5px] font-bold text-good">▲ {delta}</span>
        </div>
        <svg viewBox="0 0 74 30" fill="none" className="h-[30px] w-[74px]">
          <path d={d} stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}

const PIPELINE: { kind: PillKind; title: string; when: string }[] = [
  { kind: 'rev', title: 'How to Store Coffee Beans for Freshness', when: 'needs you' },
  { kind: 'sch', title: 'Best Grind Size for Every Brew Method', when: 'Tue 9:00' },
  { kind: 'sch', title: 'Single-Origin vs Blend: What to Know', when: 'Thu 9:00' },
  { kind: 'pub', title: 'The Complete Guide to Pour-Over Coffee', when: 'Jul 20' },
]
const THEMES = ['Brewing guides', 'Coffee origins', 'Sustainability', 'Product care']

// Dashboard: the autopilot overview — pipeline, strategy and headline metrics.
// Static/presentational for now; wires to real content endpoints later.
export function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* hero */}
      <section className="relative flex items-center gap-5 overflow-hidden rounded-2xl border border-line bg-[linear-gradient(125deg,color-mix(in_srgb,var(--hi)_11%,var(--card)),var(--card)_62%)] p-6 shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
        <div aria-hidden className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(109,94,252,.16), transparent 68%)' }} />
        <div className="relative flex-1">
          <span className="mb-2.5 inline-flex items-center gap-2 rounded-full bg-good-soft px-2.5 py-[5px] text-[12px] font-bold text-good">
            <span className="h-[7px] w-[7px] rounded-full bg-good" /> Autopilot on · Brew &amp; Co
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Your content is running itself.</h2>
          <p className="mt-1 text-[14px] text-muted">12 posts published this month · next one goes out Tuesday 9:00.</p>
        </div>
        <Link to="/content" className="grad-primary relative inline-flex flex-none items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-[15px] w-[15px]"><path d="M12 5v14M5 12h14" /></svg>
          Generate a post
        </Link>
      </section>

      {/* metrics */}
      <div className="grid gap-3.5 md:grid-cols-3">
        <Metric label="Organic traffic" value="4,820" delta="23%" color="var(--hi)" d="M0 26 12 24 24 22 36 16 48 14 60 8 74 3" />
        <Metric label="Keywords in top 20" value="47" delta="8 new" color="var(--c2)" d="M0 24 12 22 24 20 36 18 48 12 60 10 74 6" />
        <Metric label="AI citations · GEO" value="12" delta="5" color="var(--c3)" d="M0 27 12 26 24 22 36 20 48 15 60 11 74 5" />
      </div>

      {/* pipeline + strategy */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
          <div className="flex items-center gap-2.5 border-b border-line px-[17px] py-3.5">
            <h3 className="text-sm font-bold">Content pipeline</h3>
            <span className="ml-auto text-[12.5px] text-faint">this week</span>
          </div>
          <div className="flex flex-col">
            {PIPELINE.map((p) => (
              <div key={p.title} className="flex items-center gap-3 border-t border-line px-[17px] py-[11px] text-[13.5px] first:border-t-0">
                <Pill kind={p.kind} />
                <span className="min-w-0 flex-1 truncate font-semibold">{p.title}</span>
                <span className="whitespace-nowrap text-[12px] text-faint">{p.when}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-card shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
          <div className="flex items-center gap-2.5 border-b border-line px-[17px] py-3.5">
            <h3 className="text-sm font-bold">Content strategy</h3>
            <Link to="/account" className="ml-auto rounded-lg border border-line-strong bg-card px-2.5 py-1.5 text-[12px] font-semibold hover:bg-card-2">Edit</Link>
          </div>
          <div className="flex flex-col gap-3.5 p-[17px]">
            <div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">Themes</div>
              <div className="flex flex-wrap gap-1.5">
                {THEMES.map((t) => (
                  <span key={t} className="rounded-full bg-hi-soft px-2.5 py-1 text-[11.5px] font-semibold text-hi-deep">{t}</span>
                ))}
              </div>
            </div>
            <Row k="Cadence" v="3 posts / week" />
            <Row k="Tone" v="Friendly expert" />
            <Row k="Publishing to">
              <span className="grid h-4 w-4 place-items-center rounded bg-[#16A34A] text-[9px] font-bold text-white">S</span>
              Brew &amp; Co · Shopify blog
            </Row>
          </div>
        </section>
      </div>
    </div>
  )
}

function Row({ k, v, children }: { k: string; v?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <span className="w-[110px] flex-none text-muted">{k}</span>
      <span className="flex items-center gap-1.5 font-semibold">{v ?? children}</span>
    </div>
  )
}
