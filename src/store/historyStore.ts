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
  entries: HistoryEntry[]
  push:    (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  remove:  (id: string) => void
  clear:   () => void
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      entries: [],

      push: (entry) => set((s) => ({
        entries: [
          {
            ...entry,
            id:        crypto.randomUUID(),
            timestamp: Date.now(),
          },
          // Keep last 100 entries; newest first
          ...s.entries.slice(0, 99),
        ],
      })),

      remove: (id) => set((s) => ({ entries: s.entries.filter(e => e.id !== id) })),

      clear: () => set({ entries: [] }),
    }),
    { name: 'cablecalc-history' },
  ),
)
