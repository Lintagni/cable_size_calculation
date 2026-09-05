import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, TrendingDown, AlertTriangle, Cpu, Radio,
  LayoutGrid, ChevronRight, Download, Sparkles, Clock, Table2,
} from 'lucide-react'
import LvCableSizingForm from '../components/calculator/LvCableSizingForm'
import VoltageDropForm from '../components/calculator/VoltageDropForm'
import ShortCircuitForm from '../components/calculator/ShortCircuitForm'
import MotorCableForm from '../components/calculator/MotorCableForm'
import AbcCableForm from '../components/calculator/AbcCableForm'
import BusbarForm from '../components/calculator/BusbarForm'
import BoardForm from '../components/calculator/BoardForm'
import { useActivePlan } from '../store/planStore'
import { useAiQuotaStore, getRemaining, PLAN_MONTHLY_QUOTA } from '../store/aiQuotaStore'
import { useHistoryStore } from '../store/historyStore'
import { usePendingActionStore } from '../store/pendingActionStore'
import type { LvCableResult, LvCableInput } from '../calculators/lvCableSizing'
import type { AbcInput } from '../calculators/abcCableSizing'
import type { BusbarInput } from '../calculators/busbarSizing'

// ─── Types ────────────────────────────────────────────────────────────────────
type Plan  = 'free' | 'pro' | 'business'
type TabId = 'lv' | 'vdrop' | 'board' | 'sc' | 'motor' | 'abc' | 'busbar'

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'lv',     label: 'LV Cable',      Icon: Zap },
  { id: 'vdrop',  label: 'Voltage Drop',  Icon: TrendingDown },
  { id: 'board',  label: 'Board Schedule', Icon: Table2  },
  { id: 'sc',     label: 'Short Circuit', Icon: AlertTriangle  },
  { id: 'motor',  label: 'Motor Cable',   Icon: Cpu  },
  { id: 'abc',    label: 'ABC Cable',     Icon: Radio },
  { id: 'busbar', label: 'Busbar Sizing', Icon: LayoutGrid },
]

const TAB_LABELS: Record<TabId, string> = {
  lv: 'LV Cable Sizing', vdrop: 'Voltage Drop', board: 'Board Schedule',
  sc: 'Short Circuit', motor: 'Motor Cable',
  abc: 'ABC Cable', busbar: 'Busbar Sizing',
}

const TAB_DESC: Record<TabId, string> = {
  lv:     'Single-circuit sizing per BS7671 Appendix 4. Inputs update results live.',
  vdrop:  'Voltage drop check per BS7671 Section 525.',
  board:  'Size a whole distribution board at once. Grouping is derived from shared containment routes.',
  sc:     'IPSSC calculation and adiabatic withstand check.',
  motor:  'Derive design current from motor kW, efficiency and power factor.',
  abc:    'Aerial Bundle Conductor sizing per NFC 33-209.',
  busbar: 'Busbar sizing per IEC 60439 / BS EN 61439.',
}

// ─── Project meta bar ─────────────────────────────────────────────────────────
interface Meta { project: string; circuitId: string; designer: string; system: string }

function MetaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="—"
        style={{
          background: 'none', border: 'none', outline: 'none', padding: 0,
          fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
          color: 'var(--ink)', width: '100%',
        }}
      />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Calculator() {
  const plan               = useActivePlan()
  const { record }         = useAiQuotaStore()
  const { push }           = useHistoryStore()
  const { action: pending, clearAction } = usePendingActionStore()

  const [active, setActive]             = useState<TabId>('lv')
  const [currentResult, setCurrentResult] = useState<LvCableResult | null>(null)
  const [lvInputs, setLvInputs]         = useState<Partial<LvCableInput> | null>(null)
  const [abcInputs, setAbcInputs]       = useState<Partial<AbcInput> | null>(null)
  const [busbarInputs, setBusbarInputs] = useState<Partial<BusbarInput> | null>(null)
  const [meta, setMeta]                 = useState<Meta>({ project: '', circuitId: '', designer: '', system: 'TN-S 400V 3ph' })
  const [lastUpdated, setLastUpdated]   = useState<number | null>(null)
  const [exporting, setExporting]       = useState(false)
  const [exportError, setExportError]   = useState<string | null>(null)

  const aiQuota     = PLAN_MONTHLY_QUOTA[plan as Plan]
  const aiRemaining = getRemaining(record, plan as Plan)

  // Apply pending fill action from AI page
  useEffect(() => {
    if (!pending) return
    if (pending.action === 'fill_form')   { setLvInputs({ ...pending.inputs });     setActive('lv') }
    if (pending.action === 'fill_abc')    { setAbcInputs({ ...pending.inputs });    setActive('abc') }
    if (pending.action === 'fill_busbar') { setBusbarInputs({ ...pending.inputs }); setActive('busbar') }
    clearAction()
  }, [pending]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save LV results to history
  const prevResultId = useRef<string | null>(null)
  useEffect(() => {
    if (!currentResult || !lvInputs) return
    const key = `${currentResult.recommendedCsa}-${lvInputs.designCurrent}-${lvInputs.cableLength}`
    if (key === prevResultId.current) return
    prevResultId.current = key
    setLastUpdated(Date.now())
    push({
      type: 'lv',
      summary: `${currentResult.recommendedCsa}mm² ${lvInputs.insulation ?? 'XLPE'} · ${lvInputs.designCurrent}A · Method ${lvInputs.referenceMethod ?? 'C'}`,
      inputs: lvInputs as Record<string, unknown>,
      result: currentResult as unknown as Record<string, unknown>,
    })
  }, [currentResult]) // eslint-disable-line react-hooks/exhaustive-deps

  function setMetaField(key: keyof Meta, val: string) {
    setMeta(prev => ({ ...prev, [key]: val }))
  }

  // ── PDF export ──
  // Only the LV tab tracks a result object at this level, so that is the only
  // tab that can produce a report from here. The other tabs export from their
  // own result cards.
  const canExport = active === 'lv' && !!currentResult
  const exportHint = active !== 'lv'
    ? 'PDF export is available from the LV Cable tab'
    : !currentResult ? 'Run a calculation first'
    : 'Download a BS7671 calculation sheet for this circuit'

  async function handleExportPdf() {
    if (!currentResult || !canExport) return
    setExporting(true)
    try {
      const { generateReport } = await import('../lib/generateReport')
      await generateReport({ type: 'lv', result: currentResult }, meta)
    } catch (err) {
      console.error('PDF export failed', err)
      setExportError('Could not generate the PDF. Please try again.')
      setTimeout(() => setExportError(null), 5000)
    } finally {
      setExporting(false)
    }
  }

  function timeAgo(ts: number) {
    const d = Math.floor((Date.now() - ts) / 1000)
    if (d < 60) return 'just now'
    if (d < 3600) return `${Math.floor(d / 60)}m ago`
    return `${Math.floor(d / 3600)}h ago`
  }

  return (
    <div className="calc grid-bg" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Calc header ── */}
      <div className="calc-head">
        <div className="container">

          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={12} style={{ color: 'var(--ink-4)' }} />
            <span>Calculator</span>
            <ChevronRight size={12} style={{ color: 'var(--ink-4)' }} />
            <span className="cur">{TAB_LABELS[active]}</span>
          </div>

          {/* Title + actions */}
          <div className="calc-head-row">
            <div>
              <h1>{TAB_LABELS[active]}</h1>
              <p>{TAB_DESC[active]}</p>
            </div>
            <div className="calc-head-actions">
              <Link to="/dashboard" className="btn">
                <Clock size={14} /> Recent
              </Link>
              <Link to="/ai" className="btn">
                <Sparkles size={14} /> Ask AI
                {aiQuota !== -1 && (
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    background: aiRemaining === 0 ? 'var(--fail-soft)' : 'var(--accent-soft)',
                    color: aiRemaining === 0 ? 'var(--fail)' : 'var(--accent-ink)',
                    border: `1px solid ${aiRemaining === 0 ? 'color-mix(in oklch, var(--fail) 30%, transparent)' : 'var(--accent-line)'}`,
                    borderRadius: 4, padding: '1px 5px', marginLeft: 2,
                  }}>
                    {aiRemaining}
                  </span>
                )}
              </Link>
              <button
                className="btn btn-primary"
                onClick={handleExportPdf}
                disabled={!canExport || exporting}
                title={exportHint}
              >
                <Download size={14} /> {exporting ? 'Generating…' : 'Export PDF'}
              </button>
            </div>
          </div>

          {exportError && (
            <div style={{ color: 'var(--fail)', fontSize: 12, marginBottom: 8 }}>{exportError}</div>
          )}

          {/* Project meta bar */}
          <div className="calc-meta-bar">
            {[
              { label: 'Project',      key: 'project'   as keyof Meta },
              { label: 'Circuit ID',   key: 'circuitId' as keyof Meta },
              { label: 'Designer',     key: 'designer'  as keyof Meta },
              { label: 'System',       key: 'system'    as keyof Meta },
            ].map(f => (
              <div key={f.key} className="calc-meta-cell">
                <MetaField label={f.label} value={meta[f.key]} onChange={v => setMetaField(f.key, v)} />
              </div>
            ))}
            <div className="calc-meta-cell">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Last Updated
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: lastUpdated ? 'var(--ok)' : 'var(--ink-3)' }}>
                {lastUpdated ? (
                  <><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)', marginRight: 6, verticalAlign: 'middle' }} />{timeAgo(lastUpdated)}</>
                ) : '—'}
              </div>
            </div>
          </div>

          {/* Tab strip */}
          <div className="calc-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`calc-tab${active === tab.id ? ' active' : ''}`}
                onClick={() => setActive(tab.id)}
              >
                <tab.Icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Calculator forms ── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
          {active === 'lv'     && <LvCableSizingForm externalInputs={lvInputs} onResultChange={setCurrentResult} />}
          {active === 'vdrop'  && <VoltageDropForm />}
          {active === 'board'  && <BoardForm />}
          {active === 'sc'  && <ShortCircuitForm />}
          {active === 'motor'  && <MotorCableForm />}
          {active === 'abc'    && <AbcCableForm externalInputs={abcInputs} />}
          {active === 'busbar' && <BusbarForm externalInputs={busbarInputs} />}
        </div>
      </div>
    </div>
  )
}
