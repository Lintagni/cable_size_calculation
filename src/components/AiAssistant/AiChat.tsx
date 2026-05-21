import { useRef, useEffect, useState } from 'react'
import { Send, Sparkles, X, Trash2, Zap } from 'lucide-react'
import clsx from 'clsx'
import { useChatStream } from './useChatStream'
import { parseExtractedInputs } from '../../lib/claude'
import type { LvCableResult, LvCableInput } from '../../calculators/lvCableSizing'

interface Props {
  onClose: () => void
  currentResult: LvCableResult | null
  onApplyInputs: (inputs: Partial<LvCableInput>) => void
}

const QUICK_PROMPTS = [
  'Explain the recommended cable size',
  'What correction factors apply here?',
  'Size a cable: 22kW motor, 400V 3-phase, 20m, clipped to wall',
  'What is the max voltage drop for a lighting circuit?',
]

function MessageBubble({
  role, content, onApply,
}: {
  role: 'user' | 'assistant'
  content: string
  onApply?: (inputs: Partial<LvCableInput>) => void
}) {
  const extracted = role === 'assistant' ? parseExtractedInputs(content) : null

  // Strip the JSON block from displayed text
  const displayText = content
    .replace(/```json[\s\S]*?```/g, '')
    .trim()

  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-700 text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-gray-100 text-gray-800 text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[95%] leading-relaxed whitespace-pre-wrap">
        {displayText || <span className="opacity-40">▋</span>}
      </div>
      {extracted && onApply && (
        <button
          onClick={() => onApply(extracted.inputs)}
          className="self-start flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          Apply inputs to calculator
        </button>
      )}
    </div>
  )
}

export default function AiChat({ onClose, currentResult, onApplyInputs }: Props) {
  const { messages, streaming, error, send, clear } = useChatStream(currentResult)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!input.trim()) return
    send(input.trim())
    setInput('')
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">AI Assistant</div>
            <div className="text-xs text-gray-400">Claude · BS7671 expert</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={clear} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">BS7671 AI Assistant</p>
              <p className="text-xs text-gray-400 mt-1">
                Describe a circuit in plain English to pre-fill the calculator, or ask any BS7671 question.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Try asking</p>
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => { send(prompt) }}
                  className="w-full text-left text-xs text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-100 hover:border-blue-200 rounded-lg px-3 py-2 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            onApply={msg.role === 'assistant' ? onApplyInputs : undefined}
          />
        ))}

        {streaming && messages.at(-1)?.content === '' && (
          <div className="flex gap-1 px-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
            {error.includes('401') || error.includes('auth')
              ? 'Invalid API key — add your key to the .env file'
              : error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 p-3">
        {currentResult?.results && (
          <button
            onClick={() => send('Explain the calculation result in plain English')}
            className="w-full text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg px-3 py-1.5 mb-2 text-left transition-colors"
          >
            ✦ Explain this result
          </button>
        )}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-400 focus-within:bg-white transition-colors">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Describe a circuit or ask a BS7671 question…"
            disabled={streaming}
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className={clsx(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0',
              input.trim() && !streaming
                ? 'bg-blue-700 text-white hover:bg-blue-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed',
            )}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-gray-300 text-center mt-1.5">Claude · for local dev only</p>
      </div>
    </div>
  )
}
