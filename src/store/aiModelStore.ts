import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AiModelId =
  | 'claude-opus-4-5'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5'

export interface AiModel {
  id: AiModelId
  label: string
  sublabel: string
  description: string
  color: string        // Tailwind text colour class
  badge: string        // Tailwind bg+text badge classes
}

export const AI_MODELS: AiModel[] = [
  {
    id:          'claude-opus-4-5',
    label:       'Opus',
    sublabel:    'Most capable',
    description: 'Best for complex multi-step engineering analysis and nuanced BS7671 interpretation.',
    color:       'text-amber-600 dark:text-amber-400',
    badge:       'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  },
  {
    id:          'claude-sonnet-4-6',
    label:       'Sonnet',
    sublabel:    'Recommended',
    description: 'Ideal balance of speed and accuracy for everyday cable sizing and BS7671 Q&A.',
    color:       'text-violet-600 dark:text-violet-400',
    badge:       'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400',
  },
  {
    id:          'claude-haiku-4-5',
    label:       'Haiku',
    sublabel:    'Fastest',
    description: 'Quick answers for simple queries and parameter extraction. Lowest credit usage.',
    color:       'text-sky-600 dark:text-sky-400',
    badge:       'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400',
  },
]

interface AiModelStore {
  modelId: AiModelId
  setModel: (id: AiModelId) => void
}

export const useAiModelStore = create<AiModelStore>()(
  persist(
    (set) => ({
      modelId: 'claude-sonnet-4-6',
      setModel: (modelId) => set({ modelId }),
    }),
    { name: 'cablecalc-ai-model' },
  ),
)
