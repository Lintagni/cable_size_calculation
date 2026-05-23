import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AiChatPanel from '../components/AiAssistant/AiChatPanel'
import { usePendingActionStore } from '../store/pendingActionStore'
import type { FillAction } from '../lib/claude'

export default function AiPage() {
  const navigate  = useNavigate()
  const setAction = usePendingActionStore(s => s.setAction)

  // On mobile, the browser can scroll the page programmatically when the
  // keyboard opens (to bring the focused textarea into view).  When the
  // keyboard closes the browser does NOT always restore scroll, leaving the
  // layout "stuck" shifted up.  We listen to visualViewport resize events:
  // when the viewport grows back to full height (keyboard dismissed) we
  // reset the scroll to 0 so the layout snaps back.
  useEffect(() => {
    const vvp = window.visualViewport
    if (!vvp) return
    const onResize = () => {
      // keyboard closed = viewport height ≈ window.innerHeight
      if (vvp.height > window.innerHeight * 0.75) {
        window.scrollTo(0, 0)
      }
    }
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
