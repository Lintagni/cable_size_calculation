import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, Sparkles, TrendingDown, AlertTriangle, Cpu, Radio,
  LayoutGrid, Clock, ChevronRight, Lock, ArrowUpRight, Download,
} from 'lucide-react'
import AiChatPanel from '../components/AiAssistant/AiChatPanel'
import LvCableSizingForm from '../components/calculator/LvCableSizingForm'
import VoltageDropForm from '../components/calculator/VoltageDropForm'
import ShortCircuitForm from '../components/calculator/ShortCircuitForm'
import MotorCableForm from '../components/calculator/MotorCableForm'
import AbcCableForm from '../components/calculator/AbcCableForm'
import BusbarForm from '../components/calculator/BusbarForm'
import HistoryPanel from '../components/calculator/HistoryPanel'
import { usePlanStore } from '../store/planStore'
import { useAiQuotaStore, getRemaining, PLAN_MONTHLY_QUOTA } from '../store/aiQuotaStore'
import { useHistoryStore, type CalcType } from '../store/historyStore'
import type { FillAction } from '../lib/claude'
import type { LvCableResult, LvCableInput } from '../calculators/lvCableSizing'
import type { AbcInput } from '../calculators/abcCableSizing'
import type { BusbarInput } from '../calculators/busbarSizing'

// ─── Types ────────────────────────────────────────────────────────────────────
type Plan   = 'free' | 'pro' | 'business'
type TabId  = 'ai' | 'lv' | 'vdrop' | 'sc' | 'motor' | 'abc' | 'busbar' | 'history'

const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, business: 2 }
function planAllows(userPlan: Plan, minPlan: string) {
  return PLAN_RANK[userPlan] >= PLAN_RANK[minPlan as Plan]
}

const TABS: {
  id: TabId; label: string; Icon: React.ComponentType<{ size?: number }>
  minPlan: string; short?: string
}[] = [
  { id: 'ai',      label: 'AI Assistant',   Icon: Sparkles,      minPlan: 'free' },
  { id: 'lv',      label: 'LV Cable',       Icon: Zap,           minPlan: 'free' },
  { id: 'vdrop',   label: 'Voltage Drop',   Icon: TrendingDown,  minPlan: 'free' },
  { id: 'sc',      label: 'Short Circuit',  Icon: AlertTriangle, minPlan: 'pro'  },
  { id: 'motor',   label: 'Motor Cable',    Icon: Cpu,           minPlan: 'pro'  },
  { id: 'abc',     label: 'ABC Cable',      Icon: Radio,         minPlan: 'business' },
  { id: 'busbar',  label: 'Busbar Sizing',  Icon: LayoutGrid,    minPlan: 'business' },
  { id: 'history', label: 'History',        Icon: Clock,         minPlan: 'free' },
]

const TAB_LABELS: Record<TabId, string> = {
  ai: 'AI Assistant', lv: 'LV Cable Sizing', vdrop: 'Voltage Drop',
  sc: 'Short Circuit', motor: 'Motor Cable', abc: 'ABC Cable',
  busbar: 'Busbar Sizing', history: 'History',
}

// ─── Upgrade banner ───────────────────────────────────────────────────────────
function UpgradeBanner({ tier }: { tier: 'pro' | 'business' }) {
  const isPro = tier === 'pro'
  return (
    <div className="upgrade-banner">
      <div style={{
        width: 48, height: 48,
        borderRadius: 'var(--r-lg)',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-line)',
        display: 'grid',
        placeItems: 'center',
        margin: '0 auto',
        color: 'var(--accent-ink)',
      }}>
        <Lock size={20} />
      </div>
      <h3>{isPro ? 'Pro Plan Required' : 'Business Plan Required'}</h3>
      <p>
        {isPro
          ? 'Short circuit and motor cable sizing require Pro ($12.99/mo). Includes 200 AI credits, aluminium cables, and PDF reports.'
          : 'ABC cable and busbar sizing require Business ($34.99/mo). Includes unlimited AI, API access, and custom report branding.'}
      </p>
      <Link to="/pricing" className="btn btn-accent">
        View pricing <ArrowUpRight size={14} />
      </Link>
    </div>
  )
}

// ─── Main calculator page ─────────────────────────────────────────────────────
export default function Calculator() {
  const { plan, setPlan } = usePlanStore()
  const { record }        = useAiQuotaStore()
  const { push }          = useHistoryStore()

  const [active, setActive]               = useState<TabId>('lv')
  const [currentResult, setCurrentResult] = useState<LvCableResult | null>(null)
  const [lvInputs, setLvInputs]           = useState<Partial<LvCableInput> | null>(null)
  const [abcInputs, setAbcInputs]         = useState<Partial<AbcInput> | null>(null)
  const [busbarInputs, setBusbarInputs]   = useState<Partial<BusbarInput> | null>(null)

  const aiQuota     = PLAN_MONTHLY_QUOTA[plan as Plan]
  const aiRemaining = getRemaining(record, plan as Plan)

  // Auto-save LV results to history
  const prevResultId = useRef<string | null>(null)
  useEffect(() => {
    if (!currentResult || !lvInputs) return
    const key = `${currentResult.recommendedCsa}-${lvInputs.designCurrent}-${lvInputs.cableLength}`
    if (key === prevResultId.current) return
    prevResultId.current = key
    push({
      type: 'lv',
      summary: `${currentResult.recommendedCsa}mm² ${lvInputs.insulation ?? 'XLPE'} · ${lvInputs.designCurrent}A · Method ${lvInputs.referenceMethod ?? 'C'}`,
      inputs: lvInputs as Record<string, unknown>,
      result: currentResult as unknown as Record<string, unknown>,
    })
  }, [currentResult]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFillAction(action: FillAction) {
    if (action.action === 'fill_form')   { setActive('lv');     setLvInputs({ ...action.inputs }) }
    if (action.action === 'fill_abc')    { setActive('abc');    setAbcInputs({ ...action.inputs }) }
    if (action.action === 'fill_busbar') { setActive('busbar'); setBusbarInputs({ ...action.inputs }) }
  }

  function handleHistoryRestore(type: CalcType, inputs: Record<string, unknown>) {
    if (type === 'lv')     { setLvInputs(inputs as Partial<LvCableInput>); setActive('lv') }
    else if (type === 'abc')    { setAbcInputs(inputs as Partial<AbcInput>); setActive('abc') }
    else if (type === 'busbar') { setBusbarInputs(inputs as Partial<BusbarInput>); setActive('busbar') }
    else setActive(type)
  }

  const isAI = active === 'ai'

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
              <p>
                {active === 'ai'      && 'Describe a circuit — AI fills the right calculator automatically.'}
                {active === 'lv'      && 'Single-circuit sizing per BS7671 Appendix 4. Inputs update results live.'}
                {active === 'vdrop'   && 'Voltage drop check per BS7671 Section 525.'}
                {active === 'sc'      && 'IPSSC calculation and adiabatic withstand check.'}
                {active === 'motor'   && 'Derive design current from motor kW, efficiency and power factor.'}
                {active === 'abc'     && 'Aerial Bundle Conductor sizing per NFC 33-209.'}
                {active === 'busbar'  && 'Busbar sizing per IEC 60439 / BS EN 61439.'}
                {active === 'history' && 'Your saved calculations — searchable and re-openable.'}
              </p>
            </div>
            <div className="calc-head-actions">
              <button className="btn" onClick={() => setActive('history')}>
                <Clock size={14} /> Recent
              </button>
              <button className="btn" onClick={() => setActive('ai')}>
                <Sparkles size={14} /> Ask AI
                {aiQuota !== -1 && (
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    background: aiRemaining === 0 ? 'var(--fail-soft)' : 'var(--accent-soft)',
                    color: aiRemaining === 0 ? 'var(--fail)' : 'var(--accent-ink)',
                    border: `1px solid ${aiRemaining === 0 ? 'color-mix(in oklch, var(--fail) 30%, transparent)' : 'var(--accent-line)'}`,
                    borderRadius: 4,
                    padding: '1px 5px',
                    marginLeft: 2,
                  }}>
                    {aiRemaining}
                  </span>
                )}
              </button>
              <button className="btn btn-primary">
                <Download size={14} /> Export PDF
              </button>
            </div>
          </div>

          {/* Tab strip */}
          <div className="calc-tabs">
            {TABS.map(tab => {
              const allowed = planAllows(plan as Plan, tab.minPlan)
              const isPro   = tab.minPlan === 'pro'
              const isBiz   = tab.minPlan === 'business'
              return (
                <button
                  key={tab.id}
                  className={`calc-tab${active === tab.id ? ' active' : ''}${!allowed ? ' opacity-50' : ''}`}
                  onClick={() => setActive(tab.id)}
                  style={{ opacity: !allowed ? 0.5 : undefined }}
                  title={!allowed ? `${isPro ? 'Pro' : 'Business'} plan required` : undefined}
                >
                  <tab.Icon size={13} />
                  {tab.label}
                  {!allowed && <Lock size={11} style={{ color: 'var(--ink-4)' }} />}
                  {allowed && isPro && (
                    <span className="tab-badge">PRO</span>
                  )}
                  {allowed && isBiz && (
                    <span className="tab-badge">BIZ</span>
                  )}
                </button>
              )
            })}

            {/* Dev: cycle plans */}
            <button
              className="calc-tab"
              style={{ marginLeft: 'auto', color: 'var(--ink-4)', fontSize: 11 }}
              onClick={() => setPlan(plan === 'free' ? 'pro' : plan === 'pro' ? 'business' : 'free')}
              title="Dev: cycle plans"
            >
              [{(plan as string).toUpperCase()}]
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: isAI ? 'hidden' : 'auto' }}>
        {/* AI — full height, always mounted */}
        <div style={{ display: isAI ? 'block' : 'none', height: isAI ? 'calc(100vh - 160px)' : 0 }}>
          <AiChatPanel currentResult={currentResult} onFillAction={handleFillAction} />
        </div>

        {/* History */}
        {active === 'history' && (
          <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
            <HistoryPanel onRestore={handleHistoryRestore} />
          </div>
        )}

        {/* Calculator forms */}
        {active !== 'ai' && active !== 'history' && (
          <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
            {active === 'lv'     && <LvCableSizingForm externalInputs={lvInputs} onResultChange={setCurrentResult} />}
            {active === 'vdrop'  && <VoltageDropForm />}
            {active === 'sc'     && (planAllows(plan as Plan, 'pro')      ? <ShortCircuitForm /> : <UpgradeBanner tier="pro" />)}
            {active === 'motor'  && (planAllows(plan as Plan, 'pro')      ? <MotorCableForm />  : <UpgradeBanner tier="pro" />)}
            {active === 'abc'    && (planAllows(plan as Plan, 'business') ? <AbcCableForm externalInputs={abcInputs} /> : <UpgradeBanner tier="business" />)}
            {active === 'busbar' && (planAllows(plan as Plan, 'business') ? <BusbarForm externalInputs={busbarInputs} /> : <UpgradeBanner tier="business" />)}
          </div>
        )}
      </div>
    </div>
  )
}
