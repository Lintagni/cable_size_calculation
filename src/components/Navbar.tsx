import { Link, useLocation } from 'react-router-dom'
import { Zap, Moon, Sun, Calculator, Sparkles, Clock, Tag, Home } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { usePlanStore } from '../store/planStore'
import { useState } from 'react'
import AuthModal from './auth/AuthModal'

const navItems = [
  { to: '/',           label: 'Home',    Icon: Home },
  { to: '/calculator', label: 'Calc',    Icon: Calculator },
  { to: '/calculator', label: 'AI',      Icon: Sparkles, hash: '#ai' },
  { to: '/dashboard',  label: 'History', Icon: Clock },
  { to: '/pricing',    label: 'Pricing', Icon: Tag },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { dark, toggle } = useThemeStore()
  const { user, signOut } = useAuthStore()
  const { plan } = usePlanStore()
  const [authModal, setAuthModal] = useState<'signin' | 'signup' | null>(null)

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?'

  // Determine active tab
  const active = pathname === '/'
    ? 'Home'
    : pathname.startsWith('/calculator') ? 'Calc'
    : pathname.startsWith('/dashboard') ? 'History'
    : pathname.startsWith('/pricing') ? 'Pricing'
    : ''

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
          {navItems.filter(n => n.label !== 'AI').map(n => (
            <Link
              key={n.label}
              to={n.to}
              className={active === n.label ? 'active' : ''}
            >
              <n.Icon size={13} />
              {n.label}
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
            <button className="plan-pill" onClick={signOut} title="Sign out">
              <span className="avatar">{initials}</span>
              <span style={{ textTransform: 'capitalize' }}>{plan}</span>
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setAuthModal('signup')}
            >
              Sign up free
            </button>
          )}
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav">
        {navItems.map(n => (
          <Link
            key={n.label}
            to={n.to}
            className={active === n.label ? 'active' : ''}
          >
            <n.Icon size={16} />
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>

      {authModal && (
        <AuthModal defaultTab={authModal} onClose={() => setAuthModal(null)} />
      )}
    </>
  )
}
