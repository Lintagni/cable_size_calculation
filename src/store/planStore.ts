import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getGlobalTestMode } from '../lib/globalSettings'

export type Plan = 'free' | 'pro' | 'business'

interface PlanStore {
  plan:         Plan
  testMode:     boolean
  setPlan:      (plan: Plan) => void
  setTestMode:  (on: boolean) => void
  syncTestMode: () => Promise<void>   // fetch global flag from Supabase
}

// Default 'free'; overridden by Supabase profile on login.
export const usePlanStore = create<PlanStore>()(
  persist(
    (set) => ({
      plan:        'free',
      testMode:    false,
      setPlan:     (plan)     => set({ plan }),
      setTestMode: (testMode) => set({ testMode }),
      syncTestMode: async () => {
        const on = await getGlobalTestMode()
        set({ testMode: on })
      },
    }),
    { name: 'cablecalc-plan' },
  ),
)

/**
 * Effective plan.
 *
 * The paid tiers were withdrawn in September 2026 — every calculator is free
 * and there is no checkout. This returns the top tier unconditionally so the
 * existing `planAllows` gates all pass, rather than ripping the plan concept
 * out of a dozen call sites in one change. The stored `plan` value is left
 * alone; nothing reads it for gating any more.
 */
export function useActivePlan(): Plan {
  return 'business'
}
