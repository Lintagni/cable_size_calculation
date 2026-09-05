/**
 * Pinned checks on the Appendix 4 transcription.
 *
 * Run: npx tsx scripts/verify-appendix4.ts
 *
 * These are values read directly off BS7671:2018+A2 and typed in a second
 * time, independently of src/data/appendix4.ts. If a transcription slip crept
 * into the data module, the two copies disagree and this fails. It does NOT
 * prove the data matches the standard — only that two readings agree — so a
 * check against a printed copy is still worth doing.
 *
 * It also asserts the structural invariants that caused the original bug:
 * three-phase ratings must never exceed single-phase ones, and the buried
 * Method D columns must exist on the armoured tables.
 */
import {
  AP4_TABLES, tabulatedRating, methodsFor, findTable,
  type CableSelector,
} from '../src/data/appendix4'

const PVC_MC: CableSelector = { insulation: 'PVC', config: 'multicore' }
const XLPE_MC: CableSelector = { insulation: 'XLPE', config: 'multicore' }
const PVC_SC: CableSelector = { insulation: 'PVC', config: 'single-core' }
const XLPE_SC: CableSelector = { insulation: 'XLPE', config: 'single-core' }
const PVC_SWA: CableSelector = { insulation: 'PVC', config: 'multicore', armoured: true }
const XLPE_SWA: CableSelector = { insulation: 'XLPE', config: 'multicore', armoured: true }

type Case = [string, CableSelector, number, Parameters<typeof tabulatedRating>[2], 1 | 3, number]

const CASES: Case[] = [
  // 4D2A — the table whose three-phase column the old data ignored.
  ['4D2A 1mm² C 1ph', PVC_MC, 1, 'C', 1, 15],
  ['4D2A 1mm² C 3ph', PVC_MC, 1, 'C', 3, 13.5],
  ['4D2A 25mm² C 1ph', PVC_MC, 25, 'C', 1, 112],
  ['4D2A 25mm² C 3ph', PVC_MC, 25, 'C', 3, 96],
  ['4D2A 16mm² B 3ph', PVC_MC, 16, 'B', 3, 62],
  ['4D2A 300mm² A 3ph', PVC_MC, 300, 'A', 3, 298],

  // 4E2A
  ['4E2A 2.5mm² C 1ph', XLPE_MC, 2.5, 'C', 1, 33],
  ['4E2A 2.5mm² C 3ph', XLPE_MC, 2.5, 'C', 3, 30],
  ['4E2A 25mm² C 3ph', XLPE_MC, 25, 'C', 3, 119],
  ['4E2A 95mm² E 3ph', XLPE_MC, 95, 'E', 3, 298],

  // 4D1A / 4E1A single-core
  ['4D1A 1mm² A 1ph', PVC_SC, 1, 'A', 1, 11],
  ['4D1A 16mm² C 3ph', PVC_SC, 16, 'C', 3, 79],
  ['4E1A 1mm² C 3ph', XLPE_SC, 1, 'C', 3, 17.5],
  ['4E1A 240mm² B 1ph', XLPE_SC, 240, 'B', 1, 528],

  // Armoured / buried — the case that previously could not be sized at all.
  ['4D4A 16mm² D 3ph', PVC_SWA, 16, 'D', 3, 64],
  ['4D4A 16mm² C 1ph', PVC_SWA, 16, 'C', 1, 89],
  ['4E4A 6mm² D 1ph', XLPE_SWA, 6, 'D', 1, 53],
  ['4E4A 25mm² D 3ph', XLPE_SWA, 25, 'D', 3, 96],
  ['4E4A 300mm² C 3ph', XLPE_SWA, 300, 'C', 3, 599],
]

let failures = 0
function fail(msg: string) {
  console.error(`  FAIL  ${msg}`)
  failures++
}

console.log('Pinned value checks')
for (const [name, sel, csa, method, phases, expected] of CASES) {
  const got = tabulatedRating(sel, csa, method, phases)
  if (got !== expected) fail(`${name}: expected ${expected} A, got ${got}`)
}
console.log(`  ${CASES.length} cases checked`)

console.log('Structural invariants')

// Three-phase can never be rated above single-phase for the same size/method.
for (const t of AP4_TABLES) {
  for (const r of t.rows) {
    for (const [m, rating] of Object.entries(r.ratings)) {
      if (rating.c2 !== undefined && rating.c3 !== undefined && rating.c3 > rating.c2) {
        fail(`${t.id} ${r.csa}mm² ${m}: three-phase ${rating.c3} A exceeds single-phase ${rating.c2} A`)
      }
    }
  }
}

// Ratings must increase with conductor size within a method.
for (const t of AP4_TABLES) {
  for (const m of ['A', 'B', 'C', 'D', 'E', 'F'] as const) {
    for (const col of ['c2', 'c3'] as const) {
      let prev = -Infinity
      let prevCsa = 0
      for (const r of t.rows) {
        const v = r.ratings[m]?.[col]
        if (v === undefined) continue
        if (v < prev) fail(`${t.id} ${m}.${col}: ${r.csa}mm² (${v} A) below ${prevCsa}mm² (${prev} A)`)
        prev = v
        prevCsa = r.csa
      }
    }
  }
}

// The buried columns the calculator was missing must be present on both
// armoured tables, and those tables must declare the 20 °C ground ambient.
for (const sel of [PVC_SWA, XLPE_SWA]) {
  const t = findTable(sel)!
  if (!methodsFor(sel).includes('D')) fail(`${t.id}: Method D missing`)
  if (t.groundAmbient !== 20) fail(`${t.id}: expected 20 °C ground ambient, got ${t.groundAmbient}`)
}

// Non-armoured tables must not claim buried ratings they do not publish.
for (const sel of [PVC_MC, XLPE_MC, PVC_SC, XLPE_SC]) {
  const t = findTable(sel)!
  if (methodsFor(sel).includes('D')) fail(`${t.id}: has Method D but the standard's table does not`)
}

if (failures) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nAll Appendix 4 checks passed')
