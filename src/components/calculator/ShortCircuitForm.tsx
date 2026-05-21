import { useState } from 'react'
import { calculate, adiabaticCheck, type ShortCircuitInput } from '../../calculators/shortCircuit'

const inputCls = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
const inputSmCls = 'w-full border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500'
const cardCls = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6'
const headingCls = 'font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide'
const labelCls = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'

const defaultInput: ShortCircuitInput = {
  transformer: { kva: 1000, hvVoltage: 11000, lvVoltage: 400, impedancePct: 5 },
  cables: [{ csa: 300, length: 10, parallelCircuits: 1, insulation: 'XLPE', config: 'multicore' }],
  phases: 3,
  voltage: 400,
}

export default function ShortCircuitForm() {
  const [input, setInput] = useState<ShortCircuitInput>(defaultInput)
  const [result, setResult] = useState<ReturnType<typeof calculate> | null>(null)
  const [adCsa, setAdCsa] = useState(16)
  const [adTime, setAdTime] = useState(0.4)
  const [adK, setAdK] = useState(143)

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
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className={cardCls}>
          <h3 className={`${headingCls} mb-4`}>Transformer</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['kVA rating', 'kva', input.transformer.kva],
              ['HV voltage (V)', 'hvVoltage', input.transformer.hvVoltage],
              ['LV voltage (V)', 'lvVoltage', input.transformer.lvVoltage],
              ['Impedance (%)', 'impedancePct', input.transformer.impedancePct],
            ].map(([label, key, val]) => (
              <div key={String(key)}>
                <label className={labelCls}>{String(label)}</label>
                <input type="number" className={inputCls}
                  value={Number(val)} onChange={e => setTx(key as keyof typeof defaultInput.transformer, parseFloat(e.target.value) || 0)} />
              </div>
            ))}
          </div>
        </div>

        <div className={cardCls}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={headingCls}>Cable Chain</h3>
            <button onClick={addCable} className="text-xs text-blue-700 dark:text-blue-400 font-medium hover:underline">+ Add cable</button>
          </div>
          <div className="space-y-3">
            {input.cables.map((c, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-gray-500 dark:text-gray-400">CSA (mm²)</label>
                  <input type="number" className={`${inputSmCls} mt-0.5`}
                    value={c.csa} onChange={e => setCable(i, 'csa', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400">Length (m)</label>
                  <input type="number" className={`${inputSmCls} mt-0.5`}
                    value={c.length} onChange={e => setCable(i, 'length', parseFloat(e.target.value))} />
                </div>
                <div className="flex flex-col justify-between">
                  <label className="text-gray-500 dark:text-gray-400">Insulation</label>
                  <div className="flex gap-1">
                    <select className={`${inputSmCls} flex-1 mt-0.5`}
                      value={c.insulation} onChange={e => setCable(i, 'insulation', e.target.value)}>
                      <option value="XLPE">XLPE</option>
                      <option value="PVC">PVC</option>
                    </select>
                    {input.cables.length > 1 && (
                      <button onClick={() => removeCable(i)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 px-1">✕</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cardCls}>
          <h3 className={`${headingCls} mb-3`}>Adiabatic Check</h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-gray-500 dark:text-gray-400 block mb-1">Cable CSA (mm²)</label>
              <input type="number" className={inputSmCls}
                value={adCsa} onChange={e => setAdCsa(parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="text-gray-500 dark:text-gray-400 block mb-1">Prot. time t (s)</label>
              <input type="number" step={0.01} className={inputSmCls}
                value={adTime} onChange={e => setAdTime(parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="text-gray-500 dark:text-gray-400 block mb-1">K factor</label>
              <select className={inputSmCls}
                value={adK} onChange={e => setAdK(parseInt(e.target.value))}>
                <option value={143}>143 (XLPE Cu)</option>
                <option value={115}>115 (PVC Cu)</option>
                <option value={94}>94 (XLPE Al)</option>
                <option value={76}>76 (PVC Al)</option>
              </select>
            </div>
          </div>
        </div>

        <button onClick={() => setResult(calculate(input))}
          className="w-full bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition-colors">
          Calculate Fault Current
        </button>
      </div>

      <div>
        {result ? (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Prospective Fault Current</div>
              <div className="text-4xl font-bold text-blue-700 dark:text-blue-400">{result.ipsscKa.toFixed(3)} kA</div>
              <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">at end of cable chain</div>
            </div>

            <div className={cardCls}>
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Impedance Chain</div>
              <div className="space-y-2">
                {result.steps.map((step, i) => (
                  <div key={i} className="flex justify-between text-xs border-b border-gray-50 dark:border-gray-700 pb-1 last:border-0">
                    <span className="text-gray-600 dark:text-gray-400">{step.label}</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{step.ipsscKa.toFixed(3)} kA</span>
                  </div>
                ))}
              </div>
            </div>

            {adMin !== null && (
              <div className={`rounded-xl border p-4 text-sm ${
                adCsa >= adMin
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              }`}>
                <div className="font-medium text-gray-900 dark:text-gray-100">Adiabatic check: S = (IF × √t) / K</div>
                <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  Min CSA = ({(result.ipsscKa * 1000).toFixed(0)} × √{adTime}) / {adK} = <strong className="text-gray-900 dark:text-gray-100">{adMin.toFixed(1)} mm²</strong>
                </div>
                <div className={`text-xs font-semibold mt-1 ${adCsa >= adMin ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {adCsa >= adMin ? `✓ ${adCsa}mm² cable withstands fault` : `✗ ${adCsa}mm² insufficient — use ≥ ${Math.ceil(adMin)}mm²`}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-16 text-center text-gray-400 dark:text-gray-500 text-sm">
            Enter transformer and cable data then click Calculate
          </div>
        )}
      </div>
    </div>
  )
}
