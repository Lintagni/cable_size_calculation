import { useState } from 'react'
import { calculateMotorCurrent, calculateLoadCurrent, type MotorInput } from '../../calculators/motorCable'

const inputCls = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
const cardCls = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6'
const labelCls = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'
const headingCls = 'font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide'

const defaultMotor: MotorInput = {
  powerKw: 22,
  voltage: 400,
  phases: 3,
  powerFactor: 0.85,
  efficiency: 0.92,
  startingCurrentMultiplier: 6,
  description: '',
}

export default function MotorCableForm() {
  const [motor, setMotor] = useState<MotorInput>(defaultMotor)
  const [result, setResult] = useState<ReturnType<typeof calculateMotorCurrent> | null>(null)
  const [loadKw, setLoadKw] = useState(10)
  const [loadResult, setLoadResult] = useState<number | null>(null)

  function set<K extends keyof MotorInput>(k: K, v: MotorInput[K]) {
    setMotor(prev => ({ ...prev, [k]: v }))
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className={cardCls}>
          <h3 className={`${headingCls} mb-4`}>Motor Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Motor power (kW)', key: 'powerKw', val: motor.powerKw, step: 0.1 },
              { label: 'Voltage (V)', key: 'voltage', val: motor.voltage, step: 1 },
              { label: 'Power factor', key: 'powerFactor', val: motor.powerFactor, step: 0.01 },
              { label: 'Efficiency', key: 'efficiency', val: motor.efficiency, step: 0.01 },
              { label: 'Starting current ×', key: 'startingCurrentMultiplier', val: motor.startingCurrentMultiplier, step: 0.5 },
            ].map(f => (
              <div key={f.key}>
                <label className={labelCls}>{f.label}</label>
                <input type="number" step={f.step} className={inputCls}
                  value={f.val} onChange={e => set(f.key as keyof MotorInput, parseFloat(e.target.value) as MotorInput[keyof MotorInput])} />
              </div>
            ))}
            <div>
              <label className={labelCls}>Phases</label>
              <select className={inputCls}
                value={motor.phases} onChange={e => set('phases', Number(e.target.value) as 1 | 3)}>
                <option value={3}>3-phase</option>
                <option value={1}>1-phase</option>
              </select>
            </div>
          </div>
          <button onClick={() => setResult(calculateMotorCurrent(motor))}
            className="w-full bg-blue-700 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 mt-4 text-sm transition-colors">
            Calculate Motor Current
          </button>
        </div>

        <div className={cardCls}>
          <h3 className={`${headingCls} mb-3`}>General Load Current</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Load (kW)</label>
              <input type="number" className={inputCls}
                value={loadKw} onChange={e => setLoadKw(parseFloat(e.target.value))} />
            </div>
          </div>
          <button
            onClick={() => setLoadResult(calculateLoadCurrent({ loadKw, voltage: motor.voltage, phases: motor.phases, powerFactor: motor.powerFactor }))}
            className="w-full bg-gray-700 dark:bg-gray-600 text-white font-semibold py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-500 mt-3 text-sm transition-colors">
            Calculate Load Current
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {result && (
          <div className={cardCls}>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">Motor Current Results</div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-1">{result.fullLoadCurrentA.toFixed(1)} A</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">Full load current (FLC)</div>
            <div className="space-y-2 text-sm">
              {[
                ['Full load current', `${result.fullLoadCurrentA.toFixed(2)} A`],
                ['Starting current', `${result.startingCurrentA.toFixed(1)} A`],
                ['Design current Ib', `${result.designCurrentIb.toFixed(2)} A`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-gray-50 dark:border-gray-700 pb-1">
                  <span className="text-gray-500 dark:text-gray-400">{l}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              Use Ib = {result.designCurrentIb.toFixed(1)} A in the LV Cable Sizing tab to select the cable.
            </p>
          </div>
        )}

        {loadResult !== null && (
          <div className={`${cardCls} text-center`}>
            <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">General Load Current</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{loadResult.toFixed(2)} A</div>
          </div>
        )}

        {!result && loadResult === null && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-16 text-center text-gray-400 dark:text-gray-500 text-sm">
            Enter motor details and click Calculate
          </div>
        )}
      </div>
    </div>
  )
}
