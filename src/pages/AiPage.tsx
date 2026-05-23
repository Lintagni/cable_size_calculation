import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AiChatPanel from '../components/AiAssistant/AiChatPanel'
import { usePendingActionStore } from '../store/pendingActionStore'
import type { FillAction } from '../lib/claude'

export default function AiPage() {
  const navigate  = useNavigate()
  const setAction = usePendingActionStore(s => s.setAction)

  // On mobile, CSS dvh/vh are unreliable across browsers (Samsung, Firefox,
  // older Chrome) and don't consistently account for the soft keyboard.
  // We use visualViewport.height — the only API that reliably reports the
  // visible area minus keyboard on both Android and iOS — and set .ai-page
  // height directly in JS. This also prevents body scroll shifts.
  useEffect(() => {
    const page = document.querySelector<HTMLElement>('.ai-page')
    if (!page) return

    const applyHeight = () => {
      if (window.innerWidth > 720) { page.style.height = ''; return }
      const vvpH  = window.visualViewport?.height ?? window.innerHeight
      const topH  = document.querySelector<HTMLElement>('.topbar')?.offsetHeight ?? 56
      page.style.height = `${vvpH - topH - 76}px`
      window.scrollTo(0, 0)
    }

    applyHeight()
    const vvp = window.visualViewport
    vvp?.addEventListener('resize',  applyHeight)
    vvp?.addEventListener('scroll',  applyHeight)
    window.addEventListener('resize', applyHeight)

    return () => {
      page.style.height = ''
      vvp?.removeEventListener('resize',  applyHeight)
      vvp?.removeEventListener('scroll',  applyHeight)
      window.removeEventListener('resize', applyHeight)
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
