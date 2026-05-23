import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AiChatPanel from '../components/AiAssistant/AiChatPanel'
import { usePendingActionStore } from '../store/pendingActionStore'
import type { FillAction } from '../lib/claude'

export default function AiPage() {
  const navigate  = useNavigate()
  const setAction = usePendingActionStore(s => s.setAction)

  // Prevent body from scrolling while on the AI page.
  // The topbar is sticky (60px desktop / 56px mobile) and the mobile nav
  // adds padding-bottom: 76px — both cause the body to overflow without this.
  useEffect(() => {
    const prev = document.body.style.overflow
    const prevPad = document.body.style.paddingBottom
    document.body.style.overflow = 'hidden'
    document.body.style.paddingBottom = '0'
    return () => {
      document.body.style.overflow = prev
      document.body.style.paddingBottom = prevPad
    }
  }, [])

  function handleFillAction(action: FillAction) {
    setAction(action)
    navigate('/calculator')
  }

  return (
    // 60px = desktop topbar height (56px on mobile — the 4px gap is fine)
    <div style={{ height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      <AiChatPanel currentResult={null} onFillAction={handleFillAction} />
    </div>
  )
}
