import { Link, useNavigate } from 'react-router-dom'
import { Clock, Plus } from 'lucide-react'
import HistoryPanel from '../components/calculator/HistoryPanel'
import { useHistoryStore, type CalcType } from '../store/historyStore'

export default function Dashboard() {
  const navigate = useNavigate()
  const { entries } = useHistoryStore()

  function handleRestore(type: CalcType, inputs: Record<string, unknown>) {
    // Store inputs in sessionStorage, then navigate to calculator
    sessionStorage.setItem('restoreCalc', JSON.stringify({ type, inputs }))
    navigate('/calculator')
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg)', paddingBottom: 64 }}>
      <div className="container" style={{ paddingTop: 40 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="section-eyebrow">Workspace</span>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
              Calculation History
            </h1>
            <p style={{ color: 'var(--ink-3)', marginTop: 6, fontSize: 14 }}>
              {entries.length > 0
                ? `${entries.length} saved calculation${entries.length !== 1 ? 's' : ''} — click any to reopen`
                : 'Run a calculation to see it saved here automatically.'}
            </p>
          </div>
          <Link to="/calculator" className="btn btn-accent">
            <Plus size={14} /> New calculation
          </Link>
        </div>

        {/* History panel */}
        <HistoryPanel onRestore={handleRestore} />

        {entries.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/calculator" className="btn btn-lg" style={{ display: 'inline-flex' }}>
              <Clock size={14} /> Open calculator
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
