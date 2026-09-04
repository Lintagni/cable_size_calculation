import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_BOARD_DEFAULTS, newCircuit,
  type BoardCircuit, type BoardDefaults, type BoardMeta,
} from '../calculators/boardSchedule'

interface BoardStore {
  meta:     BoardMeta
  defaults: BoardDefaults
  circuits: BoardCircuit[]
  setMeta:      (patch: Partial<BoardMeta>) => void
  setDefaults:  (patch: Partial<BoardDefaults>) => void
  addCircuit:   () => void
  updateCircuit: (id: string, patch: Partial<BoardCircuit>) => void
  removeCircuit: (id: string) => void
  duplicateCircuit: (id: string) => void
  reset: () => void
}

const EMPTY_META: BoardMeta = { project: '', boardRef: '', designer: '', location: '' }

/** Way numbering continues from the highest existing "way N" style ref. */
function nextRef(circuits: BoardCircuit[]): string {
  return `Way ${circuits.length + 1}`
}

/**
 * The working distribution board.
 *
 * Persisted locally so a part-built board survives a refresh — losing twenty
 * circuits to an accidental reload would make the feature unusable.
 */
export const useBoardStore = create<BoardStore>()(
  persist(
    (set) => ({
      meta:     EMPTY_META,
      defaults: DEFAULT_BOARD_DEFAULTS,
      circuits: [newCircuit('Way 1')],

      setMeta:     (patch) => set(s => ({ meta: { ...s.meta, ...patch } })),
      setDefaults: (patch) => set(s => ({ defaults: { ...s.defaults, ...patch } })),

      addCircuit: () => set(s => ({ circuits: [...s.circuits, newCircuit(nextRef(s.circuits))] })),

      updateCircuit: (id, patch) => set(s => ({
        circuits: s.circuits.map(c => (c.id === id ? { ...c, ...patch } : c)),
      })),

      removeCircuit: (id) => set(s => ({ circuits: s.circuits.filter(c => c.id !== id) })),

      duplicateCircuit: (id) => set(s => {
        const idx = s.circuits.findIndex(c => c.id === id)
        if (idx < 0) return s
        const copy = { ...s.circuits[idx], id: crypto.randomUUID(), ref: nextRef(s.circuits) }
        const circuits = [...s.circuits]
        circuits.splice(idx + 1, 0, copy)
        return { circuits }
      }),

      reset: () => set({ meta: EMPTY_META, defaults: DEFAULT_BOARD_DEFAULTS, circuits: [newCircuit('Way 1')] }),
    }),
    { name: 'cablecalc-board' },
  ),
)
