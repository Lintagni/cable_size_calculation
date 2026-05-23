import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, UserPlus, Trash2, X, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

interface Profile {
  id: string
  email: string
  plan: 'free' | 'pro' | 'business'
  credits_used: number
  created_at: string
}

const ADMIN_EMAILS = ['gweerasinghe67@gmail.com', 'cryptopal95@gmail.com']

const PLAN_COLORS = {
  free:     { color: 'var(--ink-3)',     bg: 'var(--surface-2)',                                      border: 'var(--line)' },
  pro:      { color: 'var(--accent-ink)',bg: 'var(--accent-soft)',                                    border: 'var(--accent-line)' },
  business: { color: 'var(--ok)',        bg: 'color-mix(in oklch, var(--ok) 12%, transparent)',        border: 'color-mix(in oklch, var(--ok) 25%, transparent)' },
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '20px 24px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: color ?? 'var(--ink)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

// ── Plan bar ──────────────────────────────────────────────────────────────────
function PlanBar({ plan, count, total }: { plan: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  const colors: Record<string, string> = { free: 'var(--ink-3)', pro: 'var(--accent)', business: 'var(--ok)' }
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--ink)', textTransform: 'capitalize', fontWeight: 600 }}>{plan}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)' }}>{count} ({pct.toFixed(0)}%)</span>
      </div>
      <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: colors[plan] ?? 'var(--ink-3)', borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// ── Signup chart ──────────────────────────────────────────────────────────────
function SignupChart({ profiles }: { profiles: Profile[] }) {
  const days = 14
  const now = Date.now()
  const buckets: number[] = Array(days).fill(0)
  profiles.forEach(p => {
    const age = Math.floor((now - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24))
    if (age < days) buckets[days - 1 - age]++
  })
  const max = Math.max(...buckets, 1)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
        {buckets.map((v, i) => (
          <div key={i} title={`${v} signups`} style={{
            flex: 1, borderRadius: '2px 2px 0 0',
            background: v > 0 ? 'var(--accent)' : 'var(--line)',
            height: `${(v / max) * 100}%`, minHeight: 2, opacity: v > 0 ? 1 : 0.4,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>14d ago</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>today</span>
      </div>
    </div>
  )
}

// ── Add User Modal ─────────────────────────────────────────────────────────────
function AddUserModal({ onClose, onCreated, session }: {
  onClose: () => void
  onCreated: () => void
  session: string
}) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [plan,     setPlan]     = useState<'free' | 'pro' | 'business'>('free')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` },
        body: JSON.stringify({ email, password, plan }),
      })
      const data = await res.json() as { success?: boolean; error?: string; warning?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to create user')
      // Small delay then refresh so the new row is visible
      await new Promise(r => setTimeout(r, 600))
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--surface-2)', border: '1px solid var(--line)',
    borderRadius: 8, color: 'var(--ink)', fontSize: 13, padding: '9px 12px', outline: 'none',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.35)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Add New User</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'grid', placeItems: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="user@example.com" style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Password</label>
            <input type="text" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" minLength={6} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Plan</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['free', 'pro', 'business'] as const).map(p => (
                <button
                  key={p} type="button" onClick={() => setPlan(p)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8, border: '1px solid',
                    cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'capitalize', transition: 'all 0.12s',
                    borderColor: plan === p ? PLAN_COLORS[p].border : 'var(--line)',
                    background:  plan === p ? PLAN_COLORS[p].bg    : 'var(--surface-2)',
                    color:       plan === p ? PLAN_COLORS[p].color : 'var(--ink-3)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'var(--fail)', padding: '8px 12px', borderRadius: 8, background: 'color-mix(in oklch, var(--fail) 8%, transparent)', border: '1px solid color-mix(in oklch, var(--fail) 25%, transparent)' }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              padding: '10px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'var(--surface-2)' : 'var(--accent)', color: loading ? 'var(--ink-4)' : 'var(--accent-fg)',
              fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Admin() {
  const { user, session, initialised } = useAuthStore()
  const navigate = useNavigate()
  const [profiles,   setProfiles]   = useState<Profile[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [promoting,  setPromoting]  = useState<string | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)
  const [showAddUser,setShowAddUser] = useState(false)

  useEffect(() => {
    if (!initialised) return
    if (!user) { navigate('/'); return }
    if (!ADMIN_EMAILS.includes(user.email ?? '')) { navigate('/'); return }
    loadProfiles()
  }, [initialised, user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProfiles() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, plan, credits_used, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) { setError(error.message); setLoading(false); return }
    setProfiles((data ?? []) as Profile[])
    setLoading(false)
  }

  async function setPlan(userId: string, plan: 'free' | 'pro' | 'business') {
    setPromoting(userId)
    await supabase.from('profiles').update({ plan }).eq('id', userId)
    await loadProfiles()
    setPromoting(null)
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete user "${email}"? This cannot be undone.`)) return
    setDeleting(userId)
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Delete failed')
      await loadProfiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
    setDeleting(null)
  }

  const total       = profiles.length
  const byPlan      = { free: 0, pro: 0, business: 0 }
  let totalCredits  = 0
  profiles.forEach(p => { byPlan[p.plan]++; totalCredits += p.credits_used ?? 0 })
  const todaySignups = profiles.filter(p =>
    (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24) < 1
  ).length

  if (!initialised) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'grid', placeItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-4)' }}>Checking access…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg)', paddingBottom: 64 }}>
      <div className="container" style={{ paddingTop: 40 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 1, background: 'var(--ink-4)', display: 'inline-block' }} />
              Admin
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)' }}>Dashboard</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={() => setShowAddUser(true)} style={{ gap: 6 }}>
              <UserPlus size={13} /> Add User
            </button>
            <button className="btn" onClick={loadProfiles} style={{ gap: 6 }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: 'color-mix(in oklch, var(--fail) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--fail) 30%, transparent)', borderRadius: 'var(--r)', padding: '12px 16px', color: 'var(--fail)', fontSize: 13, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {error}
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fail)' }}><X size={14} /></button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-3)', padding: 60 }}>Loading…</div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
              <StatCard label="Total Users"     value={total}           sub={`+${todaySignups} today`} />
              <StatCard label="Pro Users"       value={byPlan.pro}      sub={`${total > 0 ? ((byPlan.pro / total) * 100).toFixed(0) : 0}% of total`} color="var(--accent)" />
              <StatCard label="Business Users"  value={byPlan.business} sub="Top tier" color="var(--ok)" />
              <StatCard label="AI Credits Used" value={totalCredits.toLocaleString()} sub="All users combined" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '20px 24px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Plan Distribution</div>
                <PlanBar plan="free"     count={byPlan.free}     total={total} />
                <PlanBar plan="pro"      count={byPlan.pro}      total={total} />
                <PlanBar plan="business" count={byPlan.business} total={total} />
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '20px 24px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Signups — last 14 days</div>
                <SignupChart profiles={profiles} />
              </div>
            </div>

            {/* Users table */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Users ({total})</span>
                <button className="btn btn-sm" onClick={() => setShowAddUser(true)} style={{ gap: 5 }}>
                  <UserPlus size={11} /> Add
                </button>
              </div>

              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 2fr 36px', borderBottom: '1px solid var(--line)' }}>
                {['Email', 'Plan', 'AI Credits', 'Joined', 'Change Plan', ''].map(h => (
                  <div key={h} style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
                ))}
              </div>

              {profiles.slice(0, 50).map(p => {
                const pc = PLAN_COLORS[p.plan]
                const isDeleting = deleting === p.id
                const isPromoting = promoting === p.id
                return (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 2fr 36px', borderBottom: '1px solid var(--line)', alignItems: 'center', opacity: isDeleting ? 0.4 : 1, transition: 'opacity 0.2s' }}>

                    <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.email}
                      {ADMIN_EMAILS.includes(p.email) && (
                        <span style={{ marginLeft: 6, fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--ok)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'color-mix(in oklch, var(--ok) 12%, transparent)', border: '1px solid color-mix(in oklch, var(--ok) 25%, transparent)', borderRadius: 3, padding: '1px 5px' }}>Admin</span>
                      )}
                    </div>

                    <div style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 4, padding: '2px 6px', color: pc.color, background: pc.bg, border: `1px solid ${pc.border}` }}>
                        {p.plan}
                      </span>
                    </div>

                    <div style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-2)' }}>
                      {p.credits_used ?? 0}
                    </div>

                    <div style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>

                    {/* Plan buttons */}
                    <div style={{ padding: '12px 16px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {(['free', 'pro', 'business'] as const).filter(plan => plan !== p.plan).map(plan => {
                        const tc = PLAN_COLORS[plan]
                        return (
                          <button
                            key={plan}
                            disabled={isPromoting || isDeleting}
                            onClick={() => setPlan(p.id, plan)}
                            style={{
                              fontSize: 10, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                              border: `1px solid ${tc.border}`, background: tc.bg, color: tc.color,
                              fontWeight: 700, textTransform: 'capitalize', transition: 'all 0.12s',
                              opacity: (isPromoting || isDeleting) ? 0.5 : 1,
                            }}
                          >
                            {isPromoting ? '…' : `→ ${plan}`}
                          </button>
                        )
                      })}
                    </div>

                    {/* Delete button */}
                    <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {!ADMIN_EMAILS.includes(p.email) && (
                        <button
                          disabled={isDeleting || isPromoting}
                          onClick={() => deleteUser(p.id, p.email)}
                          title="Delete user"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 6, borderRadius: 6, display: 'flex', lineHeight: 1, transition: 'color 0.12s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--fail)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-4)')}
                        >
                          {isDeleting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {showAddUser && (
        <AddUserModal
          session={session?.access_token ?? ''}
          onClose={() => setShowAddUser(false)}
          onCreated={loadProfiles}
        />
      )}
    </div>
  )
}
