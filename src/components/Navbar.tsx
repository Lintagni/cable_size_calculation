import { Link, useLocation } from 'react-router-dom'
import { Zap, Moon, Sun } from 'lucide-react'
import clsx from 'clsx'
import { usePlanStore } from '../store/planStore'
import { useThemeStore } from '../store/themeStore'

const links = [
  { to: '/', label: 'Home' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/dashboard', label: 'History' },
  { to: '/pricing', label: 'Pricing' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { plan, setPlan } = usePlanStore()
  const { dark, toggle } = useThemeStore()

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-blue-700 dark:text-blue-400">
            <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            CableCalc
            <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">BS7671</span>
          </Link>

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

          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Dev plan toggle — cycles Free → Pro → Business */}
            <button
              onClick={() => setPlan(plan === 'free' ? 'pro' : plan === 'pro' ? 'business' : 'free')}
              className={clsx(
                'hidden md:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
                plan === 'business'
                  ? 'bg-purple-700 text-white border-purple-700'
                  : plan === 'pro'
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300',
              )}
              title="Dev toggle — cycles Free / Pro / Business"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              {plan === 'business' ? 'Business' : plan === 'pro' ? 'Pro' : 'Free'}
            </button>

            <Link
              to="/calculator"
              className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Start Calculating
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
