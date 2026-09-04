import { calculate, type LvCableInput } from '../../calculators/lvCableSizing'
import { ladderRows } from '../../lib/sizeLadder'

/**
 * A single sizing case with every arithmetic step exposed.
 *
 * Every figure here is produced by the live engine at render time — nothing is
 * transcribed. If the engine changes, this page changes with it, so a published
 * example can never quietly drift from what the calculator actually does.
 * The steps are broken out so a reader holding a copy of BS7671 can check each
 * one independently rather than taking the result on trust.
 */

interface Props {
  id: string
  title: string
  brief: string
  input: LvCableInput
  /** Which Appendix 4 table the reader should open to check step 2. */
  table: string
}

export default function WorkedExample({ id, title, brief, input, table }: Props) {
  const result = calculate(input)
  const r = result.results
  const cf = result.correctionFactors

  if (!r) {
    return (
      <div id={id} className="worked-example">
        <h3>{title}</h3>
        <p>No tabulated rating exists for this combination.</p>
      </div>
    )
  }

  const rows = ladderRows(result)
  const selected = rows.find(row => row.selected)
  const rejected = rows.filter(row => !row.selected && row.outcome.startsWith('Rejected'))

  return (
    <div id={id} className="worked-example">
      <h3>{title}</h3>
      <p className="we-brief">{brief}</p>

      <div className="we-given">
        <Given k="Design current Ib" v={`${input.designCurrent} A`} />
        <Given k="Device rating In" v={`${input.deviceRating} A (${input.protectiveDevice})`} />
        <Given k="Supply" v={`${input.voltage} V, ${input.phases}-phase`} />
        <Given k="Route length" v={`${input.cableLength} m`} />
        <Given k="Cable" v={`${input.conductorMaterial === 'aluminium' ? 'Aluminium' : 'Copper'}, ${input.insulation}, ${input.cableConfig}`} />
        <Given k="Reference method" v={input.referenceMethod} />
        <Given k="Ambient" v={`${input.ambientTemp} °C`} />
        <Given k="Circuits in group" v={String(input.groupedCircuits)} />
      </div>

      <ol className="we-steps">
        <li>
          <strong>Correction factors.</strong> Ca = {cf.Ca.toFixed(2)} (Table 4B1 at {input.ambientTemp} °C
          for {input.insulation}), Cg = {cf.Cg.toFixed(2)} (Table 4C1, {input.groupedCircuits} circuit
          {input.groupedCircuits === 1 ? '' : 's'}), Ci = {cf.Ci.toFixed(2)}, Cc = {cf.Cc.toFixed(2)}.
          Combined = {cf.Ca.toFixed(2)} × {cf.Cg.toFixed(2)} × {cf.Ci.toFixed(2)} × {cf.Cc.toFixed(2)} ={' '}
          <strong>{cf.combined.toFixed(3)}</strong>.
        </li>
        <li>
          <strong>Required tabulated rating.</strong> It must be at least In ÷ combined ={' '}
          {input.deviceRating} ÷ {cf.combined.toFixed(3)} ={' '}
          <strong>{(input.deviceRating / cf.combined).toFixed(1)} A</strong>. Read column{' '}
          {input.referenceMethod} of Table {table} for the first size at or above this.
        </li>
        {rejected.length > 0 && (
          <li>
            <strong>Sizes rejected.</strong>{' '}
            {rejected.map((row, i) => (
              <span key={row.csa}>
                {i > 0 && '; '}
                {row.csa} mm² (It {row.It} A → Iz {row.Iz} A, Vd {row.vdPct}) —{' '}
                {row.izOk ? 'voltage drop over the limit' : 'Iz below In'}
              </span>
            ))}.
          </li>
        )}
        <li>
          <strong>Selected size.</strong> {selected?.csa ?? result.recommendedCsa} mm²: It ={' '}
          {r.tabulatedRating.toFixed(1)} A, so Iz = {r.tabulatedRating.toFixed(1)} ×{' '}
          {cf.combined.toFixed(3)} = <strong>{r.deRatedRating.toFixed(1)} A</strong>, which is{' '}
          {r.deRatedRating >= input.deviceRating ? '≥' : '<'} In = {input.deviceRating} A.
        </li>
        <li>
          <strong>Voltage drop.</strong> At {result.mVperAm.z} mV/A/m,{' '}
          Vd = {result.mVperAm.z} × {input.designCurrent} × {input.cableLength} ÷ 1000 ={' '}
          <strong>{r.voltageDrop.toFixed(2)} V</strong> = {r.voltageDropPct.toFixed(2)}% of{' '}
          {input.voltage} V, against the {r.maxAllowedVdropPct}% limit ({r.maxAllowedVdrop.toFixed(2)} V).
        </li>
      </ol>

      <div className={`we-verdict ${r.compliant ? 'ok' : 'bad'}`}>
        {r.compliant
          ? `Result: ${result.recommendedCsa} mm² — compliant on both checks.`
          : `Result: no compliant size at these inputs — ${r.reasons.join('; ')}.`}
      </div>
    </div>
  )
}

function Given({ k, v }: { k: string; v: string }) {
  return (
    <div className="we-given-row">
      <span>{k}</span>
      <strong>{v}</strong>
    </div>
  )
}
