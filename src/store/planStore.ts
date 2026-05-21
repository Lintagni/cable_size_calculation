import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Plan = 'free' | 'pro' | 'business'

interface PlanStore {
  plan: Plan
  setPlan: (plan: Plan) => void
}

// Default 'free'; overridden by Supabase profile on login.
export const usePlanStore = create<PlanStore>()(
  persist(
    (set) => ({
      plan: 'free',
      setPlan: (plan) => set({ plan }),
    }),
    { name: 'cablecalc-plan' },
  ),
)
