import { useState } from 'react'
import { X, Zap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { useAuthStore } from '../../store/authStore'

interface Props {
  onClose:       () => void
  defaultTab?:   'signin' | 'signup'
}

export default function AuthModal({ onClose, defaultTab = 'signin' }: Props) {
  const { signIn, signUp } = useAuthStore()

  const [tab,          setTab]          = useState<'signin' | 'signup'>(defaultTab)
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [signedUp,     setSignedUp]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError(null)

    if (tab === 'signin') {
      const { error } = await signIn(email, password)
      if (error) { setError(error); setLoading(false) }
      else        { onClose() }
    } else {
      const { error } = await signUp(email, password)
      if (error) { setError(error); setLoading(false) }
      else        { setSignedUp(true); setLoading(false) }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-sm font-bold text-white">CableCalc</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {signedUp ? (
          /* ── Confirmation state ── */
          <div className="px-6 pb-8 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-900/40 border border-blue-700 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
            <p className="text-sm text-gray-400 mb-6">
              We sent a confirmation link to <span className="text-white font-medium">{email}</span>. Click it to activate your account, then sign in.
            </p>
            <button
              onClick={() => { setSignedUp(false); setTab('signin') }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              Go to Sign in
            </button>
          </div>
        ) : (
          <>
            {/* ── Tab switcher ── */}
            <div className="flex mx-6 mb-5 bg-gray-800 rounded-xl p-1">
              {(['signin', 'signup'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(null) }}
                  className={clsx(
                    'flex-1 text-sm font-medium py-1.5 rounded-lg transition-all',
                    tab === t
                      ? 'bg-gray-700 text-white shadow'
                      : 'text-gray-500 hover:text-gray-300',
                  )}
                >
                  {t === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-3">
              <h2 className="text-base font-semibold text-white -mt-1 mb-1">
                {tab === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder={tab === 'signup' ? 'Password (min 6 chars)' : 'Password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 rounded-xl pl-9 pr-10 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors mt-1"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {tab === 'signin' ? 'Signing in…' : 'Creating account…'}</>
                  : tab === 'signin' ? 'Sign in' : 'Create account'
                }
              </button>

              {/* Toggle hint */}
              <p className="text-center text-xs text-gray-600 mt-1">
                {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setError(null) }}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  {tab === 'signin' ? 'Sign up free' : 'Sign in'}
                </button>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
