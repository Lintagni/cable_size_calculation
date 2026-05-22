import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  dark: boolean
  toggle: () => void
}

function applyTheme(dark: boolean) {
  // Tailwind dark mode (legacy forms)
  document.documentElement.classList.toggle('dark', dark)
  // New CSS design token system
  document.documentElement.dataset.mode = dark ? 'dark' : 'light'
}

// Apply before first render
if (typeof window !== 'undefined') {
  try {
    const s = JSON.parse(localStorage.getItem('cablecalc-theme') || '{}')
    applyTheme(!!s?.state?.dark)
  } catch {
    applyTheme(false)
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      dark: false,
      toggle: () => set(s => {
        const next = !s.dark
        applyTheme(next)
        return { dark: next }
      }),
    }),
    { name: 'cablecalc-theme' },
  ),
)
