import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Zap, Sparkles, TrendingDown, AlertTriangle, Cpu, Radio,
  LayoutGrid, Clock, CreditCard, Lock, Moon, Sun, ChevronRight,
  ArrowUpRight,
} from 'lucide-react'
import clsx from 'clsx'
import AiChatPanel from '../components/AiAssistant/AiChatPanel'
import LvCableSizingForm from '../components/calculator/LvCableSizingForm'
import VoltageDropForm from '../components/calculator/VoltageDropForm'
import ShortCircuitForm from '../components/calculator/ShortCircuitForm'
import MotorCableForm from '../components/calculator/MotorCableForm'
import AbcCableForm from '../components/calculator/AbcCableForm'
import BusbarForm from '../components/calculator/BusbarForm'
import { usePlanStore } from '../store/planStore'
import { useThemeStore } from '../store/themeStore'
import { useAiQuotaStore, getRemaining, PLAN_MONTHLY_QUOTA } from '../store/aiQuotaStore'
import type { FillAction } from '../lib/claude'
import type { LvCableResult, LvCableInput } from '../calculators/lvCableSizing'
import type { AbcInput } from '../calculators/abcCableSizing'
import type { BusbarInput } from '../calculators/busbarSizing'

// ─── Types ────────────────────────────────────────────────────────────────────
type Plan = 'free' | 'pro' | 'business'
const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, business: 2 }
function planAllows(userPlan: Plan, minPlan: string) {
  return PLAN_RANK[userPlan] >= PLAN_RANK[minPlan as Plan]
}

type TabId = 'ai' | 'lv' | 'vdrop' | 'sc' | 'motor' | 'abc' | 'busbar'

// ─── Sidebar nav config ───────────────────────────────────────────────────────
const NAV = [
  {
    section: 'Calculators',
    items: [
      { id: 'ai'    as TabId, label: 'AI Assistant',   icon: Sparkles,      minPlan: 'free' },
      { id: 'lv'    as TabId, label: 'LV Cable Sizing', icon: Zap,          minPlan: 'free' },
      { id: 'vdrop' as TabId, label: 'Voltage Drop',   icon: TrendingDown,  minPlan: 'free' },
      { id: 'sc'    as TabId, label: 'Short Circuit',   icon: AlertTriangle, minPlan: 'pro'  },
      { id: 'motor' as TabId, label: 'Motor Cable',    icon: Cpu,           minPlan: 'pro'  },
    ],
  },
  {
    section: 'Advanced',
    items: [
      { id: 'abc'    as TabId, label: 'ABC Cable',      icon: Radio,        minPlan: 'business' },
      { id: 'busbar' as TabId, label: 'Busbar Sizing',  icon: LayoutGrid,   minPlan: 'business' },
    ],
  },
]

const PLAN_LABEL: Record<Plan, string> = {
  free: 'Free', pro: 'Pro', business: 'Business',
}
const _PLAN_COLOR: Record<Plan, string> = {
  free:     'text-gray-400 dark:text-gray-500',
  pro:      'text-blue-500',
  business: 'text-violet-400',
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  active, onNav, plan, aiRemaining, aiQuota,
}: {
  active: TabId
  onNav: (id: TabId) => void
  plan: Plan
  aiRemaining: number
  aiQuota: number
}) {
  const { setPlan } = usePlanStore()
  const { dark, toggle } = useThemeStore()
  const navigate = useNavigate()

  const aiPct = aiQuota === -1 ? 100 : Math.min(100, Math.round(((aiRemaining ?? 0) / aiQuota) * 100))

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col h-screen border-r bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 overflow-hidden">

      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-gray-100 dark:border-gray-800">
        <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-white fill-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900 dark:text-white leading-none">CableCalc</div>
          <div className="text-[10px] text-gray-400 dark:text-gray-600 leading-none mt-0.5">BS7671 · NFC · IEC</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map(group => (
          <div key={group.section} className="mb-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600 px-2 py-1.5">
              {group.section}
            </div>
            {group.items.map(item => {
              const allowed = planAllows(plan, item.minPlan)
              const isActive = active === item.id
              const Icon = item.icon
              const isPro = item.minPlan === 'pro'
              const isBiz = item.minPlan === 'business'

              return (
                <button
                  key={item.id}
                  onClick={() => allowed && onNav(item.id)}
                  title={!allowed ? `${isPro ? 'Pro' : 'Business'} plan required` : undefined}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all group',
                    isActive
                      ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 font-medium'
                      : allowed
                        ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                        : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60',
                  )}
                >
                  <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-violet-600 dark:text-violet-400' : '')} />
                  <span className="flex-1 text-left truncate">{item.label}</span>

                  {/* Badges */}
                  {item.id === 'ai' && (
                    <span className={clsx(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                      aiRemaining === 0
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-500'
                        : aiQuota === -1
                          ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400'
                          : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
                    )}>
                      {aiQuota === -1 ? '∞' : aiRemaining}
                    </span>
                  )}
                  {!allowed && <Lock className="w-3 h-3 flex-shrink-0" />}
                  {allowed && isPro && (
                    <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1 rounded">PRO</span>
                  )}
                  {allowed && isBiz && (
                    <span className="text-[9px] font-bold bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 px-1 rounded">BIZ</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-gray-800 my-2" />

        {/* External nav links */}
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-all"
        >
          <Clock className="w-4 h-4" />
          <span>History</span>
        </button>
        <button
          onClick={() => navigate('/pricing')}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-all"
        >
          <CreditCard className="w-4 h-4" />
          <span>Pricing</span>
        </button>
      </nav>

      {/* Bottom — plan info */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-3">
        {/* Dark mode toggle + plan cycle (dev) */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setPlan(plan === 'free' ? 'pro' : plan === 'pro' ? 'business' : 'free')}
            className={clsx(
              'flex-1 flex items-center justify-between px-2 py-1 rounded-md text-xs font-medium border transition-colors',
              plan === 'business'
                ? 'border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20'
                : plan === 'pro'
                  ? 'border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400',
            )}
            title="Dev toggle — cycle plans"
          >
            <span>{PLAN_LABEL[plan]}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* AI credit bar */}
        {aiQuota === -1 ? (
          <div className="flex items-center gap-1.5 text-xs text-violet-500">
            <Sparkles className="w-3 h-3" />
            <span>Unlimited AI credits</span>
          </div>
        ) : (
          <div>
            <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 mb-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-violet-400" /> AI credits
              </span>
              <span className={aiRemaining <= 2 ? 'text-red-400' : aiRemaining <= aiQuota * 0.2 ? 'text-amber-400' : ''}>
                {aiRemaining} / {aiQuota}
              </span>
            </div>
            <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all',
                  aiRemaining === 0 ? 'bg-red-400' : aiRemaining <= aiQuota * 0.2 ? 'bg-amber-400' : 'bg-violet-500',
                )}
                style={{ width: `${aiPct}%` }}
              />
            </div>
            {plan !== 'business' && (
              <Link
                to="/pricing"
                className="mt-1.5 flex items-center gap-1 text-[11px] text-violet-600 dark:text-violet-400 hover:underline"
              >
                Upgrade for more <ArrowUpRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

// ─── Top bar (breadcrumb + mini controls) ─────────────────────────────────────
const TAB_LABELS: Record<TabId, string> = {
  ai: 'AI Assistant', lv: 'LV Cable Sizing', vdrop: 'Voltage Drop',
  sc: 'Short Circuit', motor: 'Motor Cable', abc: 'ABC Cable', busbar: 'Busbar Sizing',
}

function TopBar({ active }: { active: TabId }) {
  return (
    <div className="h-12 flex items-center gap-2 px-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
      <span className="text-sm text-gray-400 dark:text-gray-600">Calculator</span>
      <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-700" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{TAB_LABELS[active]}</span>
    </div>
  )
}

// ─── Upgrade banner ───────────────────────────────────────────────────────────
function UpgradeBanner({ tier }: { tier: 'pro' | 'business' }) {
  const isPro = tier === 'pro'
  return (
    <div className={clsx(
      'rounded-xl p-6 text-center mx-auto max-w-lg mt-16',
      isPro
        ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800'
        : 'bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800',
    )}>
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3', isPro ? 'bg-blue-100 dark:bg-blue-900' : 'bg-violet-100 dark:bg-violet-900')}>
        <Lock className={clsx('w-5 h-5', isPro ? 'text-blue-600 dark:text-blue-400' : 'text-violet-600 dark:text-violet-400')} />
      </div>
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {isPro ? 'Pro Plan Required' : 'Business Plan Required'}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {isPro
          ? 'Short circuit and motor cable sizing require Pro (£9.99/mo). Includes 200 AI credits, aluminium cables, and PDF reports.'
          : 'ABC cable and busbar sizing require Business (£29.99/mo). Includes unlimited AI, API access, and custom report branding.'}
      </p>
      <Link
        to="/pricing"
        className={clsx(
          'inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors',
          isPro ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-violet-700 text-white hover:bg-violet-800',
        )}
      >
        View pricing <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Calculator() {
  const { plan } = usePlanStore()
  const { record } = useAiQuotaStore()

  const [active, setActive]               = useState<TabId>('ai')
  const [currentResult, setCurrentResult] = useState<LvCableResult | null>(null)
  const [lvInputs, setLvInputs]           = useState<Partial<LvCableInput> | null>(null)
  const [abcInputs, setAbcInputs]         = useState<Partial<AbcInput> | null>(null)
  const [busbarInputs, setBusbarInputs]   = useState<Partial<BusbarInput> | null>(null)

  const aiQuota     = PLAN_MONTHLY_QUOTA[plan]
  const aiRemaining = getRemaining(record, plan)

  function handleFillAction(action: FillAction) {
    if (action.action === 'fill_form')   { setActive('lv');     setLvInputs({ ...action.inputs }) }
    if (action.action === 'fill_abc')    { setActive('abc');    setAbcInputs({ ...action.inputs }) }
    if (action.action === 'fill_busbar') { setActive('busbar'); setBusbarInputs({ ...action.inputs }) }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

      {/* Sidebar */}
      <Sidebar
        active={active}
        onNav={setActive}
        plan={plan as Plan}
        aiRemaining={aiRemaining}
        aiQuota={aiQuota}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar active={active} />

        {/* Content */}
        <div className={clsx('flex-1 overflow-auto', active !== 'ai' && 'p-6 lg:p-8')}>

          {/* AI tab — always mounted */}
          <div className={active === 'ai' ? 'h-full' : 'hidden'}>
            <AiChatPanel currentResult={currentResult} onFillAction={handleFillAction} />
          </div>

          {/* Calculator tabs */}
          {active !== 'ai' && (
            <>
              {active === 'lv'     && <LvCableSizingForm externalInputs={lvInputs} onResultChange={setCurrentResult} />}
              {active === 'vdrop'  && <VoltageDropForm />}
              {active === 'sc'     && (planAllows(plan as Plan, 'pro')      ? <ShortCircuitForm /> : <UpgradeBanner tier="pro" />)}
              {active === 'motor'  && (planAllows(plan as Plan, 'pro')      ? <MotorCableForm />  : <UpgradeBanner tier="pro" />)}
              {active === 'abc'    && (planAllows(plan as Plan, 'business') ? <AbcCableForm externalInputs={abcInputs} />    : <UpgradeBanner tier="business" />)}
              {active === 'busbar' && (planAllows(plan as Plan, 'business') ? <BusbarForm externalInputs={busbarInputs} /> : <UpgradeBanner tier="business" />)}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
