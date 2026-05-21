import { useState } from 'react'
import { X, Zap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { useAuthStore } from '../../store/authStore'

interface Props {
  onClose:     () => void
  defaultTab?: 'signin' | 'signup'
  /** When true: no backdrop, no X button, no card wrapper — renders inline */
  embedded?:   boolean
}

// Google "G" logo SVG
function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function AuthModal({ onClose, defaultTab = 'signin', embedded = false }: Props) {
  const { signIn, signUp, signInWithGoogle } = useAuthStore()

  const [tab,      setTab]      = useState<'signin' | 'signup'>(defaultTab)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [signedUp, setSignedUp] = useState(false)

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

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) { setError(error); setGoogleLoading(false) }
    // On success: browser redirects to Google — no further action needed
  }

  // ── Form body (shared between modal and embedded) ──────────────────────────
  const body = signedUp ? (
    <div className="px-6 pb-8 text-center">
      <div className="w-14 h-14 rounded-full bg-blue-900/40 border border-blue-700 flex items-center justify-center mx-auto mb-4">
        <Mail className="w-7 h-7 text-blue-400" />
      </div>
      <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
      <p className="text-sm text-gray-400 mb-6">
        We sent a confirmation link to{' '}
        <span className="text-white font-medium">{email}</span>.
        Click it to activate your account, then sign in.
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
      {/* Tab switcher — only shown when not embedded (ProtectedRoute draws its own tabs) */}
      {!embedded && (
        <div className="flex mx-6 mb-5 bg-gray-800 rounded-xl p-1">
          {(['signin', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null) }}
              className={clsx(
                'flex-1 text-sm font-medium py-1.5 rounded-lg transition-all',
                tab === t ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300',
              )}
            >
              {t === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>
      )}

      <div className="px-6 pb-6 flex flex-col gap-3">
        {!embedded && (
          <h2 className="text-base font-semibold text-white -mt-1 mb-1">
            {tab === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
        )}

        {/* Google OAuth button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-100 disabled:bg-gray-200 text-gray-800 text-sm font-semibold py-2.5 rounded-xl transition-colors border border-gray-200"
        >
          {googleLoading
            ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            : <GoogleIcon />
          }
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-0.5">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-xs text-gray-600">or</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Email */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors mt-1"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {tab === 'signin' ? 'Signing in…' : 'Creating account…'}</>
              : tab === 'signin' ? 'Sign in' : 'Create account'
            }
          </button>

          {/* Switch tab hint */}
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
      </div>
    </>
  )

  // ── Embedded mode: just the form, no backdrop or card ─────────────────────
  if (embedded) {
    return (
      <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
        {body}
      </div>
    )
  }

  // ── Modal mode: backdrop + card ───────────────────────────────────────────
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

        {body}
      </div>
    </div>
  )
}
