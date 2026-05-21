import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { checkVoltageDrop, type VdropInput, type VdropResult } from '../../calculators/voltageDrop'
import { STANDARD_CSA_SIZES } from '../../data/cableTables'

const inputCls = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelCls = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'

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

export default function VoltageDropForm() {
  const [input, setInput] = useState<VdropInput>(defaultInput)
  const [result, setResult] = useState<VdropResult | null>(null)

  function set<K extends keyof VdropInput>(key: K, value: VdropInput[K]) {
    setInput(prev => ({ ...prev, [key]: value }))
  }

  function handle() {
    setResult(checkVoltageDrop(input))
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">Voltage Drop Check — Section 525</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Cable CSA (mm²)</label>
            <select className={inputCls}
              value={input.csa} onChange={e => set('csa', Number(e.target.value))}>
              {STANDARD_CSA_SIZES.map(s => <option key={s} value={s}>{s} mm²</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Insulation</label>
            <select className={inputCls}
              value={input.insulation} onChange={e => set('insulation', e.target.value as 'PVC' | 'XLPE')}>
              <option value="XLPE">XLPE (90°C)</option>
              <option value="PVC">PVC (70°C)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Configuration</label>
            <select className={inputCls}
              value={input.cableConfig} onChange={e => set('cableConfig', e.target.value as 'single-core' | 'multicore')}>
              <option value="multicore">Multicore</option>
              <option value="single-core">Single-core</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Length (m)</label>
            <input type="number" className={inputCls}
              value={input.length} onChange={e => set('length', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className={labelCls}>Design Current Ib (A)</label>
            <input type="number" className={inputCls}
              value={input.designCurrent} onChange={e => set('designCurrent', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className={labelCls}>Voltage (V)</label>
            <select className={inputCls}
              value={input.voltage} onChange={e => set('voltage', Number(e.target.value))}>
              <option value={400}>400V</option>
              <option value={230}>230V</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Parallel Circuits</label>
            <input type="number" min={1} className={inputCls}
              value={input.parallelCircuits} onChange={e => set('parallelCircuits', parseInt(e.target.value) || 1)} />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" id="lighting" checked={input.isLighting}
              onChange={e => set('isLighting', e.target.checked)} className="rounded" />
            <label htmlFor="lighting" className="text-sm text-gray-700 dark:text-gray-300">Lighting circuit (3% limit)</label>
          </div>
        </div>

        <button onClick={handle}
          className="w-full bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition-colors mt-2">
          Check Voltage Drop
        </button>
      </div>

      <div>
        {result ? (
          <div className="space-y-4">
            <div className={`rounded-xl px-5 py-4 flex items-center gap-3 ${
              result.compliant
                ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
            }`}>
              {result.compliant
                ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                : <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
              }
              <span className={`font-semibold text-sm ${result.compliant ? 'text-green-800 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {result.compliant ? 'Voltage Drop Acceptable' : 'Voltage Drop Exceeds Limit'}
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-2">
              {[
                ['Voltage drop', `${result.voltageDrop.toFixed(3)} V`],
                ['% of supply voltage', `${result.voltageDropPct.toFixed(2)} %`],
                ['Limit (BS7671 S525)', `${result.maxAllowedV.toFixed(1)} V (${result.maxAllowedPct}%)`],
                ['Margin', `${result.margin.toFixed(3)} V`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm border-b border-gray-50 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                  <span className="text-gray-500 dark:text-gray-400">{l}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-16 text-center text-gray-400 dark:text-gray-500 text-sm">
            Enter cable details and click Check
          </div>
        )}
      </div>
    </div>
  )
}
