import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import AiChatPanel from '../components/AiAssistant/AiChatPanel'
import { usePendingActionStore } from '../store/pendingActionStore'
import type { FillAction } from '../lib/claude'

export default function AiPage() {
  const navigate = useNavigate()
  const setAction = usePendingActionStore(s => s.setAction)

  function handleFillAction(action: FillAction) {
    setAction(action)
    navigate('/calculator')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      <div className="calc-head" style={{ flexShrink: 0 }}>
        <div className="container">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span style={{ color: 'var(--ink-4)', margin: '0 4px' }}>›</span>
            <span className="cur">AI Assistant</span>
          </div>
          <div className="calc-head-row">
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={22} style={{ color: 'var(--accent)' }} />
                AI Assistant
              </h1>
              <p>Describe a circuit in plain language — AI fills the right calculator automatically.</p>
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AiChatPanel currentResult={null} onFillAction={handleFillAction} />
      </div>
    </div>
  )
}
