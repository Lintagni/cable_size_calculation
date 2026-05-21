/**
 * loadCableData — fetch all BS7671 / NFC 33-209 reference data from Supabase
 * and splice it in-place into the exported arrays that calculators already import.
 *
 * Strategy: ES module exports are live bindings to the same array objects.
 * Array.splice() mutates in-place, so every importer sees the updated data
 * the next time it reads the array — zero changes needed in any calculator file.
 *
 * If Supabase is unavailable the hardcoded defaults remain intact (safe fallback).
 */

import { supabase } from './supabase'
import {
  table4D1A, table4D2A, table4E1A, table4E2A,
  table4D3A, table4D4A, table4E3A, table4E4A,
  vdropPVCMulticore, vdropXLPEMulticore, vdropXLPESingleCore,
  vdropPVCMulticoreAl, vdropXLPEMulticoreAl,
} from '../data/cableTables'
import { ambientTempFactors, groupingFactors } from '../data/correctionFactors'
import { ABC_CONFIGS } from '../data/abcCables'
import { BUSBAR_SIZES } from '../calculators/busbarSizing'

// ── Internal type aliases (match DB column names) ─────────────────────────────

type DbRating = {
  table_id: string
  csa_mm2:  number
  method_a1: number | null; method_a2: number | null
  method_b1: number | null; method_b2: number | null
  method_c:  number | null
  method_d1: number | null; method_d2: number | null
  method_e:  number | null; method_f:  number | null; method_g: number | null
}

type DbVdrop = {
  table_id: string
  csa_mm2:  number
  r_mv_am:  number
  x_mv_am:  number
  z_mv_am:  number
}

type DbTempFactor = { temp_c: number; pvc_factor: number; xlpe_factor: number }
type DbGroupFactor = { circuits: number; cg_factor: number }
type DbAbc = {
  label: string
  phase_csa_mm2: number; neutral_csa_mm2: number
  current_rating_a: number; vdrop_v_a_km: number
  resistance_ohm_km: number; impedance_ohm_km: number
  sc_0_2s_ka: number; sc_1s_ka: number; sc_3s_ka: number
  weight_kg_km: number
}
type DbBusbar = { label: string; width_mm: number; thickness_mm: number; csa_mm2: number; current_cu_a: number }

// ── Map DB table_id → the exported TS array it should populate ────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RATINGS_MAP: Record<string, any[]> = {
  '4D1A': table4D1A, '4D2A': table4D2A,
  '4E1A': table4E1A, '4E2A': table4E2A,
  '4D3A': table4D3A, '4D4A': table4D4A,
  '4E3A': table4E3A, '4E4A': table4E4A,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VDROP_MAP: Record<string, any[]> = {
  '4D1B': vdropPVCMulticore,
  '4E1B': vdropXLPEMulticore,
  '4E2B': vdropXLPESingleCore,
  '4D3B': vdropPVCMulticoreAl,
  '4E3B': vdropXLPEMulticoreAl,
}

// ── Converters: DB row → TypeScript shape ────────────────────────────────────
function toRatingEntry(row: DbRating) {
  const e: Record<string, number> = { csa: row.csa_mm2 }
  if (row.method_a1 !== null) e.A1 = row.method_a1
  if (row.method_a2 !== null) e.A2 = row.method_a2
  if (row.method_b1 !== null) e.B1 = row.method_b1
  if (row.method_b2 !== null) e.B2 = row.method_b2
  if (row.method_c  !== null) e.C  = row.method_c
  if (row.method_d1 !== null) e.D1 = row.method_d1
  if (row.method_d2 !== null) e.D2 = row.method_d2
  if (row.method_e  !== null) e.E  = row.method_e
  if (row.method_f  !== null) e.F  = row.method_f
  if (row.method_g  !== null) e.G  = row.method_g
  return e
}

// ── Main loader (called once at app startup) ──────────────────────────────────
export async function loadCableData(): Promise<void> {
  try {
    const [ratingsRes, vdropRes, tempRes, groupRes, abcRes, busbarRes] = await Promise.all([
      supabase.from('cable_ratings').select('*').order('csa_mm2'),
      supabase.from('cable_voltage_drop').select('*').order('csa_mm2'),
      supabase.from('correction_factors_temp').select('*').order('temp_c'),
      supabase.from('correction_factors_grouping').select('*').order('circuits'),
      supabase.from('abc_cables').select('*').order('phase_csa_mm2'),
      supabase.from('busbar_sizes').select('*').order('csa_mm2'),
    ])

    // ── Current ratings ──────────────────────────────────────────────────────
    if (ratingsRes.data?.length) {
      const byTable: Record<string, ReturnType<typeof toRatingEntry>[]> = {}
      for (const row of ratingsRes.data as DbRating[]) {
        ;(byTable[row.table_id] ??= []).push(toRatingEntry(row))
      }
      for (const [tid, arr] of Object.entries(RATINGS_MAP)) {
        if (byTable[tid]?.length) arr.splice(0, arr.length, ...byTable[tid])
      }
    }

    // ── Voltage drop ─────────────────────────────────────────────────────────
    if (vdropRes.data?.length) {
      const byTable: Record<string, { csa: number; r: number; x: number; z: number }[]> = {}
      for (const row of vdropRes.data as DbVdrop[]) {
        ;(byTable[row.table_id] ??= []).push({
          csa: row.csa_mm2, r: row.r_mv_am, x: row.x_mv_am, z: row.z_mv_am,
        })
      }
      for (const [tid, arr] of Object.entries(VDROP_MAP)) {
        if (byTable[tid]?.length) arr.splice(0, arr.length, ...byTable[tid])
      }
    }

    // ── Temperature correction factors ────────────────────────────────────────
    if (tempRes.data?.length) {
      const fresh = (tempRes.data as DbTempFactor[]).map(r => ({
        temp: r.temp_c, pvc: r.pvc_factor, xlpe: r.xlpe_factor,
      }))
      ambientTempFactors.splice(0, ambientTempFactors.length, ...fresh)
    }

    // ── Grouping correction factors ───────────────────────────────────────────
    if (groupRes.data?.length) {
      const fresh = (groupRes.data as DbGroupFactor[]).map(r => ({
        circuits: r.circuits, Cg: r.cg_factor,
      }))
      groupingFactors.splice(0, groupingFactors.length, ...fresh)
    }

    // ── ABC cable configurations ──────────────────────────────────────────────
    if (abcRes.data?.length) {
      const fresh = (abcRes.data as DbAbc[]).map(r => ({
        phaseCsa:          r.phase_csa_mm2,
        neutralCsa:        r.neutral_csa_mm2,
        currentRating:     r.current_rating_a,
        vdropVAkm:         r.vdrop_v_a_km,
        resistanceOhmsKm:  r.resistance_ohm_km,
        impedanceOhmsKm:   r.impedance_ohm_km,
        shortCircuit0_2s:  r.sc_0_2s_ka,
        shortCircuit1s:    r.sc_1s_ka,
        shortCircuit3s:    r.sc_3s_ka,
        weightKgKm:        r.weight_kg_km,
        label:             r.label,
      }))
      ABC_CONFIGS.splice(0, ABC_CONFIGS.length, ...fresh)
    }

    // ── Busbar sizes ─────────────────────────────────────────────────────────
    if (busbarRes.data?.length) {
      const fresh = (busbarRes.data as DbBusbar[]).map(r => ({
        width:     r.width_mm,
        thickness: r.thickness_mm,
        csa:       r.csa_mm2,
        currentCu: r.current_cu_a,
        label:     r.label,
      }))
      BUSBAR_SIZES.splice(0, BUSBAR_SIZES.length, ...fresh)
    }

    console.log('✓ Cable data loaded from Supabase')
  } catch (err) {
    console.warn('Cable data load failed — using hardcoded defaults:', err)
  }
}
