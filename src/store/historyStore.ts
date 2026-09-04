import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CalcType = 'lv' | 'vdrop' | 'sc' | 'motor' | 'abc' | 'busbar'

export interface HistoryEntry {
  id:        string
  type:      CalcType
  timestamp: number
  summary:   string          // short human-readable title, e.g. "16mm² XLPE · 45 A · Method C"
  inputs:    Record<string, unknown>
  result:    Record<string, unknown>
}

interface HistoryStore {
  entries:  HistoryEntry[]
  /** Supabase user id while signed in; null when anonymous. Drives sync. */
  userId:   string | null
  /** True while the first cloud pull for this session is in flight. */
  syncing:  boolean
  push:     (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  remove:   (id: string) => void
  clear:    () => void
  /** Called on sign-in: merge local and cloud history, then keep writing through. */
  attachUser:  (userId: string) => Promise<void>
  /** Called on sign-out: stop syncing, keep the local copy. */
  detachUser:  () => void
}

const MAX_ENTRIES = 100

/**
 * History lives in localStorage first and syncs to Supabase when signed in.
 *
 * localStorage stays the source of truth for the current tab so the UI never
 * waits on the network, and anonymous users still get history. Cloud writes are
 * fire-and-forget: `lib/calculationsApi` swallows its own errors, so a failed
 * sync degrades to local-only rather than losing a calculation.
 */
export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      entries: [],
      userId:  null,
      syncing: false,

      push: (entry) => {
        const full: HistoryEntry = {
          ...entry,
          id:        crypto.randomUUID(),
          timestamp: Date.now(),
        }
        set(s => ({ entries: [full, ...s.entries].slice(0, MAX_ENTRIES) }))

        const { userId } = get()
        if (userId) {
          import('../lib/calculationsApi').then(api => api.saveCalculations(userId, [full]))
        }
      },

      remove: (id) => {
        set(s => ({ entries: s.entries.filter(e => e.id !== id) }))
        if (get().userId) {
          import('../lib/calculationsApi').then(api => api.deleteCalculation(id))
        }
      },

      clear: () => {
        const { userId } = get()
        set({ entries: [] })
        if (userId) {
          import('../lib/calculationsApi').then(api => api.clearCalculations(userId))
        }
      },

      attachUser: async (userId) => {
        set({ userId, syncing: true })
        try {
          const api = await import('../lib/calculationsApi')
          const remote = await api.fetchCalculations(MAX_ENTRIES)

          // Union by id, newest first. Anything calculated while signed out on
          // this device gets pushed up rather than dropped.
          const byId = new Map<string, HistoryEntry>()
          for (const e of [...remote, ...get().entries]) byId.set(e.id, e)
          const merged = [...byId.values()]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_ENTRIES)

          set({ entries: merged })

          const remoteIds = new Set(remote.map(e => e.id))
          const unsynced = merged.filter(e => !remoteIds.has(e.id))
          if (unsynced.length) await api.saveCalculations(userId, unsynced)
        } finally {
          set({ syncing: false })
        }
      },

      detachUser: () => set({ userId: null, syncing: false }),
    }),
    {
      name: 'cablecalc-history',
      // userId/syncing are session state, not history — don't persist them.
      partialize: (s) => ({ entries: s.entries }),
    },
  ),
)
