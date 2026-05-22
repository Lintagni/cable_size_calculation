import { useState } from 'react'
import { CheckCircle, XCircle, Plus, X } from 'lucide-react'
import { calculate, adiabaticCheck, type ShortCircuitInput } from '../../calculators/shortCircuit'

const defaultInput: ShortCircuitInput = {
  transformer: { kva: 1000, hvVoltage: 11000, lvVoltage: 400, impedancePct: 5 },
  cables: [{ csa: 300, length: 10, parallelCircuits: 1, insulation: 'XLPE', config: 'multicore' }],
  phases: 3,
  voltage: 400,
}

function Panel({ eyebrow, title, children, action }: { eyebrow: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="panel input-panel">
      <header className="panel-head">
        <div>
          <div className="panel-eyebrow">{eyebrow}</div>
          <div className="panel-title">{title}</div>
        </div>
        {action}
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

function Spec({ k, v, ok, fail, accent }: { k: string; v: string; ok?: boolean; fail?: boolean; accent?: boolean }) {
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

export default function ShortCircuitForm() {
  const [input, setInput]   = useState<ShortCircuitInput>(defaultInput)
  const [result, setResult] = useState<ReturnType<typeof calculate> | null>(null)
  const [adCsa, setAdCsa]   = useState(16)
  const [adTime, setAdTime] = useState(0.4)
  const [adK, setAdK]       = useState(143)

  function setTx<K extends keyof typeof defaultInput.transformer>(k: K, v: number) {
    setInput(prev => ({ ...prev, transformer: { ...prev.transformer, [k]: v } }))
  }

  function addCable() {
    setInput(prev => ({
      ...prev,
      cables: [...prev.cables, { csa: 16, length: 10, parallelCircuits: 1, insulation: 'XLPE', config: 'multicore' }],
    }))
  }

  function removeCable(idx: number) {
    setInput(prev => ({ ...prev, cables: prev.cables.filter((_, i) => i !== idx) }))
  }

  function setCable(idx: number, key: string, value: string | number) {
    setInput(prev => ({
      ...prev,
      cables: prev.cables.map((c, i) => i === idx ? { ...c, [key]: value } : c),
    }))
  }

  const adMin = result ? adiabaticCheck(result.ipsscKa * 1000, adTime, adK) : null

  return (
    <div className="calc-body">
      <div className="calc-inputs">

        {/* Transformer */}
        <Panel eyebrow="A · Source" title="Transformer">
          <div className="grid-2">
            <Field label="kVA rating" hint="kVA">
              <input type="number" className="cc-input"
                value={input.transformer.kva}
                onChange={e => setTx('kva', parseFloat(e.target.value) || 0)} />
            </Field>
            <Field label="Impedance" hint="%">
              <div className="input-suffix">
                <input type="number" step={0.1} className="cc-input"
                  value={input.transformer.impedancePct}
                  onChange={e => setTx('impedancePct', parseFloat(e.target.value) || 0)} />
                <span className="suffix">%</span>
              </div>
            </Field>
            <Field label="HV voltage" hint="V">
              <div className="input-suffix">
                <input type="number" className="cc-input"
                  value={input.transformer.hvVoltage}
                  onChange={e => setTx('hvVoltage', parseFloat(e.target.value) || 0)} />
                <span className="suffix">V</span>
              </div>
            </Field>
            <Field label="LV voltage" hint="V">
              <div className="input-suffix">
                <input type="number" className="cc-input"
                  value={input.transformer.lvVoltage}
                  onChange={e => setTx('lvVoltage', parseFloat(e.target.value) || 0)} />
                <span className="suffix">V</span>
              </div>
            </Field>
          </div>
        </Panel>

        {/* Cable chain */}
        <Panel
          eyebrow="B · Distribution"
          title="Cable Chain"
          action={
            <button type="button" className="btn" style={{ gap: 4 }} onClick={addCable}>
              <Plus size={12} /> Add cable
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {input.cables.map((c, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: 8, alignItems: 'end',
                background: 'var(--surface-2)', borderRadius: 'var(--r)', padding: '10px 12px',
              }}>
                <Field label="CSA" hint="mm²">
                  <input type="number" className="cc-input" value={c.csa}
                    onChange={e => setCable(i, 'csa', parseFloat(e.target.value))} />
                </Field>
                <Field label="Length" hint="m">
                  <input type="number" className="cc-input" value={c.length}
                    onChange={e => setCable(i, 'length', parseFloat(e.target.value))} />
                </Field>
                <Field label="Insulation">
                  <select className="cc-select" value={c.insulation}
                    onChange={e => setCable(i, 'insulation', e.target.value)}>
                    <option value="XLPE">XLPE</option>
                    <option value="PVC">PVC</option>
                  </select>
                </Field>
                {input.cables.length > 1 && (
                  <button type="button" onClick={() => removeCable(i)}
                    style={{ padding: '6px 8px', color: 'var(--fail)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--r)' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Panel>

        {/* Adiabatic */}
        <Panel eyebrow="C · Protection" title="Adiabatic Check">
          <div className="grid-3">
            <Field label="Cable CSA" hint="mm²">
              <input type="number" className="cc-input"
                value={adCsa} onChange={e => setAdCsa(parseFloat(e.target.value))} />
            </Field>
            <Field label="Trip time t" hint="s">
              <div className="input-suffix">
                <input type="number" step={0.01} className="cc-input"
                  value={adTime} onChange={e => setAdTime(parseFloat(e.target.value))} />
                <span className="suffix">s</span>
              </div>
            </Field>
            <Field label="k factor" hint="Reg 543">
              <select className="cc-select" value={adK} onChange={e => setAdK(parseInt(e.target.value))}>
                <option value={143}>143 — XLPE Cu</option>
                <option value={115}>115 — PVC Cu</option>
                <option value={94}>94 — XLPE Al</option>
                <option value={76}>76 — PVC Al</option>
              </select>
            </Field>
          </div>
        </Panel>

        <button type="button"
          onClick={() => setResult(calculate(input))}
          className="btn btn-accent btn-lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
        >
          Calculate Fault Current
        </button>
      </div>

      {/* Results */}
      <aside className="calc-results">
        {result ? (
          <div className="results-sticky">
            <div className="results-head">
              <div>
                <span className="section-eyebrow">IPSSC</span>
                <h3>Fault current</h3>
              </div>
            </div>

            {/* Headline */}
            <div style={{ padding: '20px 20px 0' }}>
              <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)', lineHeight: 1 }}>
                {result.ipsscKa.toFixed(3)} kA
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                Prospective fault current at end of cable chain
              </div>
            </div>

            {/* Impedance chain */}
            <div style={{ padding: '16px 20px 0' }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Impedance chain
              </div>
              {result.steps.map((step, i) => (
                <Spec key={i} k={step.label} v={`${step.ipsscKa.toFixed(3)} kA`} />
              ))}
            </div>

            {/* Adiabatic result */}
            {adMin !== null && (
              <div style={{ padding: '16px 20px 20px' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Adiabatic · S = (IF × √t) / k
                </div>
                <Spec k="Min CSA" v={`${adMin.toFixed(1)} mm²`} />
                <Spec
                  k={`Selected ${adCsa} mm²`}
                  v={adCsa >= adMin ? `✓ Withstands fault` : `✗ Use ≥ ${Math.ceil(adMin)} mm²`}
                  ok={adCsa >= adMin}
                  fail={adCsa < adMin}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="results-empty">
            Enter transformer and cable data then click Calculate
          </div>
        )}
      </aside>
    </div>
  )
}
