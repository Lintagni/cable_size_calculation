import { useState } from 'react'
import { Zap, Loader2, Sparkles } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import AuthModal from './AuthModal'
import clsx from 'clsx'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { user, initialised } = useAuthStore()
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')

  // ── Waiting for Supabase session to initialise ─────────────────────────────
  if (!initialised) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    )
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-8">
          <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <span className="text-xl font-bold text-white">CableCalc</span>
          <span className="text-xs text-gray-500 ml-1">BS7671</span>
        </div>

        {/* Heading */}
        <div className="text-center mb-8 max-w-sm">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 bg-violet-950/50 border border-violet-800/50 rounded-full px-3 py-1 mb-4">
            <Sparkles className="w-3 h-3" />
            AI-Powered Cable Sizing
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Sign in to access the calculator
          </h1>
          <p className="text-gray-400 text-sm">
            Free account · No credit card required · Credits never expire
          </p>
        </div>

        {/* Tab switcher */}
        <div className="w-full max-w-sm mb-4">
          <div className="flex bg-gray-800 rounded-xl p-1">
            {(['signin', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  'flex-1 text-sm font-medium py-2 rounded-lg transition-all',
                  tab === t
                    ? 'bg-gray-700 text-white shadow'
                    : 'text-gray-500 hover:text-gray-300',
                )}
              >
                {t === 'signin' ? 'Sign in' : 'Sign up free'}
              </button>
            ))}
          </div>
        </div>

        {/* Auth form — not dismissable here, it IS the page */}
        <AuthModal
          defaultTab={tab}
          onClose={() => {/* not dismissable on this page */}}
          embedded
        />

        {/* Features reminder */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center max-w-sm w-full">
          {[
            { label: 'BS7671 compliant', sub: 'IET Wiring Regs' },
            { label: '10 free credits', sub: 'Every month' },
            { label: 'Credits never expire', sub: 'Carry over' },
          ].map(f => (
            <div key={f.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <p className="text-white text-xs font-semibold">{f.label}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Authenticated ──────────────────────────────────────────────────────────
  return <>{children}</>
}
