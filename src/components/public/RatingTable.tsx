import type { CableTableEntry } from '../../data/cableTables'

const METHOD_COLS: { key: keyof CableTableEntry; label: string }[] = [
  { key: 'A1', label: 'A1' }, { key: 'A2', label: 'A2' },
  { key: 'B1', label: 'B1' }, { key: 'B2', label: 'B2' },
  { key: 'C', label: 'C' },
  { key: 'D1', label: 'D1' }, { key: 'D2', label: 'D2' },
  { key: 'E', label: 'E' }, { key: 'F', label: 'F' }, { key: 'G', label: 'G' },
]

/**
 * Renders a BS7671 Appendix 4 current-rating table straight from the data
 * this site's calculator engine uses (src/data/cableTables.ts), so the
 * published numbers can never drift from what the calculator computes.
 */
export default function RatingTable({ id, title, caption, rows }: { id: string; title: string; caption: string; rows: CableTableEntry[] }) {
  const cols = METHOD_COLS.filter(c => rows.some(r => r[c.key] !== undefined))

  return (
    <div id={id}>
      <h3>{title}</h3>
      <div className="data-table-wrap">
        <table className="data-table">
          <caption>{caption} — current-carrying capacity in amps</caption>
          <thead>
            <tr>
              <th>CSA mm²</th>
              {cols.map(c => <th key={c.key}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.csa}>
                <td>{r.csa}</td>
                {cols.map(c => <td key={c.key}>{r[c.key] ?? '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
