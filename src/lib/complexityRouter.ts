/**
 * Complexity router — classifies a user message and picks the best Claude model.
 * Pure heuristics, no API call, zero latency, zero cost.
 *
 * Logic:
 *   simple  → Haiku  (1 cr)  plain Q&A, short questions, standard lookups
 *   medium  → Sonnet (2 cr)  single circuit sizing, clear parameters
 *   complex → Opus   (5 cr)  multi-circuit, schedules, protection, ambiguous inputs
 */

import type { AiModelId } from '../store/aiModelStore'

export type Complexity = 'simple' | 'medium' | 'complex'

export interface RouteDecision {
  complexity: Complexity
  modelId:    AiModelId
  creditCost: number
  label:      string   // human-readable reason shown in UI
}

// ── Pattern sets ──────────────────────────────────────────────────────────────

/** Short technical questions — no calculation involved */
const RE_SIMPLE = /^(what\s+is|what\s+are|what['']?s|define|explain|describe|how\s+does|why\s+is|which\s+table|which\s+reg|what\s+reg|can\s+i|should\s+i|is\s+it|does\s+bs)/i

/** Keywords that indicate a sizing calculation is needed */
const RE_CALC = /(\d+\s*(?:kw|kva|kvar|a\b|amp|amps|meter|metre|\bm\b)|method\s+[a-g]|reference\s+method|motor|submain|feeder|overhead\s+cable|abc\s+cable|busbar|bus\s*bar)/i

/** Keywords that push complexity up to Opus */
const RE_COMPLEX = /\b(schedule|cable\s+schedule|full\s+board|distribution\s+board\s+schedule|all\s+circuit|multiple\s+circuit|several\s+circuit|diversity|fault\s+level|short\s+circuit|protection\s+coord|discrimination|selectivity|harmonic|inrush|earth\s+loop|mdb\s+to|lv\s+board|switchboard|complete\s+design|design\s+the\s+system|check\s+all|list\s+all|compare\s+all)\b/i

// ── Detector: which calculator type does the message imply? ───────────────────
export type CalcTypeHint = 'lv' | 'abc' | 'busbar' | null

export function detectCalcType(message: string): CalcTypeHint {
  const lower = message.toLowerCase()
  if (/\b(abc|aerial\s+bundle|overhead\s+(cable|line|lv)|aerial\s+conductor)\b/.test(lower)) return 'abc'
  if (/\b(bus\s*bar|bus-bar|busduct|panel\s+busbar|board\s+busbar)\b/.test(lower)) return 'busbar'
  if (/\b(cable|wire|conduit|trunking|tray|circuit|submain|feeder|motor\s+cable|underground|clipped)\b/.test(lower)) return 'lv'
  return null
}

/** Extract numeric parameters from plain English for pre-retrieval */
export function extractQuickParams(message: string): {
  designCurrent?: number
  cableLength?:   number
  voltage?:       number
  referenceMethod?: string
} {
  const currentMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:A\b|amp|amps)/i)
  const kwMatch      = message.match(/(\d+(?:\.\d+)?)\s*kw/i)
  const lengthMatch  = message.match(/(\d+(?:\.\d+)?)\s*(?:m\b|meter|metre)/i)
  const voltageMatch = message.match(/(\d+)\s*(?:V\b|volt)/i)
  const methodMatch  = message.match(/\b[Mm]ethod\s+([A-G]\d?)\b/i)

  // Rough kW → A conversion (PF 0.85, 400V 3φ) to seed the retrieval
  const fromKw = kwMatch ? Math.round(parseFloat(kwMatch[1]) * 1000 / (400 * 1.732 * 0.85)) : undefined

  return {
    designCurrent:   currentMatch ? parseFloat(currentMatch[1]) : fromKw,
    cableLength:     lengthMatch  ? parseFloat(lengthMatch[1])  : undefined,
    voltage:         voltageMatch ? parseInt(voltageMatch[1])    : undefined,
    referenceMethod: methodMatch  ? methodMatch[1].toUpperCase() : undefined,
  }
}

// ── Main router ───────────────────────────────────────────────────────────────
export function routeQuery(message: string): RouteDecision {
  const trimmed   = message.trim()
  const wordCount = trimmed.split(/\s+/).length
  const hasCalc   = RE_CALC.test(trimmed)

  // Complex: multi-circuit, protection, schedules, or very long
  if (RE_COMPLEX.test(trimmed) || wordCount > 90) {
    return {
      complexity: 'complex',
      modelId:    'claude-opus-4-5',
      creditCost: 5,
      label:      'Complex — multi-circuit / systems',
    }
  }

  // Simple: short question with no sizing numbers
  if (RE_SIMPLE.test(trimmed) && !hasCalc && wordCount < 25) {
    return {
      complexity: 'simple',
      modelId:    'claude-haiku-4-5',
      creditCost: 1,
      label:      'Simple — Q&A / quick lookup',
    }
  }

  // Default: single circuit sizing
  return {
    complexity: 'medium',
    modelId:    'claude-sonnet-4-6',
    creditCost: 2,
    label:      'Standard — single circuit sizing',
  }
}
