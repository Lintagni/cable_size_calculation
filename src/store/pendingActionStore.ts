import { create } from 'zustand'
import type { FillAction } from '../lib/claude'

interface PendingActionStore {
  action: FillAction | null
  setAction: (action: FillAction) => void
  clearAction: () => void
}

export const usePendingActionStore = create<PendingActionStore>(set => ({
  action: null,
  setAction: action => set({ action }),
  clearAction: () => set({ action: null }),
}))
