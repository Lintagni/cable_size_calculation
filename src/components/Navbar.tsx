import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Zap, Moon, Sun, LogOut, ChevronDown, User } from 'lucide-react'
import clsx from 'clsx'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { usePlanStore } from '../store/planStore'
import AuthModal from './auth/AuthModal'

const links = [
  { to: '/',           label: 'Home' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/dashboard',  label: 'History' },
  { to: '/pricing',    label: 'Pricing' },
]

const PLAN_STYLES: Record<string, string> = {
  business: 'bg-purple-700 text-white border-purple-700',
  pro:      'bg-blue-700 text-white border-blue-700',
  free:     'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700',
}

export default function Navbar() {
  const { pathname } = useLocation()
  const { dark, toggle } = useThemeStore()
  const { user, profile, signOut } = useAuthStore()
  const { plan } = usePlanStore()

  const [authModal,    setAuthModal]    = useState<'signin' | 'signup' | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const initials = profile?.email
    ? profile.email.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '?'

  const displayEmail = profile?.email ?? user?.email ?? ''

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-lg text-blue-700 dark:text-blue-400">
              <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              CableCalc
              <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">BS7671</span>
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-1">
              {links.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={clsx(
                    'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === l.to
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800',
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Right-side controls */}
            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                onClick={toggle}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {user ? (
                /* ── Logged-in user menu ── */
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="hidden md:flex items-center gap-2 text-sm pl-1 pr-2 py-1 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {/* Avatar circle */}
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {initials}
                    </div>
                    {/* Plan badge */}
                    <span className={clsx(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-full border capitalize',
                      PLAN_STYLES[plan],
                    )}>
                      {plan}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>

                  {/* Dropdown */}
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-40 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-800">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-white truncate">{displayEmail}</p>
                              <p className="text-[10px] text-gray-500 capitalize">{plan} plan</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-1">
                          <Link
                            to="/pricing"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                          >
                            Upgrade plan
                          </Link>
                          <button
                            onClick={() => { setUserMenuOpen(false); signOut() }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* ── Logged-out auth buttons ── */
                <>
                  <button
                    onClick={() => setAuthModal('signin')}
                    className="hidden md:block text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => setAuthModal('signup')}
                    className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    Sign up free
                  </button>
                </>
              )}

              {/* Mobile: show user icon or sign-in icon */}
              <div className="md:hidden">
                {user ? (
                  <button
                    onClick={() => signOut()}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Sign out"
                  >
                    <User className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setAuthModal('signin')}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Sign in"
                  >
                    <User className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Auth modal */}
      {authModal && (
        <AuthModal
          defaultTab={authModal}
          onClose={() => setAuthModal(null)}
        />
      )}
    </>
  )
}
