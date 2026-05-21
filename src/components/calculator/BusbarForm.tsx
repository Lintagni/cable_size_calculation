import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import {
  calculateBusbar,
  type BusbarInput, type BusbarResult, type BusbarMaterial,
  type BusbarInstallation, type BusbarArrangement,
} from '../../calculators/busbarSizing'

interface Props {
  externalInputs?: Partial<BusbarInput> | null
}

const inputCls = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
const cardCls = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5'
const headingCls = 'text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3'

function Field({ label, children, note }: { label: string; children: React.ReactNode; note?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
      {note && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{note}</p>}
    </div>
  )
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
        {value}
        {sub && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{sub}</span>}
      </span>
    </div>
  )
}

const defaultInput: BusbarInput = {
  designCurrent: 0,
  phases: 3,
  material: 'copper',
  installation: 'enclosed',
  arrangement: 'flat-edge',
  ambientTemp: 40,
  barsPerPhase: 1,
  busbarLength: 1,
  voltage: 400,
  frequency: 50,
}

export default function BusbarForm({ externalInputs }: Props) {
  const [input, setInput] = useState<BusbarInput>(defaultInput)
  const [result, setResult] = useState<BusbarResult | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [aiApplied, setAiApplied] = useState(false)

  useEffect(() => {
    if (!externalInputs) return
    setInput(prev => ({ ...prev, ...externalInputs }))
    setAiApplied(true)
    const t = setTimeout(() => setAiApplied(false), 3000)
    return () => clearTimeout(t)
  }, [externalInputs])

  function set<K extends keyof BusbarInput>(key: K, value: BusbarInput[K]) {
    setInput(prev => ({ ...prev, [key]: value }))
  }

  function handleCalculate() {
    setResult(calculateBusbar(input))
  }

  const rec = result?.recommended

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-6">
        <div className={cardCls}>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 text-sm uppercase tracking-wide">
            Busbar Sizing
          </h3>
          <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 mb-4">
            Ratings based on IEC 60439 / BS EN 61439. Reference: 40°C ambient, single bar, flat on edge, naturally ventilated.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Design Current Ib (A)">
              <input type="number" min={0} value={input.designCurrent || ''}
                onChange={e => set('designCurrent', parseFloat(e.target.value) || 0)}
                placeholder="e.g. 800" className={inputCls} />
            </Field>
            <Field label="Voltage (V)">
              <select value={input.voltage} onChange={e => set('voltage', Number(e.target.value))} className={inputCls}>
                <option value={400}>400V (3-phase)</option>
                <option value={230}>230V (1-phase)</option>
              </select>
            </Field>
            <Field label="Material">
              <select value={input.material} onChange={e => set('material', e.target.value as BusbarMaterial)} className={inputCls}>
                <option value="copper">Copper (Cu)</option>
                <option value="aluminium">Aluminium (Al)</option>
              </select>
            </Field>
            <Field label="Installation">
              <select value={input.installation} onChange={e => set('installation', e.target.value as BusbarInstallation)} className={inputCls}>
                <option value="enclosed">Enclosed (switchgear/cubicle)</option>
                <option value="open">Open / free air</option>
              </select>
            </Field>
            <Field label="Bar Arrangement">
              <select value={input.arrangement} onChange={e => set('arrangement', e.target.value as BusbarArrangement)} className={inputCls}>
                <option value="flat-edge">Flat on edge (best)</option>
                <option value="vertical">Vertical</option>
                <option value="flat-face">Flat on face</option>
              </select>
            </Field>
            <Field label="Bars Per Phase" note="Parallel bars for high-current">
              <select value={input.barsPerPhase} onChange={e => set('barsPerPhase', Number(e.target.value))} className={inputCls}>
                <option value={1}>1 bar</option>
                <option value={2}>2 bars</option>
                <option value={3}>3 bars</option>
                <option value={4}>4 bars</option>
              </select>
            </Field>
            <Field label="Ambient Temp (°C)">
              <input type="number" min={20} max={60} value={input.ambientTemp}
                onChange={e => set('ambientTemp', parseInt(e.target.value) || 40)} className={inputCls} />
            </Field>
            <Field label="Busbar Run Length (m)" note="For voltage drop">
              <input type="number" min={0.1} step={0.1} value={input.busbarLength}
                onChange={e => set('busbarLength', parseFloat(e.target.value) || 1)} className={inputCls} />
            </Field>
          </div>
        </div>

        {aiApplied && (
          <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
            <span>✦</span>
            <span>AI filled the form — review inputs then click Calculate</span>
          </div>
        )}

        <button onClick={handleCalculate}
          className="w-full bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition-colors">
          Calculate Busbar Size
        </button>
      </div>

      {/* Results */}
      <div>
        {result && rec ? (
          <div className="space-y-4">
            {/* Compliance */}
            <div className={`rounded-xl px-5 py-4 flex items-start gap-3 ${
              rec.compliant
                ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
            }`}>
              {rec.compliant
                ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                : <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              }
              <div>
                <div className={`font-semibold text-sm ${rec.compliant ? 'text-green-800 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {rec.compliant ? 'Busbar Compliant' : 'Non-Compliant'}
                </div>
                {rec.reasons.map(r => <p key={r} className="text-xs text-red-600 dark:text-red-400 mt-0.5">• {r}</p>)}
              </div>
            </div>

            {/* Recommended */}
            <div className={cardCls}>
              <div className={headingCls}>Recommended Busbar</div>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-1">
                {result.input.barsPerPhase > 1 ? `${result.input.barsPerPhase} × ` : ''}{rec.size.label} mm
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {input.material === 'copper' ? 'Copper' : 'Aluminium'} busbar ·{' '}
                CSA {rec.size.csa * input.barsPerPhase} mm² per phase ·{' '}
                {input.installation === 'enclosed' ? 'Enclosed' : 'Open air'}
              </div>
            </div>

            {/* Ratings */}
            <div className={cardCls}>
              <div className={headingCls}>Current Capacity</div>
              <Row label="Design current Ib" value={`${result.input.designCurrent.toFixed(0)} A`} />
              <Row label="Capacity per bar" value={`${rec.deratedCurrent.toFixed(0)} A`} />
              <Row label={`Total (${input.barsPerPhase} bar${input.barsPerPhase > 1 ? 's' : ''})`} value={`${rec.totalCurrent.toFixed(0)} A`} />
              <Row label="Current density" value={`${rec.currentDensity.toFixed(2)} A/mm²`} />
            </div>

            {/* Derating factors */}
            <div className={cardCls}>
              <div className={headingCls}>Derating Factors Applied</div>
              <Row label="Temperature factor" value={rec.factors.tempFactor.toFixed(3)} sub={`@ ${input.ambientTemp}°C`} />
              <Row label="Arrangement factor" value={rec.factors.arrangementFactor.toFixed(3)} />
              <Row label="Enclosure factor" value={rec.factors.enclosureFactor.toFixed(3)} />
              {input.material === 'aluminium' && (
                <Row label="Material factor (Al)" value={rec.factors.materialFactor.toFixed(3)} />
              )}
            </div>

            {/* Voltage drop */}
            <div className={cardCls}>
              <div className={headingCls}>Voltage Drop ({result.input.busbarLength} m run)</div>
              <Row label="Voltage drop" value={`${rec.voltageDrop.toFixed(3)} V`} sub={`(${rec.voltageDropPct.toFixed(3)}%)`} />
              <div className={`mt-2 text-xs font-medium ${rec.voltageDropPct < 1 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {rec.voltageDropPct < 1 ? '✓ Acceptable' : '⚠ Consider larger bar or shorter run'}
              </div>
            </div>

            {/* All sizes table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button onClick={() => setShowAll(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50">
                <span>All busbar sizes</span>
                <span className="text-gray-400">{showAll ? '▲' : '▼'}</span>
              </button>
              {showAll && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {['Size', 'CSA (mm²)', 'Capacity (A)', 'VD (V)', 'OK'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {result.allSizes.map(r => (
                        <tr key={r.size.label}
                          className={r.size.label === rec.size.label ? 'bg-blue-50 dark:bg-blue-950' : r.compliant ? 'dark:text-gray-300' : 'opacity-50'}>
                          <td className="px-3 py-2 font-medium">{r.size.label}</td>
                          <td className="px-3 py-2">{r.size.csa * input.barsPerPhase}</td>
                          <td className="px-3 py-2">{r.totalCurrent.toFixed(0)}</td>
                          <td className="px-3 py-2">{r.voltageDrop.toFixed(3)}</td>
                          <td className="px-3 py-2">
                            {r.compliant
                              ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              : <XCircle className="w-3.5 h-3.5 text-red-400" />
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-16 text-center">
            <div className="text-gray-400 dark:text-gray-500 text-sm">Enter busbar details and click Calculate</div>
          </div>
        )}
      </div>
    </div>
  )
}
