import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { calculate, type LvCableInput } from '../../calculators/lvCableSizing'
import { REFERENCE_METHODS } from '../../data/cableTables'
import ResultExplainer from '../AiAssistant/ResultExplainer'
import type { LvCableResult } from '../../calculators/lvCableSizing'

interface Props {
  externalInputs?: Partial<LvCableInput> | null
  onResultChange?: (result: LvCableResult | null) => void
}

const defaultInput: LvCableInput = {
  description: '', origin: '', destination: '',
  voltage: 400, phases: 3, frequency: 50, powerFactor: 0.85,
  designCurrent: 0, protectiveDevice: 'MCCB', deviceRating: 0,
  referenceMethod: 'C', cableLength: 0, insulation: 'XLPE',
  cableConfig: 'multicore', conductorMaterial: 'copper',
  parallelCircuits: 1, ambientTemp: 30, groupedCircuits: 1,
  thermalInsulation: 'none',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="panel input-panel">
      <header className="panel-head">
        <div>
          <div className="panel-eyebrow">{eyebrow}</div>
          <div className="panel-title">{title}</div>
        </div>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <div className="label">
        <span>{label}</span>
        {hint && <span className="hint">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Seg({ options, value, onChange }: { options: { v: string | number; label: string }[]; value: string | number; onChange: (v: any) => void }) {
  return (
    <div className="seg" style={{ width: '100%' }}>
      {options.map(o => (
        <button
          key={String(o.v)}
          type="button"
          className={value === o.v ? 'on' : ''}
          onClick={() => onChange(o.v)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Spec({ k, v, ok, fail, accent }: { k: string; v: string | number; ok?: boolean; fail?: boolean; accent?: boolean }) {
  return (
    <div className="spec">
      <span className="k">{k}</span>
      <span className={`v${ok ? ' ok' : ''}${fail ? ' fail' : ''}${accent ? ' accent' : ''}`}>
        {ok   && <CheckCircle size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />}
        {fail && <XCircle     size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />}
        {v}
      </span>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────
export default function LvCableSizingForm({ externalInputs, onResultChange }: Props) {
  const [input, setInput] = useState<LvCableInput>(defaultInput)
  const [result, setResult] = useState<LvCableResult | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [aiApplied, setAiApplied] = useState(false)

  useEffect(() => {
    if (!externalInputs) return
    setInput(prev => ({ ...prev, ...externalInputs }))
    setAiApplied(true)
    const t = setTimeout(() => setAiApplied(false), 3000)
    return () => clearTimeout(t)
  }, [externalInputs])

  function set<K extends keyof LvCableInput>(key: K, value: LvCableInput[K]) {
    setInput(prev => ({ ...prev, [key]: value }))
  }

  function handleCalculate() {
    const res = calculate(input)
    setResult(res)
    onResultChange?.(res)
  }

  return (
    <div className="calc-body">
      {/* ── Input panels ── */}
      <div className="calc-inputs">

        {/* A · Source */}
        <Panel eyebrow="A · Supply" title="Source">
          <div className="grid-2">
            <Field label="Voltage" hint="V">
              <Seg
                options={[{ v: 400, label: '400 V (3ph)' }, { v: 230, label: '230 V (1ph)' }]}
                value={input.voltage}
                onChange={v => set('voltage', Number(v) as 230 | 400)}
              />
            </Field>
            <Field label="Phases">
              <Seg
                options={[{ v: 3, label: '3-phase' }, { v: 1, label: '1-phase' }]}
                value={input.phases}
                onChange={v => set('phases', Number(v) as 1 | 3)}
              />
            </Field>
            <Field label="Power factor" hint="cos φ">
              <div className="input-suffix">
                <input
                  type="number" min={0.5} max={1} step={0.01}
                  value={input.powerFactor}
                  onChange={e => set('powerFactor', parseFloat(e.target.value))}
                  className="cc-input"
                />
              </div>
            </Field>
            <Field label="Description">
              <input
                value={input.description}
                onChange={e => set('description', e.target.value)}
                placeholder="e.g. MDB to FDB-1F"
                className="cc-input"
              />
            </Field>
          </div>
        </Panel>

        {/* B · Load & Protection */}
        <Panel eyebrow="B · Load profile" title="Load &amp; Protection">
          <div className="grid-2">
            <Field label="Design current Ib" hint="A">
              <div className="input-suffix">
                <input
                  type="number" min={0}
                  value={input.designCurrent || ''}
                  onChange={e => set('designCurrent', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 75"
                  className="cc-input"
                />
                <span className="suffix">A</span>
              </div>
            </Field>
            <Field label="Protective device">
              <select
                value={input.protectiveDevice}
                onChange={e => set('protectiveDevice', e.target.value as LvCableInput['protectiveDevice'])}
                className="cc-select"
              >
                <option>MCB</option>
                <option>MCCB</option>
                <option>ACB</option>
                <option>BS3036Fuse</option>
              </select>
            </Field>
            <Field label="Device rating In" hint="A">
              <div className="input-suffix">
                <input
                  type="number" min={0}
                  value={input.deviceRating || ''}
                  onChange={e => set('deviceRating', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 100"
                  className="cc-input"
                />
                <span className="suffix">A</span>
              </div>
            </Field>
            <Field label="Cable length" hint="m">
              <div className="input-suffix">
                <input
                  type="number" min={0}
                  value={input.cableLength || ''}
                  onChange={e => set('cableLength', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 25"
                  className="cc-input"
                />
                <span className="suffix">m</span>
              </div>
            </Field>
          </div>
        </Panel>

        {/* C · Cable & Installation */}
        <Panel eyebrow="C · Construction" title="Cable &amp; Installation">
          <div className="grid-3">
            <Field label="Conductor">
              <Seg
                options={[{ v: 'copper', label: 'Cu' }, { v: 'aluminium', label: 'Al' }]}
                value={input.conductorMaterial}
                onChange={v => {
                  const mat = v as 'copper' | 'aluminium'
                  set('conductorMaterial', mat)
                  if (mat === 'aluminium' && ['E', 'F', 'G'].includes(input.referenceMethod)) set('referenceMethod', 'C')
                }}
              />
            </Field>
            <Field label="Insulation">
              <Seg
                options={[{ v: 'XLPE', label: 'XLPE' }, { v: 'PVC', label: 'PVC' }]}
                value={input.insulation}
                onChange={v => set('insulation', v as 'PVC' | 'XLPE')}
              />
            </Field>
            <Field label="Configuration">
              <Seg
                options={[{ v: 'multicore', label: 'Multi' }, { v: 'single-core', label: 'Single' }]}
                value={input.cableConfig}
                onChange={v => {
                  const cfg = v as 'single-core' | 'multicore'
                  set('cableConfig', cfg)
                  if (cfg === 'multicore'    && ['E','F','G'].includes(input.referenceMethod))          set('referenceMethod', 'C')
                  if (cfg === 'single-core'  && ['A1','A2','B1','B2'].includes(input.referenceMethod)) set('referenceMethod', 'E')
                }}
              />
            </Field>
          </div>
          <div className="grid-2">
            <Field label="Reference method" hint="Table 4A2">
              <select
                value={input.referenceMethod}
                onChange={e => set('referenceMethod', e.target.value as LvCableInput['referenceMethod'])}
                className="cc-select"
              >
                {REFERENCE_METHODS
                  .filter(m => input.cableConfig === 'single-core'
                    ? ['B1','C','D1','E','F','G'].includes(m.code)
                    : ['A1','A2','B1','B2','C','D1','D2'].includes(m.code)
                  )
                  .map(m => (
                    <option key={m.code} value={m.code}>{m.code} — {m.description}</option>
                  ))}
              </select>
            </Field>
            <Field label="Parallel circuits">
              <input
                type="number" min={1} max={6}
                value={input.parallelCircuits}
                onChange={e => set('parallelCircuits', parseInt(e.target.value) || 1)}
                className="cc-input"
              />
            </Field>
          </div>
        </Panel>

        {/* D · Environment */}
        <Panel eyebrow="D · Correction factors" title="Environment">
          <div className="grid-3">
            <Field label="Ambient temp" hint="°C · Ca">
              <div className="input-suffix">
                <input
                  type="number" min={10} max={85}
                  value={input.ambientTemp}
                  onChange={e => set('ambientTemp', parseInt(e.target.value) || 30)}
                  className="cc-input"
                />
                <span className="suffix">°C</span>
              </div>
            </Field>
            <Field label="Grouped circuits" hint="Cg">
              <input
                type="number" min={1}
                value={input.groupedCircuits}
                onChange={e => set('groupedCircuits', parseInt(e.target.value) || 1)}
                className="cc-input"
              />
            </Field>
            <Field label="VD limit" hint="Sec 525">
              <Seg
                options={[{ v: '3', label: '3%' }, { v: '5', label: '5%' }]}
                value={input.voltage === 230 ? '3' : '5'}
                onChange={() => {}}
              />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="cc-toggle">
              <input
                type="checkbox"
                checked={input.thermalInsulation !== 'none'}
                onChange={e => set('thermalInsulation', e.target.checked ? 'surrounded' : 'none')}
              />
              <span className="toggle-track"><span className="toggle-thumb" /></span>
              <span>Cable surrounded by thermal insulation (Ci = 0.50)</span>
            </label>
          </div>
          {input.thermalInsulation !== 'none' && (
            <div style={{ marginTop: 12 }}>
              <Field label="Thermal insulation detail" hint="Ci">
                <select
                  value={input.thermalInsulation}
                  onChange={e => set('thermalInsulation', e.target.value as LvCableInput['thermalInsulation'])}
                  className="cc-select"
                >
                  <option value="oneSide">One side (Ci = 0.75)</option>
                  <option value="surrounded">Surrounded (Ci = 0.50)</option>
                </select>
              </Field>
            </div>
          )}
        </Panel>

        {aiApplied && (
          <div className="chip accent" style={{ padding: '10px 14px', borderRadius: 'var(--r)' }}>
            <span>✦</span>
            AI filled the form — review inputs then click Calculate
          </div>
        )}

        <button
          type="button"
          onClick={handleCalculate}
          className="btn btn-accent btn-lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
        >
          Calculate Cable Size
        </button>
      </div>

      {/* ── Results panel ── */}
      <aside className="calc-results">
        {result ? (
          <ResultsPane result={result} showAll={showAll} onToggleAll={() => setShowAll(v => !v)} />
        ) : (
          <div className="results-empty">
            Enter circuit details and click Calculate
          </div>
        )}
      </aside>
    </div>
  )
}

// ── Results pane ──────────────────────────────────────────────────────────────
function ResultsPane({ result, showAll, onToggleAll }: {
  result: LvCableResult; showAll: boolean; onToggleAll: () => void
}) {
  const { results: r, correctionFactors: cf, recommendedCsa, mVperAm, allSizes } = result

  if (!r || allSizes.length === 0) {
    return (
      <div className="panel" style={{ padding: 20, color: 'var(--fail)', fontSize: 14 }}>
        <strong>No cable data found</strong> for the selected combination. Try changing the Reference Method.
      </div>
    )
  }

  return (
    <div className="results-sticky">
      {/* Header */}
      <div className="results-head">
        <div>
          <span className="section-eyebrow">Live result</span>
          <h3>BS7671 compliance</h3>
        </div>
        <span className={`chip ${r.compliant ? 'ok' : 'fail'}`}>
          <span className="dot" />
          {r.compliant ? 'Pass' : 'Fail'}
        </span>
      </div>

      {/* Headline cable size */}
      <div className="result-headline">
        <div className="result-headline-label">Selected cable</div>
        <div className="result-headline-value">
          <span className="num">{recommendedCsa}</span>
          <span className="unit">mm²</span>
        </div>
        <div className="result-headline-meta">
          {result.input.conductorMaterial === 'copper' ? 'Cu' : 'Al'} ·{' '}
          {result.input.insulation} ·{' '}
          {result.input.cableConfig === 'multicore' ? 'Multicore' : 'Single-core'} ·{' '}
          Method {result.input.referenceMethod}
          {result.input.parallelCircuits > 1 && ` · ${result.input.parallelCircuits}× parallel`}
        </div>
      </div>

      {/* Current */}
      <div className="results-section">
        <h4>Current</h4>
        <Spec k="Ib · design"   v={`${result.input.designCurrent.toFixed(1)} A`} accent />
        <Spec k="In · device"   v={`${result.input.deviceRating} A`} />
        <Spec k="It · tabulated" v={`${r.tabulatedRating.toFixed(1)} A`} />
        <Spec k="Iz · derated"  v={`${r.deRatedRating.toFixed(1)} A`} ok={r.deRatedRating >= result.input.designCurrent} />
      </div>

      {/* Correction factors */}
      <div className="results-section">
        <h4>Correction factors</h4>
        <Spec k="Ca · ambient"    v={cf.Ca.toFixed(3)} />
        <Spec k="Cg · grouping"   v={cf.Cg.toFixed(3)} />
        <Spec k="Ci · insulation" v={cf.Ci.toFixed(3)} />
        <Spec k="Cc · device"     v={cf.Cc.toFixed(3)} />
        <Spec k="Combined"        v={cf.combined.toFixed(3)} accent />
      </div>

      {/* Voltage drop */}
      <div className="results-section">
        <h4>Voltage drop</h4>
        <Spec k="mV/A/m (r)" v={mVperAm.r} />
        <Spec k="mV/A/m (x)" v={mVperAm.x} />
        <Spec k="mV/A/m (z)" v={mVperAm.z} />
        <Spec k="Voltage drop" v={`${r.voltageDrop.toFixed(3)} V (${r.voltageDropPct.toFixed(2)}%)`} accent />
        <Spec
          k={`Max (${r.maxAllowedVdropPct}%)`}
          v={`${r.maxAllowedVdrop.toFixed(1)} V`}
          ok={r.voltageDrop <= r.maxAllowedVdrop}
          fail={r.voltageDrop > r.maxAllowedVdrop}
        />
      </div>

      {/* Non-compliance reasons */}
      {!r.compliant && (
        <div className="results-section" style={{ color: 'var(--fail)', fontSize: 13 }}>
          <h4>Issues</h4>
          {r.reasons.map(reason => (
            <div key={reason} style={{ padding: '4px 0', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <XCircle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
              {reason}
            </div>
          ))}
        </div>
      )}

      {/* All cable sizes toggle */}
      <div style={{ borderTop: '1px solid var(--line)' }}>
        <button
          type="button"
          onClick={onToggleAll}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', justifyContent: 'space-between', borderRadius: 0, padding: '12px 22px', fontSize: 13 }}
        >
          <span>All cable sizes</span>
          {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showAll && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, fontFamily: 'var(--font-mono)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                  {['CSA', 'It', 'Iz', 'VD (V)', 'VD%', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allSizes.map(s => (
                  <tr
                    key={s.csa}
                    style={{
                      borderBottom: '1px solid var(--line)',
                      background: s.csa === recommendedCsa ? 'var(--accent-soft)' : undefined,
                      opacity: s.compliant ? 1 : 0.45,
                    }}
                  >
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{s.csa} mm²</td>
                    <td style={{ padding: '8px 12px' }}>{s.tabulatedRating.toFixed(0)}</td>
                    <td style={{ padding: '8px 12px' }}>{s.deRatedRating.toFixed(0)}</td>
                    <td style={{ padding: '8px 12px' }}>{s.voltageDrop.toFixed(2)}</td>
                    <td style={{ padding: '8px 12px' }}>{s.voltageDropPct.toFixed(1)}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {s.compliant
                        ? <CheckCircle size={13} style={{ color: 'var(--ok)' }} />
                        : <XCircle     size={13} style={{ color: 'var(--fail)' }} />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button className="btn btn-accent" style={{ flex: 1 }}>Save to history</button>
        <button className="btn"><Download size={14} /></button>
      </div>

      <ResultExplainer result={result} />
    </div>
  )
}
