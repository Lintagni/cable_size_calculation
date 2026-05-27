import { useState } from 'react'
import { Download, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { CalcResultPayload } from '../../store/aiChatStore'
import { generateReport, generateExcelReport } from '../../lib/generateReport'

interface Props {
  payload: CalcResultPayload
}

// ── Stat cell helper ──────────────────────────────────────────────────────────
function Stat({
  label, value, mono = false, ok,
}: { label: string; value: string; mono?: boolean; ok?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        fontSize: 13, fontWeight: 600,
        color: ok === true ? 'var(--ok)' : ok === false ? 'var(--fail)' : 'var(--ink)',
      }}>
        {value}
      </span>
    </div>
  )
}

// ── Card shell ────────────────────────────────────────────────────────────────
function CardShell({
  ok, title, subtitle, children, onDownloadPdf, onDownloadExcel, downloading,
}: {
  ok: boolean
  title: string
  subtitle?: string
  children: React.ReactNode
  onDownloadPdf: () => void
  onDownloadExcel: () => void
  downloading: boolean
}) {
  return (
    <div style={{
      marginTop: 10, borderRadius: 12,
      border: '1px solid var(--line)',
      background: 'var(--surface)',
      overflow: 'hidden',
      boxShadow: '0 2px 8px oklch(0% 0 0 / 0.08)',
      width: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        background: ok
          ? 'oklch(from var(--ok) l c h / 0.15)'
          : 'oklch(from var(--fail) l c h / 0.15)',
        borderBottom: `1px solid ${ok
          ? 'oklch(from var(--ok) l c h / 0.25)'
          : 'oklch(from var(--fail) l c h / 0.25)'}`,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        {ok
          ? <CheckCircle2 size={16} style={{ color: 'var(--ok)', flexShrink: 0, marginTop: 1 }} />
          : <XCircle     size={16} style={{ color: 'var(--fail)', flexShrink: 0, marginTop: 1 }} />
        }
        <div style={{ minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 12, fontWeight: 700,
            color: ok ? 'var(--ok)' : 'var(--fail)',
          }}>
            {ok ? 'COMPLIANT' : 'NON-COMPLIANT'}
            {title && <span style={{ fontWeight: 500, color: 'var(--ink)', marginLeft: 6 }}>— {title}</span>}
          </p>
          {subtitle && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '12px 14px 10px' }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 14px', borderTop: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--surface-2)',
      }}>
        <button
          onClick={onDownloadPdf}
          disabled={downloading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, padding: '6px 14px',
            background: 'var(--ink)', color: 'var(--bg)',
            border: 'none', borderRadius: 8, cursor: downloading ? 'wait' : 'pointer',
            opacity: downloading ? 0.7 : 1, transition: 'opacity 0.15s',
          }}
        >
          {downloading
            ? <Loader2 size={13} className="animate-spin" />
            : <Download size={13} />
          }
          {downloading ? 'Generating…' : 'PDF'}
        </button>

        <button
          onClick={onDownloadExcel}
          disabled={downloading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, padding: '6px 14px',
            background: 'var(--surface)', color: 'var(--ink)',
            border: '1px solid var(--line)', borderRadius: 8,
            cursor: downloading ? 'wait' : 'pointer',
            opacity: downloading ? 0.7 : 1, transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
        >
          <FileSpreadsheet size={13} />
          Excel
        </button>
      </div>
    </div>
  )
}

// ── Stats grid layout ─────────────────────────────────────────────────────────
function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
      {children}
    </div>
  )
}

// ── Non-compliance reasons ─────────────────────────────────────────────────────
function Reasons({ reasons }: { reasons: string[] }) {
  if (!reasons.length) return null
  return (
    <div style={{
      marginTop: 8, padding: '8px 10px', borderRadius: 6,
      background: 'oklch(from var(--fail) l c h / 0.08)',
      border: '1px solid oklch(from var(--fail) l c h / 0.2)',
    }}>
      {reasons.map((r, i) => (
        <p key={i} style={{ margin: 0, fontSize: 11, color: 'var(--fail)', lineHeight: 1.5 }}>• {r}</p>
      ))}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function CalcResultCard({ payload }: Props) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownloadPdf() {
    setDownloading(true)
    try { await generateReport(payload) } finally { setDownloading(false) }
  }

  function handleDownloadExcel() {
    generateExcelReport(payload)
  }

  // ── LV cable ──────────────────────────────────────────────────────────────
  if (payload.type === 'lv') {
    const { result: r } = payload
    const res = r.results
    const cf  = r.correctionFactors
    const ok  = res.compliant
    const vdOk = res.voltageDropPct <= res.maxAllowedVdropPct

    const title    = `${r.recommendedCsa} mm²  ${r.input.insulation}  ${r.input.cableConfig}  ${r.input.conductorMaterial}`
    const subtitle = r.input.description && r.input.description !== 'Unnamed circuit'
      ? r.input.description
      : `${r.input.voltage} V ${r.input.phases}φ  ·  Method ${r.input.referenceMethod}`

    return (
      <CardShell ok={ok} title={title} subtitle={subtitle}
        onDownloadPdf={handleDownloadPdf} onDownloadExcel={handleDownloadExcel} downloading={downloading}>
        <StatsGrid>
          <Stat label="Design current Ib" value={`${r.input.designCurrent} A`} />
          <Stat label="Derated rating Iz" value={`${res.deRatedRating.toFixed(1)} A`} mono />
          <Stat label="Voltage drop" value={`${res.voltageDropPct.toFixed(2)}%  (${res.voltageDrop.toFixed(2)} V)`} ok={vdOk} mono />
          <Stat label="VD limit" value={`${res.maxAllowedVdropPct}%  (${res.maxAllowedVdrop.toFixed(2)} V)`} mono />
          <Stat label="Combined factor" value={cf.combined.toFixed(3)} mono />
          <Stat label="Device rating In" value={`${r.input.deviceRating} A`} />
        </StatsGrid>
        {!ok && <Reasons reasons={res.reasons} />}
      </CardShell>
    )
  }

  // ── ABC cable ─────────────────────────────────────────────────────────────
  if (payload.type === 'abc') {
    const { result: r } = payload
    const rec  = r.recommended
    const ok   = rec.compliant
    const vdOk = rec.voltageDropPct <= rec.maxAllowedVdropPct

    const title    = rec.config.label
    const subtitle = `${r.input.designCurrent} A  ·  ${r.input.voltage} V  ·  ${r.input.cableLength} m`

    return (
      <CardShell ok={ok} title={title} subtitle={subtitle}
        onDownloadPdf={handleDownloadPdf} onDownloadExcel={handleDownloadExcel} downloading={downloading}>
        <StatsGrid>
          <Stat label="Design current" value={`${r.input.designCurrent} A`} />
          <Stat label="Current rating" value={`${rec.config.currentRating} A`} mono />
          <Stat label="Voltage drop" value={`${rec.voltageDropPct.toFixed(2)}%  (${rec.voltageDrop.toFixed(2)} V)`} ok={vdOk} mono />
          <Stat label="VD limit" value={`${rec.maxAllowedVdropPct}%  (${rec.maxAllowedVdrop.toFixed(2)} V)`} mono />
          <Stat label="Circuit type" value={r.input.isLighting ? 'Lighting (3%)' : 'Power (5%)'} />
          <Stat label="Cable length" value={`${r.input.cableLength} m`} />
        </StatsGrid>
        {!ok && <Reasons reasons={rec.reasons} />}
      </CardShell>
    )
  }

  // ── Busbar ────────────────────────────────────────────────────────────────
  if (payload.type === 'busbar') {
    const { result: r } = payload
    const rec  = r.recommended
    const f    = rec.factors
    const ok   = rec.compliant
    const vdOk = rec.voltageDropPct <= 1   // busbars typically <1%

    const title    = `${r.input.barsPerPhase} × ${rec.size.label} mm  ${r.input.material}`
    const subtitle = `${r.input.designCurrent} A  ·  ${r.input.voltage} V ${r.input.phases}φ  ·  ${r.input.installation}`

    return (
      <CardShell ok={ok} title={title} subtitle={subtitle}
        onDownloadPdf={handleDownloadPdf} onDownloadExcel={handleDownloadExcel} downloading={downloading}>
        <StatsGrid>
          <Stat label="Design current" value={`${r.input.designCurrent} A`} />
          <Stat label="Total capacity" value={`${rec.totalCurrent.toFixed(0)} A`} mono />
          <Stat label="Current density" value={`${rec.currentDensity.toFixed(2)} A/mm²`} mono />
          <Stat label="Voltage drop" value={`${rec.voltageDropPct.toFixed(2)}%  (${rec.voltageDrop.toFixed(3)} V)`} ok={vdOk} mono />
          <Stat label="Temp factor" value={f.tempFactor.toFixed(3)} mono />
          <Stat label="Arrangement factor" value={f.arrangementFactor.toFixed(3)} mono />
        </StatsGrid>
        {!ok && <Reasons reasons={rec.reasons} />}
      </CardShell>
    )
  }

  return null
}
