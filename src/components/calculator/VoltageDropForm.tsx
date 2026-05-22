import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { checkVoltageDrop, type VdropInput, type VdropResult } from '../../calculators/voltageDrop'
import { STANDARD_CSA_SIZES } from '../../data/cableTables'

const defaultInput: VdropInput = {
  csa: 16,
  insulation: 'XLPE',
  cableConfig: 'multicore',
  length: 20,
  designCurrent: 50,
  voltage: 400,
  phases: 3,
  parallelCircuits: 1,
  isLighting: false,
}

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
        <button key={String(o.v)} type="button" className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Spec({ k, v, ok, fail }: { k: string; v: string; ok?: boolean; fail?: boolean }) {
  return (
    <div className="spec">
      <span className="k">{k}</span>
      <span className={`v${ok ? ' ok' : ''}${fail ? ' fail' : ''}`}>
        {ok   && <CheckCircle size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />}
        {fail && <XCircle     size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />}
        {v}
      </span>
    </div>
  )
}

export default function VoltageDropForm() {
  const [input, setInput] = useState<VdropInput>(defaultInput)
  const [result, setResult] = useState<VdropResult | null>(null)

  function set<K extends keyof VdropInput>(key: K, value: VdropInput[K]) {
    setInput(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="calc-body">
      <div className="calc-inputs">

        <Panel eyebrow="A · Cable" title="Cable Parameters">
          <div className="grid-2">
            <Field label="Cable CSA" hint="mm²">
              <select
                value={input.csa}
                onChange={e => set('csa', Number(e.target.value))}
                className="cc-select"
              >
                {STANDARD_CSA_SIZES.map(s => <option key={s} value={s}>{s} mm²</option>)}
              </select>
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
                options={[{ v: 'multicore', label: 'Multicore' }, { v: 'single-core', label: 'Single' }]}
                value={input.cableConfig}
                onChange={v => set('cableConfig', v as 'single-core' | 'multicore')}
              />
            </Field>
            <Field label="Parallel circuits">
              <input
                type="number" min={1}
                value={input.parallelCircuits}
                onChange={e => set('parallelCircuits', parseInt(e.target.value) || 1)}
                className="cc-input"
              />
            </Field>
          </div>
        </Panel>

        <Panel eyebrow="B · Circuit" title="Load &amp; Supply">
          <div className="grid-2">
            <Field label="Design current Ib" hint="A">
              <div className="input-suffix">
                <input
                  type="number" min={0}
                  value={input.designCurrent || ''}
                  onChange={e => set('designCurrent', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 50"
                  className="cc-input"
                />
                <span className="suffix">A</span>
              </div>
            </Field>
            <Field label="Cable length" hint="m">
              <div className="input-suffix">
                <input
                  type="number" min={0}
                  value={input.length || ''}
                  onChange={e => set('length', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 20"
                  className="cc-input"
                />
                <span className="suffix">m</span>
              </div>
            </Field>
            <Field label="Supply voltage">
              <Seg
                options={[{ v: 400, label: '400 V (3ph)' }, { v: 230, label: '230 V (1ph)' }]}
                value={input.voltage}
                onChange={v => {
                  const volt = Number(v) as 230 | 400
                  set('voltage', volt)
                  set('phases', volt === 400 ? 3 : 1)
                }}
              />
            </Field>
            <Field label="Circuit type">
              <div style={{ marginTop: 6 }}>
                <label className="cc-toggle">
                  <input
                    type="checkbox"
                    checked={input.isLighting}
                    onChange={e => set('isLighting', e.target.checked)}
                  />
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                  <span>Lighting circuit (3% limit)</span>
                </label>
              </div>
            </Field>
          </div>
        </Panel>

        <button
          type="button"
          onClick={() => setResult(checkVoltageDrop(input))}
          className="btn btn-accent btn-lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
        >
          Check Voltage Drop
        </button>
      </div>

      {/* Results */}
      <aside className="calc-results">
        {result ? (
          <div className="results-sticky">
            <div className="results-head">
              <div>
                <span className="section-eyebrow">Section 525</span>
                <h3>Voltage drop result</h3>
              </div>
              <span className={`chip ${result.compliant ? 'ok' : 'fail'}`}>
                <span className="dot" />
                {result.compliant ? 'Pass' : 'Fail'}
              </span>
            </div>

            {/* Headline value */}
            <div style={{ padding: '20px 20px 0' }}>
              <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'var(--font-mono)', color: result.compliant ? 'var(--ok)' : 'var(--fail)', lineHeight: 1 }}>
                {result.voltageDropPct.toFixed(2)}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                {result.voltageDrop.toFixed(3)} V drop · limit {result.maxAllowedPct}%
              </div>
            </div>

            <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Spec k="Voltage drop" v={`${result.voltageDrop.toFixed(3)} V`} />
              <Spec k="% of supply" v={`${result.voltageDropPct.toFixed(2)} %`} ok={result.compliant} fail={!result.compliant} />
              <Spec k="Limit (BS7671 S525)" v={`${result.maxAllowedV.toFixed(1)} V (${result.maxAllowedPct}%)`} />
              <Spec k="Margin" v={`${result.margin.toFixed(3)} V`} ok={result.margin >= 0} fail={result.margin < 0} />
            </div>
          </div>
        ) : (
          <div className="results-empty">
            Enter cable details and click Check
          </div>
        )}
      </aside>
    </div>
  )
}
