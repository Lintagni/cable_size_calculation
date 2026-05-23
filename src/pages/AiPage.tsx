import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AiChatPanel from '../components/AiAssistant/AiChatPanel'
import { usePendingActionStore } from '../store/pendingActionStore'
import type { FillAction } from '../lib/claude'

export default function AiPage() {
  const navigate  = useNavigate()
  const setAction = usePendingActionStore(s => s.setAction)

  // On mobile, the browser scrolls the <body> when the keyboard opens to try
  // to bring the focused textarea into view.  That shifts .ai-page (which is
  // in normal flow) upward, making the input bar disappear behind the keyboard.
  // Locking overflow on <html> and <body> prevents that scroll entirely;
  // 100dvh in the CSS handles the keyboard height change natively.
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    window.scrollTo(0, 0)
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
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
