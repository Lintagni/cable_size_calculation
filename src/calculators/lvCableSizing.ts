import {
  table4D1A, table4D2A, table4E1A, table4E2A,
  table4D3A, table4D4A, table4E3A, table4E4A,
  vdropPVCMulticore, vdropXLPEMulticore, vdropXLPESingleCore,
  vdropPVCMulticoreAl, vdropXLPEMulticoreAl,
  STANDARD_CSA_SIZES, ALUMINIUM_CSA_SIZES,
  type InsulationType, type CableConfig,
} from '../data/cableTables';
import {
  getAmbientFactor, getGroupingFactor,
  thermalInsulationFactors, protectiveDeviceFactors,
} from '../data/correctionFactors';

export type RefMethod = 'A1' | 'A2' | 'B1' | 'B2' | 'C' | 'D1' | 'D2' | 'E' | 'F' | 'G';
export type ProtectiveDevice = keyof typeof protectiveDeviceFactors;
export type ThermalInsulation = keyof typeof thermalInsulationFactors;

export interface LvCableInput {
  // Circuit
  description: string;
  origin: string;
  destination: string;
  voltage: number;          // Line voltage V (400 for 3ph, 230 for 1ph)
  phases: 1 | 3;
  frequency: 50 | 60;
  powerFactor: number;      // e.g. 0.85

  // Load
  designCurrent: number;    // Ib (A)
  protectiveDevice: ProtectiveDevice;
  deviceRating: number;     // In (A)

  // Installation
  referenceMethod: RefMethod;
  cableLength: number;      // m
  insulation: InsulationType;
  cableConfig: CableConfig;
  parallelCircuits: number; // number of parallel cable sets

  // Correction factors
  ambientTemp: number;      // °C
  groupedCircuits: number;  // total circuits in group (for Cg)
  thermalInsulation: ThermalInsulation;

  // Conductor material
  conductorMaterial: 'copper' | 'aluminium';

  // Optional manual override
  selectedCsa?: number;     // force a specific CSA
}

export interface CorrectionFactors {
  Ca: number;
  Cg: number;
  Ci: number;
  Cc: number;
  combined: number;
}

export interface CsaResult {
  csa: number;
  tabulatedRating: number;  // It per cable
  deRatedRating: number;    // Iz = It × Cg × Ca × Ci × Cc × parallelCircuits
  voltageDrop: number;      // V
  voltageDropPct: number;   // %
  maxAllowedVdrop: number;  // V (BS7671 Sect 525: 3% lighting, 5% other)
  maxAllowedVdropPct: number;
  adiabaticMinCsa: number;  // mm² from S = (IF × √t) / K
  kFactor: number;
  compliant: boolean;
  reasons: string[];
}

export interface LvCableResult {
  input: LvCableInput;
  correctionFactors: CorrectionFactors;
  recommendedCsa: number;
  results: CsaResult;       // result for the recommended/selected CSA
  allSizes: CsaResult[];    // results for all standard sizes
  mVperAm: { r: number; x: number; z: number };
  faultLevel?: number;      // kA at origin (if provided)
  ipssc?: number;           // kA prospective at destination
}

function getTabulatedRating(
  csa: number,
  insulation: InsulationType,
  config: CableConfig,
  method: RefMethod,
  material: 'copper' | 'aluminium',
): number {
  let table;
  if (material === 'aluminium') {
    table = insulation === 'PVC'
      ? (config === 'multicore' ? table4D3A : table4D4A)
      : (config === 'multicore' ? table4E3A : table4E4A);
  } else {
    table = insulation === 'PVC'
      ? (config === 'multicore' ? table4D1A : table4D2A)
      : (config === 'multicore' ? table4E1A : table4E2A);
  }

  const row = table.find(r => r.csa === csa);
  if (!row) return 0;
  return (row as unknown as Record<string, number>)[method] ?? 0;
}

function getVdrop(
  csa: number,
  insulation: InsulationType,
  config: CableConfig,
  material: 'copper' | 'aluminium',
): { r: number; x: number; z: number } {
  let table;
  if (material === 'aluminium') {
    table = insulation === 'XLPE' ? vdropXLPEMulticoreAl : vdropPVCMulticoreAl;
  } else {
    table = insulation === 'XLPE'
      ? (config === 'single-core' ? vdropXLPESingleCore : vdropXLPEMulticore)
      : vdropPVCMulticore;
  }

  const row = table.find(r => r.csa === csa);
  if (!row) return { r: 0, x: 0, z: 0 };
  return { r: row.r, x: row.x, z: row.z };
}

function maxVoltageDrop(voltage: number, isLighting: boolean): number {
  // BS7671 Section 525: 3% lighting, 5% other from origin of installation
  const pct = isLighting ? 0.03 : 0.05;
  return voltage * pct;
}

function adiabatic(faultCurrent: number, time: number, k: number): number {
  // S (mm²) = (IF × √t) / K
  return (faultCurrent * Math.sqrt(time)) / k;
}

export function calculate(input: LvCableInput, faultCurrentKa?: number): LvCableResult {
  const Ca = getAmbientFactor(input.ambientTemp, input.insulation);
  const Cg = getGroupingFactor(input.groupedCircuits);
  const Ci = thermalInsulationFactors[input.thermalInsulation];
  const Cc = protectiveDeviceFactors[input.protectiveDevice];
  const combined = Ca * Cg * Ci * Cc;

  const correctionFactors: CorrectionFactors = { Ca, Cg, Ci, Cc, combined };

  const maxVdrop = maxVoltageDrop(input.voltage, false);
  const maxVdropPct = 5; // 5% for non-lighting

  const material = input.conductorMaterial ?? 'copper';

  // K factors: copper XLPE=143, PVC=115; aluminium XLPE=76, PVC=76 (Table 54.4)
  const k = material === 'aluminium'
    ? 76
    : (input.insulation === 'XLPE' ? 143 : 115);
  const protectionTime = 0.4; // seconds (typical for TN-S, <32A) — could be input

  const IF = (faultCurrentKa ?? 0) * 1000;

  // Aluminium min size is 16mm²; copper uses full range
  const sizeList = material === 'aluminium' ? ALUMINIUM_CSA_SIZES : STANDARD_CSA_SIZES;

  const allSizes: CsaResult[] = sizeList
    .filter(csa => csa > 0)
    .map(csa => {
      const It = getTabulatedRating(csa, input.insulation, input.cableConfig, input.referenceMethod, material);
      if (It === 0) return null;

      const Iz = It * combined * input.parallelCircuits;
      const vd = getVdrop(csa, input.insulation, input.cableConfig, material);

      // Voltage drop: (L × Ib × mV/A/m × 10⁻³) / parallelCircuits
      // For 3-phase use z, for single-phase use z
      const vDropV = (input.cableLength * input.designCurrent * vd.z * 0.001) / input.parallelCircuits;
      const vDropPct = (vDropV / input.voltage) * 100;

      const adMin = IF > 0 ? adiabatic(IF, protectionTime, k) : 0;

      const reasons: string[] = [];
      let ok = true;

      if (Iz < input.deviceRating) { ok = false; reasons.push(`Iz (${Iz.toFixed(1)}A) < In (${input.deviceRating}A)`); }
      if (input.deviceRating < input.designCurrent) { ok = false; reasons.push(`In (${input.deviceRating}A) < Ib (${input.designCurrent}A)`); }
      if (vDropV > maxVdrop) { ok = false; reasons.push(`Volt drop ${vDropV.toFixed(2)}V > ${maxVdrop.toFixed(2)}V limit`); }
      if (IF > 0 && csa < adMin) { ok = false; reasons.push(`CSA ${csa}mm² < adiabatic min ${adMin.toFixed(1)}mm²`); }

      return {
        csa,
        tabulatedRating: It,
        deRatedRating: Iz,
        voltageDrop: vDropV,
        voltageDropPct: vDropPct,
        maxAllowedVdrop: maxVdrop,
        maxAllowedVdropPct: maxVdropPct,
        adiabaticMinCsa: adMin,
        kFactor: k,
        compliant: ok,
        reasons,
      } as CsaResult;
    })
    .filter((r): r is CsaResult => r !== null);

  if (allSizes.length === 0) {
    return { input, correctionFactors, recommendedCsa: 0, results: undefined as unknown as CsaResult, allSizes: [], mVperAm: { r: 0, x: 0, z: 0 } };
  }

  let recommendedCsa: number;
  if (input.selectedCsa) {
    recommendedCsa = input.selectedCsa;
  } else {
    const first = allSizes.find(r => r.compliant);
    recommendedCsa = first?.csa ?? allSizes.at(-1)!.csa;
  }

  const recommended = allSizes.find(r => r.csa === recommendedCsa) ?? allSizes[0];
  const mVperAm = getVdrop(recommendedCsa, input.insulation, input.cableConfig, material);

  return {
    input,
    correctionFactors,
    recommendedCsa,
    results: recommended,
    allSizes,
    mVperAm,
    faultLevel: faultCurrentKa,
  };
}
