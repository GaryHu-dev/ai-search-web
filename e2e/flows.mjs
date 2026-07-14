// End-to-end smoke of the whole app against a running backend, driven through the
// real UI with Playwright (system Chrome, no browser download).
//
//   Prereqs: backend on :3000, frontend served (default http://localhost:5173).
//   Run:     pnpm test:e2e            (or  APP_URL=http://localhost:4173 pnpm test:e2e)
//
// Not part of `pnpm test` — it needs live servers.
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const email = `e2e+${Date.now()}@acme.com`
const password = 'password123'
const results = []
const ok = (n) => { results.push(['PASS', n]); console.log('  ✓', n) }
const fail = (n, e) => { results.push(['FAIL', n, String(e?.message ?? e)]); console.log('  ✗', n, '—', e?.message ?? e) }

const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext({ acceptDownloads: true })
const page = await ctx.newPage()
page.on('dialog', (d) => d.accept())

async function run() {
  try {
    await page.goto(APP + '/login')
    await page.getByRole('tab', { name: 'Create account' }).click()
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByLabel(/Display name/i).fill('E2E User')
    await page.getByRole('button', { name: 'Create account' }).click()
    await page.getByRole('heading', { name: /Welcome back, E2E User/i }).waitFor({ timeout: 12000 })
    ok('register via UI -> Overview')
  } catch (e) { fail('register via UI', e) }

  try {
    await page.reload()
    await page.getByRole('heading', { name: /Welcome back, E2E User/i }).waitFor({ timeout: 12000 })
    ok('reload -> still authenticated (bootstrap)')
  } catch (e) { fail('reload stays authenticated', e) }

  try {
    await page.getByRole('link', { name: 'Files' }).click()
    await page.getByText(/No files yet/i).waitFor({ timeout: 8000 })
    writeFileSync('/tmp/e2e-upload.txt', 'end to end upload')
    await page.getByLabel('Choose file to upload').setInputFiles('/tmp/e2e-upload.txt')
    // exact: the success toast reads "Uploaded e2e-upload.txt" — only the row cell is exactly the filename.
    await page.getByText('e2e-upload.txt', { exact: true }).waitFor({ timeout: 10000 })
    ok('upload file -> appears in list')
  } catch (e) { fail('upload file', e) }

  try {
    await page.getByLabel('Search files').fill('nope-xyz')
    await page.getByText(/No files match/i).waitFor({ timeout: 8000 })
    await page.getByLabel('Search files').fill('')
    await page.getByText('e2e-upload.txt', { exact: true }).waitFor({ timeout: 8000 })
    ok('search filter + clear')
  } catch (e) { fail('search filter', e) }

  try {
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.getByLabel(/Download e2e-upload.txt/i).click(),
    ])
    if (!dl.suggestedFilename().includes('e2e-upload')) throw new Error('unexpected filename')
    ok('download file')
  } catch (e) { fail('download file', e) }

  try {
    await page.getByLabel(/Delete e2e-upload.txt/i).click()
    // Scope to the confirm dialog + exact name: the row's own button is "Delete e2e-upload.txt".
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click()
    await page.getByText(/No files yet/i).waitFor({ timeout: 10000 })
    ok('delete file (styled confirm) -> empty')
  } catch (e) { fail('delete file', e) }

  try {
    await page.getByRole('link', { name: 'Account' }).click()
    const input = page.getByLabel('Display name')
    await input.waitFor({ timeout: 8000 })
    await input.fill('E2E Renamed')
    await page.getByRole('button', { name: /Save changes/i }).click()
    await page.getByText('Saved', { exact: true }).waitFor({ timeout: 8000 })
    ok('update display name -> Saved')
  } catch (e) { fail('update display name', e) }

  try {
    await page.getByRole('link', { name: 'Optimize' }).click()
    await page.getByLabel('Website URL').fill('example.com')
    await page.getByRole('button', { name: 'Analyze' }).click()
    // Poll UI: either findings render or a FAILED state — both prove the round trip.
    await page.getByText(/signals look good|Audit failed/i).waitFor({ timeout: 30000 })
    ok('run GEO audit -> result renders')
  } catch (e) { fail('run GEO audit', e) }

  try {
    await page.getByLabel('Log out').click()
    await page.getByRole('tab', { name: 'Sign in' }).waitFor({ timeout: 8000 })
    ok('logout -> login page')
  } catch (e) { fail('logout', e) }

  try {
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('wrong-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.getByText(/Invalid email or password/i).waitFor({ timeout: 8000 })
    ok('wrong password -> inline 401 error (session not lost)')
  } catch (e) { fail('wrong password error', e) }

  try {
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.getByRole('heading', { name: /Welcome back, E2E Renamed/i }).waitFor({ timeout: 10000 })
    ok('correct login -> Overview (updated name)')
  } catch (e) { fail('correct login', e) }
}

try { await run() } finally {
  await browser.close()
  const failed = results.filter((r) => r[0] === 'FAIL')
  console.log(`\n=== E2E: ${results.length - failed.length}/${results.length} passed ===`)
  process.exit(failed.length ? 1 : 0)
}
