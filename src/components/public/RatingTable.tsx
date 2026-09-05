import { REFERENCE_METHODS } from '../../data/cableTables'
import type { Ap4Table, Ap4Method } from '../../data/appendix4'

const METHOD_ORDER: Ap4Method[] = ['A', 'B', 'C', 'D', 'E', 'F']

/**
 * Renders one Appendix 4 current-rating table from src/data/appendix4.ts — the
 * same data the calculator reads, so the published numbers cannot drift from
 * what the engine computes.
 *
 * Each reference method spans two columns, because that is how BS7671
 * publishes them: one two-core cable (single-phase AC or DC) and one three- or
 * four-core cable (three-phase AC). An earlier version of this page collapsed
 * them into a single figure per method, which is what let three-phase circuits
 * be rated against the single-phase column.
 */
export default function RatingTable({ table, caption }: { table: Ap4Table; caption: string }) {
  const methods = METHOD_ORDER.filter(m => table.rows.some(r => r.ratings[m]))

  return (
    <div id={`table-${table.id.toLowerCase()}`}>
      <h3>Table {table.id} — {table.title}</h3>
      <p className="rating-table-note">
        {caption} · Ambient 30 °C
        {table.groundAmbient ? `, ground ambient ${table.groundAmbient} °C` : ''} ·
        Conductor operating temperature {table.insulation === 'XLPE' ? '90' : '70'} °C
      </p>

      <div className="data-table-wrap">
        <table className="data-table rating-table">
          <caption>
            Current-carrying capacity in amperes. For each method: <strong>1ø</strong> is one
            two-core cable, single-phase AC or DC; <strong>3ø</strong> is one three- or
            four-core cable, three-phase AC.
          </caption>
          <thead>
            <tr>
              <th rowSpan={2}>CSA mm²</th>
              {methods.map(m => (
                <th key={m} colSpan={2} className="method-group" title={REFERENCE_METHODS.find(x => x.code === m)?.description}>
                  Method {m}
                </th>
              ))}
            </tr>
            <tr>
              {methods.map(m => (
                <>
                  <th key={`${m}-1`} className="sub">1ø</th>
                  <th key={`${m}-3`} className="sub">3ø</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map(r => (
              <tr key={r.csa}>
                <td>{r.csa}</td>
                {methods.map(m => (
                  <>
                    <td key={`${m}-1`}>{r.ratings[m]?.c2 ?? '—'}</td>
                    <td key={`${m}-3`}>{r.ratings[m]?.c3 ?? '—'}</td>
                  </>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="rating-table-note">
        Method descriptions:{' '}
        {methods.map(m => `${m} — ${REFERENCE_METHODS.find(x => x.code === m)?.description}`).join('; ')}.
      </p>
    </div>
  )
}
