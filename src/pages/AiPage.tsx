import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AiChatPanel from '../components/AiAssistant/AiChatPanel'
import { usePendingActionStore } from '../store/pendingActionStore'
import type { FillAction } from '../lib/claude'

export default function AiPage() {
  const navigate  = useNavigate()
  const setAction = usePendingActionStore(s => s.setAction)

  // On mobile the browser may scroll the body when the textarea is focused
  // (keyboard opens), shifting .ai-page upward.  We snap scroll back to 0
  // on every visual-viewport resize (covers both open and close).
  useEffect(() => {
    window.scrollTo(0, 0)
    const vvp = window.visualViewport
    if (!vvp) return
    const onResize = () => window.scrollTo(0, 0)
    vvp.addEventListener('resize', onResize)
    return () => vvp.removeEventListener('resize', onResize)
  }, [])

  function handleFillAction(action: FillAction) {
    setAction(action)
    navigate('/calculator')
  }

  return (
    <div className="ai-page">
      <AiChatPanel currentResult={null} onFillAction={handleFillAction} />
    </div>
  )
}
