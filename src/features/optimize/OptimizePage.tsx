import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCreateAudit } from './queries'
import { normalizeUrl } from './url'
import { AuditResult } from './AuditResult'
import { AuditHistory } from './AuditHistory'
import { Spinner } from '../../components/Spinner'
import { useToast } from '../../components/toast'
import { errorText } from '../../lib/format'

// Optimize screen: submit a site URL, create a GEO audit, then poll + render its
// six-dimension findings. Arriving with ?url= (from the Overview "Analyze" button)
// pre-fills the field and auto-runs the audit once.
export function OptimizePage() {
  const [params] = useSearchParams()
  // Strip a leading protocol for display — the field renders a decorative "https://" prefix,
  // and ?url= arrives already normalized (e.g. https://acme.io/) from the Overview hero.
  const [value, setValue] = useState(() => (params.get('url') ?? '').replace(/^https?:\/\//i, ''))
  const [invalid, setInvalid] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const toast = useToast()
  const create = useCreateAudit()

  // Selecting a history row loads that audit and mirrors its URL into the input
  // (protocol stripped, matching the field's decorative "https://" prefix) so the
  // user can see what was analyzed and re-run it via the Analyze button.
  function selectHistory(id: string, url: string) {
    setActiveId(id)
    setValue(url.replace(/^https?:\/\//i, ''))
  }

  function submit(raw: string) {
    const url = normalizeUrl(raw)
    if (!url) { setInvalid(true); return }
    setInvalid(false)
    create.mutate(url, {
      onSuccess: (audit) => setActiveId(audit.id),
      onError: (e) => toast('error', errorText(e)),
    })
  }

  // Auto-run once when landing with a valid ?url= from the Overview hero.
  const kicked = useRef(false)
  useEffect(() => {
    if (kicked.current) return
    const incoming = params.get('url')
    if (incoming && normalizeUrl(incoming)) { kicked.current = true; submit(incoming) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Optimize</h2>
        <p className="text-[14.5px] text-muted">Audit any page for how well AI answer engines can find, read, and cite it.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); submit(value) }}
        className="flex max-w-[620px] flex-col gap-1.5"
        noValidate
      >
        <div className="flex gap-2.5">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-line-strong bg-card px-3">
            <span className="text-[13px] text-faint">https://</span>
            <input
              value={value}
              onChange={(e) => { setValue(e.target.value); if (invalid) setInvalid(false) }}
              placeholder="yourdomain.com/page"
              aria-label="Website URL"
              aria-invalid={invalid}
              aria-describedby={invalid ? 'url-error' : undefined}
              className="w-full min-w-0 bg-transparent py-3 text-[14.5px] outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={create.isPending}
            className="grad-primary flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold disabled:opacity-70"
          >
            {create.isPending && <Spinner className="h-4 w-4" />}
            Analyze
          </button>
        </div>
        {invalid && <p id="url-error" className="text-[13px] text-bad">Enter a valid website, e.g. acme.com</p>}
      </form>

      {activeId && <AuditResult id={activeId} />}

      <AuditHistory activeId={activeId} onSelect={selectHistory} />
    </div>
  )
}
