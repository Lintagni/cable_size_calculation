// BS7671:2018+A2 Correction factors (Appendix 4)

// Table 4B1: Ambient temperature correction factors (Ca)
// Key: ambient temp °C, value: Ca for PVC (70°C) and XLPE (90°C)
export const ambientTempFactors: { temp: number; pvc: number; xlpe: number }[] = [
  { temp: 10, pvc: 1.22, xlpe: 1.15 },
  { temp: 15, pvc: 1.17, xlpe: 1.12 },
  { temp: 20, pvc: 1.12, xlpe: 1.08 },
  { temp: 25, pvc: 1.06, xlpe: 1.04 },
  { temp: 30, pvc: 1.00, xlpe: 1.00 },
  { temp: 35, pvc: 0.94, xlpe: 0.96 },
  { temp: 40, pvc: 0.87, xlpe: 0.91 },
  { temp: 45, pvc: 0.79, xlpe: 0.87 },
  { temp: 50, pvc: 0.71, xlpe: 0.82 },
  { temp: 55, pvc: 0.61, xlpe: 0.76 },
  { temp: 60, pvc: 0.50, xlpe: 0.71 },
  { temp: 65, pvc: 0.35, xlpe: 0.65 },
  { temp: 70, pvc: 0,    xlpe: 0.58 },
  { temp: 75, pvc: 0,    xlpe: 0.50 },
  { temp: 80, pvc: 0,    xlpe: 0.41 },
  { temp: 85, pvc: 0,    xlpe: 0.29 },
];

// Table 4C1: Grouping factors (Cg) for cables in bunches/trays
// Key: number of circuits
export const groupingFactors: { circuits: number; Cg: number }[] = [
  { circuits: 1,  Cg: 1.00 },
  { circuits: 2,  Cg: 0.80 },
  { circuits: 3,  Cg: 0.70 },
  { circuits: 4,  Cg: 0.65 },
  { circuits: 5,  Cg: 0.60 },
  { circuits: 6,  Cg: 0.57 },
  { circuits: 7,  Cg: 0.54 },
  { circuits: 8,  Cg: 0.52 },
  { circuits: 9,  Cg: 0.50 },
  { circuits: 10, Cg: 0.48 },
  { circuits: 12, Cg: 0.45 },
  { circuits: 14, Cg: 0.43 },
  { circuits: 16, Cg: 0.41 },
  { circuits: 20, Cg: 0.38 },
];

// Table 52.2: Thermal insulation factors (Ci)
export const thermalInsulationFactors = {
  none: 1.00,
  oneSide: 0.75,
  surrounded: 0.50,
} as const;

// Cc: Factor for BS3036 semi-enclosed fuse (0.725), others 1.0
export const protectiveDeviceFactors = {
  MCB: 1.00,
  MCCB: 1.00,
  ACB: 1.00,
  RCD: 1.00,
  BS3036Fuse: 0.725,
} as const;

export function getAmbientFactor(ambientTemp: number, insulation: 'PVC' | 'XLPE'): number {
  const exact = ambientTempFactors.find(r => r.temp === ambientTemp);
  if (exact) return insulation === 'PVC' ? exact.pvc : exact.xlpe;

  // Interpolate between nearest values
  const sorted = [...ambientTempFactors].sort((a, b) => a.temp - b.temp);
  const lower = sorted.filter(r => r.temp <= ambientTemp).at(-1);
  const upper = sorted.find(r => r.temp > ambientTemp);
  if (!lower) return insulation === 'PVC' ? sorted[0].pvc : sorted[0].xlpe;
  if (!upper) return insulation === 'PVC' ? sorted.at(-1)!.pvc : sorted.at(-1)!.xlpe;

  const ratio = (ambientTemp - lower.temp) / (upper.temp - lower.temp);
  if (insulation === 'PVC') return lower.pvc + ratio * (upper.pvc - lower.pvc);
  return lower.xlpe + ratio * (upper.xlpe - lower.xlpe);
}

export function getGroupingFactor(circuits: number): number {
  if (circuits <= 1) return 1.00;
  const sorted = [...groupingFactors].sort((a, b) => a.circuits - b.circuits);
  const match = sorted.find(r => r.circuits >= circuits);
  if (!match) return sorted.at(-1)!.Cg;
  const lower = sorted.filter(r => r.circuits <= circuits).at(-1);
  if (!lower || lower.circuits === match.circuits) return match.Cg;
  const ratio = (circuits - lower.circuits) / (match.circuits - lower.circuits);
  return lower.Cg + ratio * (match.Cg - lower.Cg);
}
