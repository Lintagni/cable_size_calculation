// Motor / general load cable sizing helper
// Derives design current Ib then delegates to lvCableSizing

export interface MotorInput {
  powerKw: number;
  voltage: number;      // V
  phases: 1 | 3;
  powerFactor: number;
  efficiency: number;   // e.g. 0.92
  startingCurrentMultiplier: number; // e.g. 6 for DOL, 3.5 for star-delta
  description: string;
}

export interface MotorResult {
  fullLoadCurrentA: number;
  startingCurrentA: number;
  designCurrentIb: number;  // for sizing: typically 1.0 × FLC (motor circuits)
}

export function calculateMotorCurrent(input: MotorInput): MotorResult {
  const { powerKw, voltage, phases, powerFactor, efficiency } = input;

  const powerW = powerKw * 1000;
  let flc: number;

  if (phases === 3) {
    flc = powerW / (Math.sqrt(3) * voltage * powerFactor * efficiency);
  } else {
    flc = powerW / (voltage * powerFactor * efficiency);
  }

  const startingCurrent = flc * input.startingCurrentMultiplier;

  return {
    fullLoadCurrentA: flc,
    startingCurrentA: startingCurrent,
    designCurrentIb: flc, // Ib = FLC for steady-state cable sizing
  };
}

// General load current helper
export interface GeneralLoadInput {
  loadKw?: number;
  loadKva?: number;
  loadKvar?: number;
  voltage: number;
  phases: 1 | 3;
  powerFactor?: number;
  diversity?: number; // 0 to 1
}

export function calculateLoadCurrent(input: GeneralLoadInput): number {
  const pf = input.powerFactor ?? 0.85;
  const div = input.diversity ?? 1.0;
  let kva: number;

  if (input.loadKva) {
    kva = input.loadKva;
  } else if (input.loadKw) {
    kva = input.loadKw / pf;
  } else if (input.loadKvar) {
    kva = input.loadKvar / Math.sqrt(1 - pf * pf);
  } else {
    return 0;
  }

  const kvaDesign = kva * div;
  const sqrtFactor = input.phases === 3 ? Math.sqrt(3) : 1;
  return (kvaDesign * 1000) / (sqrtFactor * input.voltage);
}
