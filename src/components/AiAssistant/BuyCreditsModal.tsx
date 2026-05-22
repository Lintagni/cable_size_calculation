import { useState } from 'react'
import { X, Sparkles, Check, Zap, AlertTriangle } from 'lucide-react'
import { DODO_PRODUCTS } from '../../config/dodoProducts'
import { CREDIT_PACKS, MODEL_CREDIT_WEIGHT } from '../../store/aiQuotaStore'
import { usePlanStore } from '../../store/planStore'
import { useAuthStore } from '../../store/authStore'
import { Link } from 'react-router-dom'

interface Props {
  onClose: () => void
}

function callsEstimate(credits: number): string {
  const sonnet = Math.floor(credits / 2)
  const opus   = Math.floor(credits / 5)
  return `${credits} Haiku · ${sonnet} Sonnet · ${opus} Opus`
}

export default function BuyCreditsModal({ onClose }: Props) {
  const { plan }    = usePlanStore()
  const { user }    = useAuthStore()
  const [selected,      setSelected]      = useState<string | null>(null)
  const [purchasing,    setPurchasing]    = useState(false)
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
    if (!productId) { setCheckoutError('No product ID configured for this pack.'); return }

    setPurchasing(true); setCheckoutError(null)
    try {
      const res = await fetch('/.netlify/functions/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productId, userId: user?.id ?? null }),
      })
      if (res.status === 404) throw new Error('Payment service not available on local dev.')
      const data = await res.json() as { checkoutUrl?: string; error?: string }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error(data.error ?? 'No checkout URL returned.')
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Something went wrong.')
      setPurchasing(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={onClose} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: 480,
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.4)', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--line)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'color-mix(in oklch, var(--accent) 18%, transparent)',
              border: '1px solid var(--accent-line)',
              display: 'grid', placeItems: 'center',
            }}>
              <Sparkles size={15} style={{ color: 'var(--accent-ink)' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Buy AI Credits</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', marginTop: 1 }}>Credits carry over — they never expire</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none',
              background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--ink-3)',
              display: 'grid', placeItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
            <span style={{ textTransform: 'capitalize' }}>{plan} plan</span>
            <span>Haiku=1cr · Sonnet=2cr · Opus=5cr</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 16 }}>
            {callsEstimate(1)} per credit
          </div>

          {/* Pack grid */}
          <div style={{ display: 'grid', gridTemplateColumns: packs.length <= 3 ? '1fr' : '1fr 1fr', gap: 10 }}>
            {packs.map(pack => (
              <button
                key={pack.id}
                onClick={() => { setSelected(pack.id); setCheckoutError(null) }}
                style={{
                  position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  padding: 14, borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                  border: `1px solid ${selected === pack.id ? 'var(--accent)' : 'var(--line)'}`,
                  background: selected === pack.id
                    ? 'color-mix(in oklch, var(--accent) 8%, transparent)'
                    : 'var(--surface-2)',
                  transition: 'all 0.12s',
                }}
              >
                {pack.popular && (
                  <span style={{
                    position: 'absolute', top: -10, left: 10,
                    fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 20,
                    background: 'var(--accent)', color: 'var(--accent-fg)',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    Best value
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{pack.label}</span>
                  {selected === pack.id && <Check size={14} style={{ color: 'var(--accent-ink)' }} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{pack.credits}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>credits</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent-ink)' }}>{pack.price}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>{pack.perCredit}</span>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', marginTop: 6 }}>
                  ≈ {Math.floor(pack.credits / MODEL_CREDIT_WEIGHT['claude-sonnet-4-6'])} Sonnet · {Math.floor(pack.credits / MODEL_CREDIT_WEIGHT['claude-opus-4-5'])} Opus
                </div>
              </button>
            ))}
          </div>

          {/* Free plan nudge */}
          {plan === 'free' && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 8,
              background: 'color-mix(in oklch, var(--accent) 6%, transparent)',
              border: '1px solid var(--accent-line)',
            }}>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-ink)' }}>Tip:</span> Pro ($12.99/mo) gives 200 credits/month — better value than top-ups.{' '}
                <Link to="/pricing" style={{ color: 'var(--accent-ink)', fontWeight: 600 }} onClick={onClose}>
                  Compare plans →
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {checkoutError && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px',
              borderRadius: 8, fontSize: 12, color: 'var(--fail)', lineHeight: 1.5,
              background: 'color-mix(in oklch, var(--fail) 8%, transparent)',
              border: '1px solid color-mix(in oklch, var(--fail) 25%, transparent)',
            }}>
              <AlertTriangle size={13} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>{checkoutError}</span>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={!selected || purchasing}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 10, border: 'none',
              fontSize: 13, fontWeight: 700, cursor: (!selected || purchasing) ? 'not-allowed' : 'pointer',
              background: (selected && !purchasing) ? 'var(--accent)' : 'var(--surface-2)',
              color: (selected && !purchasing) ? 'var(--accent-fg)' : 'var(--ink-4)',
              transition: 'all 0.15s',
            }}
          >
            {purchasing ? (
              <>
                <span style={{ display: 'flex', gap: 3 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: 'currentColor',
                      animation: 'bounce 1s ease infinite',
                      animationDelay: `${i * 0.15}s`,
                    }} />
                  ))}
                </span>
                Redirecting to checkout…
              </>
            ) : (
              <>
                <Zap size={14} />
                {selectedPack
                  ? `Pay ${selectedPack.price} · Add ${selectedPack.credits} credits`
                  : 'Select a pack to continue'
                }
              </>
            )}
          </button>

          <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>
            Credits never expire · Secure payment via Dodo Payments · Tax included
          </p>
        </div>
      </div>
    </div>
  )
}
