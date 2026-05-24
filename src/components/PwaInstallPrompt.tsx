import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed]       = useState(() => localStorage.getItem('pwa-prompt-dismissed') === '1')
  const [installed, setInstalled]       = useState(false)

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setInstallEvent(null)
  }

  function handleDismiss() {
    setDismissed(true)
    localStorage.setItem('pwa-prompt-dismissed', '1')
  }

  // Don't show if: already installed, user dismissed, or no install event
  if (installed || dismissed || !installEvent) return null

  return (
    <div style={{
      position: 'fixed', bottom: 88, left: 12, right: 12, zIndex: 70,
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-lg)', padding: '12px 14px',
      boxShadow: 'var(--shadow-pop)',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'fade-in 0.25s ease-out both',
    }}>
      {/* Icon */}
      <img src="/pwa-64x64.png" alt="CableCalc" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
          Install CableCalc
        </p>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
          Add to home screen for quick access
        </p>
      </div>

      {/* Install button */}
      <button
        onClick={handleInstall}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 12px', borderRadius: 'var(--r)',
          background: 'var(--ink)', color: 'var(--bg)',
          border: 'none', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        <Download size={13} /> Install
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        style={{
          width: 26, height: 26, borderRadius: 6, border: 'none',
          background: 'var(--surface-2)', color: 'var(--ink-3)',
          display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  )
}
