import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Calculator from './pages/Calculator'
import AiPage from './pages/AiPage'
import Dashboard from './pages/Dashboard'
import Pricing from './pages/Pricing'
import Admin from './pages/Admin'
import PaymentSuccess from './pages/PaymentSuccess'
import FeedbackWidget from './components/FeedbackWidget'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { loadCableData } from './lib/loadCableData'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      {children}
    </div>
  )
}

function ProtectedShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Navbar />
      {children}
    </ProtectedRoute>
  )
}

function FeedbackGate() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/admin')) return null
  return <FeedbackWidget />
}

export default function App() {
  const { _setSession, loadProfile } = useAuthStore()

  useEffect(() => {
    loadCableData()

    supabase.auth.getSession().then(({ data: { session } }) => {
      _setSession(session)
      if (session) loadProfile()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      _setSession(session)
      if (session) loadProfile()
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      {/* Public pages */}
      <Route path="/"        element={<Shell><Landing /></Shell>} />
      <Route path="/pricing" element={<Shell><Pricing /></Shell>} />

      {/* Protected — require Supabase login */}
      <Route path="/calculator" element={<ProtectedShell><Calculator /></ProtectedShell>} />
      <Route path="/ai"         element={<ProtectedShell><AiPage /></ProtectedShell>} />
      <Route path="/dashboard"  element={<ProtectedShell><Dashboard /></ProtectedShell>} />

      {/* Admin */}
      <Route path="/admin" element={<Shell><Admin /></Shell>} />

      {/* Misc */}
      <Route path="/payment-success" element={<PaymentSuccess />} />
    </Routes>
    <FeedbackGate />
  )
}
