import type { LvCableInput, RefMethod } from '../calculators/lvCableSizing'

/**
 * Encode/decode a sizing case in the URL query string.
 *
 * The point is that an answer can be handed to someone else — pasted into a
 * forum reply, a WhatsApp thread or an email — and land on a page showing the
 * full worked calculation rather than an empty form. That is word of mouth and
 * inbound links, which is exactly what a young site has none of.
 *
 * Keys are short and stable; anything unrecognised or malformed is ignored so a
 * mangled link degrades to the page's own defaults instead of erroring.
 * <Seo /> canonicalises to the bare path, so shared links never create
 * duplicate indexable URLs.
 */

const NUMERIC = {
  ib:  'designCurrent',
  in:  'deviceRating',
  l:   'cableLength',
  v:   'voltage',
  amb: 'ambientTemp',
  grp: 'groupedCircuits',
  par: 'parallelCircuits',
  pf:  'powerFactor',
} as const satisfies Record<string, keyof LvCableInput>

const VALID_METHODS: RefMethod[] = ['A1', 'A2', 'B1', 'B2', 'C', 'D1', 'D2', 'E', 'F', 'G']

export function encodeInputs(input: LvCableInput): string {
  const p = new URLSearchParams()
  for (const [key, field] of Object.entries(NUMERIC)) {
    const v = input[field as keyof LvCableInput]
    if (typeof v === 'number' && Number.isFinite(v)) p.set(key, String(v))
  }
  p.set('ph', String(input.phases))
  p.set('m', input.referenceMethod)
  p.set('ins', input.insulation)
  p.set('cfg', input.cableConfig === 'multicore' ? 'mc' : 'sc')
  p.set('mat', (input.conductorMaterial ?? 'copper') === 'aluminium' ? 'al' : 'cu')
  if (input.thermalInsulation && input.thermalInsulation !== 'none') p.set('ti', input.thermalInsulation)
  if (input.protectiveDevice) p.set('pd', input.protectiveDevice)
  return p.toString()
}

export function decodeInputs(search: string): Partial<LvCableInput> {
  const p = new URLSearchParams(search)
  const out: Record<string, unknown> = {}

  for (const [key, field] of Object.entries(NUMERIC)) {
    const raw = p.get(key)
    if (raw === null) continue
    const n = Number(raw)
    // Reject NaN and negatives; a bad value should fall back to the default,
    // not push a nonsense case through the engine.
    if (Number.isFinite(n) && n >= 0) out[field] = n
  }

  const ph = Number(p.get('ph'))
  if (ph === 1 || ph === 3) out.phases = ph

  const m = p.get('m')?.toUpperCase()
  if (m && (VALID_METHODS as string[]).includes(m)) out.referenceMethod = m

  const ins = p.get('ins')?.toUpperCase()
  if (ins === 'PVC' || ins === 'XLPE') out.insulation = ins

  const cfg = p.get('cfg')
  if (cfg === 'mc') out.cableConfig = 'multicore'
  if (cfg === 'sc') out.cableConfig = 'single-core'

  const mat = p.get('mat')
  if (mat === 'al') out.conductorMaterial = 'aluminium'
  if (mat === 'cu') out.conductorMaterial = 'copper'

  const ti = p.get('ti')
  if (ti) out.thermalInsulation = ti

  const pd = p.get('pd')
  if (pd) out.protectiveDevice = pd

  return out as Partial<LvCableInput>
}

/** Absolute, shareable URL for the current path plus this case. */
export function shareUrl(pathname: string, input: LvCableInput): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.cablecalc.org'
  return `${origin}${pathname}?${encodeInputs(input)}`
}
