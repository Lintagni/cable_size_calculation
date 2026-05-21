// Standalone voltage drop checker — verify a selected cable against BS7671 Section 525

export interface VdropInput {
  csa: number;
  insulation: 'PVC' | 'XLPE';
  cableConfig: 'single-core' | 'multicore';
  length: number;       // m
  designCurrent: number; // A
  voltage: number;      // V
  phases: 1 | 3;
  parallelCircuits: number;
  isLighting: boolean;
  mVperAm?: number;     // override: provide mV/A/m directly
}

export interface VdropResult {
  voltageDrop: number;      // V
  voltageDropPct: number;   // %
  maxAllowedV: number;      // V
  maxAllowedPct: number;    // %
  compliant: boolean;
  margin: number;           // V headroom
}

import { vdropPVCMulticore, vdropXLPEMulticore, vdropXLPESingleCore } from '../data/cableTables';

function getMvAm(csa: number, insulation: 'PVC' | 'XLPE', config: 'single-core' | 'multicore'): number {
  const table = insulation === 'XLPE'
    ? (config === 'single-core' ? vdropXLPESingleCore : vdropXLPEMulticore)
    : vdropPVCMulticore;
  return table.find(r => r.csa === csa)?.z ?? 0;
}

export function checkVoltageDrop(input: VdropInput): VdropResult {
  const mvAm = input.mVperAm ?? getMvAm(input.csa, input.insulation, input.cableConfig);
  const vDrop = (input.length * input.designCurrent * mvAm * 0.001) / input.parallelCircuits;
  const vDropPct = (vDrop / input.voltage) * 100;
  const maxPct = input.isLighting ? 3 : 5;
  const maxV = input.voltage * (maxPct / 100);

  return {
    voltageDrop: vDrop,
    voltageDropPct: vDropPct,
    maxAllowedV: maxV,
    maxAllowedPct: maxPct,
    compliant: vDrop <= maxV,
    margin: maxV - vDrop,
  };
}
