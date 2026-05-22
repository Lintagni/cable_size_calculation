import { useState } from 'react'
import { calculateMotorCurrent, calculateLoadCurrent, type MotorInput } from '../../calculators/motorCable'

const defaultMotor: MotorInput = {
  powerKw: 22,
  voltage: 400,
  phases: 3,
  powerFactor: 0.85,
  efficiency: 0.92,
  startingCurrentMultiplier: 6,
  description: '',
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

function Spec({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="spec">
      <span className="k">{k}</span>
      <span className={`v${accent ? ' accent' : ''}`}>{v}</span>
    </div>
  )
}

export default function MotorCableForm() {
  const [motor, setMotor]           = useState<MotorInput>(defaultMotor)
  const [result, setResult]         = useState<ReturnType<typeof calculateMotorCurrent> | null>(null)
  const [loadKw, setLoadKw]         = useState(10)
  const [loadResult, setLoadResult] = useState<number | null>(null)

  function set<K extends keyof MotorInput>(k: K, v: MotorInput[K]) {
    setMotor(prev => ({ ...prev, [k]: v }))
  }

  return (
    <div className="calc-body">
      <div className="calc-inputs">

        <Panel eyebrow="A · Motor" title="Motor Details">
          <div className="grid-2">
            <Field label="Motor power" hint="kW">
              <div className="input-suffix">
                <input type="number" step={0.1} min={0} className="cc-input"
                  value={motor.powerKw}
                  onChange={e => set('powerKw', parseFloat(e.target.value) || 0)} />
                <span className="suffix">kW</span>
              </div>
            </Field>
            <Field label="Supply">
              <Seg
                options={[{ v: 400, label: '400 V (3ph)' }, { v: 230, label: '230 V (1ph)' }]}
                value={motor.voltage}
                onChange={v => {
                  const volt = Number(v) as 230 | 400
                  set('voltage', volt)
                  set('phases', volt === 400 ? 3 : 1)
                }}
              />
            </Field>
            <Field label="Power factor" hint="cos φ">
              <input type="number" step={0.01} min={0.5} max={1} className="cc-input"
                value={motor.powerFactor}
                onChange={e => set('powerFactor', parseFloat(e.target.value) || 0.85)} />
            </Field>
            <Field label="Efficiency" hint="η">
              <input type="number" step={0.01} min={0.5} max={1} className="cc-input"
                value={motor.efficiency}
                onChange={e => set('efficiency', parseFloat(e.target.value) || 0.92)} />
            </Field>
            <Field label="Starting current" hint="× FLC">
              <input type="number" step={0.5} min={1} className="cc-input"
                value={motor.startingCurrentMultiplier}
                onChange={e => set('startingCurrentMultiplier', parseFloat(e.target.value) || 6)} />
            </Field>
            <Field label="Description">
              <input className="cc-input" placeholder="e.g. Pump P-01"
                value={motor.description}
                onChange={e => set('description', e.target.value)} />
            </Field>
          </div>
          <button type="button"
            onClick={() => setResult(calculateMotorCurrent(motor))}
            className="btn btn-accent btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
          >
            Calculate Motor Current
          </button>
        </Panel>

        <Panel eyebrow="B · General load" title="Load Current">
          <div className="grid-2">
            <Field label="Load power" hint="kW">
              <div className="input-suffix">
                <input type="number" className="cc-input"
                  value={loadKw}
                  onChange={e => setLoadKw(parseFloat(e.target.value) || 0)} />
                <span className="suffix">kW</span>
              </div>
            </Field>
          </div>
          <button type="button"
            onClick={() => setLoadResult(calculateLoadCurrent({ loadKw, voltage: motor.voltage, phases: motor.phases, powerFactor: motor.powerFactor }))}
            className="btn btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
          >
            Calculate Load Current
          </button>
        </Panel>
      </div>

      {/* Results */}
      <aside className="calc-results">
        {result || loadResult !== null ? (
          <div className="results-sticky">
            {result && (
              <>
                <div className="results-head">
                  <div>
                    <span className="section-eyebrow">Motor result</span>
                    <h3>Full load current</h3>
                  </div>
                </div>
                <div style={{ padding: '20px 20px 0' }}>
                  <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)', lineHeight: 1 }}>
                    {result.fullLoadCurrentA.toFixed(1)} A
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                    Full load current (FLC)
                  </div>
                </div>
                <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Spec k="Full load current" v={`${result.fullLoadCurrentA.toFixed(2)} A`} />
                  <Spec k="Starting current" v={`${result.startingCurrentA.toFixed(1)} A`} />
                  <Spec k="Design current Ib" v={`${result.designCurrentIb.toFixed(2)} A`} accent />
                </div>
                <div style={{ padding: '0 20px 20px', fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                  Use Ib = {result.designCurrentIb.toFixed(1)} A in LV Cable Sizing
                </div>
              </>
            )}

            {loadResult !== null && (
              <>
                <div style={{ padding: result ? '0 20px 0' : '20px 20px 0', borderTop: result ? '1px solid var(--line)' : 'none', marginTop: result ? 4 : 0 }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingTop: result ? 16 : 0 }}>
                    General load result
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink)', lineHeight: 1 }}>
                    {loadResult.toFixed(2)} A
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, paddingBottom: 20 }}>
                    Load current
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="results-empty">
            Enter motor details and click Calculate
          </div>
        )}
      </aside>
    </div>
  )
}
