const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export function isGoogleEnabled(): boolean {
  return Boolean(CLIENT_ID)
}

// Loads the Google Identity Services script once and resolves when ready.
let scriptPromise: Promise<void> | null = null
function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return reject(new Error('no document'))
    const existing = document.querySelector<HTMLScriptElement>('script[data-gsi]')
    if (existing) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.dataset.gsi = 'true'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google sign-in'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

interface GoogleId {
  accounts: {
    id: {
      initialize(config: { client_id: string; callback: (r: { credential: string }) => void }): void
      renderButton(el: HTMLElement, opts: Record<string, unknown>): void
    }
  }
}

// Initializes GIS and renders Google's official button into `container`.
// On success, `onCredential` receives the Google ID token to send to the backend.
export async function renderGoogleButton(
  container: HTMLElement,
  onCredential: (idToken: string) => void,
): Promise<void> {
  if (!CLIENT_ID) return
  await loadScript()
  const g = (window as unknown as { google?: GoogleId }).google
  if (!g) throw new Error('Google sign-in unavailable')
  g.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (r) => onCredential(r.credential),
  })
  container.innerHTML = ''
  g.accounts.id.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    logo_alignment: 'center',
    width: Math.min(Math.max(container.offsetWidth || 320, 200), 400),
  })
}
