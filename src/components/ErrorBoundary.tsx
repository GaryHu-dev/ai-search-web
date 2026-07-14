import { Component, type ReactNode } from 'react'

// Catches render errors anywhere below it so a single throw doesn't blank the whole SPA.
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-dvh place-items-center bg-bg p-6 text-center">
          <div>
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="mt-1 text-sm text-muted">An unexpected error occurred. Reloading usually fixes it.</p>
            <button onClick={() => location.reload()} className="grad-primary mt-4 rounded-xl px-4 py-2 text-sm font-semibold">
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
