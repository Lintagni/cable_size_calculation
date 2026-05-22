import { useState } from 'react'
import { Loader2, Sparkles, Zap, Shield } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import AuthModal from './AuthModal'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { user, initialised } = useAuthStore()
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')

  // Waiting for Supabase session
  if (!initialised) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Loader2 size={28} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Not logged in — show auth wall
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div className="brand-mark">CC</div>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>CableCalc</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>BS7671</span>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 32, maxWidth: 400 }}>
          <div className="chip accent" style={{ margin: '0 auto 16px', display: 'inline-flex' }}>
            <Sparkles size={12} /> AI-Powered Cable Sizing
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
            Sign in to access the calculator
          </h1>
          <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>
            Free account · No credit card required
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ width: '100%', maxWidth: 400, marginBottom: 16 }}>
          <div className="seg" style={{ width: '100%' }}>
            {(['signin', 'signup'] as const).map(t => (
              <button
                key={t}
                className={tab === t ? 'on' : ''}
                onClick={() => setTab(t)}
              >
                {t === 'signin' ? 'Sign in' : 'Sign up free'}
              </button>
            ))}
          </div>
        </div>

        {/* Auth form */}
        <AuthModal
          defaultTab={tab}
          onClose={() => {/* not dismissable on this page */}}
          embedded
        />

        {/* Feature pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 32, width: '100%', maxWidth: 400 }}>
          {[
            { Icon: Shield, label: 'BS7671 compliant', sub: 'IET Wiring Regs' },
            { Icon: Zap,    label: '10 free credits',  sub: 'Every month' },
            { Icon: Sparkles, label: 'AI assistant',   sub: 'Claude powered' },
          ].map(f => (
            <div key={f.label} style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 'var(--r)', padding: '12px 10px', textAlign: 'center',
            }}>
              <f.Icon size={14} style={{ color: 'var(--accent)', margin: '0 auto 6px' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{f.label}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{f.sub}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
