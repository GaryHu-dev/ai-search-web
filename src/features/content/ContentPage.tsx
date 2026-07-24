// Content workbench: an AI-generated post with SEO + GEO optimization panels and
// the approve / publish actions. Static/presentational for now.

function Check({ ok }: { ok: boolean }) {
  return (
    <span className={`grid h-[18px] w-[18px] flex-none place-items-center rounded-full ${ok ? 'bg-good text-white' : 'bg-card-2 text-muted'}`}>
      {ok ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 8v5M12 16h0" /></svg>
      )}
    </span>
  )
}
function CheckRow({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <div className="flex items-center gap-2.5 text-[13px]"><Check ok={ok} /> <span>{children}</span></div>
}

export function ContentPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-[color-mix(in_srgb,var(--c3)_16%,transparent)] px-2.5 py-[3px] text-[10.5px] font-bold uppercase tracking-wide text-c3">In review</span>
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-muted">
          <span className="grid h-4 w-4 place-items-center rounded bg-[#16A34A] text-[9px] font-bold text-white">S</span>
          Brew &amp; Co · Shopify blog
        </span>
        <div className="ml-auto flex gap-2.5">
          <button className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-card px-3 py-2 text-[13px] font-semibold hover:bg-card-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-[15px] w-[15px]"><path d="M3 12a9 9 0 1 0 3-6.7M3 5v4h4" /></svg>
            Regenerate
          </button>
          <button className="grad-primary inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" className="h-[15px] w-[15px]"><path d="M20 6 9 17l-5-5" /></svg>
            Approve &amp; schedule
          </button>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
        {/* document */}
        <article className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
          <div className="border-b border-line px-5 py-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-hi-soft px-2.5 py-1 text-[11.5px] font-semibold text-hi-deep">✦ AI-generated · 1,240 words</span>
          </div>
          <div className="px-7 pb-8 pt-6">
            <span className="mb-3 inline-block rounded-full bg-hi-soft px-2.5 py-1 text-[11.5px] font-semibold text-hi-deep">🎯 how to store coffee beans</span>
            <h2 className="text-[27px] font-bold leading-[1.15] tracking-tight">How to Store Coffee Beans for Maximum Freshness</h2>
            <div className="mb-[18px] mt-2 flex flex-wrap gap-3.5 border-b border-line pb-3.5 text-[12.5px] text-faint">
              <span>✦ Generated Jul 22</span><span>6 min read</span><span>Theme: Product care</span>
            </div>
            <p className="mb-3 text-[15px] leading-[1.68] text-ink">
              Freshly roasted coffee is at its best within a few weeks of roasting — and how you store it makes all the difference. If you've wondered{' '}
              <mark className="rounded bg-[color-mix(in_srgb,var(--hi)_16%,transparent)] px-0.5 text-ink">how to store coffee beans</mark>{' '}
              so every cup tastes as good as the first, it comes down to four things: air, light, heat, and moisture.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-bold">Keep it airtight</h3>
            <p className="mb-3 text-[15px] leading-[1.68] text-ink">Oxygen is coffee's biggest enemy. Store beans in an opaque, airtight container with a one-way valve, and only grind what you need right before brewing.</p>
            <h3 className="mb-2 mt-5 text-lg font-bold">Cool, dark, and dry</h3>
            <p className="text-[15px] leading-[1.68] text-ink">A pantry shelf away from the stove and window is ideal. Heat and sunlight accelerate staling — so skip the spot next to the kettle.</p>
          </div>
        </article>

        {/* panels */}
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-line bg-card shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--c2)" strokeWidth="1.9"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" strokeLinecap="round" /></svg>
              <h3 className="text-sm font-bold">SEO</h3>
              <span className="ml-auto text-sm font-extrabold text-good">94</span>
            </div>
            <div className="flex flex-col gap-2.5 p-4">
              <CheckRow ok>Keyword in title &amp; first paragraph</CheckRow>
              <CheckRow ok>Headings structured (H1 → H2)</CheckRow>
              <CheckRow ok={false}>Add 1 more internal link</CheckRow>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-card shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--c3)" strokeWidth="1.9"><path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 8.7l5.4-.8z" strokeLinejoin="round" /></svg>
              <h3 className="text-sm font-bold">GEO · cite-ready</h3>
              <span className="ml-auto text-sm font-extrabold text-c3">88</span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div className="rounded-xl border border-dashed border-line-strong bg-card-2 px-3 py-2.5 text-[12.5px] leading-[1.5]">
                <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-c3">Quotable answer</div>
                Store beans airtight, cool, dark and dry — away from heat, light and moisture — and grind just before brewing.
              </div>
              <CheckRow ok>FAQ structured data attached</CheckRow>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
