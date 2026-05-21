import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { useAiComplete } from '../../lib/useAiComplete'
import { usePlanStore } from '../../store/planStore'
import type { LvCableResult } from '../../calculators/lvCableSizing'
import MarkdownMessage from './MarkdownMessage'

interface Props {
  result: LvCableResult
}

export default function ResultExplainer({ result }: Props) {
  const { plan } = usePlanStore()
  const isPro = plan === 'pro'
  const [open, setOpen] = useState(false)
  const { streaming, response, error, complete } = useAiComplete(result)

  async function handleExplain() {
    if (open && response) { setOpen(false); return }
    setOpen(true)
    if (!response && !streaming) {
      await complete('Explain this cable sizing result in plain English. Reference the relevant BS7671 regulation numbers. Keep it concise — 3-5 bullet points.')
    }
  }

  if (!isPro) return null

  return (
    <div className="mt-3">
      <button
        onClick={handleExplain}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-medium text-blue-700 dark:text-blue-400 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          {open && response ? 'Hide explanation' : 'Explain this result (AI)'}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="mt-2 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3">
          <MarkdownMessage
            content={response.replace(/```json[\s\S]*?```/g, '').trim()}
            streaming={streaming && !response}
          />
          {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}
        </div>
      )}
    </div>
  )
}
