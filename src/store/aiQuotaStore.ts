import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AiModelId } from './aiModelStore'
import type { Profile } from '../lib/supabase'

interface QuotaRecord {
  period:    string  // 'YYYY-MM' — monthly bucket
  used:      number  // debited from monthly allowance this period
  purchased: number  // extra credits bought; carries over until spent
}

interface AiQuotaStore {
  record:          QuotaRecord
  consume:         (modelId: AiModelId, plan: string) => void
  addCredits:      (amount: number) => void
  setFromProfile:  (profile: Profile) => void
  resetForDev:     () => void
}

// Monthly credit limits per plan
export const PLAN_MONTHLY_QUOTA: Record<string, number> = {
  free:     10,
  pro:      200,
  business: 2000,
}

// Credit weight per model (reflects real API cost ratio)
export const MODEL_CREDIT_WEIGHT: Record<AiModelId, number> = {
  'claude-haiku-4-5':  1,
  'claude-sonnet-4-6': 2,
  'claude-opus-4-5':   5,
}

// ── Credit top-up packs (shown in BuyCreditsModal) ───────────────────────────
export interface CreditPack {
  id:       string
  label:    string
  credits:  number
  price:    string   // display string
  perCredit: string  // display string
  popular?: boolean
  plans:    Array<'free' | 'pro' | 'business'>  // which tiers see this pack
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id:        'starter',
    label:     'Starter',
    credits:   25,
    price:     '$0.99',
    perCredit: '$0.040 / credit',
    plans:     ['free'],
  },
  {
    id:        'boost',
    label:     'Boost',
    credits:   75,
    price:     '$2.99',
    perCredit: '$0.040 / credit',
    plans:     ['free', 'pro'],
  },
  {
    id:        'standard',
    label:     'Standard',
    credits:   200,
    price:     '$6.99',
    perCredit: '$0.035 / credit',
    popular:   true,
    plans:     ['free', 'pro', 'business'],
  },
  {
    id:        'pro',
    label:     'Pro Pack',
    credits:   600,
    price:     '$17.99',
    perCredit: '$0.030 / credit',
    plans:     ['pro', 'business'],
  },
  {
    id:        'studio',
    label:     'Studio',
    credits:   1500,
    price:     '$34.99',
    perCredit: '$0.023 / credit',
    popular:   true,
    plans:     ['business'],
  },
  {
    id:        'enterprise',
    label:     'Enterprise',
    credits:   5000,
    price:     '$89.99',
    perCredit: '$0.018 / credit',
    plans:     ['business'],
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function currentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthlyUsed(record: QuotaRecord): number {
  return record.period === currentPeriod() ? record.used : 0
}

/** Total credits remaining: unused monthly allowance + carried-over purchased credits */
export function getRemaining(record: QuotaRecord, plan: string): number {
  const quota = PLAN_MONTHLY_QUOTA[plan] ?? 10
  const monthlyLeft = Math.max(0, quota - monthlyUsed(record))
  return monthlyLeft + (record.purchased ?? 0)
}

/** Can the user afford one call with the selected model? */
export function canAfford(record: QuotaRecord, plan: string, modelId: AiModelId): boolean {
  return getRemaining(record, plan) >= MODEL_CREDIT_WEIGHT[modelId]
}

// ── Store ────────────────────────────────────────────────────────────────────
export const useAiQuotaStore = create<AiQuotaStore>()(
  persist(
    (set) => ({
      record: { period: currentPeriod(), used: 0, purchased: 0 },

      consume: (modelId, plan) => set(s => {
        const weight       = MODEL_CREDIT_WEIGHT[modelId]
        const period       = currentPeriod()
        const prevUsed     = monthlyUsed(s.record)
        const purchased    = s.record.purchased ?? 0
        const monthlyQuota = PLAN_MONTHLY_QUOTA[plan] ?? 10
        const monthlyLeft  = Math.max(0, monthlyQuota - prevUsed)

        if (monthlyLeft >= weight) {
          return { record: { period, used: prevUsed + weight, purchased } }
        } else {
          const fromPurchased = weight - monthlyLeft
          return {
            record: {
              period,
              used:      prevUsed + monthlyLeft,
              purchased: Math.max(0, purchased - fromPurchased),
            },
          }
        }
      }),

      addCredits: (amount) => set(s => ({
        record: {
          ...s.record,
          period:    currentPeriod(),
          purchased: (s.record.purchased ?? 0) + amount,
        },
      })),

      setFromProfile: (profile) => set(s => {
        const dbPeriod  = profile.credits_period || currentPeriod()
        const now       = currentPeriod()

        // If the DB period is the current month, keep whichever `used` value is
        // higher. This prevents loadProfile() from resetting credits that were
        // consumed locally but whose DB write hasn't landed yet (fire-and-forget
        // race condition). Purchased credits always come from DB (authoritative).
        const localUsed = (s.record.period === dbPeriod && dbPeriod === now)
          ? s.record.used
          : 0

        return {
          record: {
            period:    dbPeriod,
            used:      Math.max(profile.credits_used, localUsed),
            purchased: profile.credits_purchased,
          },
        }
      }),

      resetForDev: () => set({ record: { period: currentPeriod(), used: 0, purchased: 0 } }),
    }),
    { name: 'cablecalc-ai-quota' },
  ),
)
