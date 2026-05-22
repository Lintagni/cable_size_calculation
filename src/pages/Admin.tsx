import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

interface Profile {
  id: string
  email: string
  plan: 'free' | 'pro' | 'business'
  ai_credits_used: number
  created_at: string
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '20px 24px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: color ?? 'var(--ink)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

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

function SignupChart({ profiles }: { profiles: Profile[] }) {
  // Group by day for the last 14 days
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
            height: `${(v / max) * 100}%`, minHeight: 2,
            opacity: v > 0 ? 1 : 0.4,
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

export default function Admin() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()
  const [profiles, setProfiles]   = useState<Profile[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [promoting, setPromoting] = useState<string | null>(null)

  const ADMIN_EMAILS = ['gweerasinghe67@gmail.com', 'cryptopal95@gmail.com']

  useEffect(() => {
    if (!user) { navigate('/'); return }
    if (!ADMIN_EMAILS.includes(user.email ?? '')) { navigate('/'); return }
    loadProfiles()
  }, [user])

  async function loadProfiles() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, plan, ai_credits_used, created_at')
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

  const total    = profiles.length
  const byPlan   = { free: 0, pro: 0, business: 0 }
  let totalCredits = 0
  profiles.forEach(p => { byPlan[p.plan]++; totalCredits += p.ai_credits_used ?? 0 })
  const todaySignups = profiles.filter(p => {
    const age = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)
    return age < 1
  }).length

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
          <button className="btn" onClick={loadProfiles} style={{ gap: 6 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {error && (
          <div style={{ background: 'color-mix(in oklch, var(--fail) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--fail) 30%, transparent)', borderRadius: 'var(--r)', padding: '12px 16px', color: 'var(--fail)', fontSize: 13, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-3)', padding: 60 }}>Loading…</div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
              <StatCard label="Total Users"     value={total}         sub={`+${todaySignups} today`} />
              <StatCard label="Pro Users"       value={byPlan.pro}    sub={`${total > 0 ? ((byPlan.pro / total) * 100).toFixed(0) : 0}% of total`} color="var(--accent)" />
              <StatCard label="Business Users"  value={byPlan.business} sub="Top tier" color="var(--ok)" />
              <StatCard label="AI Credits Used" value={totalCredits.toLocaleString()} sub="All users combined" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
              {/* Plan distribution */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '20px 24px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Plan Distribution</div>
                <PlanBar plan="free"     count={byPlan.free}     total={total} />
                <PlanBar plan="pro"      count={byPlan.pro}      total={total} />
                <PlanBar plan="business" count={byPlan.business} total={total} />
              </div>

              {/* Signup chart */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '20px 24px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Signups — last 14 days</div>
                <SignupChart profiles={profiles} />
              </div>
            </div>

            {/* Users table */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', justifyContent: 'space-between' }}>
                <span>Users ({total})</span>
              </div>

              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1.5fr', borderBottom: '1px solid var(--line)' }}>
                {['Email', 'Plan', 'AI Credits', 'Joined', 'Actions'].map(h => (
                  <div key={h} style={{ padding: '10px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
                ))}
              </div>

              {profiles.slice(0, 50).map(p => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1.5fr', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
                  <div style={{ padding: '12px 20px', fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.email}
                  </div>
                  <div style={{ padding: '12px 20px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 4, padding: '2px 6px',
                      color: p.plan === 'business' ? 'var(--ok)' : p.plan === 'pro' ? 'var(--accent-ink)' : 'var(--ink-3)',
                      background: p.plan === 'business' ? 'color-mix(in oklch, var(--ok) 12%, transparent)' : p.plan === 'pro' ? 'var(--accent-soft)' : 'var(--surface-2)',
                      border: '1px solid',
                      borderColor: p.plan === 'business' ? 'color-mix(in oklch, var(--ok) 25%, transparent)' : p.plan === 'pro' ? 'var(--accent-line)' : 'var(--line)',
                    }}>
                      {p.plan}
                    </span>
                  </div>
                  <div style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-2)' }}>
                    {p.ai_credits_used ?? 0}
                  </div>
                  <div style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)' }}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </div>
                  <div style={{ padding: '12px 20px', display: 'flex', gap: 6 }}>
                    {(['free', 'pro', 'business'] as const).filter(plan => plan !== p.plan).map(plan => (
                      <button
                        key={plan}
                        disabled={promoting === p.id}
                        onClick={() => setPlan(p.id, plan)}
                        style={{
                          fontSize: 11, padding: '3px 8px', borderRadius: 4,
                          border: '1px solid var(--line)', background: 'var(--surface-2)',
                          color: 'var(--ink-3)', cursor: 'pointer',
                          opacity: promoting === p.id ? 0.5 : 1,
                          textTransform: 'capitalize',
                        }}
                      >
                        → {plan}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
