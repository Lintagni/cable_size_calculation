import { useState } from 'react'
import { X, Sparkles, Check, Zap, AlertTriangle } from 'lucide-react'
import { DODO_PRODUCTS } from '../../config/dodoProducts'
import clsx from 'clsx'
import { CREDIT_PACKS, MODEL_CREDIT_WEIGHT } from '../../store/aiQuotaStore'
import { usePlanStore } from '../../store/planStore'
import { useAuthStore } from '../../store/authStore'
import { Link } from 'react-router-dom'

interface Props {
  onClose: () => void
}

// What each credit is worth in terms of real calls
function callsEstimate(credits: number): string {
  const haiku  = credits          // 1 credit each
  const sonnet = Math.floor(credits / 2)
  const opus   = Math.floor(credits / 5)
  return `${haiku} Haiku · ${sonnet} Sonnet · ${opus} Opus`
}

export default function BuyCreditsModal({ onClose }: Props) {
  const { plan }                    = usePlanStore()
  const { user }                    = useAuthStore()
  const [selected, setSelected]           = useState<string | null>(null)
  const [purchasing, setPurchasing]       = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const packs = CREDIT_PACKS.filter(p => p.plans.includes(plan as 'free' | 'pro' | 'business'))
  const selectedPack = packs.find(p => p.id === selected)

  const PACK_PRODUCT_IDS: Record<string, string> = {
    starter:    DODO_PRODUCTS.STARTER,
    boost:      DODO_PRODUCTS.BOOST,
    standard:   DODO_PRODUCTS.STANDARD,
    pro:        DODO_PRODUCTS.PRO_PACK,
    studio:     DODO_PRODUCTS.STUDIO,
    enterprise: DODO_PRODUCTS.ENTERPRISE,
  }

  async function handleCheckout() {
    if (!selectedPack) return
    const productId = PACK_PRODUCT_IDS[selectedPack.id]
    if (!productId) {
      setCheckoutError('No product ID configured for this pack. Please contact support.')
      return
    }

    setPurchasing(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/.netlify/functions/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productId, userId: user?.id ?? null }),
      })

      if (res.status === 404) {
        throw new Error('Payment service not available. Make sure you are on the deployed site.')
      }

      const data = await res.json() as { checkoutUrl?: string; error?: string }
      if (data.checkoutUrl) {
        // Redirect to Dodo hosted checkout — browser will navigate away
        window.location.href = data.checkoutUrl
      } else {
        throw new Error(data.error ?? 'Payment service did not return a checkout URL.')
      }
    } catch (err) {
      console.error('checkout error:', err)
      setCheckoutError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setPurchasing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Buy AI Credits</h2>
              <p className="text-[11px] text-gray-400">
                Credits carry over — they never expire
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <>
          {/* Current plan info */}
            <div className="px-6 pt-4 pb-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span className="capitalize">{plan} plan</span>
                <span>{callsEstimate(1)} per credit</span>
              </div>
              <div className="text-[11px] text-gray-600 mb-4">
                Weighted cost: Haiku = 1 cr · Sonnet = 2 cr · Opus = 5 cr
              </div>

              {/* Pack grid */}
              <div className={clsx('grid gap-3', packs.length <= 3 ? 'grid-cols-1' : 'grid-cols-2')}>
                {packs.map(pack => (
                  <button
                    key={pack.id}
                    onClick={() => { setSelected(pack.id); setCheckoutError(null) }}
                    className={clsx(
                      'relative flex flex-col items-start p-4 rounded-xl border text-left transition-all',
                      selected === pack.id
                        ? 'border-violet-500 bg-violet-950/40 shadow-md shadow-violet-900/30'
                        : 'border-gray-700 bg-gray-800/60 hover:border-gray-500 hover:bg-gray-800',
                    )}
                  >
                    {pack.popular && (
                      <span className="absolute -top-2.5 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-600 text-white">
                        Best value
                      </span>
                    )}

                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-sm font-semibold text-white">{pack.label}</span>
                      {selected === pack.id && (
                        <Check className="w-4 h-4 text-violet-400" />
                      )}
                    </div>

                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-2xl font-bold text-white">{pack.credits}</span>
                      <span className="text-xs text-gray-400">credits</span>
                    </div>

                    <div className="flex items-center justify-between w-full mt-1">
                      <span className="text-sm font-semibold text-violet-400">{pack.price}</span>
                      <span className="text-[10px] text-gray-500">{pack.perCredit}</span>
                    </div>

                    <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                      ≈ {Math.floor(pack.credits / MODEL_CREDIT_WEIGHT['claude-sonnet-4-6'])} Sonnet calls
                      · {Math.floor(pack.credits / MODEL_CREDIT_WEIGHT['claude-opus-4-5'])} Opus calls
                    </p>
                  </button>
                ))}
              </div>

              {/* Upgrade nudge for free plan */}
              {plan === 'free' && (
                <div className="mt-3 p-3 rounded-xl bg-blue-950/30 border border-blue-900/50">
                  <p className="text-xs text-blue-300">
                    <span className="font-semibold">Tip:</span> Upgrading to Pro ($12.99/mo) gives 200 credits/month — better value than buying top-ups repeatedly.{' '}
                    <Link to="/pricing" className="text-blue-400 hover:underline" onClick={onClose}>
                      Compare plans →
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* Footer / Pay button */}
            <div className="px-6 pb-5 pt-2 flex flex-col gap-2">
              {/* Error message */}
              {checkoutError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-400" />
                  <span>{checkoutError}</span>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={!selected || purchasing}
                className={clsx(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all',
                  selected && !purchasing
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed',
                )}
              >
                {purchasing ? (
                  <>
                    <span className="flex gap-0.5">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                    Redirecting to checkout…
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {selectedPack
                      ? `Pay ${selectedPack.price} · Add ${selectedPack.credits} credits`
                      : 'Select a pack to continue'
                    }
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-600 text-center mt-1">
                Credits never expire · Secure payment via Dodo Payments · Tax included
              </p>
            </div>
          </>
      </div>
    </div>
  )
}
