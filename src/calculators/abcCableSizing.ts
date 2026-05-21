// ABC Aerial Bundle Conductor sizing calculator (NFC 33-209)
import { ABC_CONFIGS, type AbcConfig } from '../data/abcCables';

export interface AbcInput {
  designCurrent: number;    // Ib (A)
  voltage: number;          // V (400 for 3-phase)
  cableLength: number;      // m
  selectedConfig?: string;  // optional: force a specific config label
  isLighting: boolean;      // affects voltage drop limit (3% vs 5%)
}

export interface AbcSizeResult {
  config: AbcConfig;
  voltageDrop: number;        // V
  voltageDropPct: number;     // %
  maxAllowedVdrop: number;    // V
  maxAllowedVdropPct: number; // %
  currentOk: boolean;
  vdropOk: boolean;
  compliant: boolean;
  reasons: string[];
}

export interface AbcResult {
  input: AbcInput;
  recommended: AbcSizeResult;
  allConfigs: AbcSizeResult[];
}

function calcSize(cfg: AbcConfig, input: AbcInput): AbcSizeResult {
  const maxVdropPct = input.isLighting ? 3 : 5;
  const maxVdrop = (input.voltage * maxVdropPct) / 100;

  // Voltage drop: VD (V) = Ib × L × vdropVAkm / 1000
  const vdV = (input.designCurrent * input.cableLength * cfg.vdropVAkm) / 1000;
  const vdPct = (vdV / input.voltage) * 100;

  const currentOk = cfg.currentRating >= input.designCurrent;
  const vdropOk = vdV <= maxVdrop;
  const compliant = currentOk && vdropOk;

  const reasons: string[] = [];
  if (!currentOk) reasons.push(`Rating ${cfg.currentRating}A < Ib ${input.designCurrent}A`);
  if (!vdropOk) reasons.push(`Volt drop ${vdV.toFixed(2)}V > ${maxVdrop.toFixed(2)}V (${maxVdropPct}%) limit`);

  return {
    config: cfg,
    voltageDrop: vdV,
    voltageDropPct: vdPct,
    maxAllowedVdrop: maxVdrop,
    maxAllowedVdropPct: maxVdropPct,
    currentOk,
    vdropOk,
    compliant,
    reasons,
  };
}

export function calculateAbc(input: AbcInput): AbcResult {
  const allConfigs = ABC_CONFIGS.map(cfg => calcSize(cfg, input));

  let recommended: AbcSizeResult;
  if (input.selectedConfig) {
    recommended = allConfigs.find(r => r.config.label === input.selectedConfig)
      ?? allConfigs[allConfigs.length - 1];
  } else {
    recommended = allConfigs.find(r => r.compliant) ?? allConfigs[allConfigs.length - 1];
  }

  return { input, recommended, allConfigs };
}
