import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth/auth-context'
import { useToast } from '../../components/toast'
import { useConfirm } from '../../components/confirm'
import { Spinner } from '../../components/Spinner'
import { useUpdateProfile, useDeleteAccount } from './queries'
import { errorText, avatarInitial } from '../../lib/format'

const schema = z.object({ displayName: z.string().max(100) })
type Values = z.infer<typeof schema>

// Account screen: edit the display name (PATCH), a read-only email, and a
// danger-zone deletion that clears the whole session and returns to /login.
export function AccountPage() {
  const { user, setUser, logout } = useAuth()
  const update = useUpdateProfile()
  const del = useDeleteAccount()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const [saved, setSaved] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: { displayName: user?.displayName ?? '' },
  })

  if (!user) return <div className="text-sm text-muted">Loading…</div>

  async function onSubmit(values: Values) {
    setSaved(false)
    setActionError(null)
    try {
      const updated = await update.mutateAsync({ displayName: values.displayName })
      setUser(updated)
      form.reset({ displayName: updated.displayName ?? '' })
      setSaved(true)
      toast('success', 'Changes saved')
    } catch (e) {
      setActionError(errorText(e))
    }
  }

  async function onDelete() {
    const yes = await confirm({
      title: 'Delete account',
      message: 'Permanently delete your account and sign out everywhere? This can’t be undone.',
      confirmLabel: 'Delete account',
      danger: true,
    })
    if (!yes) return
    setActionError(null)
    try {
      await del.mutateAsync()
    } catch (e) {
      setActionError(errorText(e))
      return
    }
    // Reset the whole session (tokens + auth context), then leave.
    await logout()
    navigate('/login')
  }

  const inputClass = 'field-input px-3 py-3 text-[14px]'

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account</h2>
        <p className="text-[14.5px] text-muted">Manage your profile and workspace.</p>
      </div>

      <section className="flex flex-col gap-[18px] rounded-2xl border border-line bg-card p-[22px]">
        <div>
          <div className="text-sm font-bold">Profile</div>
          <div className="text-[12.5px] text-faint">This is how you'll appear in GEO.</div>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="grad-avatar grid h-[52px] w-[52px] place-items-center rounded-full text-xl font-bold">
            {avatarInitial(user.displayName, user.email)}
          </span>
          <div>
            <div className="text-[15px] font-semibold">{user.displayName ?? '—'}</div>
            <div className="text-[13px] text-muted">{user.email}</div>
          </div>
        </div>
        <div className="h-px bg-line" />
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <label className="flex max-w-[420px] flex-col gap-1.5 text-[12.5px] font-semibold">
            Display name
            <input className={inputClass}
              aria-invalid={!!form.formState.errors.displayName}
              aria-describedby={form.formState.errors.displayName ? 'displayName-error' : undefined}
              {...form.register('displayName', { onChange: () => setSaved(false) })} />
            {form.formState.errors.displayName && (
              <span id="displayName-error" className="text-xs font-normal text-bad">{form.formState.errors.displayName.message}</span>
            )}
          </label>
          <label className="flex max-w-[420px] flex-col gap-1.5 text-[12.5px] font-semibold">
            Email
            <input value={user.email} readOnly className={inputClass} />
            <span className="text-xs font-normal text-faint">Email can't be changed for now.</span>
          </label>
          <div className="flex items-center gap-2.5">
            <button type="submit" disabled={update.isPending}
              className="grad-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold disabled:opacity-60">
              {update.isPending && <Spinner className="h-3.5 w-3.5" />}
              {update.isPending ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={() => { form.reset(); setSaved(false); setActionError(null) }} className="rounded-xl border border-line-strong bg-card px-4 py-2.5 text-[14px] font-semibold">
              Cancel
            </button>
            {saved && !form.formState.isDirty && <span className="text-sm text-good">Saved</span>}
          </div>
          {actionError && <p role="alert" className="text-sm text-bad">{actionError}</p>}
        </form>
      </section>

      <section className="flex flex-col gap-3.5 rounded-2xl border border-line bg-card p-[22px]">
        <div className="text-sm font-bold">Plan</div>
        <div className="flex items-center justify-between text-[13.5px]">
          <span className="text-muted">Current plan</span>
          <span className="rounded-full bg-good-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-good">Free</span>
        </div>
      </section>

      <div className="flex flex-col items-start gap-4 rounded-2xl border border-bad-soft p-5 sm:flex-row sm:items-center">
        <div>
          <div className="text-[14.5px] font-semibold">Delete account</div>
          <div className="max-w-[52ch] text-[13px] text-muted">
            Permanently remove your account and sign out everywhere. This can't be undone.
          </div>
        </div>
        <button onClick={onDelete} disabled={del.isPending}
          className="rounded-xl bg-bad-soft px-4 py-2.5 text-[14px] font-semibold text-bad disabled:opacity-60 sm:ml-auto">
          Delete account
        </button>
      </div>
    </div>
  )
}
