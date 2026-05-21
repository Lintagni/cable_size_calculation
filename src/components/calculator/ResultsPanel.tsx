import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { LvCableResult } from '../../calculators/lvCableSizing'
import ResultExplainer from '../AiAssistant/ResultExplainer'

interface Props {
  result: LvCableResult
  showAll: boolean
  onToggleAll: () => void
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

const cardCls = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5'
const headingCls = 'text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3'

export default function ResultsPanel({ result, showAll, onToggleAll }: Props) {
  const { results: r, correctionFactors: cf, recommendedCsa, mVperAm, allSizes } = result

  if (!r || allSizes.length === 0) {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-5 text-sm text-red-700 dark:text-red-400">
        <strong>No cable data found</strong> for the selected insulation type, cable configuration and reference method combination.
        Try changing the Reference Method — method E/F/G applies to single-core cables in free air; methods A–D apply to multicore cables.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Compliance banner */}
      <div className={`rounded-xl px-5 py-4 flex items-start gap-3 ${
        r.compliant
          ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
      }`}>
        {r.compliant
          ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          : <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
        }
        <div>
          <div className={`font-semibold text-sm ${r.compliant ? 'text-green-800 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {r.compliant ? 'BS7671 Compliant' : 'Non-Compliant'}
          </div>
          {!r.compliant && (
            <ul className="mt-1 text-xs text-red-600 dark:text-red-400 space-y-0.5">
              {r.reasons.map(reason => <li key={reason}>• {reason}</li>)}
            </ul>
          )}
        </div>
      </div>

      {/* Recommended cable */}
      <div className={cardCls}>
        <div className={headingCls}>Recommended Cable</div>
        <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-1">{recommendedCsa} mm²</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {result.input.insulation} {result.input.cableConfig === 'multicore' ? 'Multicore' : 'Single-core'} ·{' '}
          Ref Method {result.input.referenceMethod} ·{' '}
          {result.input.parallelCircuits > 1 ? `${result.input.parallelCircuits} parallel circuits` : 'single circuit'}
        </div>
      </div>

      {/* Current ratings */}
      <div className={cardCls}>
        <div className={headingCls}>Current Ratings</div>
        <Row label="Design current Ib" value={`${result.input.designCurrent.toFixed(1)} A`} />
        <Row label="Device rating In" value={`${result.input.deviceRating} A`} />
        <Row label="Tabulated rating It" value={`${r.tabulatedRating.toFixed(1)} A`} sub="per cable" />
        <Row label="Derated rating Iz" value={`${r.deRatedRating.toFixed(1)} A`} sub="× all factors" />
      </div>

      {/* Correction factors */}
      <div className={cardCls}>
        <div className={headingCls}>Correction Factors</div>
        <Row label="Ca — ambient temp" value={cf.Ca.toFixed(3)} />
        <Row label="Cg — grouping" value={cf.Cg.toFixed(3)} />
        <Row label="Ci — thermal insulation" value={cf.Ci.toFixed(3)} />
        <Row label="Cc — protective device" value={cf.Cc.toFixed(3)} />
        <Row label="Combined" value={cf.combined.toFixed(3)} />
      </div>

      {/* Voltage drop */}
      <div className={cardCls}>
        <div className={headingCls}>Voltage Drop</div>
        <Row label="mV/A/m (r)" value={`${mVperAm.r}`} />
        <Row label="mV/A/m (x)" value={`${mVperAm.x}`} />
        <Row label="mV/A/m (z)" value={`${mVperAm.z}`} />
        <Row label="Voltage drop" value={`${r.voltageDrop.toFixed(3)} V`} sub={`(${r.voltageDropPct.toFixed(2)}%)`} />
        <Row label="Maximum allowed" value={`${r.maxAllowedVdrop.toFixed(1)} V`} sub={`(${r.maxAllowedVdropPct}%)`} />
        <div className={`mt-2 text-xs font-medium ${r.voltageDrop <= r.maxAllowedVdrop ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {r.voltageDrop <= r.maxAllowedVdrop
            ? `✓ Margin: ${(r.maxAllowedVdrop - r.voltageDrop).toFixed(3)} V`
            : `✗ Exceeds by ${(r.voltageDrop - r.maxAllowedVdrop).toFixed(3)} V`
          }
        </div>
      </div>

      {/* All sizes table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={onToggleAll}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750"
        >
          <span>All cable sizes</span>
          {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showAll && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['CSA', 'It (A)', 'Iz (A)', 'VD (V)', 'VD%', 'OK'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {allSizes.map(s => (
                  <tr
                    key={s.csa}
                    className={
                      s.csa === recommendedCsa
                        ? 'bg-blue-50 dark:bg-blue-950'
                        : s.compliant
                          ? 'dark:text-gray-300'
                          : 'opacity-50 dark:text-gray-500'
                    }
                  >
                    <td className="px-3 py-2 font-medium">{s.csa} mm²</td>
                    <td className="px-3 py-2">{s.tabulatedRating.toFixed(0)}</td>
                    <td className="px-3 py-2">{s.deRatedRating.toFixed(0)}</td>
                    <td className="px-3 py-2">{s.voltageDrop.toFixed(2)}</td>
                    <td className="px-3 py-2">{s.voltageDropPct.toFixed(1)}</td>
                    <td className="px-3 py-2">
                      {s.compliant
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
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

      <ResultExplainer result={result} />
    </div>
  )
}
