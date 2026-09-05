import { methodsFor } from './appendix4';
// BS7671:2018+A2 Appendix 4 — voltage drop data, correction-factor helpers and
// shared types.
//
// The current-RATING tables that used to live here were removed on 2026-09-05:
// their table IDs did not match BS7671 (the multicore data sat under 4D1A,
// which is the single-core table; aluminium sat under 4D3A/4D4A, which are
// armoured copper), and they collapsed the standard's two-core / three-core
// columns into one figure, so three-phase circuits were rated against the
// single-phase column. Ratings now come from src/data/appendix4.ts.

export type InsulationType = 'PVC' | 'XLPE';
export type ConductorMaterial = 'copper' | 'aluminium';
export type CableConfig = 'single-core' | 'multicore';

export interface CableTableEntry {
  csa: number; // cross-sectional area mm²
  // Reference methods: A1, A2, B1, B2, C, D1, D2, E, F, G
  A1?: number; A2?: number; B1?: number; B2?: number;
  C?: number; D1?: number; D2?: number; E?: number; F?: number; G?: number;
}

// Voltage drop tables mV/A/m (r, x, z) from BS7671 Appendix 4
// Format: { csa, r, x, z } — z is the value used for power factor 0.8 circuits
// PVC multicore copper (Table 4D1B column 3)
export interface VdropEntry {
  csa: number;
  r: number; // mV/A/m resistive component
  x: number; // mV/A/m reactive component
  z: number; // mV/A/m impedance (combined, at pf 0.8)
}

export const vdropPVCMulticore: VdropEntry[] = [
  { csa: 1,    r: 44,   x: 0.18, z: 44   },
  { csa: 1.5,  r: 29,   x: 0.177,z: 29   },
  { csa: 2.5,  r: 18,   x: 0.171,z: 18   },
  { csa: 4,    r: 11,   x: 0.167,z: 11   },
  { csa: 6,    r: 7.3,  x: 0.164,z: 7.3  },
  { csa: 10,   r: 4.4,  x: 0.16, z: 4.4  },
  { csa: 16,   r: 2.8,  x: 0.159,z: 2.8  },
  { csa: 25,   r: 1.75, x: 0.157,z: 1.75 },
  { csa: 35,   r: 1.25, x: 0.156,z: 1.25 },
  { csa: 50,   r: 0.93, x: 0.155,z: 0.93 },
  { csa: 70,   r: 0.63, x: 0.154,z: 0.64 },
  { csa: 95,   r: 0.47, x: 0.153,z: 0.48 },
  { csa: 120,  r: 0.37, x: 0.153,z: 0.39 },
  { csa: 150,  r: 0.30, x: 0.152,z: 0.33 },
  { csa: 185,  r: 0.245,x: 0.151,z: 0.29 },
  { csa: 240,  r: 0.19, x: 0.15, z: 0.24 },
  { csa: 300,  r: 0.154,x: 0.15, z: 0.21 },
];

// XLPE multicore copper (Table 4E1B column 3)
export const vdropXLPEMulticore: VdropEntry[] = [
  { csa: 1,    r: 44,   x: 0.18, z: 44   },
  { csa: 1.5,  r: 29,   x: 0.177,z: 29   },
  { csa: 2.5,  r: 18,   x: 0.171,z: 18   },
  { csa: 4,    r: 11,   x: 0.167,z: 11   },
  { csa: 6,    r: 7.3,  x: 0.164,z: 7.3  },
  { csa: 10,   r: 4.4,  x: 0.16, z: 4.4  },
  { csa: 16,   r: 2.8,  x: 0.159,z: 2.8  },
  { csa: 25,   r: 1.75, x: 0.157,z: 1.75 },
  { csa: 35,   r: 1.25, x: 0.156,z: 1.25 },
  { csa: 50,   r: 0.93, x: 0.155,z: 0.93 },
  { csa: 70,   r: 0.63, x: 0.154,z: 0.64 },
  { csa: 95,   r: 0.47, x: 0.153,z: 0.48 },
  { csa: 120,  r: 0.37, x: 0.153,z: 0.39 },
  { csa: 150,  r: 0.28, x: 0.152,z: 0.32 },
  { csa: 185,  r: 0.23, x: 0.151,z: 0.28 },
  { csa: 240,  r: 0.175,x: 0.15, z: 0.23 },
  { csa: 300,  r: 0.135,x: 0.16, z: 0.21 },
];

// XLPE single-core copper (Table 4E2B)
export const vdropXLPESingleCore: VdropEntry[] = [
  { csa: 1,    r: 44,   x: 0.18, z: 44   },
  { csa: 1.5,  r: 29,   x: 0.177,z: 29   },
  { csa: 2.5,  r: 18,   x: 0.171,z: 18   },
  { csa: 4,    r: 11,   x: 0.167,z: 11   },
  { csa: 6,    r: 7.3,  x: 0.164,z: 7.3  },
  { csa: 10,   r: 4.4,  x: 0.16, z: 4.4  },
  { csa: 16,   r: 2.4,  x: 0.14, z: 2.4  },
  { csa: 25,   r: 1.5,  x: 0.135,z: 1.5  },
  { csa: 35,   r: 1.1,  x: 0.13, z: 1.1  },
  { csa: 50,   r: 0.8,  x: 0.13, z: 0.81 },
  { csa: 70,   r: 0.55, x: 0.125,z: 0.57 },
  { csa: 95,   r: 0.4,  x: 0.13, z: 0.43 },
  { csa: 120,  r: 0.32, x: 0.125,z: 0.35 },
  { csa: 150,  r: 0.26, x: 0.125,z: 0.30 },
  { csa: 185,  r: 0.21, x: 0.125,z: 0.25 },
  { csa: 240,  r: 0.165,x: 0.12, z: 0.21 },
  { csa: 300,  r: 0.135,x: 0.16, z: 0.21 },
  { csa: 400,  r: 0.1,  x: 0.115,z: 0.15 },
];

// ─── ALUMINIUM CONDUCTOR TABLES ────────────────────────────────────────────
// Aluminium minimum size is 16mm² per BS7671 Table 54.7 (fixed wiring)

// Voltage drop for aluminium multicore PVC (Table 4D3B — approximate from BS7671)
// Al resistivity ~1.64× Cu at operating temp; reactive component unchanged
export const vdropPVCMulticoreAl: VdropEntry[] = [
  { csa: 16,  r: 4.6,  x: 0.159, z: 4.6  },
  { csa: 25,  r: 2.9,  x: 0.157, z: 2.9  },
  { csa: 35,  r: 2.05, x: 0.156, z: 2.05 },
  { csa: 50,  r: 1.53, x: 0.155, z: 1.53 },
  { csa: 70,  r: 1.04, x: 0.154, z: 1.05 },
  { csa: 95,  r: 0.77, x: 0.153, z: 0.79 },
  { csa: 120, r: 0.61, x: 0.153, z: 0.63 },
  { csa: 150, r: 0.49, x: 0.152, z: 0.51 },
  { csa: 185, r: 0.40, x: 0.151, z: 0.43 },
  { csa: 240, r: 0.31, x: 0.150, z: 0.34 },
  { csa: 300, r: 0.25, x: 0.150, z: 0.29 },
];

// Voltage drop for aluminium multicore XLPE (Table 4E3B — approximate)
export const vdropXLPEMulticoreAl: VdropEntry[] = [
  { csa: 16,  r: 4.6,  x: 0.159, z: 4.6  },
  { csa: 25,  r: 2.88, x: 0.157, z: 2.88 },
  { csa: 35,  r: 2.06, x: 0.156, z: 2.06 },
  { csa: 50,  r: 1.53, x: 0.155, z: 1.53 },
  { csa: 70,  r: 1.04, x: 0.154, z: 1.05 },
  { csa: 95,  r: 0.77, x: 0.153, z: 0.79 },
  { csa: 120, r: 0.61, x: 0.153, z: 0.63 },
  { csa: 150, r: 0.46, x: 0.152, z: 0.49 },
  { csa: 185, r: 0.38, x: 0.151, z: 0.41 },
  { csa: 240, r: 0.29, x: 0.150, z: 0.32 },
  { csa: 300, r: 0.22, x: 0.150, z: 0.26 },
];

export const STANDARD_CSA_SIZES = [1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400];
export const ALUMINIUM_CSA_SIZES = [16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400];

export const REFERENCE_METHODS = [
  { code: 'A', description: 'Enclosed in conduit in a thermally insulating wall' },
  { code: 'B', description: 'Enclosed in conduit on a wall or in trunking' },
  { code: 'C', description: 'Clipped direct' },
  { code: 'D', description: 'Direct in ground or in ducting in ground' },
  { code: 'E', description: 'In free air or on a perforated tray (multicore)' },
  { code: 'F', description: 'In free air or on a perforated tray (single-core)' },
];

/**
 * Reference methods the loaded Appendix 4 data can actually serve.
 *
 * Delegates to src/data/appendix4.ts, which holds the corrected transcription.
 * Offering a method with no tabulated column produces a silent "no rating"
 * dead end, so every method dropdown filters through this.
 */
export function supportedMethods(
  insulation: InsulationType,
  config: CableConfig,
  material: ConductorMaterial = 'copper',
  armoured = false,
  phases: 1 | 3 = 3,
): string[] {
  return methodsFor({ insulation, config, material, armoured }, phases);
}
