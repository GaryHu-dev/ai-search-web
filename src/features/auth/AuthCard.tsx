import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth/auth-context'
import { loginSchema, registerSchema, type RegisterValues } from './schemas'
import { isGoogleEnabled, renderGoogleButton } from './google'
import { Spinner } from '../../components/Spinner'
import { errorText } from '../../lib/format'

type Tab = 'signin' | 'register'

export function AuthCard() {
  const [tab, setTab] = useState<Tab>('signin')
  const [formError, setFormError] = useState<string | null>(null)
  const { login, register: registerUser, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const isRegister = tab === 'register'
  const googleRef = useRef<HTMLDivElement>(null)
  const signinTabRef = useRef<HTMLButtonElement>(null)
  const registerTabRef = useRef<HTMLButtonElement>(null)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
  })

  // Wire up Google Identity Services (only when a client id is configured).
  useEffect(() => {
    if (!isGoogleEnabled() || !googleRef.current) return
    renderGoogleButton(googleRef.current, async (idToken) => {
      setFormError(null)
      try {
        await loginWithGoogle(idToken)
        navigate('/')
      } catch (e) {
        setFormError(errorText(e))
      }
    }).catch(() => setFormError('Google sign-in failed to load.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: RegisterValues) {
    setFormError(null)
    try {
      if (isRegister) await registerUser(values)
      else await login(values.email, values.password)
      navigate('/')
    } catch (e) {
      setFormError(errorText(e))
    }
  }

  function switchTab(next: Tab) {
    setTab(next)
    setFormError(null)
    form.reset()
  }

  function onTablistKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const next: Tab = tab === 'signin' ? 'register' : 'signin'
    switchTab(next)
    ;(next === 'signin' ? signinTabRef : registerTabRef).current?.focus()
  }

  const inputClass = 'field-input px-3 py-3 text-[14.5px]'

  return (
    <div className="w-full max-w-[392px]">
      <div role="tablist" aria-label="Sign in or create account" onKeyDown={onTablistKeyDown}
        className="mb-6 inline-flex gap-0.5 rounded-xl border border-line bg-card-2 p-1">
        <button ref={signinTabRef} role="tab" id="signin-tab" aria-selected={!isRegister} aria-controls="auth-panel"
          tabIndex={!isRegister ? 0 : -1} onClick={() => switchTab('signin')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${!isRegister ? 'bg-card text-ink shadow-sm' : 'text-muted'}`}>
          Sign in
        </button>
        <button ref={registerTabRef} role="tab" id="register-tab" aria-selected={isRegister} aria-controls="auth-panel"
          tabIndex={isRegister ? 0 : -1} onClick={() => switchTab('register')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${isRegister ? 'bg-card text-ink shadow-sm' : 'text-muted'}`}>
          Create account
        </button>
      </div>

      <div role="tabpanel" id="auth-panel" aria-labelledby={isRegister ? 'register-tab' : 'signin-tab'} tabIndex={0}>
        <h2 className="text-[25px] font-bold tracking-tight">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
        <p className="mb-6 mt-1.5 text-[14.5px] text-muted">Pick up your AI-visibility tracking where you left off.</p>

        {formError && (
          <div role="alert" className="mb-4 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
            {formError}
          </div>
        )}

        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold">
            Email
            <input type="email" autoComplete="email" className={inputClass}
              aria-invalid={!!form.formState.errors.email}
              aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
              {...form.register('email')} />
            {form.formState.errors.email && (
              <span id="email-error" className="text-xs font-normal text-bad">{form.formState.errors.email.message}</span>
            )}
          </label>

          <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold">
            Password
            <input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} className={inputClass}
              aria-invalid={!!form.formState.errors.password}
              aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
              {...form.register('password')} />
            {form.formState.errors.password && (
              <span id="password-error" className="text-xs font-normal text-bad">{form.formState.errors.password.message}</span>
            )}
          </label>

          {isRegister && (
            <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold">
              Display name (optional)
              <input className={inputClass} {...form.register('displayName')} />
            </label>
          )}

          <button type="submit" disabled={form.formState.isSubmitting}
            className="grad-primary mt-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 font-semibold disabled:opacity-70">
            {form.formState.isSubmitting && <Spinner className="h-4 w-4" />}
            {isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {isGoogleEnabled() && (
          <>
            <div className="my-1 flex items-center gap-3 text-xs text-faint">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>
            <div className="relative">
              <button type="button" tabIndex={-1} aria-hidden
                className="pointer-events-none flex w-full items-center justify-center gap-2.5 rounded-xl border border-line-strong bg-card py-3 font-semibold">
                <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/></svg>
                Continue with Google
              </button>
              {/* Google's official button, rendered transparently on top so it captures the click but our styled button shows. */}
              <div ref={googleRef} className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-0" />
            </div>
          </>
        )}

        <div className="mt-5 text-center text-[13.5px] text-muted">
          {isRegister ? (
            <>Already have an account?{' '}
              <button type="button" className="font-semibold text-ink underline decoration-hi decoration-2 underline-offset-2" onClick={() => switchTab('signin')}>Sign in</button>
            </>
          ) : (
            <>New to GEO?{' '}
              <button type="button" className="font-semibold text-ink underline decoration-hi decoration-2 underline-offset-2" onClick={() => switchTab('register')}>Create an account</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
