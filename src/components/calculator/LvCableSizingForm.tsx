import { useState, useEffect } from 'react'
import { calculate, type LvCableInput } from '../../calculators/lvCableSizing'
import { REFERENCE_METHODS } from '../../data/cableTables'
import ResultsPanel from './ResultsPanel'
import type { LvCableResult } from '../../calculators/lvCableSizing'

interface Props {
  externalInputs?: Partial<LvCableInput> | null
  onResultChange?: (result: LvCableResult | null) => void
}

const defaultInput: LvCableInput = {
  description: '',
  origin: '',
  destination: '',
  voltage: 400,
  phases: 3,
  frequency: 50,
  powerFactor: 0.85,
  designCurrent: 0,
  protectiveDevice: 'MCCB',
  deviceRating: 0,
  referenceMethod: 'C',
  cableLength: 0,
  insulation: 'XLPE',
  cableConfig: 'multicore',
  conductorMaterial: 'copper',
  parallelCircuits: 1,
  ambientTemp: 30,
  groupedCircuits: 1,
  thermalInsulation: 'none',
}

function Field({ label, children, note }: { label: string; children: React.ReactNode; note?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
      {note && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{note}</p>}
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputCls} />
}

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

  const cardCls = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6'
  const headingCls = 'font-semibold text-gray-900 dark:text-gray-100 mb-4 text-sm uppercase tracking-wide'

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Input panel */}
      <div className="space-y-6">
        <div className={cardCls}>
          <h3 className={headingCls}>Circuit Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Description">
              <Input value={input.description} onChange={e => set('description', e.target.value)} placeholder="e.g. MDB to FDB-1F" />
            </Field>
            <Field label="Voltage (V)">
              <Select value={input.voltage} onChange={e => set('voltage', Number(e.target.value) as 230 | 400)}>
                <option value={400}>400V (3-phase)</option>
                <option value={230}>230V (1-phase)</option>
              </Select>
            </Field>
            <Field label="Phases">
              <Select value={input.phases} onChange={e => set('phases', Number(e.target.value) as 1 | 3)}>
                <option value={3}>3-phase</option>
                <option value={1}>1-phase</option>
              </Select>
            </Field>
            <Field label="Power Factor">
              <Input type="number" min={0.5} max={1} step={0.01} value={input.powerFactor}
                onChange={e => set('powerFactor', parseFloat(e.target.value))} />
            </Field>
          </div>
        </div>

        <div className={cardCls}>
          <h3 className={headingCls}>Load &amp; Protection</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Design Current Ib (A)" note="Actual load current">
              <Input type="number" min={0} value={input.designCurrent || ''}
                onChange={e => set('designCurrent', parseFloat(e.target.value) || 0)} placeholder="e.g. 75" />
            </Field>
            <Field label="Protective Device">
              <Select value={input.protectiveDevice} onChange={e => set('protectiveDevice', e.target.value as LvCableInput['protectiveDevice'])}>
                <option>MCB</option>
                <option>MCCB</option>
                <option>ACB</option>
                <option>BS3036Fuse</option>
              </Select>
            </Field>
            <Field label="Device Rating In (A)" note="Nominal current">
              <Input type="number" min={0} value={input.deviceRating || ''}
                onChange={e => set('deviceRating', parseFloat(e.target.value) || 0)} placeholder="e.g. 100" />
            </Field>
            <Field label="Cable Length (m)">
              <Input type="number" min={0} value={input.cableLength || ''}
                onChange={e => set('cableLength', parseFloat(e.target.value) || 0)} placeholder="e.g. 25" />
            </Field>
          </div>
        </div>

        <div className={cardCls}>
          <h3 className={headingCls}>Cable &amp; Installation</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Conductor Material">
              <Select value={input.conductorMaterial} onChange={e => {
                const mat = e.target.value as 'copper' | 'aluminium'
                set('conductorMaterial', mat)
                // Al minimum 16mm² — reset to multicore if single-core Al
                if (mat === 'aluminium' && ['E','F','G'].includes(input.referenceMethod)) set('referenceMethod', 'C')
              }}>
                <option value="copper">Copper (Cu)</option>
                <option value="aluminium">Aluminium (Al) — min 16mm²</option>
              </Select>
            </Field>
            <Field label="Insulation">
              <Select value={input.insulation} onChange={e => set('insulation', e.target.value as 'PVC' | 'XLPE')}>
                <option value="XLPE">XLPE (90°C)</option>
                <option value="PVC">PVC (70°C)</option>
              </Select>
            </Field>
            <Field label="Cable Configuration">
              <Select value={input.cableConfig} onChange={e => {
                const cfg = e.target.value as 'single-core' | 'multicore'
                set('cableConfig', cfg)
                if (cfg === 'multicore' && ['E','F','G'].includes(input.referenceMethod)) set('referenceMethod', 'C')
                if (cfg === 'single-core' && ['A1','A2','B1','B2'].includes(input.referenceMethod)) set('referenceMethod', 'E')
              }}>
                <option value="multicore">Multicore</option>
                <option value="single-core">Single-core</option>
              </Select>
            </Field>
            <Field label="Reference Method" note="BS7671 Table 4A2">
              <Select value={input.referenceMethod} onChange={e => set('referenceMethod', e.target.value as LvCableInput['referenceMethod'])}>
                {REFERENCE_METHODS
                  .filter(m => input.cableConfig === 'single-core'
                    ? ['B1','C','D1','E','F','G'].includes(m.code)
                    : ['A1','A2','B1','B2','C','D1','D2'].includes(m.code)
                  )
                  .map(m => (
                    <option key={m.code} value={m.code}>{m.code} — {m.description}</option>
                  ))}
              </Select>
            </Field>
            <Field label="Parallel Circuits">
              <Input type="number" min={1} max={6} value={input.parallelCircuits}
                onChange={e => set('parallelCircuits', parseInt(e.target.value) || 1)} />
            </Field>
          </div>
        </div>

        <div className={cardCls}>
          <h3 className={headingCls}>Correction Factors</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ambient Temp (°C)" note="Ca — Table 4B1">
              <Input type="number" min={10} max={85} value={input.ambientTemp}
                onChange={e => set('ambientTemp', parseInt(e.target.value) || 30)} />
            </Field>
            <Field label="Circuits in Group" note="Cg — Table 4C1">
              <Input type="number" min={1} value={input.groupedCircuits}
                onChange={e => set('groupedCircuits', parseInt(e.target.value) || 1)} />
            </Field>
            <Field label="Thermal Insulation" note="Ci — Table 52.2">
              <Select value={input.thermalInsulation} onChange={e => set('thermalInsulation', e.target.value as LvCableInput['thermalInsulation'])}>
                <option value="none">None (Ci = 1.00)</option>
                <option value="oneSide">One side (Ci = 0.75)</option>
                <option value="surrounded">Surrounded (Ci = 0.50)</option>
              </Select>
            </Field>
          </div>
        </div>

        {aiApplied && (
          <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
            <span>✦</span>
            <span>AI filled the form — review inputs then click Calculate</span>
          </div>
        )}

        <button
          onClick={handleCalculate}
          className="w-full bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition-colors"
        >
          Calculate Cable Size
        </button>
      </div>

      {/* Results panel */}
      <div>
        {result ? (
          <ResultsPanel result={result} showAll={showAll} onToggleAll={() => setShowAll(v => !v)} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-16 text-center">
            <div className="text-gray-400 dark:text-gray-500 text-sm">Enter circuit details and click Calculate</div>
          </div>
        )}
      </div>
    </div>
  )
}
