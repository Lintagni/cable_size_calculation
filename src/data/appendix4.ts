/**
 * BS7671:2018+A2 Appendix 4 current-carrying capacity tables.
 *
 * TRANSCRIBED 2026-09-05 from BS7671:2018+A2 pages 447–463 (Appendix 4).
 * This module replaces the rating data in `cableTables.ts`, which had three
 * defects found while building the /verification page:
 *
 *  1. Table identities were wrong. The old `table4D1A` held multicore data,
 *     but 4D1A is the SINGLE-CORE table; multicore is 4D2A. The tables labelled
 *     4D3A/4D4A/4E3A/4E4A held aluminium data, but those IDs belong to ARMOURED
 *     COPPER in the standard — aluminium is the 4H/4J series.
 *
 *  2. Columns A1/A2/B1/B2 were treated as separate installation methods. In
 *     Appendix 4 those sub-columns are the CONDUCTOR COUNT: "1 two-core cable,
 *     single-phase AC or DC" versus "1 three- or four-core cable, three-phase
 *     AC". The old model collapsed them and used the two-core figure for every
 *     circuit, so three-phase circuits were rated against the single-phase
 *     column — non-conservative by 10–15%. At 25 mm² method C the old data gave
 *     110 A where the standard gives 96 A for three-phase.
 *
 *  3. No table carried the Method D (buried) columns, so every buried
 *     installation silently returned "no tabulated rating".
 *
 * Hence the shape below: ratings are keyed by method AND by conductor count.
 *
 * VERIFICATION STATUS: transcribed by reading the scanned standard, then
 * spot-checked by `scripts/verify-appendix4.ts`. It has NOT been independently
 * checked by a second person against a printed copy. Do that before treating
 * these numbers as authoritative, and never estimate a missing value —
 * `undefined` correctly means "no rating published for this combination".
 */

import type { InsulationType, CableConfig, ConductorMaterial } from './cableTables'

/** Appendix 4 installation reference methods used by these tables. */
export type Ap4Method = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

/**
 * The two conductor-count columns every Appendix 4 rating table carries.
 * `c2` = one two-core cable, single-phase AC or DC.
 * `c3` = one three- or four-core cable, three-phase AC.
 */
export interface Rating {
  c2?: number
  c3?: number
}

export interface Ap4Row {
  csa: number
  ratings: Partial<Record<Ap4Method, Rating>>
}

export interface Ap4Table {
  id: string
  title: string
  insulation: InsulationType
  config: CableConfig
  material: ConductorMaterial
  armoured: boolean
  /** Ground ambient for the buried Method D columns, where the table has them. */
  groundAmbient?: number
  rows: Ap4Row[]
}

/** Compact row builder: [csa, {method: [c2, c3]}] keeps the tables readable. */
function row(csa: number, spec: Partial<Record<Ap4Method, [number | null, number | null]>>): Ap4Row {
  const ratings: Partial<Record<Ap4Method, Rating>> = {}
  for (const [m, pair] of Object.entries(spec)) {
    const [c2, c3] = pair as [number | null, number | null]
    ratings[m as Ap4Method] = {
      ...(c2 === null ? {} : { c2 }),
      ...(c3 === null ? {} : { c3 }),
    }
  }
  return { csa, ratings }
}

// ── Table 4D1A ──────────────────────────────────────────────────────────────
// Single-core 70 °C thermoplastic (PVC), non-armoured, copper. Ambient 30 °C.
// Method F uses column 8 (2 cables flat, touching) for single-phase and
// column 10 (3 cables trefoil) for three-phase — trefoil is the lower of the
// published flat/trefoil pair, so this is the conservative reading.
export const table4D1A: Ap4Table = {
  id: '4D1A',
  title: 'Single-core 70 °C thermoplastic insulated cables, non-armoured',
  insulation: 'PVC', config: 'single-core', material: 'copper', armoured: false,
  rows: [
    row(1,    { A: [11, 10.5],   B: [13.5, 12],   C: [15.5, 14] }),
    row(1.5,  { A: [14.5, 13.5], B: [17.5, 15.5], C: [20, 18] }),
    row(2.5,  { A: [20, 18],     B: [24, 21],     C: [27, 25] }),
    row(4,    { A: [26, 24],     B: [32, 28],     C: [37, 33] }),
    row(6,    { A: [34, 31],     B: [41, 36],     C: [47, 43] }),
    row(10,   { A: [46, 42],     B: [57, 50],     C: [65, 59] }),
    row(16,   { A: [61, 56],     B: [76, 68],     C: [87, 79] }),
    row(25,   { A: [80, 73],     B: [101, 89],    C: [114, 104], F: [131, 110] }),
    row(35,   { A: [99, 89],     B: [125, 110],   C: [141, 129], F: [162, 137] }),
    row(50,   { A: [119, 108],   B: [151, 134],   C: [182, 167], F: [196, 167] }),
    row(70,   { A: [151, 136],   B: [192, 171],   C: [234, 214], F: [251, 216] }),
    row(95,   { A: [182, 164],   B: [232, 207],   C: [284, 261], F: [304, 264] }),
    row(120,  { A: [210, 188],   B: [269, 239],   C: [330, 303], F: [352, 308] }),
    row(150,  { A: [240, 216],   B: [300, 262],   C: [381, 349], F: [406, 356] }),
    row(185,  { A: [273, 245],   B: [341, 296],   C: [436, 400], F: [463, 409] }),
    row(240,  { A: [321, 286],   B: [400, 346],   C: [515, 472], F: [546, 485] }),
    row(300,  { A: [367, 328],   B: [458, 394],   C: [594, 545], F: [629, 561] }),
    row(400,  { A: [null, null], B: [546, 467],   C: [694, 634], F: [754, 656] }),
  ],
}

// ── Table 4D2A ──────────────────────────────────────────────────────────────
// Multicore 70 °C thermoplastic (PVC), non-armoured, copper. Ambient 30 °C.
// The E column for 300 and 400 mm² three-phase was not legible in the scan and
// is deliberately left out rather than guessed.
export const table4D2A: Ap4Table = {
  id: '4D2A',
  title: 'Multicore 70 °C thermoplastic insulated and sheathed cables, non-armoured',
  insulation: 'PVC', config: 'multicore', material: 'copper', armoured: false,
  rows: [
    row(1,    { A: [11, 10],     B: [13, 11.5],   C: [15, 13.5],   E: [17, 14.5] }),
    row(1.5,  { A: [14, 13],     B: [16.5, 15],   C: [19.5, 17.5], E: [22, 18.5] }),
    row(2.5,  { A: [18.5, 17.5], B: [23, 20],     C: [27, 24],     E: [30, 25] }),
    row(4,    { A: [25, 23],     B: [30, 27],     C: [36, 32],     E: [40, 34] }),
    row(6,    { A: [32, 29],     B: [38, 34],     C: [46, 41],     E: [51, 43] }),
    row(10,   { A: [43, 39],     B: [52, 46],     C: [63, 57],     E: [70, 60] }),
    row(16,   { A: [57, 52],     B: [69, 62],     C: [85, 76],     E: [94, 80] }),
    row(25,   { A: [75, 68],     B: [90, 80],     C: [112, 96],    E: [119, 101] }),
    row(35,   { A: [92, 83],     B: [111, 99],    C: [138, 119],   E: [148, 126] }),
    row(50,   { A: [110, 99],    B: [133, 118],   C: [168, 144],   E: [180, 153] }),
    row(70,   { A: [139, 125],   B: [168, 149],   C: [213, 184],   E: [232, 196] }),
    row(95,   { A: [167, 150],   B: [201, 179],   C: [258, 223],   E: [282, 238] }),
    row(120,  { A: [192, 172],   B: [232, 206],   C: [299, 259],   E: [328, 276] }),
    row(150,  { A: [219, 196],   B: [258, 225],   C: [344, 299],   E: [379, 319] }),
    row(185,  { A: [248, 223],   B: [294, 255],   C: [392, 341],   E: [434, 364] }),
    row(240,  { A: [291, 261],   B: [344, 297],   C: [461, 403],   E: [514, 430] }),
    row(300,  { A: [334, 298],   B: [394, 339],   C: [530, 464],   E: [593, null] }),
    row(400,  { A: [null, null], B: [470, 402],   C: [634, 557],   E: [715, null] }),
  ],
}

// ── Table 4D4A ──────────────────────────────────────────────────────────────
// Multicore ARMOURED 70 °C thermoplastic (PVC), copper. This is the SWA table,
// and the one that carries Method D — the buried case the calculator could not
// previously do at all. Ground ambient is 20 °C, not 30 °C.
export const table4D4A: Ap4Table = {
  id: '4D4A',
  title: 'Multicore armoured 70 °C thermoplastic insulated cables',
  insulation: 'PVC', config: 'multicore', material: 'copper', armoured: true,
  groundAmbient: 20,
  rows: [
    row(1.5, { C: [21, 18],   E: [22, 19],   D: [22, 18] }),
    row(2.5, { C: [28, 25],   E: [31, 26],   D: [29, 24] }),
    row(4,   { C: [38, 33],   E: [41, 35],   D: [37, 30] }),
    row(6,   { C: [49, 42],   E: [53, 45],   D: [46, 38] }),
    row(10,  { C: [67, 58],   E: [72, 62],   D: [60, 50] }),
    row(16,  { C: [89, 77],   E: [97, 83],   D: [78, 64] }),
    row(25,  { C: [118, 102], E: [128, 110], D: [99, 82] }),
    row(35,  { C: [145, 125], E: [157, 135], D: [119, 98] }),
    row(50,  { C: [175, 151], E: [190, 163], D: [140, 116] }),
    row(70,  { C: [222, 192], E: [241, 207], D: [173, 143] }),
    row(95,  { C: [269, 231], E: [291, 251], D: [204, 169] }),
    row(120, { C: [310, 267], E: [336, 290], D: [231, 192] }),
    row(150, { C: [356, 306], E: [386, 332], D: [261, 217] }),
    row(185, { C: [405, 348], E: [439, 378], D: [292, 243] }),
    row(240, { C: [476, 409], E: [516, 445], D: [336, 280] }),
    row(300, { C: [547, 469], E: [592, 510], D: [379, 316] }),
  ],
}

// ── Table 4E1A ──────────────────────────────────────────────────────────────
// Single-core 90 °C thermosetting (XLPE), non-armoured, copper. Ambient 30 °C.
export const table4E1A: Ap4Table = {
  id: '4E1A',
  title: 'Single-core 90 °C thermosetting insulated cables, non-armoured',
  insulation: 'XLPE', config: 'single-core', material: 'copper', armoured: false,
  rows: [
    row(1,    { A: [14, 13],     B: [17, 15],   C: [19, 17.5] }),
    row(1.5,  { A: [19, 17],     B: [23, 20],   C: [25, 23] }),
    row(2.5,  { A: [26, 23],     B: [31, 28],   C: [34, 31] }),
    row(4,    { A: [35, 31],     B: [42, 37],   C: [46, 41] }),
    row(6,    { A: [45, 40],     B: [54, 48],   C: [59, 54] }),
    row(10,   { A: [61, 54],     B: [75, 66],   C: [81, 74] }),
    row(16,   { A: [81, 73],     B: [100, 88],  C: [109, 99] }),
    row(25,   { A: [106, 95],    B: [133, 117], C: [143, 130], F: [161, 135] }),
    row(35,   { A: [131, 117],   B: [164, 144], C: [176, 161], F: [200, 169] }),
    row(50,   { A: [158, 141],   B: [198, 175], C: [228, 209], F: [242, 207] }),
    row(70,   { A: [200, 179],   B: [253, 222], C: [293, 268], F: [310, 268] }),
    row(95,   { A: [241, 216],   B: [306, 269], C: [355, 326], F: [377, 328] }),
    row(120,  { A: [278, 249],   B: [354, 312], C: [413, 379], F: [437, 383] }),
    row(150,  { A: [318, 285],   B: [393, 342], C: [476, 436], F: [504, 444] }),
    row(185,  { A: [362, 324],   B: [449, 384], C: [545, 500], F: [575, 510] }),
    row(240,  { A: [424, 380],   B: [528, 450], C: [644, 590], F: [679, 607] }),
    row(300,  { A: [486, 435],   B: [603, 514], C: [743, 681], F: [783, 703] }),
    row(400,  { A: [null, null], B: [683, 584], C: [868, 793], F: [940, 823] }),
  ],
}

// ── Table 4E2A ──────────────────────────────────────────────────────────────
// Multicore 90 °C thermosetting (XLPE), non-armoured, copper. Ambient 30 °C.
export const table4E2A: Ap4Table = {
  id: '4E2A',
  title: 'Multicore 90 °C thermosetting insulated cables, non-armoured',
  insulation: 'XLPE', config: 'multicore', material: 'copper', armoured: false,
  rows: [
    row(1,    { A: [14.5, 13],   B: [17, 15],   C: [19, 17],   E: [21, 18] }),
    row(1.5,  { A: [18.5, 16.5], B: [22, 19.5], C: [24, 22],   E: [26, 23] }),
    row(2.5,  { A: [25, 22],     B: [30, 26],   C: [33, 30],   E: [36, 32] }),
    row(4,    { A: [33, 30],     B: [40, 35],   C: [45, 40],   E: [49, 42] }),
    row(6,    { A: [42, 38],     B: [51, 44],   C: [58, 52],   E: [63, 54] }),
    row(10,   { A: [57, 51],     B: [69, 60],   C: [80, 71],   E: [86, 75] }),
    row(16,   { A: [76, 68],     B: [91, 80],   C: [107, 96],  E: [115, 100] }),
    row(25,   { A: [99, 89],     B: [119, 105], C: [138, 119], E: [149, 127] }),
    row(35,   { A: [121, 109],   B: [146, 128], C: [171, 147], E: [185, 158] }),
    row(50,   { A: [145, 130],   B: [175, 154], C: [209, 179], E: [225, 192] }),
    row(70,   { A: [183, 164],   B: [221, 194], C: [269, 229], E: [289, 246] }),
    row(95,   { A: [220, 197],   B: [265, 233], C: [328, 278], E: [352, 298] }),
    row(120,  { A: [253, 227],   B: [305, 268], C: [382, 322], E: [410, 346] }),
    row(150,  { A: [290, 259],   B: [334, 300], C: [441, 371], E: [473, 399] }),
    row(185,  { A: [329, 295],   B: [384, 340], C: [506, 424], E: [542, 456] }),
    row(240,  { A: [386, 346],   B: [459, 398], C: [599, 500], E: [641, 538] }),
    row(300,  { A: [442, 396],   B: [532, 455], C: [693, 576], E: [741, null] }),
    row(400,  { A: [null, null], B: [625, 536], C: [803, 667], E: [865, null] }),
  ],
}

// ── Table 4E4A ──────────────────────────────────────────────────────────────
// Multicore ARMOURED 90 °C thermosetting (XLPE), copper — XLPE/SWA/PVC to
// BS5467, with Method D. Ground ambient 20 °C.
export const table4E4A: Ap4Table = {
  id: '4E4A',
  title: 'Multicore armoured 90 °C thermosetting insulated cables',
  insulation: 'XLPE', config: 'multicore', material: 'copper', armoured: true,
  groundAmbient: 20,
  rows: [
    row(1.5, { C: [27, 23],   E: [29, 25],   D: [25, 21] }),
    row(2.5, { C: [36, 31],   E: [39, 33],   D: [33, 28] }),
    row(4,   { C: [49, 42],   E: [52, 44],   D: [43, 36] }),
    row(6,   { C: [62, 53],   E: [66, 56],   D: [53, 44] }),
    row(10,  { C: [85, 73],   E: [90, 78],   D: [71, 58] }),
    row(16,  { C: [110, 94],  E: [115, 99],  D: [91, 75] }),
    row(25,  { C: [146, 124], E: [152, 131], D: [116, 96] }),
    row(35,  { C: [180, 154], E: [188, 162], D: [139, 115] }),
    row(50,  { C: [219, 187], E: [228, 197], D: [164, 135] }),
    row(70,  { C: [279, 238], E: [291, 251], D: [203, 167] }),
    row(95,  { C: [338, 289], E: [354, 304], D: [239, 197] }),
    row(120, { C: [392, 335], E: [410, 353], D: [271, 223] }),
    row(150, { C: [451, 386], E: [472, 406], D: [306, 251] }),
    row(185, { C: [515, 441], E: [539, 463], D: [343, 281] }),
    row(240, { C: [607, 520], E: [636, 546], D: [395, 324] }),
    row(300, { C: [698, 599], E: [732, 628], D: [446, 365] }),
  ],
}

export const AP4_TABLES: Ap4Table[] = [
  table4D1A, table4D2A, table4D4A, table4E1A, table4E2A, table4E4A,
]

export interface CableSelector {
  insulation: InsulationType
  config: CableConfig
  material?: ConductorMaterial
  armoured?: boolean
}

/**
 * The table matching a cable description, or undefined when the standard's
 * data for that combination has not been transcribed yet.
 *
 * Aluminium (the Appendix 4 tables in the 4H and 4J series) is not yet
 * transcribed and returns undefined — callers must treat that as "cannot
 * size", never as zero.
 */
export function findTable(sel: CableSelector): Ap4Table | undefined {
  const material = sel.material ?? 'copper'
  const armoured = sel.armoured ?? false
  return AP4_TABLES.find(t =>
    t.insulation === sel.insulation
    && t.config === sel.config
    && t.material === material
    && t.armoured === armoured,
  )
}

/**
 * Tabulated rating It for one size, or undefined if the standard publishes no
 * figure for that combination.
 *
 * `phases` picks the column: 1 → the two-core single-phase column, 3 → the
 * three/four-core three-phase column. Getting this wrong is what made the old
 * data non-conservative for every three-phase circuit.
 */
export function tabulatedRating(
  sel: CableSelector,
  csa: number,
  method: Ap4Method,
  phases: 1 | 3,
): number | undefined {
  const table = findTable(sel)
  const rating = table?.rows.find(r => r.csa === csa)?.ratings[method]
  return phases === 3 ? rating?.c3 : rating?.c2
}

/** Methods this cable type has published ratings for, in Appendix 4 order. */
export function methodsFor(sel: CableSelector, phases: 1 | 3 = 3): Ap4Method[] {
  const table = findTable(sel)
  if (!table) return []
  const order: Ap4Method[] = ['A', 'B', 'C', 'D', 'E', 'F']
  return order.filter(m =>
    table.rows.some(r => (phases === 3 ? r.ratings[m]?.c3 : r.ratings[m]?.c2) !== undefined),
  )
}

/** Sizes with at least one published rating, ascending. */
export function sizesFor(sel: CableSelector): number[] {
  return findTable(sel)?.rows.map(r => r.csa) ?? []
}
