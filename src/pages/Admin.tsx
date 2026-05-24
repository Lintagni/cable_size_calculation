import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, UserPlus, Trash2, X, Loader2, Upload, Database, ToggleLeft, ToggleRight, FileSpreadsheet, CheckCircle2, AlertCircle, Star, MessageSquare, FlaskConical } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { usePlanStore } from '../store/planStore'
import { setGlobalTestMode } from '../lib/globalSettings'
import { fetchAllExamples, toggleExample, deleteExample } from '../lib/exampleRetrieval'
import type { ExampleRow } from '../lib/exampleRetrieval'

/** Always returns parsed JSON; throws with a readable message if the server returns non-JSON */
async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`Server error (${res.status}): ${text.slice(0, 200)}`)
  }
}

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
      const data = await safeJson<{ success?: boolean; error?: string; detail?: unknown }>(res)
      if (!res.ok) throw new Error(data.error ?? 'Failed to create user')
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

// ── Excel parser (lazy-loads xlsx) ────────────────────────────────────────────
interface ParsedRow {
  calc_type:         string
  description?:      string
  voltage?:          number
  phases?:           number
  design_current?:   number
  cable_length?:     number
  reference_method?: string
  insulation?:       string
  conductor_material?: string
  result_csa?:       number
  result_vd_pct?:    number
  result_compliant?: boolean
  grouped_circuits?: number
  ambient_temp?:     number
  notes?:            string
  is_lighting?:      boolean
  abc_config_label?: string
  busbar_material?:  string
  installation?:     string
  arrangement?:      string
  bars_per_phase?:   number
  bar_size_label?:   string
  enabled:           boolean
}

function normalKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Maps common column name variations → our field names
const FIELD_MAP: Record<string, keyof ParsedRow> = {
  // Current
  ib: 'design_current', designcurrent: 'design_current', current: 'design_current',
  loadcurrent: 'design_current', ia: 'design_current', ratedcurrent: 'design_current',
  // Voltage
  voltage: 'voltage', v: 'voltage', systemvoltage: 'voltage', linevoltage: 'voltage',
  // Length / run
  length: 'cable_length', cablelength: 'cable_length', runm: 'cable_length', runlength: 'cable_length', l: 'cable_length',
  // Method
  method: 'reference_method', refmethod: 'reference_method', referencemethod: 'reference_method', installationmethod: 'reference_method',
  // Result CSA
  csa: 'result_csa', size: 'result_csa', cablesize: 'result_csa', resultmm2: 'result_csa', result: 'result_csa', selectedcsa: 'result_csa',
  // VD
  vd: 'result_vd_pct', vdpct: 'result_vd_pct', vdrop: 'result_vd_pct', voltagedrop: 'result_vd_pct', vdroppc: 'result_vd_pct',
  // Compliant
  compliant: 'result_compliant', ok: 'result_compliant', pass: 'result_compliant', status: 'result_compliant',
  // Description
  description: 'description', circuit: 'description', circuitdesc: 'description', label: 'description', circuitname: 'description',
  // Insulation
  insulation: 'insulation', insulationtype: 'insulation', cabletype: 'insulation',
  // Material / conductor
  material: 'conductor_material', conductor: 'conductor_material', conductormaterial: 'conductor_material',
  // Phases
  phases: 'phases', ph: 'phases', nophases: 'phases', phase: 'phases',
  // Grouping
  groupedcircuits: 'grouped_circuits', grouping: 'grouped_circuits', cg: 'grouped_circuits', noingroup: 'grouped_circuits',
  // Temperature
  ambienttemp: 'ambient_temp', temp: 'ambient_temp', temperature: 'ambient_temp', ambtemp: 'ambient_temp',
  // Notes
  notes: 'notes', note: 'notes', comment: 'notes', remarks: 'notes',
  // ABC
  lighting: 'is_lighting', islighting: 'is_lighting', abcconfig: 'abc_config_label', config: 'abc_config_label',
  // Busbar
  barsize: 'bar_size_label', busbarsize: 'bar_size_label', barsperphase: 'bars_per_phase',
  installation: 'installation', arrangement: 'arrangement',
}

function parseBool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number')  return v !== 0
  const s = String(v).toLowerCase().trim()
  if (['yes', 'y', 'true', '1', 'ok', 'pass', 'compliant'].includes(s)) return true
  if (['no', 'n', 'false', '0', 'fail', 'non-compliant'].includes(s))   return false
  return undefined
}

function detectType(row: Record<string, unknown>): 'lv' | 'abc' | 'busbar' {
  const keys = Object.keys(row).map(k => k.toLowerCase())
  if (keys.some(k => k.includes('abc') || k.includes('aerial') || k.includes('overhead'))) return 'abc'
  if (keys.some(k => k.includes('busbar') || k.includes('bus bar') || k.includes('bar size'))) return 'busbar'
  const vals = Object.values(row).join(' ').toLowerCase()
  if (/\babc\b|aerial|overhead/.test(vals)) return 'abc'
  if (/busbar|bus bar/.test(vals)) return 'busbar'
  return 'lv'
}

async function parseExcel(file: File): Promise<ParsedRow[]> {
  const { read, utils } = await import('xlsx')
  const buf  = await file.arrayBuffer()
  const wb   = read(new Uint8Array(buf), { type: 'array' })
  const ws   = wb.Sheets[wb.SheetNames[0]]
  const rows = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

  return rows
    .map(raw => {
      const out: Partial<ParsedRow> = { enabled: true }
      const calcType = detectType(raw)
      out.calc_type = calcType

      for (const [origKey, val] of Object.entries(raw)) {
        const mapped = FIELD_MAP[normalKey(origKey)]
        if (!mapped || val === '' || val === null || val === undefined) continue

        if (mapped === 'result_compliant' || mapped === 'is_lighting') {
          (out as Record<string, unknown>)[mapped] = parseBool(val)
        } else if (typeof val === 'string') {
          const num = parseFloat(val.replace(/[^0-9.]/g, ''))
          if (!isNaN(num) && ['design_current','cable_length','voltage','result_csa','result_vd_pct','phases','grouped_circuits','ambient_temp','bars_per_phase'].includes(mapped)) {
            (out as Record<string, unknown>)[mapped] = num
          } else {
            (out as Record<string, unknown>)[mapped] = val.trim() || undefined
          }
        } else if (typeof val === 'number') {
          (out as Record<string, unknown>)[mapped] = val
        } else {
          (out as Record<string, unknown>)[mapped] = String(val).trim() || undefined
        }
      }

      return out as ParsedRow
    })
    .filter(r => r.design_current || r.result_csa || r.description)  // skip empty rows
}

// ── Knowledge Base Tab ────────────────────────────────────────────────────────
function KnowledgeBaseTab({ session }: { session: string }) {
  const [examples,   setExamples]   = useState<ExampleRow[]>([])
  const [loading,    setLoading]    = useState(true)
  const [uploading,  setUploading]  = useState(false)
  const [preview,    setPreview]    = useState<ParsedRow[] | null>(null)
  const [previewFile,setPreviewFile]= useState<string>('')
  const [filter,     setFilter]     = useState<'all' | 'lv' | 'abc' | 'busbar'>('all')
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const rows = await fetchAllExamples()
    setExamples(rows)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const rows = await parseExcel(file)
      setPreview(rows)
      setPreviewFile(file.name)
    } catch (err) {
      showToast(`Parse error: ${err instanceof Error ? err.message : err}`, false)
    }
    e.target.value = ''
  }

  async function handleConfirm() {
    if (!preview?.length) return
    setUploading(true)
    try {
      const res  = await fetch('/api/admin/upload-examples', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` },
        body:    JSON.stringify({ examples: preview }),
      })
      const data = await safeJson<{ inserted?: number; message?: string; error?: string }>(res)
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      showToast(data.message ?? `${data.inserted} examples added`)
      setPreview(null)
      await load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), false)
    }
    setUploading(false)
  }

  async function handleToggle(id: string, enabled: boolean) {
    await toggleExample(id, !enabled)
    setExamples(prev => prev.map(e => e.id === id ? { ...e, enabled: !enabled } : e))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this example? This cannot be undone.')) return
    await deleteExample(id)
    setExamples(prev => prev.filter(e => e.id !== id))
    showToast('Example deleted')
  }

  const filtered = filter === 'all' ? examples : examples.filter(e => e.calc_type === filter)
  const counts   = { lv: examples.filter(e => e.calc_type === 'lv').length, abc: examples.filter(e => e.calc_type === 'abc').length, busbar: examples.filter(e => e.calc_type === 'busbar').length }

  const tagStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: '1px solid',
    background:   active ? 'var(--accent-soft)' : 'var(--surface-2)',
    borderColor:  active ? 'var(--accent-line)' : 'var(--line)',
    color:        active ? 'var(--accent-ink)'  : 'var(--ink-3)',
    transition: 'all 0.12s',
  })

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)', border: `1px solid ${toast.ok ? 'var(--ok)' : 'var(--fail)'}`,
          borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          fontSize: 13, color: toast.ok ? 'var(--ok)' : 'var(--fail)', fontWeight: 600,
        }}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Upload card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <FileSpreadsheet size={18} style={{ color: 'var(--ok)' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Upload Calculation Examples</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Excel files (.xlsx, .xls) — one row per calculation. Headers are auto-detected.</div>
          </div>
        </div>

        {/* SQL hint */}
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--line)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 11, color: 'var(--ink-3)',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-ink)', fontWeight: 700 }}>One-time setup: </span>
          Run the Supabase migration SQL before first upload.{' '}
          <button
            onClick={() => {
              const sql = `-- Run this once in Supabase SQL editor (Dashboard → SQL Editor)
create table if not exists public.calculation_examples (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  project_name text, standard text default 'BS7671',
  calc_type text not null check (calc_type in ('lv','abc','busbar')),
  enabled boolean not null default true,
  description text, voltage numeric, phases int,
  design_current numeric, cable_length numeric,
  result_vd_pct numeric, result_compliant boolean, notes text,
  reference_method text, insulation text, conductor_material text,
  cable_config text, ambient_temp numeric, grouped_circuits int, result_csa numeric,
  is_lighting boolean, abc_config_label text,
  busbar_material text, installation text, arrangement text,
  bars_per_phase int, bar_size_label text
);
alter table public.calculation_examples enable row level security;
create policy "public_read" on public.calculation_examples for select using (enabled = true);`
              navigator.clipboard.writeText(sql).catch(() => {})
              alert('SQL copied to clipboard — paste into Supabase SQL Editor and run.')
            }}
            style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', color: 'var(--accent-ink)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >
            Copy migration SQL
          </button>
        </div>

        {!preview ? (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--line)', borderRadius: 'var(--r)',
              padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
          >
            <Upload size={28} style={{ color: 'var(--ink-4)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)', margin: '0 0 4px' }}>Click to upload Excel file</p>
            <p style={{ fontSize: 12, color: 'var(--ink-4)', margin: 0 }}>.xlsx or .xls — one row per circuit calculation</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                <FileSpreadsheet size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                {previewFile} — {preview.length} row{preview.length !== 1 ? 's' : ''} detected
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPreview(null)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink-3)', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
                <button onClick={handleConfirm} disabled={uploading} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--ok)', color: '#fff', cursor: uploading ? 'wait' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Database size={13} />}
                  {uploading ? 'Saving…' : `Add ${preview.length} examples`}
                </button>
              </div>
            </div>

            {/* Preview table */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    {['Type','Description','Ib (A)','Voltage','Length (m)','Method','Insulation','Result CSA','VD%','OK'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 20).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--line)', background: i % 2 === 0 ? 'transparent' : 'var(--surface-2)' }}>
                      <td style={{ padding: '6px 10px' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3, background: 'var(--accent-soft)', color: 'var(--accent-ink)' }}>{row.calc_type}</span></td>
                      <td style={{ padding: '6px 10px', color: 'var(--ink)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description ?? '—'}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{row.design_current ?? '—'}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{row.voltage ?? '—'}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{row.cable_length ?? '—'}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{row.reference_method ?? '—'}</td>
                      <td style={{ padding: '6px 10px', color: 'var(--ink-3)' }}>{row.insulation ?? '—'}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{row.result_csa != null ? `${row.result_csa}mm²` : '—'}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{row.result_vd_pct != null ? `${row.result_vd_pct}%` : '—'}</td>
                      <td style={{ padding: '6px 10px' }}>
                        {row.result_compliant === true  && <span style={{ color: 'var(--ok)',   fontSize: 12, fontWeight: 700 }}>✓</span>}
                        {row.result_compliant === false && <span style={{ color: 'var(--fail)', fontSize: 12, fontWeight: 700 }}>✗</span>}
                        {row.result_compliant === undefined && '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 20 && (
                <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--ink-4)', borderTop: '1px solid var(--line)', fontFamily: 'var(--font-mono)' }}>
                  + {preview.length - 20} more rows not shown in preview
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Existing examples */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={14} style={{ color: 'var(--ink-3)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Knowledge Base ({examples.length} example{examples.length !== 1 ? 's' : ''})
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            {(['all', 'lv', 'abc', 'busbar'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={tagStyle(filter === f)}>
                {f === 'all' ? `All (${examples.length})` : `${f.toUpperCase()} (${counts[f] ?? 0})`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading examples…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Database size={32} style={{ color: 'var(--ink-4)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: 0 }}>No examples yet. Upload an Excel file above to get started.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1.5fr 70px 70px 80px 80px 80px 80px 50px 60px', borderBottom: '1px solid var(--line)', padding: '0 16px' }}>
              {['Type','Description','Ib (A)','Voltage','Length','Method','CSA','VD%','Active',''].map(h => (
                <div key={h} style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)' }}>{h}</div>
              ))}
            </div>

            {filtered.slice(0, 100).map(ex => (
              <div key={ex.id} style={{
                display: 'grid', gridTemplateColumns: '80px 1.5fr 70px 70px 80px 80px 80px 80px 50px 60px',
                borderBottom: '1px solid var(--line)', padding: '0 16px',
                opacity: ex.enabled ? 1 : 0.45, alignItems: 'center',
              }}>
                <div style={{ padding: '10px 8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3, background: 'var(--accent-soft)', color: 'var(--accent-ink)' }}>{ex.calc_type}</span>
                </div>
                <div style={{ padding: '10px 8px', fontSize: 12, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ex.description ?? ex.project_name ?? '—'}
                </div>
                <div style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>{ex.design_current ?? '—'}</div>
                <div style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>{ex.voltage ?? '—'}</div>
                <div style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>{ex.cable_length != null ? `${ex.cable_length}m` : '—'}</div>
                <div style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>{ex.reference_method ?? '—'}</div>
                <div style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)' }}>{ex.result_csa != null ? `${ex.result_csa}mm²` : '—'}</div>
                <div style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, color: ex.result_compliant === false ? 'var(--fail)' : 'var(--ink-2)' }}>
                  {ex.result_vd_pct != null ? `${ex.result_vd_pct}%` : '—'}
                </div>
                <div style={{ padding: '10px 8px' }}>
                  <button onClick={() => handleToggle(ex.id, ex.enabled)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ex.enabled ? 'var(--ok)' : 'var(--ink-4)', padding: 0, display: 'flex' }}>
                    {ex.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                </div>
                <div style={{ padding: '10px 8px' }}>
                  <button onClick={() => handleDelete(ex.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 4, borderRadius: 6, display: 'flex' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--fail)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-4)')}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ── Feedback Tab ─────────────────────────────────────────────────────────────
interface FeedbackRow {
  id: string
  created_at: string
  category: string
  rating: number | null
  message: string | null
  user_email: string | null
  page: string | null
}

const CAT_LABELS: Record<string, string> = {
  rate: '⭐ Rate', error: '⚠️ Error', bug: '🐛 Bug',
  calculation: '🧮 Calc Error', feature: '💡 Feature',
}
const CAT_COLORS: Record<string, string> = {
  rate: 'var(--accent-ink)', error: 'var(--fail)', bug: '#e07b00',
  calculation: '#7c3aed', feature: 'var(--ok)',
}

function FeedbackTab() {
  const [rows,    setRows]    = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<string>('all')

  useEffect(() => {
    supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => { setRows(data ?? []); setLoading(false) })
  }, [])

  const cats   = ['all', 'rate', 'error', 'bug', 'calculation', 'feature']
  const counts = cats.reduce<Record<string, number>>((acc, c) => {
    acc[c] = c === 'all' ? rows.length : rows.filter(r => r.category === c).length
    return acc
  }, {})
  const filtered = filter === 'all' ? rows : rows.filter(r => r.category === filter)

  const avgRating = (() => {
    const rated = rows.filter(r => r.rating != null)
    if (!rated.length) return null
    return (rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(1)
  })()

  const tagStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: '1px solid',
    background:  active ? 'var(--accent-soft)' : 'var(--surface-2)',
    borderColor: active ? 'var(--accent-line)' : 'var(--line)',
    color:       active ? 'var(--accent-ink)'  : 'var(--ink-3)',
    transition: 'all 0.12s',
  })

  return (
    <div>
      {/* Summary row */}
      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Total Feedback"  value={rows.length} />
        <StatCard label="Avg Rating"      value={avgRating ?? '—'} sub="out of 5 stars" color="var(--accent)" />
        <StatCard label="Bug Reports"     value={counts.bug ?? 0}  color="#e07b00" />
        <StatCard label="Feature Requests"value={counts.feature ?? 0} color="var(--ok)" />
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
        {/* Filter bar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <MessageSquare size={14} style={{ color: 'var(--ink-3)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>
            Filter
          </span>
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={tagStyle(filter === c)}>
              {c === 'all' ? `All (${counts.all})` : `${CAT_LABELS[c]} (${counts[c] ?? 0})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading feedback…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <MessageSquare size={32} style={{ color: 'var(--ink-4)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: 0 }}>No feedback in this category yet.</p>
          </div>
        ) : (
          <div className="admin-table-scroll">
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '130px 90px 60px 1fr 160px 100px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
              {['Date', 'Category', 'Rating', 'Message', 'User', 'Page'].map(h => (
                <div key={h} style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)' }}>{h}</div>
              ))}
            </div>
            {filtered.map(row => (
              <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '130px 90px 60px 1fr 160px 100px', borderBottom: '1px solid var(--line)', alignItems: 'start' }}>
                <div style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                  {new Date(row.created_at).toLocaleDateString()}<br />
                  <span style={{ fontSize: 10 }}>{new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: CAT_COLORS[row.category] ?? 'var(--ink)' }}>
                    {CAT_LABELS[row.category] ?? row.category}
                  </span>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  {row.rating != null ? (
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={12} fill={n <= row.rating! ? '#f59e0b' : 'none'} style={{ color: n <= row.rating! ? '#f59e0b' : 'var(--line)' }} />
                      ))}
                    </div>
                  ) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                </div>
                <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
                  {row.message ?? <span style={{ color: 'var(--ink-4)' }}>—</span>}
                </div>
                <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.user_email ?? <span style={{ color: 'var(--ink-4)' }}>anonymous</span>}
                </div>
                <div style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)' }}>
                  {row.page ?? '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Admin() {
  const { user, session, initialised } = useAuthStore()
  const { testMode, setTestMode, syncTestMode } = usePlanStore()
  const navigate = useNavigate()
  const [tab,        setTab]        = useState<'dashboard' | 'knowledge' | 'feedback'>('dashboard')
  const [profiles,   setProfiles]   = useState<Profile[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [promoting,  setPromoting]  = useState<string | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)
  const [showAddUser,setShowAddUser] = useState(false)

  // Mark body so CSS can strip mobile-nav padding on admin pages
  useEffect(() => {
    document.body.classList.add('admin-page')
    return () => document.body.classList.remove('admin-page')
  }, [])

  useEffect(() => {
    if (!initialised) return
    if (!user) { navigate('/'); return }
    if (!ADMIN_EMAILS.includes(user.email ?? '')) { navigate('/'); return }
    loadProfiles()
  }, [initialised, user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProfiles() {
    setLoading(true)
    try {
      // Use server-side endpoint (service role key) so RLS never blocks the read
      const res = await fetch('/api/admin/list-users', {
        headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
      })
      const json = await safeJson<{ profiles?: Profile[]; error?: string }>(res)
      if (!res.ok) throw new Error(json.error ?? 'Failed to load users')
      setProfiles(json.profiles ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
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
      const data = await safeJson<{ error?: string }>(res)
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 1, background: 'var(--ink-4)', display: 'inline-block' }} />
              Admin
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)' }}>
              {tab === 'dashboard' ? 'Dashboard' : tab === 'knowledge' ? 'Knowledge Base' : 'Feedback'}
            </h1>
          </div>
          {tab === 'dashboard' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" onClick={() => setShowAddUser(true)} style={{ gap: 6 }}>
                <UserPlus size={13} /> Add User
              </button>
              <button className="btn" onClick={loadProfiles} style={{ gap: 6 }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--line)', paddingBottom: 0 }}>
          {([
            { id: 'dashboard', label: 'Dashboard',      icon: '📊' },
            { id: 'knowledge', label: 'Knowledge Base', icon: '🧠' },
            { id: 'feedback',  label: 'Feedback',       icon: '💬' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                color: tab === t.id ? 'var(--accent-ink)' : 'var(--ink-3)',
                marginBottom: -1, transition: 'color 0.12s',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Knowledge Base tab */}
        {tab === 'knowledge' && (
          <KnowledgeBaseTab session={session?.access_token ?? ''} />
        )}

        {/* Feedback tab */}
        {tab === 'feedback' && <FeedbackTab />}

        {/* Dashboard tab */}
        {tab === 'dashboard' && (<>
        {error && (
          <div style={{ background: 'color-mix(in oklch, var(--fail) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--fail) 30%, transparent)', borderRadius: 'var(--r)', padding: '12px 16px', color: 'var(--fail)', fontSize: 13, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {error}
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fail)' }}><X size={14} /></button>
          </div>
        )}

        {/* ── Test Mode Toggle ──────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          padding: '14px 20px', borderRadius: 'var(--r)', marginBottom: 24,
          background: testMode
            ? 'color-mix(in oklch, #f59e0b 12%, transparent)'
            : 'var(--surface)',
          border: `1px solid ${testMode ? '#f59e0b' : 'var(--line)'}`,
          transition: 'all 0.25s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FlaskConical size={18} style={{ color: testMode ? '#f59e0b' : 'var(--ink-4)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: testMode ? '#b45309' : 'var(--ink)' }}>
                Test Mode — {testMode ? 'ON · Business tier for everyone' : 'OFF · Normal tier limits'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                {testMode
                  ? 'All calculator tabs unlocked · 2000 AI credits · only affects this browser'
                  : 'Flip ON to test the full app as a Business user (this browser only)'}
              </div>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            onClick={async () => {
              const next = !testMode
              setTestMode(next)                   // optimistic local update
              await setGlobalTestMode(next)       // write to Supabase (all users)
              await syncTestMode()                // confirm round-trip
            }}
            style={{
              flexShrink: 0, width: 52, height: 28, borderRadius: 14, border: 'none',
              cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
              background: testMode ? '#f59e0b' : 'var(--line-2)',
              padding: 0,
            }}
            title={testMode ? 'Turn off test mode' : 'Turn on test mode'}
          >
            <span style={{
              position: 'absolute', top: 3, left: testMode ? 27 : 3,
              width: 22, height: 22, borderRadius: '50%', background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              transition: 'left 0.2s', display: 'block',
            }} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-3)', padding: 60 }}>Loading…</div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="admin-stats-grid">
              <StatCard label="Total Users"     value={total}           sub={`+${todaySignups} today`} />
              <StatCard label="Pro Users"       value={byPlan.pro}      sub={`${total > 0 ? ((byPlan.pro / total) * 100).toFixed(0) : 0}% of total`} color="var(--accent)" />
              <StatCard label="Business Users"  value={byPlan.business} sub="Top tier" color="var(--ok)" />
              <StatCard label="AI Credits Used" value={totalCredits.toLocaleString()} sub="All users combined" />
            </div>

            <div className="admin-chart-row">
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

              {/* Table — horizontally scrollable on mobile */}
              <div className="admin-table-scroll">
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
              </div>{/* end admin-table-scroll */}
            </div>
          </>
        )}
        </>)}
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
