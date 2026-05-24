import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download, Plus, Search, ChevronRight, Trash2, Sparkles, MessageSquare, Calculator } from 'lucide-react'
import { useHistoryStore, type HistoryEntry, type CalcType } from '../store/historyStore'
import { useSavedChatStore, type SavedChat } from '../store/savedChatStore'
import { useAiChatStore } from '../store/aiChatStore'

// ── Type metadata ──────────────────────────────────────────────────────────────
const TYPE_META: Record<CalcType, { label: string; color: string }> = {
  lv:     { label: 'LV Cable',     color: 'var(--accent)' },
  vdrop:  { label: 'Voltage Drop', color: '#f59e0b' },
  sc:     { label: 'Short Circuit',color: '#ef4444' },
  motor:  { label: 'Motor',        color: '#22c55e' },
  abc:    { label: 'ABC Cable',    color: '#a78bfa' },
  busbar: { label: 'Busbar',       color: '#06b6d4' },
}

const FILTER_TYPES: { key: CalcType | 'all'; label: string }[] = [
  { key: 'all',    label: 'All' },
  { key: 'lv',     label: 'LV Cable' },
  { key: 'motor',  label: 'Motor' },
  { key: 'vdrop',  label: 'Voltage drop' },
  { key: 'sc',     label: 'Short circuit' },
  { key: 'abc',    label: 'ABC Cable' },
  { key: 'busbar', label: 'Busbar' },
]

function timeAgo(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 1000)
  if (d < 60)    return 'just now'
  if (d < 3600)  return `${Math.floor(d / 60)} min ago`
  if (d < 86400) return `${Math.floor(d / 3600)} hr ago`
  if (d < 86400 * 2) return 'yesterday'
  return new Date(ts).toLocaleDateString()
}

function parseCable(entry: HistoryEntry): string {
  // Extract cable description from summary e.g. "16mm² XLPE · 45A · Method C"
  const parts = entry.summary.split('·')
  return parts[0]?.trim() ?? '—'
}

function parseCompliant(entry: HistoryEntry): boolean | null {
  const r = entry.result as any
  if (r?.results?.compliant !== undefined) return r.results.compliant as boolean
  if (r?.compliant !== undefined) return r.compliant as boolean
  return null
}

// ── Row component ──────────────────────────────────────────────────────────────
function HistoryRow({ entry, onRestore, onRemove }: {
  entry: HistoryEntry
  onRestore: (e: HistoryEntry) => void
  onRemove: (id: string) => void
}) {
  const meta   = TYPE_META[entry.type]
  const cable  = parseCable(entry)
  const ib     = (entry.inputs.designCurrent as number | undefined)
  const vd     = (entry.result as any)?.results?.voltageDropPct as number | undefined
  const compliant = parseCompliant(entry)
  const desc   = (entry.inputs.description as string) || '—'
  const origin = (entry.inputs.origin as string) || ''

  return (
    <div
      style={{
        display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.5fr 1fr 1fr auto',
        alignItems: 'center', gap: 0,
        borderBottom: '1px solid var(--line)',
        cursor: 'pointer',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
      onClick={() => onRestore(entry)}
    >
      {/* Project · Circuit */}
      <div style={{ padding: '14px 20px', minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {desc !== '—' ? desc : entry.summary.split('·')[0]?.trim()}
        </div>
        {(origin) && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {origin}
          </div>
        )}
      </div>

      {/* Type badge */}
      <div style={{ padding: '14px 16px' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: meta.color, background: `color-mix(in oklch, ${meta.color} 12%, transparent)`,
          border: `1px solid color-mix(in oklch, ${meta.color} 30%, transparent)`,
          borderRadius: 4, padding: '2px 6px',
        }}>
          {meta.label}
        </span>
      </div>

      {/* Cable */}
      <div style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-2)' }}>
        {cable}
      </div>

      {/* Ib / VD */}
      <div style={{ padding: '14px 16px' }}>
        {ib !== undefined && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)' }}>
            {ib} A
          </div>
        )}
        {vd !== undefined && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
            {vd.toFixed(2)}%
          </div>
        )}
        {ib === undefined && <span style={{ color: 'var(--ink-4)' }}>—</span>}
      </div>

      {/* Status */}
      <div style={{ padding: '14px 16px' }}>
        {compliant !== null ? (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: compliant ? 'var(--ok)' : 'var(--fail)',
            background: compliant ? 'color-mix(in oklch, var(--ok) 10%, transparent)' : 'color-mix(in oklch, var(--fail) 10%, transparent)',
            border: `1px solid color-mix(in oklch, ${compliant ? 'var(--ok)' : 'var(--fail)'} 25%, transparent)`,
            borderRadius: 20, padding: '2px 8px',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: compliant ? 'var(--ok)' : 'var(--fail)', display: 'inline-block' }} />
            {compliant ? 'Compliant' : 'Fail'}
          </span>
        ) : (
          <span style={{ color: 'var(--ink-4)', fontSize: 13 }}>—</span>
        )}
      </div>

      {/* Updated + remove */}
      <div style={{ padding: '14px 16px 14px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
          {timeAgo(entry.timestamp)}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onRemove(entry.id) }}
          style={{ color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', lineHeight: 1 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--fail)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-4)')}
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
        <ChevronRight size={14} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
      </div>
    </div>
  )
}

// ── Chat history row ───────────────────────────────────────────────────────────
function ChatRow({ chat, onResume, onRemove }: {
  chat: SavedChat
  onResume: (c: SavedChat) => void
  onRemove: (id: string) => void
}) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px 12px 20px',
        borderBottom: '1px solid var(--line)',
        cursor: 'pointer', transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
      onClick={() => onResume(chat)}
    >
      {/* Icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', flexShrink: 0,
        background: 'color-mix(in oklch, var(--accent) 12%, transparent)',
        border: '1px solid var(--accent-line)',
      }}>
        <Sparkles size={14} style={{ color: 'var(--accent-ink)' }} />
      </div>

      {/* Title + meta — takes all remaining space */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {chat.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--accent-ink)', background: 'var(--accent-soft)',
            border: '1px solid var(--accent-line)', borderRadius: 3, padding: '1px 5px',
          }}>
            AI Chat
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>
            {chat.turnCount}Q · {chat.messages.length} msgs · {timeAgo(chat.timestamp)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); onRemove(chat.id) }}
          style={{ color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', lineHeight: 1 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--fail)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-4)')}
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
        <ChevronRight size={14} style={{ color: 'var(--ink-4)' }} />
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { entries, remove, clear } = useHistoryStore()
  const { chats, remove: removeChat, clear: clearChats } = useSavedChatStore()

  const [tab, setTab]         = useState<'calc' | 'ai'>('calc')
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<CalcType | 'all'>('all')

  function handleResumeChat(chat: SavedChat) {
    const store = useAiChatStore.getState()
    store.setMessages(chat.messages)
    store.setMsgModels(() => chat.msgModels)
    navigate('/ai')
  }

  const filtered = useMemo(() => {
    let list = entries
    if (filter !== 'all') list = list.filter(e => e.type === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.summary.toLowerCase().includes(q) ||
        String(e.inputs.description ?? '').toLowerCase().includes(q) ||
        String(e.inputs.origin ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [entries, search, filter])

  function handleRestore(entry: HistoryEntry) {
    sessionStorage.setItem('restoreCalc', JSON.stringify({ type: entry.type, inputs: entry.inputs }))
    navigate('/calculator')
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg)', paddingBottom: 64 }}>
      <div className="container" style={{ paddingTop: 40 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 1, background: 'var(--ink-4)', display: 'inline-block' }} />
              Workspace
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>History</h1>
            <p style={{ color: 'var(--ink-3)', marginTop: 8, fontSize: 14 }}>
              {entries.length} calculation{entries.length !== 1 ? 's' : ''} · {chats.length} saved chat{chats.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {tab === 'calc' ? (
              <>
                <button className="btn" style={{ gap: 6 }} onClick={() => alert('PDF export coming soon')}>
                  <Download size={14} /> Export all
                </button>
                <Link to="/calculator" className="btn btn-accent btn-lg" style={{ gap: 6 }}>
                  <Plus size={14} /> New calculation
                </Link>
              </>
            ) : (
              <Link to="/ai" className="btn btn-accent btn-lg" style={{ gap: 6 }}>
                <Sparkles size={14} /> New chat
              </Link>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 4, width: 'fit-content' }}>
          {([
            { key: 'calc', label: 'Calculations', Icon: Calculator },
            { key: 'ai',   label: 'AI Chats',     Icon: MessageSquare },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 6,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: tab === t.key ? 'var(--surface)' : 'transparent',
                color: tab === t.key ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: tab === t.key ? 'var(--shadow-card)' : 'none',
              }}
            >
              <t.Icon size={14} />
              {t.label}
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                padding: '1px 5px', borderRadius: 4,
                background: tab === t.key ? 'var(--accent-soft)' : 'var(--line)',
                color: tab === t.key ? 'var(--accent-ink)' : 'var(--ink-4)',
              }}>
                {t.key === 'calc' ? entries.length : chats.length}
              </span>
            </button>
          ))}
        </div>

        {/* ── Calculations tab ── */}
        {tab === 'calc' && (
          <>
            {/* Search + filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{
                flex: 1, minWidth: 260, display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)',
                padding: '0 14px',
              }}>
                <Search size={14} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search project, circuit, designer…"
                  style={{
                    background: 'none', border: 'none', outline: 'none',
                    fontSize: 13, color: 'var(--ink)', width: '100%', padding: '10px 0',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FILTER_TYPES.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                      fontSize: 12, fontWeight: 500, padding: '6px 12px',
                      borderRadius: 'var(--r)', border: '1px solid',
                      cursor: 'pointer', transition: 'all 0.12s',
                      borderColor: filter === f.key ? 'var(--accent)' : 'var(--line)',
                      background: filter === f.key ? 'var(--accent-soft)' : 'var(--surface)',
                      color: filter === f.key ? 'var(--accent-ink)' : 'var(--ink-3)',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
                {entries.length > 0 && (
                  <button
                    onClick={() => { if (confirm('Clear all history?')) clear() }}
                    style={{ fontSize: 12, padding: '6px 12px', borderRadius: 'var(--r)', border: '1px solid var(--line)', background: 'none', color: 'var(--fail)', cursor: 'pointer' }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.5fr 1fr 1fr auto', borderBottom: '1px solid var(--line)' }}>
                {['Project · Circuit', 'Type', 'Cable', 'Ib / VD', 'Status', 'Updated'].map((h, i) => (
                  <div key={h} style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, paddingLeft: i === 0 ? 20 : 16 }}>
                    {h}
                  </div>
                ))}
              </div>
              {filtered.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 12 }}>
                    {entries.length === 0 ? 'No calculations yet — run one in the calculator.' : 'No results match your search.'}
                  </div>
                  {entries.length === 0 && <Link to="/calculator" className="btn btn-accent">Open calculator</Link>}
                </div>
              ) : (
                filtered.map(entry => (
                  <HistoryRow key={entry.id} entry={entry} onRestore={handleRestore} onRemove={remove} />
                ))
              )}
            </div>
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-4)' }}>
              {filtered.length} of {entries.length} entries · stored in browser
            </p>
          </>
        )}

        {/* ── AI Chats tab ── */}
        {tab === 'ai' && (
          <>
            {chats.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button
                  onClick={() => { if (confirm('Delete all saved chats?')) clearChats() }}
                  style={{ fontSize: 12, padding: '6px 12px', borderRadius: 'var(--r)', border: '1px solid var(--line)', background: 'none', color: 'var(--fail)', cursor: 'pointer' }}
                >
                  Clear all
                </button>
              </div>
            )}

            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
              {chats.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                    <Sparkles size={20} style={{ color: 'var(--ink-4)' }} />
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 12 }}>
                    No saved chats yet — use the <strong>Save</strong> button in the AI chat bar to save a conversation.
                  </div>
                  <Link to="/ai" className="btn btn-accent" style={{ gap: 6 }}>
                    <Sparkles size={14} /> Open AI chat
                  </Link>
                </div>
              ) : (
                chats.map(chat => (
                  <ChatRow key={chat.id} chat={chat} onResume={handleResumeChat} onRemove={removeChat} />
                ))
              )}
            </div>
            {chats.length > 0 && (
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-4)' }}>
                {chats.length} saved chat{chats.length !== 1 ? 's' : ''} · click any row to resume · stored in browser
              </p>
            )}
          </>
        )}

      </div>
    </div>
  )
}
