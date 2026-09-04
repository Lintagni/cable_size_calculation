import type { LvCableResult } from '../calculators/lvCableSizing'

/**
 * The size-selection ladder: every candidate CSA the engine stepped through,
 * with the check that rejected it.
 *
 * Shared by the results panel and the PDF report so what is on screen and what
 * a checker receives can never disagree. Every competing calculator returns a
 * bare number; showing which constraint was binding is what makes the answer
 * defensible rather than taken on faith.
 */

export interface LadderRow {
  csa: number
  It: string
  Iz: string
  izOk: boolean
  vd: string
  vdPct: string
  vdOk: boolean
  outcome: string
  selected: boolean
}

/**
 * Candidate sizes up to and including the selection, plus one above it.
 *
 * The rejected sizes below the answer are the justification for it; the one
 * above shows the selection really was the first size to pass both checks
 * rather than an arbitrary jump.
 */
export function ladderRows(r: LvCableResult): LadderRow[] {
  const { allSizes, recommendedCsa, input } = r
  if (!allSizes.length) return []

  const selectedIdx = allSizes.findIndex(s => s.csa === recommendedCsa)
  const end = selectedIdx < 0 ? allSizes.length : Math.min(selectedIdx + 2, allSizes.length)

  return allSizes.slice(0, end).map(s => {
    const izOk = s.deRatedRating >= input.deviceRating
    const vdOk = s.voltageDrop <= s.maxAllowedVdrop
    const selected = s.csa === recommendedCsa

    let outcome: string
    if (selected) outcome = 'Selected — first size passing both'
    else if (!izOk && !vdOk) outcome = 'Rejected — capacity and voltage drop'
    else if (!izOk) outcome = 'Rejected — Iz below In'
    else if (!vdOk) outcome = 'Rejected — voltage drop over limit'
    else outcome = 'Also compliant (larger)'

    return {
      csa: s.csa,
      It: s.tabulatedRating.toFixed(1),
      Iz: s.deRatedRating.toFixed(1),
      izOk,
      vd: s.voltageDrop.toFixed(2),
      vdPct: `${s.voltageDropPct.toFixed(2)}%`,
      vdOk,
      outcome,
      selected,
    }
  })
}

/**
 * One-line summary of which check decided the size. Displayed above the ladder
 * because it is the single sentence most users actually need.
 */
export function bindingConstraint(r: LvCableResult): string | null {
  const rows = ladderRows(r)
  const selectedIdx = rows.findIndex(row => row.selected)
  if (selectedIdx <= 0) {
    return rows.length ? 'The smallest tabulated size already satisfies both checks.' : null
  }
  const below = rows[selectedIdx - 1]
  if (!below.izOk && !below.vdOk) {
    return `Both checks bind: ${below.csa} mm² fails on capacity and on voltage drop (${below.vdPct}).`
  }
  if (!below.izOk) {
    return `Current-carrying capacity binds: ${below.csa} mm² derates to ${below.Iz} A, below the ${r.input.deviceRating} A device.`
  }
  return `Voltage drop binds: ${below.csa} mm² carries the current but drops ${below.vdPct} over ${r.input.cableLength} m.`
}
