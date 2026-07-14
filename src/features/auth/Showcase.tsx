const HERO_BG =
  'radial-gradient(52% 56% at 14% 18%, #8B78FF, transparent 60%),' +
  'radial-gradient(48% 52% at 88% 10%, #2E7DFF, transparent 58%),' +
  'radial-gradient(58% 58% at 84% 90%, #FF5FA2, transparent 60%),' +
  'radial-gradient(54% 58% at 8% 94%, #12D6E6, transparent 60%),' +
  'linear-gradient(135deg, #5B4BF0, #6E52E6)'

const GRID =
  'linear-gradient(rgba(255,255,255,.14) 1px,transparent 1px),' +
  'linear-gradient(90deg,rgba(255,255,255,.14) 1px,transparent 1px)'

function EngineRow({ name, color, pct }: { name: string; color: string; pct: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex w-[104px] items-center gap-1.5 text-[12px]">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {name}
      </span>
      <span className="h-[7px] flex-1 overflow-hidden rounded-[5px] bg-[var(--line)]">
        <span className="block h-full rounded-[5px]" style={{ width: `${pct}%`, background: color }} />
      </span>
      <span className="w-9 text-right text-[11.5px] font-semibold tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  )
}

export function Showcase() {
  return (
    <section className="relative hidden flex-col items-center justify-center overflow-hidden px-14 py-[52px] text-center text-white md:flex" style={{ background: HERO_BG }}>
      <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: GRID, backgroundSize: '44px 44px', WebkitMaskImage: 'radial-gradient(80% 70% at 40% 40%, #000, transparent 78%)', maskImage: 'radial-gradient(80% 70% at 40% 40%, #000, transparent 78%)' }} />
      <div className="pointer-events-none absolute -right-28 -top-32 h-[420px] w-[420px] rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgba(255,255,255,.35), transparent 60%)' }} />

      <div className="absolute left-[56px] top-[52px] flex items-center gap-2.5 text-[16px] font-semibold">
        <span className="grid h-[26px] w-[26px] place-items-center rounded-lg bg-white text-[12px] text-[#5B4BF0] shadow-lg">◆</span>GEO
      </div>

      <div className="relative flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.16em] text-white/80">
        <span className="h-[7px] w-[7px] rounded-full bg-[#7CFCE4] shadow-[0_0_10px_#7CFCE4]" />AI visibility · live
      </div>
      <h1 className="relative mt-3.5 max-w-[13ch] text-[44px] font-bold leading-[1.03] tracking-[-.035em] text-balance">Win the AI answer.</h1>
      <p className="relative mt-4 max-w-[36ch] text-[15px] leading-relaxed text-white/80">
        Track how often ChatGPT, Perplexity and Google's AI cite your brand — and reclaim the answers naming competitors.
      </p>

      <div className="relative mt-7 w-full max-w-[440px] rounded-2xl border border-white/60 bg-white/95 p-5 text-left text-ink shadow-[0_30px_70px_-28px_rgba(14,19,48,.55)]">
        <div className="mb-4 flex items-baseline gap-2.5">
          <span className="text-[30px] font-bold leading-none tracking-[-.03em]" style={{ background: 'linear-gradient(120deg,#5B4BF0,#2E7DFF)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>42%</span>
          <span className="text-[12px] leading-tight text-muted">of AI answers in your<br />category mention you</span>
        </div>
        <div className="flex flex-col gap-2.5">
          <EngineRow name="ChatGPT" color="#12C7B6" pct={48} />
          <EngineRow name="Perplexity" color="#3E7BFA" pct={39} />
          <EngineRow name="Overviews" color="#E1893D" pct={27} />
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap justify-center gap-2.5">
        {[['Track citations', '#12C7B6'], ['Catch competitors', '#3E7BFA'], ['GEO fixes', '#ffffff']].map(([label, c]) => (
          <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[12.5px] backdrop-blur-sm">
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: c }} />{label}
          </span>
        ))}
      </div>

      <div className="relative mt-7">
        <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[.16em] text-white/60">Trusted by growth teams</div>
        <div className="flex flex-wrap justify-center gap-6 text-[14px] font-semibold tracking-tight text-white/60">
          <span>Northwind</span><span>Lumen</span><span>Vertex</span><span>Halcyon</span>
        </div>
      </div>
    </section>
  )
}
