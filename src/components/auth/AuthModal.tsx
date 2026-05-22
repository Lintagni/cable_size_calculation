import { useState } from 'react'
import { X, Zap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface Props {
  onClose:     () => void
  defaultTab?: 'signin' | 'signup'
  embedded?:   boolean
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--surface-2)', border: '1px solid var(--line)',
  borderRadius: 10, color: 'var(--ink)',
  fontSize: 13, padding: '10px 12px 10px 36px',
  outline: 'none', transition: 'border-color 0.15s',
}

export default function AuthModal({ onClose, defaultTab = 'signin', embedded = false }: Props) {
  const { signIn, signUp, signInWithGoogle } = useAuthStore()

  const [tab,          setTab]          = useState<'signin' | 'signup'>(defaultTab)
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [googleLoading,setGoogleLoading]= useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [signedUp,     setSignedUp]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true); setError(null)
    if (tab === 'signin') {
      const { error } = await signIn(email, password)
      if (error) { setError(error); setLoading(false) } else { onClose() }
    } else {
      const { error } = await signUp(email, password)
      if (error) { setError(error); setLoading(false) } else { setSignedUp(true); setLoading(false) }
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true); setError(null)
    const { error } = await signInWithGoogle()
    if (error) { setError(error); setGoogleLoading(false) }
  }

  const body = signedUp ? (
    <div style={{ padding: '0 24px 32px', textAlign: 'center' }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: 'color-mix(in oklch, var(--accent) 12%, transparent)',
        border: '1px solid var(--accent-line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <Mail size={22} style={{ color: 'var(--accent-ink)' }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Check your email</div>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20, lineHeight: 1.6 }}>
        We sent a confirmation link to{' '}
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{email}</span>.
        Click it to activate your account, then sign in.
      </p>
      <button
        onClick={() => { setSignedUp(false); setTab('signin') }}
        style={{
          width: '100%', padding: '10px', borderRadius: 10,
          background: 'var(--accent)', color: 'var(--accent-fg)',
          fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
        }}
      >
        Go to Sign in
      </button>
    </div>
  ) : (
    <>
      {!embedded && (
        <div style={{ margin: '0 24px 20px', display: 'flex', background: 'var(--surface-2)', borderRadius: 10, padding: 4, border: '1px solid var(--line)' }}>
          {(['signin', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null) }}
              style={{
                flex: 1, fontSize: 13, fontWeight: 600, padding: '7px',
                borderRadius: 7, border: 'none', cursor: 'pointer', transition: 'all 0.12s',
                background: tab === t ? 'var(--surface)' : 'transparent',
                color: tab === t ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {t === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!embedded && (
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
            {tab === 'signin' ? 'Welcome back' : 'Create your account'}
          </div>
        )}

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10,
            color: 'var(--ink)', fontSize: 13, fontWeight: 600, padding: '10px',
            cursor: 'pointer', transition: 'border-color 0.12s',
            opacity: (googleLoading || loading) ? 0.6 : 1,
          }}
        >
          {googleLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <GoogleIcon />}
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>

        {/* Email / password form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)', pointerEvents: 'none' }} />
            <input
              type="email" placeholder="Email address"
              value={email} onChange={e => setEmail(e.target.value)}
              required style={inputStyle}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)', pointerEvents: 'none' }} />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder={tab === 'signup' ? 'Password (min 6 chars)' : 'Password'}
              value={password} onChange={e => setPassword(e.target.value)}
              minLength={6} required
              style={{ ...inputStyle, paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 0, lineHeight: 1 }}
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {error && (
            <div style={{
              fontSize: 12, color: 'var(--fail)', padding: '8px 12px', borderRadius: 8,
              background: 'color-mix(in oklch, var(--fail) 8%, transparent)',
              border: '1px solid color-mix(in oklch, var(--fail) 25%, transparent)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            style={{
              width: '100%', padding: '10px', borderRadius: 10,
              background: (loading || googleLoading) ? 'var(--surface-2)' : 'var(--accent)',
              color: (loading || googleLoading) ? 'var(--ink-4)' : 'var(--accent-fg)',
              fontSize: 13, fontWeight: 700, border: 'none', cursor: (loading || googleLoading) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
            }}
          >
            {loading
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {tab === 'signin' ? 'Signing in…' : 'Creating account…'}</>
              : tab === 'signin' ? 'Sign in' : 'Create account'
            }
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-4)' }}>
            {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setError(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-ink)', fontWeight: 600, fontSize: 12, padding: 0 }}
            >
              {tab === 'signin' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </>
  )

  if (embedded) {
    return (
      <div style={{ width: '100%', maxWidth: 380, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
        {body}
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={onClose} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 380, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.4)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--accent)', display: 'grid', placeItems: 'center',
            }}>
              <Zap size={15} style={{ color: 'var(--accent-fg)' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>CableCalc</span>
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

        {body}
      </div>
    </div>
  )
}
