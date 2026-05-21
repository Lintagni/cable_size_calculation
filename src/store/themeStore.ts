import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  dark: boolean
  toggle: () => void
}

// Apply before first render
if (typeof window !== 'undefined') {
  try {
    const s = JSON.parse(localStorage.getItem('cablecalc-theme') || '{}')
    if (s?.state?.dark) document.documentElement.classList.add('dark')
  } catch {}
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      dark: false,
      toggle: () => set(s => {
        const next = !s.dark
        document.documentElement.classList.toggle('dark', next)
        return { dark: next }
      }),
    }),
    { name: 'cablecalc-theme' },
  ),
)
