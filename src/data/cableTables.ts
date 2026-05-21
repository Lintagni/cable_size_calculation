// BS7671:2018+A2 Appendix 4 cable current rating data

export type InsulationType = 'PVC' | 'XLPE';
export type ConductorMaterial = 'copper' | 'aluminium';
export type CableConfig = 'single-core' | 'multicore';

export interface CableTableEntry {
  csa: number; // cross-sectional area mm²
  // Reference methods: A1, A2, B1, B2, C, D1, D2, E, F, G
  A1?: number; A2?: number; B1?: number; B2?: number;
  C?: number; D1?: number; D2?: number; E?: number; F?: number; G?: number;
}

// Table 4D1A: Multicore PVC 70°C copper (2 or 3 conductors loaded)
export const table4D1A: CableTableEntry[] = [
  { csa: 1,    A1: 11,  A2: 10.5, B1: 13,  B2: 12.5, C: 15  },
  { csa: 1.5,  A1: 14.5,A2: 13.5, B1: 16.5,B2: 15.5, C: 19.5 },
  { csa: 2.5,  A1: 19.5,A2: 18.5, B1: 23,  B2: 21,   C: 27  },
  { csa: 4,    A1: 26,  A2: 25,   B1: 30,  B2: 28,   C: 36  },
  { csa: 6,    A1: 34,  A2: 32,   B1: 38,  B2: 35,   C: 46  },
  { csa: 10,   A1: 46,  A2: 43,   B1: 52,  B2: 48,   C: 63  },
  { csa: 16,   A1: 61,  A2: 57,   B1: 69,  B2: 64,   C: 85  },
  { csa: 25,   A1: 80,  A2: 75,   B1: 90,  B2: 84,   C: 110 },
  { csa: 35,   A1: 99,  A2: 92,   B1: 111, B2: 103,  C: 133 },
  { csa: 50,   A1: 119, A2: 110,  B1: 133, B2: 124,  C: 159 },
  { csa: 70,   A1: 151, A2: 139,  B1: 168, B2: 156,  C: 200 },
  { csa: 95,   A1: 182, A2: 167,  B1: 201, B2: 188,  C: 241 },
  { csa: 120,  A1: 210, A2: 192,  B1: 232, B2: 216,  C: 278 },
  { csa: 150,  A1: 240, A2: 219,  B1: 258, B2: 245,  C: 318 },
  { csa: 185,  A1: 273, A2: 248,  B1: 294, B2: 278,  C: 362 },
  { csa: 240,  A1: 321, A2: 291,  B1: 344, B2: 325,  C: 424 },
  { csa: 300,  A1: 367, A2: 334,  B1: 394, B2: 371,  C: 486 },
];

// Table 4D2A: Single-core PVC 70°C copper, in free air (ref E & F)
export const table4D2A: CableTableEntry[] = [
  { csa: 1,    E: 15,  F: 15  },
  { csa: 1.5,  E: 19.5,F: 19.5 },
  { csa: 2.5,  E: 27,  F: 27  },
  { csa: 4,    E: 36,  F: 36  },
  { csa: 6,    E: 46,  F: 46  },
  { csa: 10,   E: 63,  F: 63  },
  { csa: 16,   E: 85,  F: 85  },
  { csa: 25,   E: 110, F: 114 },
  { csa: 35,   E: 133, F: 141 },
  { csa: 50,   E: 159, F: 170 },
  { csa: 70,   E: 200, F: 213 },
  { csa: 95,   E: 241, F: 256 },
  { csa: 120,  E: 278, F: 293 },
  { csa: 150,  E: 318, F: 336 },
  { csa: 185,  E: 362, F: 383 },
  { csa: 240,  E: 424, F: 449 },
  { csa: 300,  E: 486, F: 515 },
  { csa: 400,  E: 561, F: 600 },
];

// Table 4E1A: Multicore XLPE 90°C copper (2 or 3 conductors loaded)
export const table4E1A: CableTableEntry[] = [
  { csa: 1,    A1: 13,  A2: 12.5, B1: 15,  B2: 14.5, C: 17.5 },
  { csa: 1.5,  A1: 17,  A2: 16,   B1: 19.5,B2: 18.5, C: 23  },
  { csa: 2.5,  A1: 23,  A2: 22,   B1: 27,  B2: 25,   C: 31  },
  { csa: 4,    A1: 31,  A2: 30,   B1: 36,  B2: 34,   C: 42  },
  { csa: 6,    A1: 40,  A2: 38,   B1: 46,  B2: 43,   C: 54  },
  { csa: 10,   A1: 54,  A2: 51,   B1: 63,  B2: 59,   C: 73  },
  { csa: 16,   A1: 73,  A2: 68,   B1: 85,  B2: 79,   C: 98  },
  { csa: 25,   A1: 95,  A2: 89,   B1: 112, B2: 104,  C: 129 },
  { csa: 35,   A1: 117, A2: 110,  B1: 138, B2: 129,  C: 158 },
  { csa: 50,   A1: 141, A2: 132,  B1: 168, B2: 154,  C: 191 },
  { csa: 70,   A1: 179, A2: 167,  B1: 213, B2: 194,  C: 246 },
  { csa: 95,   A1: 216, A2: 202,  B1: 258, B2: 233,  C: 298 },
  { csa: 120,  A1: 249, A2: 233,  B1: 299, B2: 268,  C: 346 },
  { csa: 150,  A1: 285, A2: 265,  B1: 344, B2: 300,  C: 395 },
  { csa: 185,  A1: 324, A2: 300,  B1: 392, B2: 341,  C: 450 },
  { csa: 240,  A1: 380, A2: 351,  B1: 461, B2: 400,  C: 530 },
  { csa: 300,  A1: 435, A2: 402,  B1: 530, B2: 460,  C: 610 },
];

// Table 4E2A: Single-core XLPE 90°C copper, in free air (ref E & F)
export const table4E2A: CableTableEntry[] = [
  { csa: 1,    E: 17.5, F: 17.5 },
  { csa: 1.5,  E: 23,   F: 23  },
  { csa: 2.5,  E: 31,   F: 31  },
  { csa: 4,    E: 42,   F: 42  },
  { csa: 6,    E: 54,   F: 54  },
  { csa: 10,   E: 73,   F: 73  },
  { csa: 16,   E: 98,   F: 98  },
  { csa: 25,   E: 129,  F: 134 },
  { csa: 35,   E: 158,  F: 167 },
  { csa: 50,   E: 191,  F: 201 },
  { csa: 70,   E: 246,  F: 261 },
  { csa: 95,   E: 298,  F: 315 },
  { csa: 120,  E: 346,  F: 364 },
  { csa: 150,  E: 395,  F: 416 },
  { csa: 185,  E: 450,  F: 473 },
  { csa: 240,  E: 530,  F: 558 },
  { csa: 300,  E: 610,  F: 642 },
  { csa: 400,  E: 718,  F: 754 },
];

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

// Table 4D3A: Multicore PVC 70°C aluminium (2 or 3 conductors loaded)
export const table4D3A: CableTableEntry[] = [
  { csa: 16,  A1: 47,  A2: 44,  B1: 55,  B2: 51,  C: 65  },
  { csa: 25,  A1: 62,  A2: 58,  B1: 73,  B2: 68,  C: 86  },
  { csa: 35,  A1: 77,  A2: 72,  B1: 89,  B2: 83,  C: 104 },
  { csa: 50,  A1: 92,  A2: 86,  B1: 108, B2: 99,  C: 123 },
  { csa: 70,  A1: 116, A2: 108, B1: 136, B2: 125, C: 154 },
  { csa: 95,  A1: 139, A2: 130, B1: 163, B2: 150, C: 185 },
  { csa: 120, A1: 160, A2: 150, B1: 188, B2: 172, C: 212 },
  { csa: 150, A1: 182, A2: 169, B1: 212, B2: 194, C: 240 },
  { csa: 185, A1: 207, A2: 192, B1: 245, B2: 222, C: 271 },
  { csa: 240, A1: 242, A2: 224, B1: 285, B2: 258, C: 317 },
  { csa: 300, A1: 278, A2: 255, B1: 326, B2: 294, C: 362 },
];

// Table 4D4A: Single-core PVC 70°C aluminium (in free air, ref E & F)
export const table4D4A: CableTableEntry[] = [
  { csa: 16,  E: 65,  F: 65  },
  { csa: 25,  E: 86,  F: 90  },
  { csa: 35,  E: 104, F: 110 },
  { csa: 50,  E: 123, F: 130 },
  { csa: 70,  E: 154, F: 163 },
  { csa: 95,  E: 185, F: 196 },
  { csa: 120, E: 212, F: 225 },
  { csa: 150, E: 240, F: 255 },
  { csa: 185, E: 271, F: 288 },
  { csa: 240, E: 317, F: 337 },
  { csa: 300, E: 362, F: 385 },
  { csa: 400, E: 415, F: 445 },
];

// Table 4E3A: Multicore XLPE 90°C aluminium (2 or 3 conductors loaded)
export const table4E3A: CableTableEntry[] = [
  { csa: 16,  A1: 57,  A2: 53,  B1: 68,  B2: 63,  C: 80  },
  { csa: 25,  A1: 76,  A2: 71,  B1: 89,  B2: 82,  C: 106 },
  { csa: 35,  A1: 94,  A2: 88,  B1: 110, B2: 102, C: 130 },
  { csa: 50,  A1: 113, A2: 105, B1: 134, B2: 121, C: 156 },
  { csa: 70,  A1: 143, A2: 133, B1: 171, B2: 155, C: 200 },
  { csa: 95,  A1: 172, A2: 160, B1: 207, B2: 188, C: 241 },
  { csa: 120, A1: 199, A2: 185, B1: 240, B2: 218, C: 279 },
  { csa: 150, A1: 227, A2: 210, B1: 278, B2: 250, C: 318 },
  { csa: 185, A1: 259, A2: 240, B1: 317, B2: 285, C: 362 },
  { csa: 240, A1: 305, A2: 281, B1: 374, B2: 336, C: 428 },
  { csa: 300, A1: 351, A2: 323, B1: 431, B2: 388, C: 493 },
];

// Table 4E4A: Single-core XLPE 90°C aluminium (in free air, ref E & F)
export const table4E4A: CableTableEntry[] = [
  { csa: 16,  E: 80,  F: 80  },
  { csa: 25,  E: 106, F: 110 },
  { csa: 35,  E: 130, F: 137 },
  { csa: 50,  E: 156, F: 166 },
  { csa: 70,  E: 200, F: 213 },
  { csa: 95,  E: 241, F: 256 },
  { csa: 120, E: 279, F: 295 },
  { csa: 150, E: 318, F: 336 },
  { csa: 185, E: 362, F: 384 },
  { csa: 240, E: 428, F: 455 },
  { csa: 300, E: 493, F: 524 },
  { csa: 400, E: 571, F: 609 },
];

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
  { code: 'A1', description: 'Enclosed in insulated wall (clipped multicore)' },
  { code: 'A2', description: 'Enclosed in insulated wall (multicore in conduit)' },
  { code: 'B1', description: 'Enclosed in conduit on wall (single-core)' },
  { code: 'B2', description: 'Enclosed in conduit on wall (multicore)' },
  { code: 'C',  description: 'Clipped direct to non-metallic surface' },
  { code: 'D1', description: 'In duct in ground (single)' },
  { code: 'D2', description: 'In duct in ground (multicore)' },
  { code: 'E',  description: 'Free air (multicore horizontal)' },
  { code: 'F',  description: 'Free air (single-core trefoil)' },
  { code: 'G',  description: 'Free air (single-core flat spaced)' },
];
