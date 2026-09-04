import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Link2, Check } from 'lucide-react'
import { shareUrl } from '../../lib/shareLink'
import type { LvCableInput } from '../../calculators/lvCableSizing'

/**
 * Copies a link that reopens this exact calculation.
 *
 * Falls back to a visible text input when the clipboard API is unavailable
 * (older browsers, and any non-secure origin) so the link is still gettable.
 */
export default function ShareButton({ input, className }: { input: LvCableInput; className?: string }) {
  const { pathname } = useLocation()
  const [copied, setCopied] = useState(false)
  const [fallback, setFallback] = useState<string | null>(null)

  async function copy() {
    const url = shareUrl(pathname, input)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setFallback(url)
    }
  }

  if (fallback) {
    return (
      <input
        className="cc-input"
        readOnly
        value={fallback}
        onFocus={e => e.currentTarget.select()}
        style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={className ?? 'btn btn-sm'}
      title="Copy a link that reopens this calculation"
    >
      {copied ? <Check size={13} /> : <Link2 size={13} />}
      {copied ? 'Link copied' : 'Copy link'}
    </button>
  )
}
