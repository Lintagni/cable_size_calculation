// Short circuit / fault current calculations per BS7671 and IEC 60909

export interface TransformerData {
  kva: number;           // kVA rating
  hvVoltage: number;     // V
  lvVoltage: number;     // V
  impedancePct: number;  // % impedance (e.g. 5 for 5%)
  xrRatio?: number;      // X/R ratio (default 10)
}

export interface CableImpedance {
  csa: number;
  length: number;        // m
  parallelCircuits: number;
  insulation: 'PVC' | 'XLPE';
  config: 'single-core' | 'multicore';
}

export interface ShortCircuitInput {
  transformer: TransformerData;
  cables: CableImpedance[];   // chain of cables from transformer to point
  phases: 1 | 3;
  voltage: number;            // V at fault point
}

export interface ShortCircuitResult {
  ipsscKa: number;           // Prospective short-circuit current kA
  transformerImpedancePu: number;
  totalImpedancePu: number;
  baseCurrentA: number;
  iBaseKa: number;
  steps: { label: string; zPu: number; cumZPu: number; ipsscKa: number }[];
}

// Copper resistivity at 90°C: 0.0225 Ω·mm²/m (XLPE), at 70°C: 0.0206
const RESISTIVITY_90C = 0.0225;
const RESISTIVITY_70C = 0.0206;

function cableResistance(
  csa: number, length: number, parallels: number,
  insulation: 'PVC' | 'XLPE'
): number {
  const rho = insulation === 'XLPE' ? RESISTIVITY_90C : RESISTIVITY_70C;
  return (rho * length) / (csa * parallels); // Ω per phase (single way)
}

export function calculate(input: ShortCircuitInput): ShortCircuitResult {
  const { transformer } = input;

  const kvaBase = transformer.kva;
  const vBase = transformer.lvVoltage;
  const iBase = (kvaBase * 1000) / (Math.sqrt(3) * vBase);
  const zBase = vBase / (Math.sqrt(3) * iBase);

  // Transformer impedance in per-unit
  const zTxPu = transformer.impedancePct / 100;

  const steps: ShortCircuitResult['steps'] = [
    { label: 'Transformer', zPu: zTxPu, cumZPu: zTxPu, ipsscKa: (iBase / zTxPu) / 1000 },
  ];

  let cumZ = zTxPu;

  for (const cable of input.cables) {
    const R = cableResistance(cable.csa, cable.length, cable.parallelCircuits, cable.insulation);
    // Approximate X = R × 0.08 for LV cables (typical)
    const X = R * 0.08;
    const Z = Math.sqrt(R * R + X * X);
    const zCablePu = Z / zBase;
    cumZ += zCablePu;

    steps.push({
      label: `Cable ${cable.csa}mm² ${cable.length}m`,
      zPu: zCablePu,
      cumZPu: cumZ,
      ipsscKa: (iBase / cumZ) / 1000,
    });
  }

  return {
    ipsscKa: (iBase / cumZ) / 1000,
    transformerImpedancePu: zTxPu,
    totalImpedancePu: cumZ,
    baseCurrentA: iBase,
    iBaseKa: iBase / 1000,
    steps,
  };
}

// Adiabatic check: minimum cable size for fault withstand
// S (mm²) = (IF × √t) / K
export function adiabaticCheck(faultCurrentA: number, protectionTimeS: number, k: number): number {
  return (faultCurrentA * Math.sqrt(protectionTimeS)) / k;
}
