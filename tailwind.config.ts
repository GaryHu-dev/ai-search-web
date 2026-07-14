import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        sidebar: 'var(--sidebar)',
        card: 'var(--card)',
        'card-2': 'var(--card-2)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        hi: 'var(--hi)',
        'hi-soft': 'var(--hi-soft)',
        'hi-deep': 'var(--hi-deep)',
        primary: 'var(--primary)',
        good: 'var(--good)',
        'good-soft': 'var(--good-soft)',
        bad: 'var(--bad)',
        'bad-soft': 'var(--bad-soft)',
        c1: 'var(--c1)',
        c2: 'var(--c2)',
        c3: 'var(--c3)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk Variable"', '"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
