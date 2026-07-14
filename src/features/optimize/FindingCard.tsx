import type { Finding } from './types'

const OK = '#12C7B6'
const WARN = '#E1893D'

// One GEO dimension result. Left status dot + title, a summary line, then the
// recommendation callout when the dimension needs work.
export function FindingCard({ finding }: { finding: Finding }) {
  const ok = finding.status === 'ok'
  const color = ok ? OK : WARN
  return (
    <div className="rounded-2xl border border-line bg-card p-[18px]">
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: color }} />
        <span className="text-[14.5px] font-semibold">{finding.title}</span>
        {/* Text uses the app's ink/card-2 pair (not the status hue) so the pill clears
            WCAG AA 4.5:1 in both themes — the dot above still carries the color cue. */}
        <span className="ml-auto rounded-full bg-card-2 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink">
          {ok ? 'OK' : 'Needs work'}
        </span>
        {finding.strength === 'hard' && (
          <span className="rounded border border-line bg-card-2 px-1.5 py-px text-[9.5px] font-semibold uppercase text-faint">
            blocker
          </span>
        )}
      </div>
      <p className="text-[13.5px] text-muted">{finding.summary}</p>
      {!ok && (
        <div className="mt-3 rounded-xl bg-hi-soft px-3 py-2.5 text-[13px] text-hi-deep">
          <span className="font-semibold">Fix: </span>{finding.recommendation}
        </div>
      )}
    </div>
  )
}
