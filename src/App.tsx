import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Calculator from './pages/Calculator'
import Dashboard from './pages/Dashboard'
import Pricing from './pages/Pricing'
import PaymentSuccess from './pages/PaymentSuccess'

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Navbar />
      {children}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* App shell — full screen, own sidebar, no Navbar */}
      <Route path="/calculator" element={<Calculator />} />

      {/* Public pages — standard navbar layout */}
      <Route path="/"         element={<PublicLayout><Landing /></PublicLayout>} />
      <Route path="/dashboard" element={<PublicLayout><Dashboard /></PublicLayout>} />
      <Route path="/pricing"         element={<PublicLayout><Pricing /></PublicLayout>} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
    </Routes>
  )
}
