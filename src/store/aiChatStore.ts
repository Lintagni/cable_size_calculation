import { create } from 'zustand'
import type { ChatMessage } from '../lib/useAiChat'
import type { FillAction } from '../lib/claude'
import type { AiModelId } from './aiModelStore'
import type { LvCableResult } from '../calculators/lvCableSizing'
import type { AbcResult } from '../calculators/abcCableSizing'
import type { BusbarResult } from '../calculators/busbarSizing'

// Discriminated union so the result card knows which type to render
export type CalcResultPayload =
  | { type: 'lv';     result: LvCableResult }
  | { type: 'abc';    result: AbcResult }
  | { type: 'busbar'; result: BusbarResult }

interface AiChatStore {
  messages:        ChatMessage[]
  msgModels:       Record<number, AiModelId>        // model used for each assistant turn (by msg index)
  calcResults:     Record<number, CalcResultPayload> // calc result attached to each assistant turn
  pendingFill:     FillAction | null                 // latest fillAction — user can open in Calculator
  setMessages:     (msgs: ChatMessage[]) => void
  setMsgModels:    (fn: (prev: Record<number, AiModelId>) => Record<number, AiModelId>) => void
  setCalcResult:   (msgIdx: number, payload: CalcResultPayload) => void
  setPendingFill:  (action: FillAction | null) => void
  reset:           () => void
}

// No persist — chat survives in-app navigation but not full page refresh (intentional)
export const useAiChatStore = create<AiChatStore>((set) => ({
  messages:       [],
  msgModels:      {},
  calcResults:    {},
  pendingFill:    null,
  setMessages:    (messages) => set({ messages }),
  setMsgModels:   (fn) => set(s => ({ msgModels: fn(s.msgModels) })),
  setCalcResult:  (msgIdx, payload) => set(s => ({ calcResults: { ...s.calcResults, [msgIdx]: payload } })),
  setPendingFill: (pendingFill) => set({ pendingFill }),
  reset:          () => set({ messages: [], msgModels: {}, calcResults: {}, pendingFill: null }),
}))
