import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Plan = 'free' | 'pro' | 'business'

interface PlanStore {
  plan:        Plan
  testMode:    boolean          // admin-only: override everyone to business tier
  setPlan:     (plan: Plan) => void
  setTestMode: (on: boolean) => void
}

// Default 'free'; overridden by Supabase profile on login.
export const usePlanStore = create<PlanStore>()(
  persist(
    (set) => ({
      plan:        'free',
      testMode:    false,
      setPlan:     (plan)     => set({ plan }),
      setTestMode: (testMode) => set({ testMode }),
    }),
    { name: 'cablecalc-plan' },
  ),
)

/** Returns effective plan — 'business' when test mode is ON, real plan otherwise. */
export function useActivePlan(): Plan {
  const plan     = usePlanStore(s => s.plan)
  const testMode = usePlanStore(s => s.testMode)
  return testMode ? 'business' : plan
}
