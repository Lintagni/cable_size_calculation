import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react'
import { useAiQuotaStore } from '../store/aiQuotaStore'
import { useAuthStore } from '../store/authStore'

type Status = 'loading' | 'success' | 'error'

export default function PaymentSuccess() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const { addCredits }  = useAiQuotaStore()
  const { session, loadProfile } = useAuthStore()
  const [status,  setStatus]  = useState<Status>('loading')
  const [credits, setCredits] = useState(0)
  const [errMsg,  setErrMsg]  = useState('')

  useEffect(() => {
    const paymentId = searchParams.get('payment_id')
    if (!paymentId) {
      setErrMsg('No payment ID in URL. If you completed a payment, contact support.')
      setStatus('error')
      return
    }

    const headers: Record<string, string> = {}
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    fetch(
      `/.netlify/functions/verify-payment?payment_id=${encodeURIComponent(paymentId)}`,
      { headers },
    )
      .then(r => r.json())
      .then(async (data: { verified?: boolean; credits?: number; error?: string }) => {
        if (data.verified && data.credits) {
          // Update local store immediately for UI responsiveness
          addCredits(data.credits)
          setCredits(data.credits)
          setStatus('success')
          // Reload profile from Supabase (if logged in) to keep DB in sync
          if (session) await loadProfile()
        } else {
          throw new Error(data.error ?? 'Payment could not be verified')
        }
      })
      .catch((err: Error) => {
        setErrMsg(err.message)
        setStatus('error')
      })
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">

        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-violet-400 mx-auto mb-5 animate-spin" />
            <h2 className="text-xl font-bold text-white mb-2">Verifying payment…</h2>
            <p className="text-gray-400 text-sm">Confirming with Dodo Payments — this takes a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-900/40 border border-green-700 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Payment successful!</h2>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <span className="text-3xl font-bold text-violet-400">+{credits}</span>
              <span className="text-gray-300 text-lg">credits</span>
            </div>
            <p className="text-gray-500 text-sm mb-8">
              Added to your account. Credits never expire and stack on your monthly allowance.
            </p>
            <button
              onClick={() => navigate('/calculator')}
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors w-full"
            >
              Go to AI Assistant →
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-900/40 border border-red-700 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification failed</h2>
            <p className="text-gray-400 text-sm mb-2">{errMsg}</p>
            <p className="text-gray-600 text-xs mb-8">
              If you were charged, please contact support with your payment ID.
            </p>
            <button
              onClick={() => navigate('/calculator')}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors w-full"
            >
              Back to Calculator
            </button>
          </>
        )}
      </div>
    </div>
  )
}
