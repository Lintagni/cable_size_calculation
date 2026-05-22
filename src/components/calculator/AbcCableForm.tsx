import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { calculateAbc, type AbcInput, type AbcResult } from '../../calculators/abcCableSizing'
import { ABC_CONFIGS } from '../../data/abcCables'

interface Props {
  externalInputs?: Partial<AbcInput> | null
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

const defaultInput: AbcInput = {
  designCurrent: 0,
  voltage: 400,
  cableLength: 0,
  isLighting: false,
}

export default function AbcCableForm({ externalInputs }: Props) {
  const [input, setInput] = useState<AbcInput>(defaultInput)
  const [result, setResult] = useState<AbcResult | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [aiApplied, setAiApplied] = useState(false)

  useEffect(() => {
    if (!externalInputs) return
    setInput(prev => ({ ...prev, ...externalInputs }))
    setAiApplied(true)
    const t = setTimeout(() => setAiApplied(false), 3000)
    return () => clearTimeout(t)
  }, [externalInputs])

  function set<K extends keyof AbcInput>(key: K, value: AbcInput[K]) {
    setInput(prev => ({ ...prev, [key]: value }))
  }

  function handleCalculate() {
    setResult(calculateAbc(input))
  }

  const rec = result?.recommended

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Input */}
      <div className="space-y-6">
        <div className={cardCls}>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 text-sm uppercase tracking-wide">
            ABC Cable — Circuit Details
          </h3>
          <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 mb-4">
            Aerial Bundle Conductors (NFC 33-209) — Al/XLPE phase conductors, Al-alloy neutral messenger. Rated for outdoor overhead installation.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Design Current Ib (A)">
              <input type="number" min={0} value={input.designCurrent || ''}
                onChange={e => set('designCurrent', parseFloat(e.target.value) || 0)}
                placeholder="e.g. 150" className={inputCls} />
            </Field>
            <Field label="Voltage (V)">
              <select value={input.voltage} onChange={e => set('voltage', Number(e.target.value))} className={inputCls}>
                <option value={400}>400V (3-phase)</option>
              </select>
            </Field>
            <Field label="Cable Length (m)">
              <input type="number" min={0} value={input.cableLength || ''}
                onChange={e => set('cableLength', parseFloat(e.target.value) || 0)}
                placeholder="e.g. 200" className={inputCls} />
            </Field>
            <Field label="Circuit Type">
              <select value={input.isLighting ? 'lighting' : 'power'}
                onChange={e => set('isLighting', e.target.value === 'lighting')} className={inputCls}>
                <option value="power">Power (5% VD limit)</option>
                <option value="lighting">Lighting (3% VD limit)</option>
              </select>
            </Field>
            <Field label="Force Specific Size" note="Optional — leave blank for auto">
              <select value={input.selectedConfig ?? ''}
                onChange={e => set('selectedConfig', e.target.value || undefined)} className={inputCls}>
                <option value="">Auto-select (recommended)</option>
                {ABC_CONFIGS.map(c => (
                  <option key={c.label} value={c.label}>{c.label} — {c.currentRating}A</option>
                ))}
              </select>
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
          Calculate ABC Cable Size
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
                  {rec.compliant ? 'NFC 33-209 Compliant' : 'Non-Compliant'}
                </div>
                {rec.reasons.map(r => <p key={r} className="text-xs text-red-600 dark:text-red-400 mt-0.5">• {r}</p>)}
              </div>
            </div>

            {/* Recommended */}
            <div className={cardCls}>
              <div className={headingCls}>Recommended Configuration</div>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-1">{rec.config.label}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Al/XLPE Aerial Bundle Conductor · Phase {rec.config.phaseCsa}mm² · Neutral {rec.config.neutralCsa}mm²
              </div>
            </div>

            {/* Current & VD */}
            <div className={cardCls}>
              <div className={headingCls}>Performance</div>
              <Row label="Design current Ib" value={`${result.input.designCurrent.toFixed(1)} A`} />
              <Row label="Cable current rating" value={`${rec.config.currentRating} A`} />
              <Row label="Utilisation" value={`${((result.input.designCurrent / rec.config.currentRating) * 100).toFixed(1)}%`} />
              <Row label="Voltage drop" value={`${rec.voltageDrop.toFixed(2)} V`} sub={`(${rec.voltageDropPct.toFixed(2)}%)`} />
              <Row label="Max allowed VD" value={`${rec.maxAllowedVdrop.toFixed(1)} V`} sub={`(${rec.maxAllowedVdropPct}%)`} />
              <div className={`mt-2 text-xs font-medium ${rec.vdropOk ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {rec.vdropOk
                  ? `✓ VD margin: ${(rec.maxAllowedVdrop - rec.voltageDrop).toFixed(2)} V`
                  : `✗ Exceeds by ${(rec.voltageDrop - rec.maxAllowedVdrop).toFixed(2)} V`
                }
              </div>
            </div>

            {/* Short circuit */}
            <div className={cardCls}>
              <div className={headingCls}>Short-Circuit Capacity</div>
              <Row label="For 0.2 s" value={`${rec.config.shortCircuit0_2s} kA`} />
              <Row label="For 1.0 s" value={`${rec.config.shortCircuit1s} kA`} />
              <Row label="For 3.0 s" value={`${rec.config.shortCircuit3s} kA`} />
              <Row label="Phase resistance" value={`${rec.config.resistanceOhmsKm} Ω/km`} />
              <Row label="Cable weight" value={`${rec.config.weightKgKm.toFixed(0)} kg/km`} />
            </div>

            {/* All configs table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button onClick={() => setShowAll(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750">
                <span>All ABC configurations</span>
                <span className="text-gray-400">{showAll ? '▲' : '▼'}</span>
              </button>
              {showAll && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {['Config', 'Rating (A)', 'VD (V)', 'VD%', 'OK'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {result.allConfigs.map(r => (
                        <tr key={r.config.label}
                          className={r.config.label === rec.config.label ? 'bg-blue-50 dark:bg-blue-950' : r.compliant ? 'dark:text-gray-300' : 'opacity-50'}>
                          <td className="px-3 py-2 font-medium">{r.config.label}</td>
                          <td className="px-3 py-2">{r.config.currentRating}</td>
                          <td className="px-3 py-2">{r.voltageDrop.toFixed(2)}</td>
                          <td className="px-3 py-2">{r.voltageDropPct.toFixed(1)}</td>
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
            <div className="text-gray-400 dark:text-gray-500 text-sm">Enter circuit details and click Calculate</div>
          </div>
        )}
      </div>
    </div>
  )
}
