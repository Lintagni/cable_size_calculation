import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { calculate, type LvCableInput, type RefMethod } from '../../calculators/lvCableSizing'
import { REFERENCE_METHODS } from '../../data/cableTables'

/**
 * Public, no-login BS7671 sizing calculator embedded on content landing pages.
 *
 * Runs the same engine as the full calculator (calculators/lvCableSizing) but
 * exposes only the inputs a search visitor actually arrives with. Each page
 * supplies a preset so the defaults already match its intent.
 */

const BASE_INPUT: LvCableInput = {
  description: 'Quick sizing',
  origin: '—',
  destination: '—',
  voltage: 400,
  phases: 3,
  frequency: 50,
  powerFactor: 0.85,
  designCurrent: 63,
  protectiveDevice: 'MCB',
  deviceRating: 63,
  referenceMethod: 'C',
  cableLength: 25,
  insulation: 'XLPE',
  cableConfig: 'multicore',
  parallelCircuits: 1,
  ambientTemp: 30,
  groupedCircuits: 1,
  thermalInsulation: 'none',
  conductorMaterial: 'copper',
}

interface Props {
  preset?: Partial<LvCableInput>
  /** Reference methods offered in the dropdown, in page-relevant order. */
  methods?: RefMethod[]
  /** Short line explaining what the preset has assumed. */
  note?: string
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <div className="label"><span>{label}</span></div>
      {children}
    </div>
  )
}

function Spec({ k, v, ok, fail }: { k: string; v: string; ok?: boolean; fail?: boolean }) {
  return (
    <div className="spec">
      <span className="k">{k}</span>
      <span className={`v${ok ? ' ok' : ''}${fail ? ' fail' : ''}`}>{v}</span>
    </div>
  )
}

export default function QuickCalculator({ preset, methods, note }: Props) {
  const [input, setInput] = useState<LvCableInput>({ ...BASE_INPUT, ...preset })

  function set<K extends keyof LvCableInput>(key: K, value: LvCableInput[K]) {
    setInput(prev => ({ ...prev, [key]: value }))
  }

  // The engine is pure, so results can be derived on every render.
  const result = useMemo(() => {
    try {
      return calculate(input)
    } catch {
      return null
    }
  }, [input])

  const methodList = methods ?? (['C', 'B1', 'B2', 'D1', 'D2', 'E', 'F'] as RefMethod[])
  const r = result?.results
  const cf = result?.correctionFactors

  return (
    <section className="panel" style={{ marginTop: 8 }}>
      <header className="panel-head">
        <div>
          <div className="panel-eyebrow">BS7671:2018+A2</div>
          <div className="panel-title">Size the cable</div>
        </div>
      </header>

      <div style={{ padding: 'var(--pad)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
          <Field label="Design current Ib (A)">
            <input
              className="cc-input" type="number" min={1} inputMode="decimal"
              value={input.designCurrent}
              onChange={e => {
                const v = Number(e.target.value)
                // Keep In >= Ib so the device rating never silently fails the check.
                setInput(prev => ({
                  ...prev,
                  designCurrent: v,
                  deviceRating: prev.deviceRating < v ? v : prev.deviceRating,
                }))
              }}
            />
          </Field>

          <Field label="Device rating In (A)">
            <input
              className="cc-input" type="number" min={1} inputMode="decimal"
              value={input.deviceRating}
              onChange={e => set('deviceRating', Number(e.target.value))}
            />
          </Field>

          <Field label="Cable length (m)">
            <input
              className="cc-input" type="number" min={1} inputMode="decimal"
              value={input.cableLength}
              onChange={e => set('cableLength', Number(e.target.value))}
            />
          </Field>

          <Field label="Supply">
            <select
              className="cc-select"
              value={input.phases}
              onChange={e => {
                const phases = Number(e.target.value) as 1 | 3
                set('phases', phases)
                set('voltage', phases === 1 ? 230 : 400)
              }}
            >
              <option value={1}>Single phase · 230 V</option>
              <option value={3}>Three phase · 400 V</option>
            </select>
          </Field>

          <Field label="Installation method">
            <select
              className="cc-select"
              value={input.referenceMethod}
              onChange={e => set('referenceMethod', e.target.value as RefMethod)}
            >
              {methodList.map(m => {
                const meta = REFERENCE_METHODS.find(x => x.code === m)
                return <option key={m} value={m}>{m} — {meta?.description ?? m}</option>
              })}
            </select>
          </Field>

          <Field label="Insulation">
            <select
              className="cc-select"
              value={input.insulation}
              onChange={e => set('insulation', e.target.value as 'PVC' | 'XLPE')}
            >
              <option value="XLPE">XLPE · 90°C</option>
              <option value="PVC">PVC · 70°C</option>
            </select>
          </Field>

          <Field label="Ambient temp (°C)">
            <input
              className="cc-input" type="number" min={10} max={80} inputMode="decimal"
              value={input.ambientTemp}
              onChange={e => set('ambientTemp', Number(e.target.value))}
            />
          </Field>

          <Field label="Circuits in group">
            <input
              className="cc-input" type="number" min={1} max={20} inputMode="numeric"
              value={input.groupedCircuits}
              onChange={e => set('groupedCircuits', Math.max(1, Number(e.target.value)))}
            />
          </Field>
        </div>

        {note && (
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 14, fontFamily: 'var(--font-mono)' }}>
            {note}
          </p>
        )}

        {/* ── Result ── */}
        {r && cf ? (
          <div style={{ marginTop: 22, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
            <div className="result-headline">
              <div>
                <div className="result-headline-label">Minimum compliant size</div>
                <div className="result-headline-value">
                  {result.recommendedCsa} mm²
                </div>
                <div className="result-headline-meta">
                  {input.conductorMaterial === 'aluminium' ? 'Aluminium' : 'Copper'} ·{' '}
                  {input.insulation} · {input.cableConfig === 'multicore' ? 'multicore' : 'single-core'} ·
                  method {input.referenceMethod}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                {r.compliant
                  ? <span className="chip" style={{ color: 'var(--ok)' }}><CheckCircle size={12} /> Compliant</span>
                  : <span className="chip" style={{ color: 'var(--fail)' }}><XCircle size={12} /> Check inputs</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 24px', marginTop: 16 }}>
              <Spec k="Tabulated It" v={`${r.tabulatedRating.toFixed(1)} A`} />
              <Spec k="Derated Iz" v={`${r.deRatedRating.toFixed(1)} A`} ok={r.deRatedRating >= input.deviceRating} fail={r.deRatedRating < input.deviceRating} />
              <Spec k="Voltage drop" v={`${r.voltageDrop.toFixed(2)} V (${r.voltageDropPct.toFixed(2)}%)`} ok={r.voltageDrop <= r.maxAllowedVdrop} fail={r.voltageDrop > r.maxAllowedVdrop} />
              <Spec k="Vd limit (5%)" v={`${r.maxAllowedVdrop.toFixed(2)} V`} />
              <Spec k="Ca ambient" v={cf.Ca.toFixed(2)} />
              <Spec k="Cg grouping" v={cf.Cg.toFixed(2)} />
              <Spec k="Ci insulation" v={cf.Ci.toFixed(2)} />
              <Spec k="Combined factor" v={cf.combined.toFixed(3)} />
            </div>

            {!r.compliant && r.reasons.length > 0 && (
              <ul style={{ marginTop: 14, fontSize: 12.5, color: 'var(--fail)', paddingLeft: 18 }}>
                {r.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
              </ul>
            )}

            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 18, lineHeight: 1.6 }}>
              Iz = It × Ca × Cg × Ci × Cc. Voltage drop uses the mV/A/m figures from
              BS7671 Appendix 4 and is checked against the 5% limit in Section 525 for
              non-lighting circuits. Adiabatic and fault-level checks need a prospective
              fault current — use the full calculator for those.
            </p>

            <Link to="/calculator" className="btn btn-accent" style={{ marginTop: 16 }}>
              Full calculator — fault current, PDF export <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--ink-3)' }}>
            No tabulated rating exists for that combination of insulation, configuration
            and installation method. Try a different installation method.
          </p>
        )}
      </div>
    </section>
  )
}
