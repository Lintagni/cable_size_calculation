// ABC Aerial Bundle Conductor data — NFC 33-209
// Phase conductors: Al/XLPE; Neutral messenger: Al-alloy/XLPE
// Source: Kelani Cables product catalogue

export interface AbcConfig {
  phaseCsa: number;     // mm² phase conductor
  neutralCsa: number;   // mm² neutral messenger
  currentRating: number;// A (phase conductor)
  vdropVAkm: number;    // V/A/km phase conductor
  resistanceOhmsKm: number; // Ω/km at 20°C
  impedanceOhmsKm: number;  // Ω/km total
  shortCircuit0_2s: number; // kA for 0.2s
  shortCircuit1s: number;   // kA for 1.0s
  shortCircuit3s: number;   // kA for 3.0s
  weightKgKm: number;       // kg/km (base, no street lighting)
  label: string;            // display string
}

// Standard ABC configurations (no street lighting cores)
export const ABC_CONFIGS: AbcConfig[] = [
  {
    phaseCsa: 25, neutralCsa: 54.6,
    currentRating: 112, vdropVAkm: 2.2, resistanceOhmsKm: 1.2,
    impedanceOhmsKm: 0.501,
    shortCircuit0_2s: 5.28, shortCircuit1s: 2.36, shortCircuit3s: 1.36,
    weightKgKm: 514.1, label: '3×25 + 54.6N',
  },
  {
    phaseCsa: 35, neutralCsa: 54.6,
    currentRating: 138, vdropVAkm: 1.65, resistanceOhmsKm: 0.868,
    impedanceOhmsKm: 0.501,
    shortCircuit0_2s: 7.39, shortCircuit1s: 3.31, shortCircuit3s: 1.91,
    weightKgKm: 621.2, label: '3×35 + 54.6N',
  },
  {
    phaseCsa: 50, neutralCsa: 54.6,
    currentRating: 168, vdropVAkm: 1.27, resistanceOhmsKm: 0.641,
    impedanceOhmsKm: 0.500,
    shortCircuit0_2s: 10.56, shortCircuit1s: 4.72, shortCircuit3s: 2.73,
    weightKgKm: 735.0, label: '3×50 + 54.6N',
  },
  {
    phaseCsa: 70, neutralCsa: 54.6,
    currentRating: 213, vdropVAkm: 0.87, resistanceOhmsKm: 0.443,
    impedanceOhmsKm: 0.350,
    shortCircuit0_2s: 14.79, shortCircuit1s: 6.61, shortCircuit3s: 3.82,
    weightKgKm: 975.8, label: '3×70 + 54.6N',
  },
  {
    phaseCsa: 70, neutralCsa: 70,
    currentRating: 213, vdropVAkm: 0.87, resistanceOhmsKm: 0.443,
    impedanceOhmsKm: 0.350,
    shortCircuit0_2s: 14.79, shortCircuit1s: 6.61, shortCircuit3s: 3.82,
    weightKgKm: 1013.3, label: '3×70 + 70N',
  },
  {
    phaseCsa: 95, neutralCsa: 70,
    currentRating: 258, vdropVAkm: 0.67, resistanceOhmsKm: 0.320,
    impedanceOhmsKm: 0.258,
    shortCircuit0_2s: 20.07, shortCircuit1s: 8.98, shortCircuit3s: 5.18,
    weightKgKm: 1196.2, label: '3×95 + 70N',
  },
  {
    phaseCsa: 120, neutralCsa: 70,
    currentRating: 300, vdropVAkm: 0.55, resistanceOhmsKm: 0.253,
    impedanceOhmsKm: 0.258,
    shortCircuit0_2s: 25.35, shortCircuit1s: 11.34, shortCircuit3s: 6.55,
    weightKgKm: 1350.5, label: '3×120 + 70N',
  },
  {
    phaseCsa: 120, neutralCsa: 95,
    currentRating: 300, vdropVAkm: 0.55, resistanceOhmsKm: 0.253,
    impedanceOhmsKm: 0.258,
    shortCircuit0_2s: 25.35, shortCircuit1s: 11.34, shortCircuit3s: 6.55,
    weightKgKm: 1413.7, label: '3×120 + 95N',
  },
  {
    phaseCsa: 150, neutralCsa: 70,
    currentRating: 344, vdropVAkm: 0.46, resistanceOhmsKm: 0.206,
    impedanceOhmsKm: 0.257,
    shortCircuit0_2s: 31.69, shortCircuit1s: 14.17, shortCircuit3s: 8.18,
    weightKgKm: 1660.9, label: '3×150 + 70N',
  },
  {
    phaseCsa: 150, neutralCsa: 95,
    currentRating: 344, vdropVAkm: 0.46, resistanceOhmsKm: 0.206,
    impedanceOhmsKm: 0.257,
    shortCircuit0_2s: 31.69, shortCircuit1s: 14.17, shortCircuit3s: 8.18,
    weightKgKm: 1724.1, label: '3×150 + 95N',
  },
];
