import { useState, useRef, useEffect, useMemo } from 'react'
import { Sparkles, Send, RotateCcw, ArrowUpRight, ChevronDown, Check, Zap, X } from 'lucide-react'
import clsx from 'clsx'
import { useAiChat } from '../../lib/useAiChat'
import type { FillAction } from '../../lib/claude'
import { usePlanStore } from '../../store/planStore'
import { useAiQuotaStore, getRemaining, canAfford, PLAN_MONTHLY_QUOTA, MODEL_CREDIT_WEIGHT } from '../../store/aiQuotaStore'
import { useAiModelStore, AI_MODELS } from '../../store/aiModelStore'
import type { AiModelId, RealModelId } from '../../store/aiModelStore'
import type { LvCableResult } from '../../calculators/lvCableSizing'
import MarkdownMessage from './MarkdownMessage'
import BuyCreditsModal from './BuyCreditsModal'
import CalcResultCard from './CalcResultCard'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAiChatStore } from '../../store/aiChatStore'
import { routeQuery } from '../../lib/complexityRouter'

interface Props {
  currentResult: LvCableResult | null
  onFillAction: (action: FillAction) => void
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const SUGGESTIONS = [
  { tag: 'LV Cable',  text: '22kW motor, 35m run' },
  { tag: 'LV Cable',  text: 'MDB → DB-03, 45kW' },
  { tag: 'LV Cable',  text: '100A submain, 40m' },
  { tag: 'ABC Cable', text: '150A overhead, 300m run' },
  { tag: 'Busbar',    text: '800A copper busbars' },
  { tag: 'BS7671',    text: 'Cg for 4 circuits?' },
]

const SUGGESTIONS_FULL = [
  '22kW motor, 400V 3-phase, 35m clipped to wall',
  'Size a cable from MDB to a DB, 45kW load, 25m',
  'Submain 100A, 400V, 3-phase, 40m in free air',
  'Overhead ABC cable for 150A load, 300m run',
  'Size copper busbars for 800A in enclosed panel at 45°C',
  'What grouping factor applies to 4 circuits in trunking?',
]

const MODEL_DOT: Record<AiModelId, string> = {
  'auto':              'bg-emerald-400',
  'claude-opus-4-5':   'bg-amber-400',
  'claude-sonnet-4-6': 'bg-violet-400',
  'claude-haiku-4-5':  'bg-sky-400',
}

// ── Model selector dropdown (empty state) ─────────────────────────────────────
function ModelDropdown() {
  const { modelId, setModel } = useAiModelStore()
  const [open, setOpen]       = useState(false)
  const ref                   = useRef<HTMLDivElement>(null)
  const active                = AI_MODELS.find(m => m.id === modelId)!

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
          borderRadius: 12, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          background: 'var(--surface)', border: '1px solid var(--line)',
          color: 'var(--ink)', transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
      >
        <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', MODEL_DOT[modelId])} />
        <span className={active.color} style={{ fontWeight: 600 }}>Claude {active.label}</span>
        <ChevronDown size={13} style={{
          color: 'var(--ink-3)',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.15s',
        }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', left: 0, top: 'calc(100% + 8px)', zIndex: 50,
          width: 264, borderRadius: 16, border: '1px solid var(--line)',
          background: 'var(--surface)', boxShadow: 'var(--shadow-pop)', overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 12px 4px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-4)', margin: 0 }}>Select model</p>
          </div>
          {AI_MODELS.map(m => (
            <button
              key={m.id}
              onClick={() => { setModel(m.id as AiModelId); setOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                background: m.id === modelId ? 'var(--surface-2)' : 'transparent',
                border: 'none',
              }}
              onMouseEnter={e => { if (m.id !== modelId) e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={e => { if (m.id !== modelId) e.currentTarget.style.background = 'transparent' }}
            >
              <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', MODEL_DOT[m.id as AiModelId])} style={{ marginTop: 5 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                  <span className={m.color} style={{ fontSize: 13, fontWeight: 600 }}>Claude {m.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', flexShrink: 0 }}>{m.sublabel}</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.4, margin: 0 }}>{m.description}</p>
              </div>
              {m.id === modelId && <Check size={13} style={{ color: 'var(--accent-ink)', flexShrink: 0, marginTop: 4 }} />}
            </button>
          ))}
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--line)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', margin: 0 }}>Powered by Anthropic · selection saved</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Compact pill for chat input toolbar ───────────────────────────────────────
function ModelBadgePill() {
  const { modelId, setModel } = useAiModelStore()
  const [open, setOpen]       = useState(false)
  const ref                   = useRef<HTMLDivElement>(null)
  const active                = AI_MODELS.find(m => m.id === modelId)!

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
          borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
          background: 'var(--surface-2)', border: '1px solid var(--line)',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
      >
        <span className={clsx('w-1.5 h-1.5 rounded-full', MODEL_DOT[modelId])} />
        <span className={active.color}>{active.label}</span>
        <ChevronDown size={11} style={{
          color: 'var(--ink-3)',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.15s',
        }} />
      </button>

      {/* Dropdown opens UPWARD — input box is at the bottom of the screen */}
      {open && (
        <div style={{
          position: 'absolute', left: 0, bottom: 'calc(100% + 6px)', zIndex: 50,
          width: 220, borderRadius: 12, border: '1px solid var(--line)',
          background: 'var(--surface)', boxShadow: 'var(--shadow-pop)', overflow: 'hidden',
        }}>
          {AI_MODELS.map(m => (
            <button
              key={m.id}
              onClick={() => { setModel(m.id as AiModelId); setOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                background: m.id === modelId ? 'var(--surface-2)' : 'transparent',
                border: 'none',
              }}
              onMouseEnter={e => { if (m.id !== modelId) e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={e => { if (m.id !== modelId) e.currentTarget.style.background = 'transparent' }}
            >
              <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', MODEL_DOT[m.id as AiModelId])} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={m.color} style={{ fontSize: 12, fontWeight: 600 }}>{m.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>{m.sublabel}</span>
                </div>
              </div>
              {m.id === modelId && <Check size={11} style={{ color: 'var(--accent-ink)', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Inline model tag on AI response bubbles ───────────────────────────────────
function ResponseModelTag({ modelId }: { modelId: AiModelId }) {
  const model = AI_MODELS.find(m => m.id === modelId)!
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md',
      model.badge,
    )}>
      <span className={clsx('w-1 h-1 rounded-full', MODEL_DOT[modelId])} />
      {model.label}
    </span>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function AiChatPanel({ currentResult, onFillAction }: Props) {
  const { plan } = usePlanStore()
  const { record, consume } = useAiQuotaStore()
  const { modelId } = useAiModelStore()

  // Chat state lives in Zustand — survives navigation to Calculator and back
  const { msgModels, setMsgModels, calcResults, pendingFill, setPendingFill } = useAiChatStore()

  const quota     = PLAN_MONTHLY_QUOTA[plan]
  const remaining = getRemaining(record, plan)

  const [prompt, setPrompt]               = useState('')
  const [showBuyModal, setShowBuyModal]   = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const messagesEndRef                  = useRef<HTMLDivElement>(null)
  const textareaRef                     = useRef<HTMLTextAreaElement>(null)
  const prevMsgCountRef                 = useRef(0)

  const { messages, streaming, error, send, reset } = useAiChat(currentResult)
  const hasMessages = messages.length > 0

  // ── Live routing estimate (updates as user types) ──────────────────────────
  const routeEstimate = useMemo(() => {
    if (!prompt.trim()) return null
    if (modelId !== 'auto') return null
    return routeQuery(prompt)
  }, [prompt, modelId])

  // Effective credit cost for the current message
  const effectiveCreditCost = routeEstimate
    ? routeEstimate.creditCost
    : MODEL_CREDIT_WEIGHT[modelId] ?? 2

  // Can the user afford this message?
  const canQuery = remaining >= effectiveCreditCost || remaining >= 1

  useEffect(() => {
    const isNewMessage = messages.length > prevMsgCountRef.current
    prevMsgCountRef.current = messages.length
    // Smooth scroll for new messages; instant during streaming to avoid flicker
    messagesEndRef.current?.scrollIntoView({ behavior: isNewMessage ? 'smooth' : 'instant' })
  }, [messages])

  async function handleSubmit() {
    if (!prompt.trim() || streaming) return

    const text = prompt.trim()

    // ── 1. Determine effective model ─────────────────────────────────────────
    let effectiveModel: RealModelId
    if (modelId === 'auto') {
      effectiveModel = routeQuery(text).modelId
    } else {
      effectiveModel = modelId as RealModelId
    }

    // ── 2. Affordability check — fall back to cheaper model if needed ─────────
    if (!canAfford(record, plan, effectiveModel)) {
      const fallbacks: RealModelId[] = ['claude-sonnet-4-6', 'claude-haiku-4-5']
      const affordable = fallbacks.find(m => canAfford(record, plan, m))
      if (!affordable) return   // truly out of credits
      effectiveModel = affordable
    }

    // ── 3. Consume credits immediately (UI feedback) ──────────────────────────
    consume(effectiveModel, plan)

    // ── 4. Sync updated credits to DB (fire-and-forget) ──────────────────────
    void (async () => {
      try {
        const { record } = useAiQuotaStore.getState()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        await supabase.from('profiles').update({
          credits_used:      record.used,
          credits_purchased: record.purchased,
          credits_period:    record.period,
        }).eq('id', session.user.id)
      } catch (e) {
        console.warn('credits sync to DB failed:', e)
      }
    })()

    // ── 5. Send ───────────────────────────────────────────────────────────────
    const assistantIdx = messages.length + 1
    setPrompt('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setMsgModels(prev => ({ ...prev, [assistantIdx]: effectiveModel }))

    await send(text, effectiveModel)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  function handleReset() { reset(); useAiChatStore.getState().reset() }

  // ── Empty / centered state ─────────────────────────────────────────────────
  const [shuffleIdx, setShuffleIdx] = useState(0)
  const visibleSuggestions = SUGGESTIONS.slice(shuffleIdx % 2 === 0 ? 0 : 3, shuffleIdx % 2 === 0 ? 6 : 6)

  if (!hasMessages) {
    return (
      <div className="ai-empty-state">

        {/* ── Scrollable greeting + suggestions ───────────────────────────── */}
        <div className="ai-empty-content">
          {/* Eyebrow */}
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--ink-4)',
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          }}>
            <span style={{ width: 24, height: 1, background: 'var(--ink-4)', display: 'inline-block' }} />
            AI Assistant · Beta
            <span style={{ width: 24, height: 1, background: 'var(--ink-4)', display: 'inline-block' }} />
          </div>

          {/* Greeting */}
          <h1 style={{ fontSize: 'clamp(26px, 7vw, 60px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 10, textAlign: 'center', lineHeight: 1.05 }}>
            {greeting()}, Engineer.
          </h1>
          <p style={{ color: 'var(--ink-3)', marginBottom: 32, textAlign: 'center', fontSize: 15, maxWidth: 480 }}>
            Describe a circuit in plain English — I'll fill the right calculator automatically.
          </p>

          {/* Suggestions */}
          <div style={{ width: '100%', maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <span style={{ width: 24, height: 1, background: 'var(--ink-4)', display: 'inline-block' }} />
                Try asking
              </div>
              <button
                onClick={() => setShuffleIdx(i => i + 1)}
                style={{ fontSize: 12, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Shuffle
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
              {visibleSuggestions.map((s, i) => (
                <button
                  key={s.text}
                  disabled={!canQuery}
                  onClick={() => {
                    const full = SUGGESTIONS_FULL[(shuffleIdx % 2 === 0 ? 0 : 3) + i] ?? s.text
                    setPrompt(full); textareaRef.current?.focus(); autoResize(textareaRef.current!)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
                    background: 'var(--surface)', border: '1px solid var(--line)',
                    borderRadius: 'var(--r)', cursor: canQuery ? 'pointer' : 'not-allowed',
                    textAlign: 'left', transition: 'border-color 0.12s',
                    opacity: canQuery ? 1 : 0.45, overflow: 'hidden',
                  }}
                  onMouseEnter={e => { if (canQuery) e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)' }}
                >
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: 'var(--accent-ink)', background: 'var(--accent-soft)',
                    border: '1px solid var(--accent-line)',
                    borderRadius: 3, padding: '2px 5px', flexShrink: 0, whiteSpace: 'nowrap',
                  }}>
                    {s.tag}
                  </span>
                  <span style={{
                    fontSize: 12, color: 'var(--ink-2)', flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {s.text}
                  </span>
                  <span style={{ color: 'var(--ink-4)', fontSize: 12, flexShrink: 0 }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Input — pinned at bottom (same as chat mode) ─────────────────── */}
        <div className="ai-chat-input-outer" style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 640 }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 'var(--r-lg)',
              opacity: canQuery ? 1 : 0.7,
              boxShadow: '0 4px 24px oklch(0% 0 0 / 0.12)',
            }}>
              {/* Top row: model pill · credits · buy credits */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderBottom: '1px solid var(--line)',
              }}>
                <ModelBadgePill />
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: !canQuery ? 'var(--fail)' : remaining <= (quota ?? 0) * 0.2 ? '#f59e0b' : 'var(--ink-4)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {quota === -1
                    ? '∞ Unlimited'
                    : <>{remaining}/{quota} cr · {MODEL_CREDIT_WEIGHT[modelId]}cr/msg</>
                  }
                </span>
                {quota !== -1 && (
                  <button
                    onClick={() => setShowBuyModal(true)}
                    style={{
                      marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                      padding: '3px 8px', borderRadius: 6,
                      background: 'var(--surface-2)', border: '1px solid var(--line)',
                      cursor: 'pointer', color: 'var(--ink-3)',
                    }}
                  >
                    Buy credits
                  </button>
                )}
              </div>
              {/* Textarea + send */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: '10px 12px 12px' }}>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={prompt}
                  onChange={e => { setPrompt(e.target.value); autoResize(e.target) }}
                  onKeyDown={handleKey}
                  disabled={!canQuery}
                  placeholder={canQuery ? 'Describe your circuit, busbar, or overhead ABC run…' : 'Monthly credit quota reached — upgrade to continue'}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 14, color: 'var(--ink)', resize: 'none', lineHeight: 1.6,
                    minHeight: 24, maxHeight: 160, fontFamily: 'var(--font-sans)',
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || streaming || !canQuery}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: prompt.trim() && canQuery ? 'var(--ink)' : 'var(--line)',
                    transition: 'background 0.15s',
                  }}
                >
                  {streaming
                    ? <span style={{ width: 6, height: 6, background: 'var(--bg)', borderRadius: '50%' }} />
                    : <Send size={14} style={{ color: prompt.trim() && canQuery ? 'var(--bg)' : 'var(--ink-4)' }} />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {showBuyModal && <BuyCreditsModal onClose={() => setShowBuyModal(false)} />}
      </div>
    )
  }

  // ── Chat mode ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 0 }}>
      <div style={{ width: '100%', maxWidth: 640, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 24, marginTop: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i}>
            {/* Message bubble row */}
            <div className={clsx('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={clsx(
                'max-w-[78%] rounded-2xl px-4 py-3 text-sm',
                msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-sm shadow-sm shadow-violet-900/30'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-sm shadow-sm',
              )}>
                {msg.role === 'user'
                  ? msg.content
                  : <>
                      <MarkdownMessage
                        content={msg.content.replace(/```json[\s\S]*?```/g, '').trim()}
                        streaming={streaming && i === messages.length - 1}
                      />
                      {/* Model tag shown after streaming completes */}
                      {(!streaming || i < messages.length - 1) && msgModels[i] && (
                        <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center gap-2">
                          <ResponseModelTag modelId={msgModels[i]} />
                          <span className="text-[9px] text-gray-400 dark:text-gray-600">BS7671 · NFC 33-209 · IEC 60439</span>
                        </div>
                      )}
                    </>
                }
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                  YOU
                </div>
              )}
            </div>

            {/* Calc result card — shown below each assistant message that has a result */}
            {msg.role === 'assistant' && calcResults[i] && (!streaming || i < messages.length - 1) && (
              <div style={{ paddingLeft: 40 }}>
                <CalcResultCard
                  payload={calcResults[i]}
                  onOpenInCalc={pendingFill ? () => { onFillAction(pendingFill); setPendingFill(null) } : undefined}
                />
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="text-xs text-red-400 text-center bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3">
            {error.includes('401') ? '⚠ Invalid API key — check your .env file' : `⚠ ${error}`}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      </div>

      {/* Quota exhausted banner */}
      {!canQuery && !bannerDismissed && (
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white font-semibold">Credits exhausted</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {plan === 'free'
                  ? 'Buy a top-up pack or upgrade to Pro for 200/month.'
                  : plan === 'pro'
                  ? 'Buy a top-up pack or upgrade to Business for 2,000/month.'
                  : 'Buy a top-up pack to continue.'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowBuyModal(true)}
                className="text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Buy credits
              </button>
              {plan !== 'business' && (
                <Link
                  to="/pricing"
                  className="text-xs font-medium text-gray-400 hover:text-gray-200 border border-gray-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  Upgrade <ArrowUpRight className="w-3 h-3" />
                </Link>
              )}
              <button
                onClick={() => setBannerDismissed(true)}
                className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded-md hover:bg-gray-700/50"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showBuyModal && <BuyCreditsModal onClose={() => setShowBuyModal(false)} />}

      {/* Input — model/credits/new-chat live inside the box */}
      <div className="ai-chat-input-outer" style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-lg)',
            opacity: canQuery ? 1 : 0.8,
            boxShadow: '0 4px 24px oklch(0% 0 0 / 0.12)',
          }}>
            {/* ── Top row: model · credits · new chat ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderBottom: '1px solid var(--line)',
            }}>
              <ModelBadgePill />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: !canQuery ? 'var(--fail)' : remaining <= (quota ?? 0) * 0.2 ? '#f59e0b' : 'var(--ink-4)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {routeEstimate
                  ? <Zap size={10} style={{ color: 'var(--ok)' }} />
                  : <Sparkles size={10} style={{ color: 'var(--accent-ink)' }} />
                }
                {quota === -1
                  ? 'Unlimited'
                  : routeEstimate
                    ? <>{remaining}/{quota} cr · <span style={{ color: 'var(--ok)' }}>Auto → {AI_MODELS.find(m => m.id === routeEstimate.modelId)?.label} · {routeEstimate.creditCost}cr</span></>
                    : <>{remaining}/{quota} cr · {MODEL_CREDIT_WEIGHT[modelId]}cr/msg</>
                }
              </span>
              <button
                onClick={handleReset}
                style={{
                  marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-4)', background: 'none',
                  border: '1px solid var(--line)', borderRadius: 6,
                  padding: '3px 8px', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-4)')}
              >
                <RotateCcw size={11} /> New chat
              </button>
            </div>

            {/* ── Bottom row: textarea + send ── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: '10px 12px 12px' }}>
              <textarea
                ref={textareaRef}
                rows={1}
                value={prompt}
                onChange={e => { setPrompt(e.target.value); autoResize(e.target) }}
                onKeyDown={handleKey}
                disabled={streaming || !canQuery}
                placeholder={canQuery ? 'Reply… (Enter to send, Shift+Enter for new line)' : 'Monthly quota reached'}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 14, color: 'var(--ink)', resize: 'none', lineHeight: 1.6,
                  minHeight: 24, maxHeight: 160, fontFamily: 'var(--font-sans)',
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || streaming || !canQuery}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: prompt.trim() && canQuery ? 'var(--ink)' : 'var(--line)',
                  transition: 'background 0.15s',
                }}
              >
                {streaming
                  ? <span style={{ display: 'flex', gap: 3 }}>{[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, background: 'var(--bg)', borderRadius: '50%', animation: 'bounce 1s ease infinite', animationDelay: `${i * 0.15}s` }} />)}</span>
                  : <Send size={13} style={{ color: prompt.trim() && canQuery ? 'var(--bg)' : 'var(--ink-4)' }} />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
