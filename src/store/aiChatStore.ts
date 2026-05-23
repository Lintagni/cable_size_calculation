import { create } from 'zustand'
import type { ChatMessage } from '../lib/useAiChat'
import type { FillAction } from '../lib/claude'
import type { AiModelId } from './aiModelStore'

interface AiChatStore {
  messages:        ChatMessage[]
  msgModels:       Record<number, AiModelId>   // which model answered each assistant turn
  pendingFill:     FillAction | null            // fillAction waiting for user click
  setMessages:     (msgs: ChatMessage[]) => void
  setMsgModels:    (fn: (prev: Record<number, AiModelId>) => Record<number, AiModelId>) => void
  setPendingFill:  (action: FillAction | null) => void
  reset:           () => void
}

// No persist — chat survives in-app navigation but not full page refresh (intentional)
export const useAiChatStore = create<AiChatStore>((set) => ({
  messages:       [],
  msgModels:      {},
  pendingFill:    null,
  setMessages:    (messages) => set({ messages }),
  setMsgModels:   (fn) => set(s => ({ msgModels: fn(s.msgModels) })),
  setPendingFill: (pendingFill) => set({ pendingFill }),
  reset:          () => set({ messages: [], msgModels: {}, pendingFill: null }),
}))
