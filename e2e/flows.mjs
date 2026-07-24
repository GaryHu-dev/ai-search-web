// End-to-end smoke of the app shell against a running frontend, driven through the
// real UI with Playwright (system Chrome, no browser download).
//
//   Prereqs: frontend served (default http://localhost:5173).
//   Run:     pnpm test:e2e            (or  APP_URL=http://localhost:4173 pnpm test:e2e)
//
// Auth is Google-only (backend-driven OAuth), so a full logged-in journey can't run
// headlessly without a real Google session. This smoke covers what's reachable
// pre-auth: the login page renders and the Google entry point is wired up.
import { chromium } from 'playwright'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const results = []
const ok = (n) => { results.push(['PASS', n]); console.log('  ✓', n) }
const fail = (n, e) => { results.push(['FAIL', n, String(e?.message ?? e)]); console.log('  ✗', n, '—', e?.message ?? e) }

const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext()
const page = await ctx.newPage()

async function run() {
  try {
    await page.goto(APP + '/login')
    await page.getByRole('heading', { name: /Sign in to Omniport/i }).waitFor({ timeout: 12000 })
    await page.getByRole('button', { name: /Continue with Google/i }).waitFor({ timeout: 8000 })
    ok('login page renders (Omniport, Google-only)')
  } catch (e) { fail('login page renders', e) }

  try {
    await page.goto(APP + '/')
    // Anonymous users are bounced to /login by ProtectedRoute.
    await page.getByRole('button', { name: /Continue with Google/i }).waitFor({ timeout: 8000 })
    ok('protected route redirects anonymous -> login')
  } catch (e) { fail('protected redirect', e) }
}

try { await run() } finally {
  await browser.close()
  const failed = results.filter((r) => r[0] === 'FAIL')
  console.log(`\n=== E2E: ${results.length - failed.length}/${results.length} passed ===`)
  process.exit(failed.length ? 1 : 0)
}
