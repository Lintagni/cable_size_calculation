import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Plan = 'free' | 'pro' | 'business'

interface PlanStore {
  plan: Plan
  setPlan: (plan: Plan) => void
}

// Persisted so dev toggle survives reloads.
// Replace with Supabase subscription check at deploy time.
export const usePlanStore = create<PlanStore>()(
  persist(
    (set) => ({
      plan: 'pro',
      setPlan: (plan) => set({ plan }),
    }),
    { name: 'cablecalc-plan' },
  ),
)
