import { useEffect } from 'react'
import AiChatPanel from '../components/AiAssistant/AiChatPanel'
import AiErrorBoundary from '../components/AiAssistant/AiErrorBoundary'

export default function AiPage() {

  // On mobile, .ai-page uses position:fixed (top:56px, bottom:76px via CSS).
  // We only need JS to:
  //  1. Lock body scroll so the 76px padding-bottom can't be scrolled into
  //  2. Raise the page bottom when the soft keyboard opens so the input
  //     stays visible above the keyboard (visualViewport shrinks on keyboard open)
  useEffect(() => {
    if (window.innerWidth > 720) return   // desktop: CSS handles it

    const html = document.documentElement
    const body = document.body
    const page = document.querySelector<HTMLElement>('.ai-page')

    const prevHtmlOv = html.style.overflow
    const prevBodyOv = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    const onViewportChange = () => {
      if (!page) return
      const vvp = window.visualViewport
      if (!vvp) return
      // How much of the screen the keyboard occupies
      const keyboardH = Math.max(0, window.innerHeight - vvp.height - vvp.offsetTop)
      // When keyboard is open, pin page bottom to the keyboard top.
      // When keyboard is closed, restore CSS value (76px above nav).
      page.style.bottom = keyboardH > 100 ? `${keyboardH}px` : ''
      // Scroll any focused input into view after the layout has updated
      if (keyboardH > 100) {
        const el = document.activeElement
        if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
          requestAnimationFrame(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          })
        }
      }
    }

    const vvp = window.visualViewport
    vvp?.addEventListener('resize', onViewportChange)
    vvp?.addEventListener('scroll', onViewportChange)

    return () => {
      html.style.overflow = prevHtmlOv
      body.style.overflow = prevBodyOv
      if (page) page.style.bottom = ''
      vvp?.removeEventListener('resize', onViewportChange)
      vvp?.removeEventListener('scroll', onViewportChange)
    }
  }, [])

  return (
    <div className="ai-page">
      <AiErrorBoundary>
        <AiChatPanel currentResult={null} />
      </AiErrorBoundary>
    </div>
  )
}
