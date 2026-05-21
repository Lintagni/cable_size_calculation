import { useState, useRef } from 'react'
import { Sparkles, Send, X, ChevronDown, ChevronUp, Lock } from 'lucide-react'
import clsx from 'clsx'
import { useAiComplete } from '../../lib/useAiComplete'
import { usePlanStore } from '../../store/planStore'
import type { LvCableResult, LvCableInput } from '../../calculators/lvCableSizing'

interface Props {
  currentResult: LvCableResult | null
  onApplyInputs: (inputs: Partial<LvCableInput>) => void
}

const SUGGESTIONS = [
  '22kW motor, 400V 3-phase, 35m clipped to wall',
  'Size a cable from MDB to a DB, 45kW load, 25m',
  'Submain 100A, 400V, 3-phase, 40m in free air',
]

export default function AiInputBar({ currentResult, onApplyInputs }: Props) {
  const { plan } = usePlanStore()
  const isPro = plan === 'pro'

  const [prompt, setPrompt] = useState('')
  const [responseOpen, setResponseOpen] = useState(false)
  const [applied, setApplied] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { streaming, response, error, complete, reset } = useAiComplete(currentResult)

  const displayResponse = response
    .replace(/```json[\s\S]*?```/g, '')
    .trim()

  async function handleSubmit() {
    if (!prompt.trim() || streaming) return
    setResponseOpen(true)
    setApplied(false)
    reset()
    const result = await complete(prompt.trim())
    if (result.extractedInputs) {
      onApplyInputs(result.extractedInputs)
      setApplied(true)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  function handleDismiss() {
    setResponseOpen(false)
    setPrompt('')
    reset()
    setApplied(false)
  }

  function handleFocusLocked() {
    setShowUpgrade(true)
  }

  return (
    <div className="mb-8">
      {/* Main bar */}
      <div className={clsx(
        'relative rounded-2xl border-2 transition-all',
        isPro
          ? 'border-blue-200 bg-white focus-within:border-blue-400 focus-within:shadow-lg focus-within:shadow-blue-50'
          : 'border-gray-200 bg-gray-50',
      )}>
        {/* AI label */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
          <div className={clsx(
            'w-6 h-6 rounded-md flex items-center justify-center',
            isPro ? 'bg-blue-700' : 'bg-gray-300',
          )}>
            {isPro
              ? <Sparkles className="w-3.5 h-3.5 text-white" />
              : <Lock className="w-3.5 h-3.5 text-white" />
            }
          </div>
          <span className={clsx('text-xs font-semibold', isPro ? 'text-blue-700' : 'text-gray-400')}>
            AI Circuit Assistant
          </span>
          {isPro && (
            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full font-medium">
              Claude · Pro
            </span>
          )}
          {!isPro && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-full font-medium">
              Pro feature
            </span>
          )}
        </div>

        {/* Input row */}
        <div className="flex items-center gap-3 px-5 pb-4">
          <input
            ref={inputRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKey}
            onFocus={!isPro ? handleFocusLocked : undefined}
            readOnly={!isPro}
            placeholder={
              isPro
                ? 'Describe your circuit in plain English — e.g. "22kW motor, 400V 3-phase, 35m clipped to wall"'
                : 'Upgrade to Pro to use the AI assistant'
            }
            disabled={streaming}
            className={clsx(
              'flex-1 text-sm outline-none bg-transparent placeholder-gray-400',
              isPro ? 'text-gray-800 cursor-text' : 'text-gray-400 cursor-pointer',
            )}
          />
          {isPro ? (
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || streaming}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                prompt.trim() && !streaming
                  ? 'bg-blue-700 text-white hover:bg-blue-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed',
              )}
            >
              {streaming
                ? <span className="flex gap-1">{[0,1,2].map(i => <span key={i} className="w-1 h-1 bg-blue-300 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</span>
                : <><Send className="w-3.5 h-3.5" /> Ask</>
              }
            </button>
          ) : (
            <button
              onClick={() => setShowUpgrade(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
            >
              Upgrade to Pro
            </button>
          )}
        </div>

        {/* Suggestions (pro only, no response yet) */}
        {isPro && !responseOpen && (
          <div className="flex flex-wrap gap-2 px-5 pb-4">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setPrompt(s); inputRef.current?.focus() }}
                className="text-xs text-gray-500 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-100 hover:border-blue-200 rounded-lg px-3 py-1.5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade prompt (free users) */}
      {showUpgrade && !isPro && (
        <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">AI Assistant is a Pro feature</p>
            <p className="text-xs text-gray-500 mb-3">
              Describe any circuit in plain English — Claude extracts all parameters and fills the calculator instantly. Includes BS7671 Q&A and result explanations.
            </p>
            <button
              onClick={() => usePlanStore.getState().setPlan('pro')}
              className="text-xs font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Upgrade to Pro — $12.99/mo
            </button>
            <span className="text-xs text-gray-400 ml-3">7-day free trial</span>
          </div>
          <button onClick={() => setShowUpgrade(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AI response card */}
      {responseOpen && isPro && (
        <div className="mt-3 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-medium text-gray-700">
                {streaming ? 'Claude is thinking…' : applied ? '✓ Inputs applied to form' : 'Claude'}
              </span>
              {applied && (
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                  Review & click Calculate
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setResponseOpen(v => !v)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                {responseOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <button onClick={handleDismiss} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="px-4 py-3">
            {displayResponse ? (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{displayResponse}</p>
            ) : streaming ? (
              <div className="flex gap-1 py-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />
                ))}
              </div>
            ) : null}
            {error && (
              <p className="text-xs text-red-500 mt-2">
                {error.includes('401') ? 'Invalid API key — check your .env file' : error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
