import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, RotateCcw, ArrowUpRight, ChevronDown, Check } from 'lucide-react'
import clsx from 'clsx'
import { useAiChat } from '../../lib/useAiChat'
import type { FillAction } from '../../lib/claude'
import { usePlanStore } from '../../store/planStore'
import { useAiQuotaStore, getRemaining, canAfford, PLAN_MONTHLY_QUOTA, MODEL_CREDIT_WEIGHT } from '../../store/aiQuotaStore'
import { useAiModelStore, AI_MODELS } from '../../store/aiModelStore'
import type { AiModelId } from '../../store/aiModelStore'
import type { LvCableResult } from '../../calculators/lvCableSizing'
import MarkdownMessage from './MarkdownMessage'
import BuyCreditsModal from './BuyCreditsModal'
import { Link } from 'react-router-dom'

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
  'claude-opus-4-5':   'bg-amber-400',
  'claude-sonnet-4-6': 'bg-violet-400',
  'claude-haiku-4-5':  'bg-sky-400',
}

// ── Model selector dropdown ────────────────────────────────────────────────────
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
          'bg-gray-900 border-gray-700 hover:border-gray-500',
          active.color,
        )}
      >
        <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', MODEL_DOT[modelId])} />
        Claude {active.label}
        <ChevronDown className={clsx('w-3.5 h-3.5 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-64 rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Select model</p>
          </div>
          {AI_MODELS.map(m => (
            <button
              key={m.id}
              onClick={() => { setModel(m.id as AiModelId); setOpen(false) }}
              className={clsx(
                'w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors',
                m.id === modelId ? 'bg-gray-800' : 'hover:bg-gray-800/60',
              )}
            >
              <span className={clsx('w-2 h-2 rounded-full flex-shrink-0 mt-1.5', MODEL_DOT[m.id as AiModelId])} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={clsx('text-sm font-semibold', m.color)}>
                    Claude {m.label}
                  </span>
                  <span className="text-[10px] text-gray-500 flex-shrink-0">{m.sublabel}</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{m.description}</p>
              </div>
              {m.id === modelId && <Check className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-1" />}
            </button>
          ))}
          <div className="px-3 py-2 border-t border-gray-800">
            <p className="text-[10px] text-gray-600">Powered by Anthropic · selection saved</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Compact pill for chat toolbar ─────────────────────────────────────────────
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all',
          'border-gray-700 dark:border-gray-700 bg-gray-800 dark:bg-gray-800',
          active.color,
        )}
      >
        <span className={clsx('w-1.5 h-1.5 rounded-full', MODEL_DOT[modelId])} />
        {active.label}
        <ChevronDown className={clsx('w-3 h-3 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-60 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
          {AI_MODELS.map(m => (
            <button
              key={m.id}
              onClick={() => { setModel(m.id as AiModelId); setOpen(false) }}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                m.id === modelId ? 'bg-gray-50 dark:bg-gray-700/60' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40',
              )}
            >
              <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', MODEL_DOT[m.id as AiModelId])} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={clsx('text-xs font-semibold', m.color)}>{m.label}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{m.sublabel}</span>
                </div>
              </div>
              {m.id === modelId && <Check className="w-3 h-3 text-violet-400 flex-shrink-0" />}
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

  const quota     = PLAN_MONTHLY_QUOTA[plan]
  const remaining = getRemaining(record, plan)
  const canQuery  = canAfford(record, plan, modelId)

  const [prompt, setPrompt]           = useState('')
  const [appliedLabel, setAppliedLabel] = useState<string | null>(null)
  const [msgModels, setMsgModels]     = useState<Record<number, AiModelId>>({})
  const [showBuyModal, setShowBuyModal] = useState(false)
  const messagesEndRef                = useRef<HTMLDivElement>(null)
  const textareaRef                   = useRef<HTMLTextAreaElement>(null)

  const { messages, streaming, error, send, reset } = useAiChat(currentResult)
  const hasMessages = messages.length > 0

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit() {
    if (!prompt.trim() || streaming || !canQuery) return
    consume(modelId, plan)
    const text = prompt.trim()
    const assistantIdx = messages.length + 1
    setPrompt('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setMsgModels(prev => ({ ...prev, [assistantIdx]: modelId }))

    const { fillAction } = await send(text)
    if (fillAction) {
      onFillAction(fillAction)
      const labels: Record<FillAction['action'], string> = {
        fill_form:   'Switched to LV Cable Sizing',
        fill_abc:    'Switched to ABC Cable',
        fill_busbar: 'Switched to Busbar Sizing',
      }
      setAppliedLabel(labels[fillAction.action])
      setTimeout(() => setAppliedLabel(null), 4000)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  function handleReset() { reset(); setMsgModels({}) }

  // ── Empty / centered state ─────────────────────────────────────────────────
  const [shuffleIdx, setShuffleIdx] = useState(0)
  const visibleSuggestions = SUGGESTIONS.slice(shuffleIdx % 2 === 0 ? 0 : 3, shuffleIdx % 2 === 0 ? 6 : 6)

  if (!hasMessages) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', padding: '0 24px 40px',
      }}>
        {/* Eyebrow */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--ink-4)',
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
        }}>
          <span style={{ width: 24, height: 1, background: 'var(--ink-4)', display: 'inline-block' }} />
          AI Assistant · Beta
          <span style={{ width: 24, height: 1, background: 'var(--ink-4)', display: 'inline-block' }} />
        </div>

        {/* Greeting */}
        <h1 style={{ fontSize: 64, fontWeight: 800, color: 'var(--ink)', marginBottom: 10, textAlign: 'center', lineHeight: 1.05 }}>
          {greeting()}, Engineer.
        </h1>
        <p style={{ color: 'var(--ink-3)', marginBottom: 32, textAlign: 'center', fontSize: 15, maxWidth: 480 }}>
          Describe a circuit in plain English — I'll fill the right calculator automatically.
        </p>

        {/* Model + credits row */}
        <div style={{ width: '100%', maxWidth: 640, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <ModelDropdown />
          {quota !== -1 && (
            <>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12,
                color: !canQuery ? 'var(--fail)' : remaining <= quota * 0.2 ? '#f59e0b' : 'var(--ink-3)',
              }}>
                {remaining}/{quota} credits
              </span>
              <button
                onClick={() => setShowBuyModal(true)}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 'var(--r)',
                  background: 'var(--accent)', color: 'var(--bg)', border: 'none', cursor: 'pointer',
                }}
              >
                + Buy credits
              </button>
            </>
          )}
          {quota === -1 && (
            <span style={{ fontSize: 12, color: 'var(--ok)', fontFamily: 'var(--font-mono)' }}>
              ∞ Unlimited credits
            </span>
          )}
        </div>

        {/* Input box */}
        <div style={{
          width: '100%', maxWidth: 640,
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 'var(--r-lg)', overflow: 'hidden',
          opacity: canQuery ? 1 : 0.7,
          boxShadow: '0 4px 24px oklch(0% 0 0 / 0.12)',
        }}>
          <textarea
            ref={textareaRef}
            rows={3}
            value={prompt}
            onChange={e => { setPrompt(e.target.value); autoResize(e.target) }}
            onKeyDown={handleKey}
            disabled={!canQuery}
            placeholder={canQuery ? 'Describe your circuit, busbar, or overhead ABC run…' : 'Monthly credit quota reached — upgrade to continue'}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              padding: '16px 16px 8px', fontSize: 14, color: 'var(--ink)',
              resize: 'none', lineHeight: 1.6, minHeight: 80, maxHeight: 160,
              fontFamily: 'var(--font-sans)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 12px', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>
              Enter ↵ to send · Shift+Enter for new line
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {appliedLabel && (
                <span style={{ fontSize: 11, color: 'var(--ok)', fontWeight: 600 }}>✓ {appliedLabel}</span>
              )}
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || streaming || !canQuery}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
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

        {/* Suggestions */}
        <div style={{ width: '100%', maxWidth: 640, marginTop: 20 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
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

        {showBuyModal && <BuyCreditsModal onClose={() => setShowBuyModal(false)} />}
      </div>
    )
  }

  // ── Chat mode ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
        {/* Model selector */}
        <ModelBadgePill />

        {/* Credits */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <Sparkles className="w-3 h-3 text-violet-500" />
          {quota === -1
            ? 'Unlimited'
            : <>{remaining}/{quota} <span className="text-gray-600 dark:text-gray-600">· {MODEL_CREDIT_WEIGHT[modelId]}/call</span></>
          }
        </div>

        {/* Applied label */}
        {appliedLabel && (
          <span className="text-xs text-green-500 font-medium bg-green-950/30 px-2 py-0.5 rounded-full border border-green-900/40">
            ✓ {appliedLabel}
          </span>
        )}

        {/* New chat — push to right */}
        <button
          onClick={handleReset}
          className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 border border-gray-700 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-gray-800"
        >
          <RotateCcw className="w-3 h-3" /> New chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 640, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
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
      {!canQuery && (
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
            </div>
          </div>
        </div>
      )}

      {showBuyModal && <BuyCreditsModal onClose={() => setShowBuyModal(false)} />}

      {/* Input — same centred 640px width as empty state */}
      <div style={{ flexShrink: 0, padding: '8px 16px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 10,
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-lg)', padding: '12px 14px',
            opacity: canQuery ? 1 : 0.7,
            boxShadow: '0 4px 24px oklch(0% 0 0 / 0.12)',
          }}>
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
  )
}
