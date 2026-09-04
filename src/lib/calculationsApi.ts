import { supabase } from './supabase'
import type { HistoryEntry } from '../store/historyStore'

/**
 * Supabase persistence for calculation history.
 *
 * Every call degrades to a no-op rather than throwing: history is a
 * convenience, and a missing table or a dropped connection must never break a
 * calculation. If the `calculations` table has not been created yet (see
 * supabase/migrations/0001_calculations.sql) sync disables itself after the
 * first failure and the app carries on with localStorage alone.
 */

/** Flipped once we learn the backend can't serve us, to stop retry noise. */
let syncDisabled = false

export function isSyncDisabled() {
  return syncDisabled
}

/** PostgREST codes meaning "this table/column isn't there" — not worth retrying. */
const SCHEMA_MISSING = new Set(['42P01', 'PGRST205', 'PGRST204'])

function handle(error: { code?: string; message?: string } | null, op: string): boolean {
  if (!error) return true
  if (error.code && SCHEMA_MISSING.has(error.code)) {
    syncDisabled = true
    console.warn(
      `[history] '${op}' disabled — the calculations table is missing. `
      + 'Apply supabase/migrations/0001_calculations.sql to enable cloud history.',
    )
    return false
  }
  console.warn(`[history] ${op} failed:`, error.message ?? error)
  return false
}

interface Row {
  id: string
  type: HistoryEntry['type']
  summary: string
  inputs: Record<string, unknown>
  result: Record<string, unknown>
  created_at: string
}

function toEntry(row: Row): HistoryEntry {
  return {
    id: row.id,
    type: row.type,
    summary: row.summary,
    inputs: row.inputs ?? {},
    result: row.result ?? {},
    timestamp: new Date(row.created_at).getTime(),
  }
}

/** This user's saved calculations, newest first. Empty array on any failure. */
export async function fetchCalculations(limit = 100): Promise<HistoryEntry[]> {
  if (syncDisabled) return []
  const { data, error } = await supabase
    .from('calculations')
    .select('id, type, summary, inputs, result, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!handle(error, 'fetch')) return []
  return (data ?? []).map(r => toEntry(r as Row))
}

/**
 * Upsert entries. Used both for a single new calculation and to push local
 * history up the first time a user signs in on a new device.
 */
export async function saveCalculations(userId: string, entries: HistoryEntry[]): Promise<void> {
  if (syncDisabled || entries.length === 0) return
  const rows = entries.map(e => ({
    id: e.id,
    user_id: userId,
    type: e.type,
    summary: e.summary,
    inputs: e.inputs,
    result: e.result,
    created_at: new Date(e.timestamp).toISOString(),
  }))
  const { error } = await supabase.from('calculations').upsert(rows, { onConflict: 'id' })
  handle(error, 'save')
}

export async function deleteCalculation(id: string): Promise<void> {
  if (syncDisabled) return
  const { error } = await supabase.from('calculations').delete().eq('id', id)
  handle(error, 'delete')
}

export async function clearCalculations(userId: string): Promise<void> {
  if (syncDisabled) return
  const { error } = await supabase.from('calculations').delete().eq('user_id', userId)
  handle(error, 'clear')
}
