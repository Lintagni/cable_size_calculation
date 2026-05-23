import { useState } from 'react'
import { MessageSquarePlus, X, Star, Send, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

type Category = 'rate' | 'error' | 'bug' | 'calculation' | 'feature'

const CATEGORIES: { id: Category; label: string; emoji: string; placeholder: string }[] = [
  { id: 'rate',        label: 'Rate App',          emoji: '⭐', placeholder: '' },
  { id: 'error',       label: 'Error',             emoji: '⚠️', placeholder: 'Describe the error you encountered…' },
  { id: 'bug',         label: 'Bug',               emoji: '🐛', placeholder: 'What did you do, and what went wrong?' },
  { id: 'calculation', label: 'Calc Error',        emoji: '🧮', placeholder: 'Which calculation and what result seemed wrong?' },
  { id: 'feature',     label: 'New Feature',       emoji: '💡', placeholder: 'Describe the feature you would like to see…' },
]

export default function FeedbackWidget() {
  const { user } = useAuthStore()
  const [open,    setOpen]    = useState(false)
  const [category,setCategory]= useState<Category>('rate')
  const [rating,  setRating]  = useState(0)
  const [hover,   setHover]   = useState(0)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [done,    setDone]    = useState(false)

  function reset() {
    setCategory('rate'); setRating(0); setHover(0); setMessage(''); setDone(false)
  }
  function handleOpen()  { reset(); setOpen(true) }
  function handleClose() { setOpen(false); setTimeout(reset, 300) }

  async function handleSubmit() {
    if (category === 'rate' && rating === 0) return
    if (category !== 'rate' && !message.trim()) return
    setSending(true)
    try {
      await supabase.from('feedback').insert({
        category,
        rating:     category === 'rate' ? rating : null,
        message:    message.trim() || null,
        user_id:    user?.id    ?? null,
        user_email: user?.email ?? null,
        page:       window.location.pathname,
      })
      setDone(true)
      setTimeout(handleClose, 1800)
    } catch { /* swallow */ }
    setSending(false)
  }

  const cat       = CATEGORIES.find(c => c.id === category)!
  const canSubmit = category === 'rate' ? rating > 0 : message.trim().length > 0

  return (
    <>
      {/* FAB trigger */}
      <button
        onClick={handleOpen}
        title="Send feedback"
        className="feedback-fab"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          width: 48, height: 48, borderRadius: '50%', border: 'none',
          background: 'var(--accent)', color: 'var(--accent-fg)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.35)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)' }}
      >
        <MessageSquarePlus size={20} />
      </button>

      {/* Panel */}
      {open && (
        <div className="feedback-overlay">
          <div className="feedback-backdrop" onClick={handleClose} />

          <div className="feedback-panel">

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Send Feedback</div>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'grid', placeItems: 'center', padding: 4, borderRadius: 6 }}>
                <X size={14} />
              </button>
            </div>

            {done ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <CheckCircle2 size={36} style={{ color: 'var(--ok)', marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Thank you!</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Your feedback helps improve CableCalc.</div>
              </div>
            ) : (
              <div className="feedback-body">

                {/* ── Desktop: left sidebar ── Mobile: top pill row ── */}
                <div className="feedback-categories">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={`feedback-cat-btn${category === c.id ? ' active' : ''}`}
                    >
                      <span>{c.emoji}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>

                {/* ── Right / bottom: input area ── */}
                <div className="feedback-input-area">
                  {category === 'rate' ? (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>How would you rate CableCalc?</div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                        {[1,2,3,4,5].map(n => (
                          <button
                            key={n}
                            onClick={() => setRating(n)}
                            onMouseEnter={() => setHover(n)}
                            onMouseLeave={() => setHover(0)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                              color: n <= (hover || rating) ? '#f59e0b' : 'var(--line)',
                              transition: 'color 0.1s, transform 0.1s',
                              transform: n <= (hover || rating) ? 'scale(1.2)' : 'scale(1)',
                            }}
                          >
                            <Star size={28} fill={n <= (hover || rating) ? '#f59e0b' : 'none'} />
                          </button>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 10 }}>
                        {rating === 0 ? 'Select a rating' : ['','Poor','Fair','Good','Very good','Excellent'][rating]}
                      </div>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Leave a comment (optional)…"
                        rows={2}
                        style={{
                          width: '100%', boxSizing: 'border-box', resize: 'none',
                          background: 'var(--surface-2)', border: '1px solid var(--line)',
                          borderRadius: 8, padding: '8px 10px', color: 'var(--ink)',
                          fontSize: 13, outline: 'none', fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>
                        {cat.emoji} {cat.label}
                      </div>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder={cat.placeholder}
                        className="feedback-textarea"
                        style={{
                          flex: 1, width: '100%', boxSizing: 'border-box', resize: 'none',
                          background: 'var(--surface-2)', border: '1px solid var(--line)',
                          borderRadius: 8, padding: '10px 12px', color: 'var(--ink)',
                          fontSize: 13, outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                        }}
                      />
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || sending}
                    style={{
                      width: '100%', padding: '11px', borderRadius: 8, border: 'none',
                      background: canSubmit ? 'var(--accent)' : 'var(--surface-2)',
                      color: canSubmit ? 'var(--accent-fg)' : 'var(--ink-4)',
                      fontSize: 13, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      transition: 'all 0.15s', flexShrink: 0,
                    }}
                  >
                    <Send size={13} />
                    {sending ? 'Sending…' : 'Submit Feedback'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
