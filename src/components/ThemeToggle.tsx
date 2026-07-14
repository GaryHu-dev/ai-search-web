import { useTheme, type Theme } from '../lib/theme/theme-context'

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Auto' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div role="group" aria-label="Theme" className="flex gap-0.5 rounded-lg border border-line bg-card-2 p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={theme === o.value}
          onClick={() => setTheme(o.value)}
          className={`flex-1 rounded-md px-2 py-1.5 text-[11.5px] font-medium transition-colors ${
            theme === o.value ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
