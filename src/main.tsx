import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './lib/theme/theme-context'
import { AuthProvider } from './lib/auth/auth-context'
import { ToastProvider } from './components/toast'
import { ConfirmProvider } from './components/confirm'
import { ErrorBoundary } from './components/ErrorBoundary'
import { App } from './App'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/space-grotesk/wght.css'
import './styles/index.css'

const queryClient = new QueryClient()

// Provider tree: theme (data-theme) → query cache → auth session → toast → confirm → app.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
