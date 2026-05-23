/**
 * Retrieves similar past calculations from the `calculation_examples` table
 * and formats them as a prompt-injection string for Claude.
 *
 * Uses soft SQL range-filtering (±50% on current, exact on voltage & method)
 * — no vector embeddings needed for structured engineering data.
 */

import { supabase } from './supabase'
import type { CalcTypeHint } from './complexityRouter'

export interface ExampleRow {
  id:                string
  calc_type:         string
  description:       string | null
  project_name:      string | null
  voltage:           number | null
  phases:            number | null
  design_current:    number | null
  cable_length:      number | null
  reference_method:  string | null
  insulation:        string | null
  conductor_material:string | null
  result_csa:        number | null
  result_vd_pct:     number | null
  result_compliant:  boolean | null
  abc_config_label:  string | null
  bar_size_label:    string | null
  notes:             string | null
  enabled:           boolean
  created_at:        string
  standard:          string | null
  grouped_circuits:  number | null
  ambient_temp:      number | null
  is_lighting:       boolean | null
  busbar_material:   string | null
  installation:      string | null
  arrangement:       string | null
  bars_per_phase:    number | null
}

export interface RetrievalParams {
  calcType?:       CalcTypeHint
  designCurrent?:  number
  cableLength?:    number
  voltage?:        number
  referenceMethod?: string
}

/** Format a single example row as one bullet line for the prompt */
function formatExample(ex: ExampleRow): string {
  const compliance = ex.result_compliant === true ? 'COMPLIANT' : ex.result_compliant === false ? 'NON-COMPLIANT' : ''
  const vd = ex.result_vd_pct != null ? ` VD ${ex.result_vd_pct.toFixed(1)}%` : ''
  const project = ex.project_name ? ` [${ex.project_name}]` : ''
  const note = ex.notes ? ` — ${ex.notes}` : ''

  if (ex.calc_type === 'lv') {
    const desc   = ex.description ?? 'LV circuit'
    const method = ex.reference_method ? `, Method ${ex.reference_method}` : ''
    const insul  = [ex.insulation, ex.conductor_material].filter(Boolean).join(' ')
    const groups = ex.grouped_circuits && ex.grouped_circuits > 1 ? `, grouped ×${ex.grouped_circuits}` : ''
    return `• ${desc}${project}: ${ex.design_current}A, ${ex.voltage}V${method}${groups}, ${ex.cable_length}m, ${insul} → ${ex.result_csa}mm²${vd}${compliance ? ` (${compliance})` : ''}${note}`
  }

  if (ex.calc_type === 'abc') {
    const type = ex.is_lighting ? 'lighting' : 'power'
    return `• ABC ${type}${project}: ${ex.design_current}A, ${ex.voltage}V, ${ex.cable_length}m → ${ex.abc_config_label ?? '?'}${vd}${compliance ? ` (${compliance})` : ''}${note}`
  }

  if (ex.calc_type === 'busbar') {
    const mat = ex.busbar_material ?? ex.conductor_material ?? ''
    return `• Busbar ${mat}${project}: ${ex.design_current}A, ${ex.voltage}V ${ex.phases}φ, ${ex.installation} → ${ex.bar_size_label ?? '?'}${vd}${compliance ? ` (${compliance})` : ''}${note}`
  }

  return ''
}

/**
 * Query Supabase for similar examples and return formatted prompt injection.
 * Returns empty string if no examples found or on error (non-blocking).
 */
export async function findSimilarExamples(params: RetrievalParams): Promise<string> {
  if (!params.calcType) return ''

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('calculation_examples')
      .select('*')
      .eq('calc_type', params.calcType)
      .eq('enabled', true)
      .limit(5)

    // Soft filter: current within ±50%
    if (params.designCurrent) {
      query = query
        .gte('design_current', params.designCurrent * 0.5)
        .lte('design_current', params.designCurrent * 1.75)
    }

    // Exact filter: voltage and reference method
    if (params.voltage) {
      query = query.eq('voltage', params.voltage)
    }
    if (params.referenceMethod) {
      query = query.eq('reference_method', params.referenceMethod)
    }

    const { data, error } = await query

    if (error || !data || data.length === 0) return ''

    const lines = (data as ExampleRow[])
      .map(formatExample)
      .filter(Boolean)

    if (lines.length === 0) return ''

    return `\n\n---\nSimilar calculations from past projects (reference only — always verify):\n${lines.join('\n')}`
  } catch {
    return ''   // never block the main request
  }
}

/** Fetch ALL examples for admin management — bypasses the enabled filter */
export async function fetchAllExamples(): Promise<ExampleRow[]> {
  const { data, error } = await supabase
    .from('calculation_examples')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error || !data) return []
  return data as ExampleRow[]
}

/** Toggle enabled state of an example */
export async function toggleExample(id: string, enabled: boolean): Promise<void> {
  await supabase.from('calculation_examples').update({ enabled }).eq('id', id)
}

/** Delete an example */
export async function deleteExample(id: string): Promise<void> {
  await supabase.from('calculation_examples').delete().eq('id', id)
}
