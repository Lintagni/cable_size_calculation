import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage } from '../lib/useAiChat'
import type { AiModelId } from './aiModelStore'

export interface SavedChat {
  id:        string
  timestamp: number
  title:     string                       // first user message, truncated
  messages:  ChatMessage[]
  msgModels: Record<number, AiModelId>   // model used per assistant turn
  turnCount: number                       // number of user turns
}

interface SavedChatStore {
  chats:  SavedChat[]
  save:   (messages: ChatMessage[], msgModels: Record<number, AiModelId>) => string
  remove: (id: string) => void
  clear:  () => void
}

export const useSavedChatStore = create<SavedChatStore>()(
  persist(
    (set) => ({
      chats: [],

      save: (messages, msgModels) => {
        const firstUser = messages.find(m => m.role === 'user')?.content ?? 'Untitled chat'
        const title = firstUser.length > 72 ? firstUser.slice(0, 72) + '…' : firstUser
        const id = crypto.randomUUID()
        const entry: SavedChat = {
          id,
          timestamp: Date.now(),
          title,
          messages,
          msgModels,
          turnCount: messages.filter(m => m.role === 'user').length,
        }
        set(s => ({ chats: [entry, ...s.chats.slice(0, 49)] }))
        return id
      },

      remove: (id) => set(s => ({ chats: s.chats.filter(c => c.id !== id) })),
      clear:  () => set({ chats: [] }),
    }),
    { name: 'cablecalc-saved-chats' },
  ),
)
