// Busbar sizing calculator
// Current ratings based on IEC 60439 / BS EN 61439 and engineering tables
// Reference temperature: 40°C ambient, naturally ventilated

export type BusbarMaterial = 'copper' | 'aluminium';
export type BusbarInstallation = 'open' | 'enclosed';
export type BusbarArrangement = 'flat-edge' | 'flat-face' | 'vertical';

export interface BusbarDimension {
  width: number;   // mm
  thickness: number; // mm
  csa: number;     // mm²
  currentCu: number; // A (copper, open air, 40°C, flat-on-edge)
  label: string;   // e.g. "40×10"
}

// Standard busbar sizes — copper ratings (open air, 40°C, single bar, flat on edge)
export const BUSBAR_SIZES: BusbarDimension[] = [
  { width: 15, thickness: 3,  csa: 45,  currentCu: 120,  label: '15×3'  },
  { width: 20, thickness: 3,  csa: 60,  currentCu: 155,  label: '20×3'  },
  { width: 25, thickness: 3,  csa: 75,  currentCu: 190,  label: '25×3'  },
  { width: 25, thickness: 5,  csa: 125, currentCu: 270,  label: '25×5'  },
  { width: 30, thickness: 5,  csa: 150, currentCu: 315,  label: '30×5'  },
  { width: 40, thickness: 5,  csa: 200, currentCu: 395,  label: '40×5'  },
  { width: 40, thickness: 10, csa: 400, currentCu: 660,  label: '40×10' },
  { width: 50, thickness: 5,  csa: 250, currentCu: 475,  label: '50×5'  },
  { width: 50, thickness: 10, csa: 500, currentCu: 790,  label: '50×10' },
  { width: 60, thickness: 5,  csa: 300, currentCu: 550,  label: '60×5'  },
  { width: 60, thickness: 10, csa: 600, currentCu: 920,  label: '60×10' },
  { width: 80, thickness: 5,  csa: 400, currentCu: 700,  label: '80×5'  },
  { width: 80, thickness: 10, csa: 800, currentCu: 1150, label: '80×10' },
  { width: 100, thickness: 5, csa: 500, currentCu: 860,  label: '100×5' },
  { width: 100, thickness: 10,csa: 1000,currentCu: 1370, label: '100×10'},
  { width: 120, thickness: 10,csa: 1200,currentCu: 1600, label: '120×10'},
];

// Temperature correction factors (reference 40°C)
const TEMP_CORRECTION: Record<number, number> = {
  20: 1.15, 25: 1.12, 30: 1.08, 35: 1.04, 40: 1.00,
  45: 0.96, 50: 0.91, 55: 0.87, 60: 0.82,
};

// Arrangement derating vs flat-on-edge
const ARRANGEMENT_FACTOR: Record<BusbarArrangement, number> = {
  'flat-edge': 1.00,
  'flat-face': 0.88,
  'vertical':  0.95,
};

// Enclosure derating
const ENCLOSURE_FACTOR: Record<BusbarInstallation, number> = {
  'open':     1.00,
  'enclosed': 0.85,
};

// Aluminium vs copper ratio (~60% current for same cross-section)
const AL_FACTOR = 0.61;

export interface BusbarInput {
  designCurrent: number;      // A per phase
  phases: 1 | 3;
  material: BusbarMaterial;
  installation: BusbarInstallation;
  arrangement: BusbarArrangement;
  ambientTemp: number;        // °C
  barsPerPhase: number;       // number of parallel bars per phase (1–4)
  busbarLength: number;       // m (for voltage drop)
  voltage: number;            // V (for voltage drop %)
  frequency: 50 | 60;
}

export interface BusbarSizeResult {
  size: BusbarDimension;
  deratedCurrent: number;  // A (per bar, after all factors)
  totalCurrent: number;    // A (per phase = deratedCurrent × barsPerPhase)
  voltageDrop: number;     // V
  voltageDropPct: number;  // %
  currentDensity: number;  // A/mm²
  compliant: boolean;
  reasons: string[];
  factors: {
    tempFactor: number;
    arrangementFactor: number;
    enclosureFactor: number;
    materialFactor: number;
  };
}

export interface BusbarResult {
  input: BusbarInput;
  recommended: BusbarSizeResult;
  allSizes: BusbarSizeResult[];
  minCsaRequired: number; // mm²
}

function getBaseCurrentCu(size: BusbarDimension): number {
  return size.currentCu;
}

function getTempFactor(temp: number): number {
  // Find nearest bracketing keys and interpolate
  const temps = Object.keys(TEMP_CORRECTION).map(Number).sort((a, b) => a - b);
  if (temp <= temps[0]) return TEMP_CORRECTION[temps[0]];
  if (temp >= temps[temps.length - 1]) return TEMP_CORRECTION[temps[temps.length - 1]];
  const lo = temps.filter(t => t <= temp).at(-1)!;
  const hi = temps.filter(t => t > temp)[0];
  const frac = (temp - lo) / (hi - lo);
  return TEMP_CORRECTION[lo] + frac * (TEMP_CORRECTION[hi] - TEMP_CORRECTION[lo]);
}

function calcBusbarSize(size: BusbarDimension, input: BusbarInput): BusbarSizeResult {
  const tempFactor = getTempFactor(input.ambientTemp);
  const arrangementFactor = ARRANGEMENT_FACTOR[input.arrangement];
  const enclosureFactor = ENCLOSURE_FACTOR[input.installation];
  const materialFactor = input.material === 'aluminium' ? AL_FACTOR : 1.0;

  const baseCurrent = getBaseCurrentCu(size);
  const deratedPerBar = baseCurrent * tempFactor * arrangementFactor * enclosureFactor * materialFactor;
  const totalCurrent = deratedPerBar * input.barsPerPhase;

  // Resistivity at operating temp (copper ~0.0216 Ω·mm²/m at 70°C; Al ~0.0355)
  const resistivity = input.material === 'copper' ? 0.0216 : 0.0355;
  const totalCsa = size.csa * input.barsPerPhase;
  const resistanceOhm = (resistivity * input.busbarLength) / totalCsa;

  // Voltage drop: V = I × R (resistive only for busbars)
  const vDropV = input.designCurrent * resistanceOhm;
  const vDropPct = (vDropV / input.voltage) * 100;

  const currentDensity = input.designCurrent / (size.csa * input.barsPerPhase);

  const compliant = totalCurrent >= input.designCurrent;
  const reasons: string[] = [];
  if (!compliant) reasons.push(`Derated capacity ${totalCurrent.toFixed(0)}A < Ib ${input.designCurrent}A`);
  if (vDropPct > 1) reasons.push(`Voltage drop ${vDropV.toFixed(2)}V (${vDropPct.toFixed(2)}%) — consider larger bar`);

  return {
    size,
    deratedCurrent: deratedPerBar,
    totalCurrent,
    voltageDrop: vDropV,
    voltageDropPct: vDropPct,
    currentDensity,
    compliant,
    reasons,
    factors: { tempFactor, arrangementFactor, enclosureFactor, materialFactor },
  };
}

export function calculateBusbar(input: BusbarInput): BusbarResult {
  const allSizes = BUSBAR_SIZES.map(size => calcBusbarSize(size, input));

  const recommended = allSizes.find(r => r.compliant) ?? allSizes[allSizes.length - 1];

  // Minimum CSA required at 1 A/mm² typical density
  const minCsaRequired = input.designCurrent / input.barsPerPhase;

  return { input, recommended, allSizes, minCsaRequired };
}
