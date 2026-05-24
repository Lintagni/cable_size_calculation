import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, Calculator, Sparkles, Clock, Tag, Home } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { usePlanStore } from '../store/planStore'
import { useState } from 'react'
import AuthModal from './auth/AuthModal'

const navItems = [
  { to: '/',           label: 'Home',    Icon: Home       },
  { to: '/calculator', label: 'Calc',    Icon: Calculator },
  { to: '/ai',         label: 'AI',      Icon: Sparkles   },
  { to: '/dashboard',  label: 'History', Icon: Clock      },
  { to: '/pricing',    label: 'Pricing', Icon: Tag        },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { dark, toggle } = useThemeStore()
  const { user, signOut } = useAuthStore()
  const { plan } = usePlanStore()
  const [authModal, setAuthModal] = useState<'signin' | 'signup' | null>(null)

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?'

  const active =
    pathname === '/'                  ? 'Home'    :
    pathname.startsWith('/calculator') ? 'Calc'    :
    pathname.startsWith('/ai')         ? 'AI'      :
    pathname.startsWith('/dashboard')  ? 'History' :
    pathname.startsWith('/pricing')    ? 'Pricing' : ''

  return (
    <>
      {/* ── Top bar ── */}
      <header className="topbar">
        {/* Brand */}
        <Link to="/" className="brand">
          <div className="brand-mark">CC</div>
          <span>CableCalc</span>
          <span className="brand-meta">BS7671 · NFC · IEC</span>
        </Link>

        {/* Pill nav — desktop */}
        <nav className="nav">
          {navItems.map(n => (
            <Link
              key={n.label}
              to={n.to}
              className={active === n.label ? 'active' : ''}
            >
              <n.Icon size={13} />
              {n.label}
              {n.label === 'AI' && (
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: '0.04em',
                  color: 'var(--accent-ink)', background: 'var(--accent-soft)',
                  border: '1px solid var(--accent-line)',
                  borderRadius: 3, padding: '1px 4px', lineHeight: 1,
                }}>
                  BETA
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Right controls */}
        <div className="top-right">
          <button
            className="mode-toggle"
            onClick={toggle}
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--ink-3)',
                textTransform: 'capitalize',
              }}>
                {plan}
              </span>
              <button className="plan-pill" onClick={signOut} title="Sign out">
                <span className="avatar">{initials}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-sm"
                onClick={() => setAuthModal('signin')}
              >
                Sign in
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setAuthModal('signup')}
              >
                Sign up free
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Mobile bottom nav — hidden on admin pages ── */}
      {!pathname.startsWith('/admin') && (
        <nav className="mobile-nav">
          {navItems.map(n => (
            <Link
              key={n.label}
              to={n.to}
              className={active === n.label ? 'active' : ''}
            >
              <n.Icon size={16} />
              <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                {n.label}
                {n.label === 'AI' && (
                  <span style={{
                    fontSize: 7, fontWeight: 700,
                    color: 'var(--accent-ink)', background: 'var(--accent-soft)',
                    border: '1px solid var(--accent-line)',
                    borderRadius: 2, padding: '1px 3px', lineHeight: 1,
                  }}>
                    β
                  </span>
                )}
              </span>
            </Link>
          ))}
        </nav>
      )}

      {authModal && (
        <AuthModal defaultTab={authModal} onClose={() => setAuthModal(null)} />
      )}
    </>
  )
}
