import { calculate, type LvCableInput, type LvCableResult, type RefMethod, type ProtectiveDevice } from './lvCableSizing'
import type { InsulationType, CableConfig } from '../data/cableTables'

/**
 * Distribution board schedule — many circuits sized together.
 *
 * Real designs are boards, not single circuits, and every free competitor
 * stops at one circuit at a time. Two things fall out of holding the whole
 * board that a single-circuit tool cannot do:
 *
 *  1. Grouping (Cg) is derived, not typed. Circuits sharing a containment
 *     route are counted automatically, so adding a circuit to a tray correctly
 *     rederates every other circuit on it — the mistake people most often make
 *     when sizing circuits one at a time in a spreadsheet.
 *  2. Board totals (connected load, worst voltage drop, non-compliant count)
 *     are checked in one pass.
 */

export interface BoardDefaults {
  voltage: number
  phases: 1 | 3
  ambientTemp: number
  insulation: InsulationType
  cableConfig: CableConfig
  conductorMaterial: 'copper' | 'aluminium'
  referenceMethod: RefMethod
}

export interface BoardCircuit {
  id: string
  /** Way number / circuit reference as it appears on the board, e.g. "L1". */
  ref: string
  description: string
  designCurrent: number
  deviceRating: number
  protectiveDevice: ProtectiveDevice
  cableLength: number
  /** Circuits sharing a non-empty route are grouped together for Cg. */
  route: string
  /** Lighting circuits take the 3% voltage drop limit rather than 5%. */
  isLighting: boolean
  /** Per-circuit overrides; anything unset inherits from BoardDefaults. */
  referenceMethod?: RefMethod
  insulation?: InsulationType
  cableConfig?: CableConfig
  conductorMaterial?: 'copper' | 'aluminium'
  phases?: 1 | 3
}

export interface BoardMeta {
  project: string
  boardRef: string
  designer: string
  location: string
}

export interface BoardRow {
  circuit: BoardCircuit
  /** Circuits counted in this circuit's group, including itself. */
  groupSize: number
  result: LvCableResult | null
  error?: string
}

export interface BoardTotals {
  circuitCount: number
  connectedLoad: number      // sum of Ib (A) — before diversity
  largestCircuit: number     // max Ib (A)
  worstVoltageDropPct: number
  nonCompliant: number
  routes: { route: string; count: number }[]
}

export interface BoardResult {
  rows: BoardRow[]
  totals: BoardTotals
}

export const DEFAULT_BOARD_DEFAULTS: BoardDefaults = {
  voltage: 400,
  phases: 3,
  ambientTemp: 30,
  insulation: 'XLPE',
  cableConfig: 'multicore',
  conductorMaterial: 'copper',
  referenceMethod: 'C',
}

export function newCircuit(ref: string): BoardCircuit {
  return {
    id: crypto.randomUUID(),
    ref,
    description: '',
    designCurrent: 0,
    deviceRating: 0,
    protectiveDevice: 'MCB',
    cableLength: 0,
    route: '',
    isLighting: false,
  }
}

/**
 * Circuits sharing a route are grouped for Cg. A blank route means "run on its
 * own" — grouping does not apply, so those circuits get a group of 1 each
 * rather than being lumped together.
 */
function groupSizes(circuits: BoardCircuit[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const c of circuits) {
    const key = c.route.trim().toLowerCase()
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

function toLvInput(c: BoardCircuit, d: BoardDefaults, groupSize: number): LvCableInput {
  const phases = c.phases ?? d.phases
  return {
    description: c.description || c.ref,
    origin: '',
    destination: '',
    // A single-phase way off a three-phase board runs at phase voltage.
    voltage: phases === 1 && d.phases === 3 ? 230 : d.voltage,
    phases,
    frequency: 50,
    powerFactor: 0.85,
    designCurrent: c.designCurrent,
    protectiveDevice: c.protectiveDevice,
    deviceRating: c.deviceRating,
    referenceMethod: c.referenceMethod ?? d.referenceMethod,
    cableLength: c.cableLength,
    insulation: c.insulation ?? d.insulation,
    cableConfig: c.cableConfig ?? d.cableConfig,
    parallelCircuits: 1,
    ambientTemp: d.ambientTemp,
    groupedCircuits: groupSize,
    thermalInsulation: 'none',
    conductorMaterial: c.conductorMaterial ?? d.conductorMaterial,
  }
}

export function calculateBoard(circuits: BoardCircuit[], defaults: BoardDefaults): BoardResult {
  const counts = groupSizes(circuits)

  const rows: BoardRow[] = circuits.map(c => {
    const key = c.route.trim().toLowerCase()
    const groupSize = key ? (counts.get(key) ?? 1) : 1

    // Circuits that haven't been filled in yet are shown blank rather than
    // pushed through the engine, which would report a spurious failure.
    if (c.designCurrent <= 0 || c.deviceRating <= 0 || c.cableLength <= 0) {
      return { circuit: c, groupSize, result: null }
    }

    try {
      const input = toLvInput(c, defaults, groupSize)
      const result = calculate(input)
      if (!result.results) {
        return { circuit: c, groupSize, result: null, error: 'No tabulated rating for this combination' }
      }
      // The engine's 3%/5% split keys off the circuit description; lighting is
      // flagged explicitly on the board, so apply that limit here.
      if (c.isLighting) {
        return { circuit: c, groupSize, result: applyLightingLimit(result) }
      }
      return { circuit: c, groupSize, result }
    } catch (err) {
      return { circuit: c, groupSize, result: null, error: err instanceof Error ? err.message : 'Calculation failed' }
    }
  })

  const sized = rows.filter(r => r.result?.results)
  const totals: BoardTotals = {
    circuitCount: circuits.length,
    connectedLoad: circuits.reduce((sum, c) => sum + (c.designCurrent || 0), 0),
    largestCircuit: circuits.reduce((max, c) => Math.max(max, c.designCurrent || 0), 0),
    worstVoltageDropPct: sized.reduce((max, r) => Math.max(max, r.result!.results.voltageDropPct), 0),
    nonCompliant: sized.filter(r => !r.result!.results.compliant).length,
    routes: [...groupSizes(circuits).entries()].map(([route, count]) => ({ route, count })),
  }

  return { rows, totals }
}

/**
 * Re-check a result against the 3% lighting limit.
 *
 * The engine applies 5% by default; rather than duplicate the selection loop,
 * this walks the already-computed size list and picks the first size that
 * satisfies both capacity and the tighter drop limit.
 */
function applyLightingLimit(result: LvCableResult): LvCableResult {
  const limitPct = 3
  const allSizes = result.allSizes.map(s => {
    const maxAllowedVdrop = (limitPct / 100) * result.input.voltage
    const compliantNow = s.deRatedRating >= result.input.deviceRating && s.voltageDrop <= maxAllowedVdrop
    const reasons: string[] = []
    if (s.deRatedRating < result.input.deviceRating) {
      reasons.push(`Iz ${s.deRatedRating.toFixed(1)} A below In ${result.input.deviceRating} A`)
    }
    if (s.voltageDrop > maxAllowedVdrop) {
      reasons.push(`Voltage drop ${s.voltageDropPct.toFixed(2)}% over the ${limitPct}% lighting limit`)
    }
    return {
      ...s,
      maxAllowedVdrop,
      maxAllowedVdropPct: limitPct,
      compliant: compliantNow,
      reasons,
    }
  })

  const recommended = allSizes.find(s => s.compliant) ?? allSizes.at(-1)!
  return { ...result, allSizes, recommendedCsa: recommended.csa, results: recommended }
}
