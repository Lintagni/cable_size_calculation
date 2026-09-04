import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Shell from './components/Shell'
import Seo from './components/Seo'
import Landing from './pages/Landing'
import Calculator from './pages/Calculator'
import AiPage from './pages/AiPage'
import Dashboard from './pages/Dashboard'
import Pricing from './pages/Pricing'
import Admin from './pages/Admin'
import PaymentSuccess from './pages/PaymentSuccess'
import SwaArmouredCalculator from './pages/public/SwaArmouredCalculator'
import VoltageDropCalculator from './pages/public/VoltageDropCalculator'
import ShowerCableCalculator from './pages/public/ShowerCableCalculator'
import Bs7671Guide from './pages/public/Bs7671Guide'
import Bs7671Tables from './pages/public/Bs7671Tables'
import PublicCalculator from './pages/public/PublicCalculator'
import Methodology from './pages/public/Methodology'
import Verification from './pages/public/Verification'
import NotFound from './pages/NotFound'
import FeedbackWidget from './components/FeedbackWidget'
import PwaInstallPrompt from './components/PwaInstallPrompt'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { loadCableData } from './lib/loadCableData'
import { usePlanStore } from './store/planStore'
import { useHistoryStore } from './store/historyStore'

function ProtectedShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Navbar />
      {children}
    </ProtectedRoute>
  )
}

/**
 * /calculator is public. Anonymous visitors (and crawlers) get PublicCalculator
 * — the same BS7671 engine plus the reference content, prerendered to static
 * HTML at build time. A signed-in session gets the full workspace instead.
 *
 * While Supabase is still resolving the session we render the public page
 * rather than a spinner: it is the correct answer for the majority case and
 * avoids a flash of empty layout.
 */
function CalculatorRoute() {
  const { user, initialised } = useAuthStore()
  if (!initialised || !user) return <PublicCalculator />
  return (
    <>
      <Navbar />
      <Calculator />
    </>
  )
}

function FeedbackGate() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/admin') || pathname === '/ai') return null
  return <FeedbackWidget />
}

export default function App() {
  const { _setSession, loadProfile } = useAuthStore()

  useEffect(() => {
    loadCableData()

    // Sync global test-mode flag from Supabase on load, then every 60 s
    const syncTestMode = usePlanStore.getState().syncTestMode
    syncTestMode()
    const testModeInterval = setInterval(syncTestMode, 60_000)

    // Keep calculation history pointed at the right owner: pull down and merge
    // on sign-in, fall back to local-only on sign-out.
    const history = useHistoryStore.getState()
    function syncHistory(session: { user: { id: string } } | null) {
      if (session) history.attachUser(session.user.id)
      else history.detachUser()
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      _setSession(session)
      if (session) loadProfile()
      syncHistory(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      _setSession(session)
      if (session) loadProfile()
      syncHistory(session)
    })

    return () => {
      clearInterval(testModeInterval)
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Seo />
      <Routes>
        {/* Public pages */}
        <Route path="/"        element={<Shell><Landing /></Shell>} />
        <Route path="/pricing" element={<Shell><Pricing /></Shell>} />

        {/* Public content pages — no login required, compose their own chrome via PageShell */}
        <Route path="/calculator/swa-armoured-cable-size"      element={<SwaArmouredCalculator />} />
        <Route path="/calculator/voltage-drop"                 element={<VoltageDropCalculator />} />
        <Route path="/calculator/shower-cable-size"             element={<ShowerCableCalculator />} />
        <Route path="/guides/bs7671-cable-sizing-explained"     element={<Bs7671Guide />} />
        <Route path="/tables/bs7671-cable-current-rating-tables" element={<Bs7671Tables />} />
        <Route path="/methodology"                              element={<Methodology />} />
        <Route path="/verification"                             element={<Verification />} />

        {/* Public tool — full workspace once signed in */}
        <Route path="/calculator" element={<CalculatorRoute />} />

        {/* Protected — require Supabase login */}
        <Route path="/ai"         element={<ProtectedShell><AiPage /></ProtectedShell>} />
        <Route path="/dashboard"  element={<ProtectedShell><Dashboard /></ProtectedShell>} />

        {/* Admin */}
        <Route path="/admin" element={<Shell><Admin /></Shell>} />

        {/* Misc */}
        <Route path="/payment-success" element={<PaymentSuccess />} />

        {/* Anything else. Vercel serves dist/404.html with a 404 status for
            unmatched paths; this covers client-side navigation to a bad URL. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <FeedbackGate />
      <PwaInstallPrompt />
    </>
  )
}
