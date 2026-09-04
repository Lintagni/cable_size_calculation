import { Check, X } from 'lucide-react'
import { ladderRows, bindingConstraint } from '../../lib/sizeLadder'
import type { LvCableResult } from '../../calculators/lvCableSizing'

/**
 * Shows the sizes the engine rejected on the way to its answer, and why.
 *
 * Deliberately visible by default rather than behind a toggle: the reasoning
 * is the product. A bare "6 mm²" is what every free competitor already gives.
 */
export default function SizeLadder({ result, compact = false }: { result: LvCableResult; compact?: boolean }) {
  const rows = ladderRows(result)
  const binding = bindingConstraint(result)
  if (rows.length === 0) return null

  return (
    <div className="size-ladder">
      <div className="size-ladder-head">
        <h4>Why this size</h4>
        {binding && <p>{binding}</p>}
      </div>

      <div className="size-ladder-scroll">
        <table className="size-ladder-table">
          <thead>
            <tr>
              <th>CSA</th>
              <th>Iz</th>
              <th>Iz ≥ In</th>
              <th>Vd</th>
              <th>Vd ≤ limit</th>
              {!compact && <th className="outcome-col">Outcome</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.csa} className={row.selected ? 'selected' : undefined}>
                <td className="csa">
                  {row.csa} mm²
                  {row.selected && <span className="pick">selected</span>}
                </td>
                <td>{row.Iz} A</td>
                <td className={row.izOk ? 'pass' : 'fail'}>
                  {row.izOk ? <Check size={13} /> : <X size={13} />}
                </td>
                <td>{row.vdPct}</td>
                <td className={row.vdOk ? 'pass' : 'fail'}>
                  {row.vdOk ? <Check size={13} /> : <X size={13} />}
                </td>
                {!compact && <td className="outcome-col">{row.outcome}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="size-ladder-note">
        Checked against In = {result.input.deviceRating} A and a {result.results?.maxAllowedVdropPct}%
        voltage drop limit over {result.input.cableLength} m. Iz = It × Ca × Cg × Ci × Cc.
      </p>
    </div>
  )
}
