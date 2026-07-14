import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { http, HttpResponse, delay } from 'msw'
import { server } from '../../../test/msw/server'
import { AuthProvider, useAuth } from '../auth-context'
import { clearTokens, setRefreshToken, getRefreshToken } from '../../api/token-store'

function Probe() {
  const { status, user, login } = useAuth()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.email ?? '-'}</span>
      <button onClick={() => login('jane@acme.com', 'password123').catch(() => {})}>login</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    clearTokens()
    localStorage.clear()
  })

  it('starts anonymous with no refresh token', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
  })

  it('bootstraps to authenticated when a refresh token exists', async () => {
    setRefreshToken('r-old')
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(screen.getByTestId('user')).toHaveTextContent('jane@acme.com')
  })

  it('login sets the user and authenticated status', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
    await act(async () => {
      screen.getByText('login').click()
    })
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
  })

  it('does not persist the refresh token if me() fails during login', async () => {
    server.use(
      http.get('http://localhost:3000/v1/users/me', () =>
        HttpResponse.json({ statusCode: 500, error: 'Internal', message: 'boom' }, { status: 500 })),
    )
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
    await act(async () => {
      screen.getByText('login').click()
    })
    // me() fails → login rejects → no refresh token persisted, still anonymous.
    await waitFor(() => expect(getRefreshToken()).toBeNull())
    expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
  })

  it('logs out this tab when another tab clears the refresh token (storage event)', async () => {
    setRefreshToken('r-old')
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'geo.refreshToken', newValue: null, oldValue: 'r-old' }),
      )
    })

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
    expect(screen.getByTestId('user')).toHaveTextContent('-')
  })

  it('does not blow up if the provider unmounts before bootstrap me() resolves', async () => {
    setRefreshToken('r-old')
    server.use(
      http.get('http://localhost:3000/v1/users/me', async () => {
        await delay(50)
        return HttpResponse.json({
          data: { id: 'u1', email: 'jane@acme.com', displayName: 'Jane Doe', createdAt: '2026-07-01T00:00:00.000Z' },
          requestId: 'req_me',
        })
      }),
    )
    const { unmount } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    // Bootstrap kicked off `me()` but it hasn't resolved yet — unmount before it does.
    expect(screen.getByTestId('status')).toHaveTextContent('loading')
    expect(() => unmount()).not.toThrow()

    // Let the in-flight response resolve; the `cancelled` guard should swallow it silently.
    await new Promise((resolve) => setTimeout(resolve, 80))
  })
})
