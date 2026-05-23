import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AiChatPanel from '../components/AiAssistant/AiChatPanel'
import { usePendingActionStore } from '../store/pendingActionStore'
import type { FillAction } from '../lib/claude'

export default function AiPage() {
  const navigate  = useNavigate()
  const setAction = usePendingActionStore(s => s.setAction)

  // On mobile the body has padding-bottom:76px (mobile nav clearance) which
  // makes it 76px taller than the viewport → page scrolls into the padding.
  // Also, CSS dvh/vh are inaccurate on Samsung Browser, Firefox, older Chrome
  // and don't account for the soft keyboard on iOS Safari.
  // Fix: lock body scroll + set .ai-page height from visualViewport.height
  // (the only API that reliably reflects keyboard state on all browsers).
  useEffect(() => {
    if (window.innerWidth > 720) return   // desktop: CSS handles it

    const html  = document.documentElement
    const body  = document.body
    const page  = document.querySelector<HTMLElement>('.ai-page')

    // Lock body scroll so the 76px body padding can't be scrolled into
    const prevHtmlOv = html.style.overflow
    const prevBodyOv = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    const applyHeight = () => {
      if (!page) return
      const vvpH = window.visualViewport?.height ?? window.innerHeight
      const topH  = document.querySelector<HTMLElement>('.topbar')?.offsetHeight ?? 56
      // Fill from below the topbar to the top of the mobile nav (76px clearance)
      page.style.height = `${vvpH - topH - 76}px`
    }

    applyHeight()
    const vvp = window.visualViewport
    vvp?.addEventListener('resize',  applyHeight)
    vvp?.addEventListener('scroll',  applyHeight)

    return () => {
      html.style.overflow = prevHtmlOv
      body.style.overflow = prevBodyOv
      if (page) page.style.height = ''
      vvp?.removeEventListener('resize',  applyHeight)
      vvp?.removeEventListener('scroll',  applyHeight)
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
