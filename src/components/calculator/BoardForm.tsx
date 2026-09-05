import { useMemo, useState } from 'react'
import { Plus, Copy, Trash2, Download, AlertTriangle, RotateCcw } from 'lucide-react'
import { useBoardStore } from '../../store/boardStore'
import { calculateBoard, type BoardCircuit } from '../../calculators/boardSchedule'
import { REFERENCE_METHODS, supportedMethods } from '../../data/cableTables'
import type { RefMethod } from '../../calculators/lvCableSizing'
import type { InsulationType } from '../../data/cableTables'

/**
 * Distribution board schedule.
 *
 * The whole board is sized in one pass so grouping (Cg) can be derived from
 * how many circuits share a containment route rather than typed per circuit —
 * see calculators/boardSchedule.ts.
 */
export default function BoardForm() {
  const { meta, defaults, circuits, setMeta, setDefaults, addCircuit, updateCircuit, removeCircuit, duplicateCircuit, reset } = useBoardStore()
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const board = useMemo(() => calculateBoard(circuits, defaults), [circuits, defaults])

  // Only methods the loaded tables can rate for the board's cable type.
  const methodOptions = useMemo(
    () => {
      const ok = supportedMethods(
        defaults.insulation, defaults.cableConfig, defaults.conductorMaterial,
        defaults.armoured, defaults.phases,
      )
      return REFERENCE_METHODS.filter(m => ok.includes(m.code))
    },
    [defaults.insulation, defaults.cableConfig, defaults.conductorMaterial, defaults.armoured, defaults.phases],
  )

  async function exportPdf() {
    setExporting(true)
    setError(null)
    try {
      const { generateBoardReport } = await import('../../lib/generateReport')
      await generateBoardReport(board, meta, defaults)
    } catch (err) {
      console.error('Board PDF export failed', err)
      setError('Could not generate the PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  function upd<K extends keyof BoardCircuit>(id: string, key: K, value: BoardCircuit[K]) {
    updateCircuit(id, { [key]: value } as Partial<BoardCircuit>)
  }

  return (
    <div className="board">
      {/* ── Board identity ── */}
      <section className="panel">
        <header className="panel-head">
          <div>
            <div className="panel-eyebrow">A · Board</div>
            <div className="panel-title">Identification</div>
          </div>
        </header>
        <div className="panel-body">
          <div className="grid-4">
            <label className="field">
              <div className="label"><span>Project</span></div>
              <input className="cc-input" value={meta.project} onChange={e => setMeta({ project: e.target.value })} />
            </label>
            <label className="field">
              <div className="label"><span>Board ref</span></div>
              <input className="cc-input" placeholder="DB-1" value={meta.boardRef} onChange={e => setMeta({ boardRef: e.target.value })} />
            </label>
            <label className="field">
              <div className="label"><span>Location</span></div>
              <input className="cc-input" value={meta.location} onChange={e => setMeta({ location: e.target.value })} />
            </label>
            <label className="field">
              <div className="label"><span>Designer</span></div>
              <input className="cc-input" value={meta.designer} onChange={e => setMeta({ designer: e.target.value })} />
            </label>
          </div>
        </div>
      </section>

      {/* ── Defaults inherited by every circuit ── */}
      <section className="panel" style={{ marginTop: 16 }}>
        <header className="panel-head">
          <div>
            <div className="panel-eyebrow">B · Defaults</div>
            <div className="panel-title">Applied to every way unless overridden</div>
          </div>
        </header>
        <div className="panel-body">
          <div className="grid-4">
            <label className="field">
              <div className="label"><span>Supply</span></div>
              <select
                className="cc-select"
                value={defaults.phases}
                onChange={e => {
                  const phases = Number(e.target.value) as 1 | 3
                  setDefaults({ phases, voltage: phases === 1 ? 230 : 400 })
                }}
              >
                <option value={3}>Three phase · 400 V</option>
                <option value={1}>Single phase · 230 V</option>
              </select>
            </label>
            <label className="field">
              <div className="label"><span>Installation method</span></div>
              <select className="cc-select" value={defaults.referenceMethod} onChange={e => setDefaults({ referenceMethod: e.target.value as RefMethod })}>
                {methodOptions.map(m => <option key={m.code} value={m.code}>{m.code} — {m.description}</option>)}
              </select>
            </label>
            <label className="field">
              <div className="label"><span>Insulation</span></div>
              <select className="cc-select" value={defaults.insulation} onChange={e => setDefaults({ insulation: e.target.value as InsulationType })}>
                <option value="XLPE">XLPE · 90°C</option>
                <option value="PVC">PVC · 70°C</option>
              </select>
            </label>
            <label className="field">
              <div className="label"><span>Armour</span></div>
              <select
                className="cc-select"
                value={defaults.armoured ? 'yes' : 'no'}
                onChange={e => setDefaults({ armoured: e.target.value === 'yes' })}
              >
                <option value="no">Non-armoured</option>
                <option value="yes">Armoured · SWA</option>
              </select>
            </label>
            <label className="field">
              <div className="label"><span>Ambient temp (°C)</span></div>
              <input
                className="cc-input" type="number" min={10} max={80}
                value={defaults.ambientTemp}
                onChange={e => setDefaults({ ambientTemp: Number(e.target.value) })}
              />
            </label>
          </div>
        </div>
      </section>

      {/* ── Circuit schedule ── */}
      <section className="panel" style={{ marginTop: 16 }}>
        <header className="panel-head">
          <div>
            <div className="panel-eyebrow">C · Schedule</div>
            <div className="panel-title">Circuits</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={addCircuit}><Plus size={13} /> Add way</button>
            <button className="btn btn-sm" onClick={reset} title="Clear the board and start again"><RotateCcw size={13} /> Reset</button>
          </div>
        </header>

        <div className="board-scroll">
          <table className="board-table">
            <thead>
              <tr>
                <th>Way</th>
                <th>Description</th>
                <th>Ib (A)</th>
                <th>In (A)</th>
                <th>Length (m)</th>
                <th>Method</th>
                <th title="Circuits sharing a route are grouped together for Cg">Route</th>
                <th title="Lighting circuits use the 3% voltage drop limit">Ltg</th>
                <th>Cg</th>
                <th>CSA</th>
                <th>Iz (A)</th>
                <th>Vd</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {board.rows.map(row => {
                const c = row.circuit
                const res = row.result?.results
                const bad = res && !res.compliant
                return (
                  <tr key={c.id} className={bad ? 'row-fail' : undefined}>
                    <td><input className="cell-input narrow" value={c.ref} onChange={e => upd(c.id, 'ref', e.target.value)} /></td>
                    <td><input className="cell-input wide" value={c.description} placeholder="Sockets, kitchen" onChange={e => upd(c.id, 'description', e.target.value)} /></td>
                    <td>
                      <input
                        className="cell-input num" type="number" min={0} inputMode="decimal" value={c.designCurrent || ''}
                        onChange={e => {
                          const v = Number(e.target.value)
                          // Keep In >= Ib, matching the quick calculator's behaviour.
                          updateCircuit(c.id, { designCurrent: v, deviceRating: c.deviceRating < v ? v : c.deviceRating })
                        }}
                      />
                    </td>
                    <td><input className="cell-input num" type="number" min={0} inputMode="decimal" value={c.deviceRating || ''} onChange={e => upd(c.id, 'deviceRating', Number(e.target.value))} /></td>
                    <td><input className="cell-input num" type="number" min={0} inputMode="decimal" value={c.cableLength || ''} onChange={e => upd(c.id, 'cableLength', Number(e.target.value))} /></td>
                    <td>
                      <select className="cell-input narrow" value={c.referenceMethod ?? ''} onChange={e => upd(c.id, 'referenceMethod', (e.target.value || undefined) as RefMethod | undefined)}>
                        <option value="">{defaults.referenceMethod}</option>
                        {methodOptions.map(m => <option key={m.code} value={m.code}>{m.code}</option>)}
                      </select>
                    </td>
                    <td><input className="cell-input narrow" placeholder="—" value={c.route} onChange={e => upd(c.id, 'route', e.target.value)} /></td>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={c.isLighting} onChange={e => upd(c.id, 'isLighting', e.target.checked)} />
                    </td>
                    <td className="derived">{row.result ? row.result.correctionFactors.Cg.toFixed(2) : `${row.groupSize}×`}</td>
                    <td className="derived strong">{res ? `${row.result!.recommendedCsa} mm²` : '—'}</td>
                    <td className="derived">{res ? res.deRatedRating.toFixed(1) : '—'}</td>
                    <td className="derived">{res ? `${res.voltageDropPct.toFixed(2)}%` : '—'}</td>
                    <td className="derived">
                      {row.error
                        ? <span className="fail">{row.error}</span>
                        : res
                          ? (res.compliant ? <span className="pass">Pass</span> : <span className="fail">{res.reasons[0] ?? 'Fail'}</span>)
                          : <span style={{ color: 'var(--ink-4)' }}>Incomplete</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button className="icon-btn" title="Duplicate" onClick={() => duplicateCircuit(c.id)}><Copy size={13} /></button>
                        <button className="icon-btn" title="Remove" onClick={() => removeCircuit(c.id)} disabled={circuits.length === 1}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="board-foot">
          <div className="board-totals">
            <div><span>Circuits</span><strong>{board.totals.circuitCount}</strong></div>
            <div><span>Connected load</span><strong>{board.totals.connectedLoad.toFixed(1)} A</strong></div>
            <div><span>Largest circuit</span><strong>{board.totals.largestCircuit.toFixed(1)} A</strong></div>
            <div><span>Worst Vd</span><strong>{board.totals.worstVoltageDropPct.toFixed(2)}%</strong></div>
            <div>
              <span>Non-compliant</span>
              <strong className={board.totals.nonCompliant ? 'fail' : 'pass'}>{board.totals.nonCompliant}</strong>
            </div>
          </div>

          <button className="btn btn-primary" onClick={exportPdf} disabled={exporting}>
            <Download size={14} /> {exporting ? 'Generating…' : 'Export board schedule'}
          </button>
        </div>

        {error && <div style={{ color: 'var(--fail)', fontSize: 12, padding: '0 22px 16px' }}>{error}</div>}

        {board.totals.routes.length > 0 && (
          <div className="board-note">
            <AlertTriangle size={13} />
            <span>
              Grouping is derived from the Route column:{' '}
              {board.totals.routes.map(r => `${r.route} (${r.count} circuit${r.count === 1 ? '' : 's'})`).join(', ')}.
              Circuits with no route are treated as run on their own, Cg = 1.00.
            </span>
          </div>
        )}
      </section>

      <p className="board-disclaimer">
        Connected load is the arithmetic sum of design currents before diversity.
        Apply diversity per BS7671 Appendix 1 / the On-Site Guide before selecting the
        board's incoming device.
      </p>
    </div>
  )
}
