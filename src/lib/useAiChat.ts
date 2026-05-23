import { useState, useCallback } from 'react'
import { anthropic, SYSTEM_PROMPT, buildResultContext, parseExtractedInputs } from './claude'
import type { FillAction } from './claude'
import type { LvCableResult, LvCableInput } from '../calculators/lvCableSizing'
import type { AbcInput } from '../calculators/abcCableSizing'
import type { BusbarInput } from '../calculators/busbarSizing'
import { useAiModelStore } from '../store/aiModelStore'
import { useAiChatStore } from '../store/aiChatStore'
import type { CalcResultPayload } from '../store/aiChatStore'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ── Default inputs merged with AI-extracted partials ──────────────────────────
const DEFAULT_LV: LvCableInput = {
  description: 'Unnamed circuit', origin: '', destination: '',
  voltage: 400, phases: 3, frequency: 50, powerFactor: 0.85,
  designCurrent: 10, protectiveDevice: 'MCB', deviceRating: 16,
  referenceMethod: 'C', cableLength: 10, insulation: 'XLPE',
  cableConfig: 'multicore', parallelCircuits: 1,
  ambientTemp: 30, groupedCircuits: 1, thermalInsulation: 'none',
  conductorMaterial: 'copper',
}

// ── Run the appropriate calculator for a fillAction ───────────────────────────
async function runCalculator(fillAction: FillAction): Promise<CalcResultPayload | null> {
  try {
    if (fillAction.action === 'fill_form') {
      const { calculate } = await import('../calculators/lvCableSizing')
      const input: LvCableInput = { ...DEFAULT_LV, ...fillAction.inputs } as LvCableInput
      const result: LvCableResult = calculate(input)
      return { type: 'lv', result }
    }

    if (fillAction.action === 'fill_abc') {
      const { calculateAbc } = await import('../calculators/abcCableSizing')
      const input: AbcInput = {
        designCurrent: 10, voltage: 400, cableLength: 100, isLighting: false,
        ...fillAction.inputs,
      } as AbcInput
      const result = calculateAbc(input)
      return { type: 'abc', result }
    }

    if (fillAction.action === 'fill_busbar') {
      const { calculateBusbar } = await import('../calculators/busbarSizing')
      const input: BusbarInput = {
        designCurrent: 100, phases: 3, material: 'copper',
        installation: 'enclosed', arrangement: 'flat-edge',
        ambientTemp: 40, barsPerPhase: 1, busbarLength: 2,
        voltage: 400, frequency: 50,
        ...fillAction.inputs,
      } as BusbarInput
      const result = calculateBusbar(input)
      return { type: 'busbar', result }
    }
  } catch (e) {
    console.warn('runCalculator failed:', e)
  }
  return null
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAiChat(currentResult: LvCableResult | null) {
  const { messages, setMessages, setCalcResult, setPendingFill } = useAiChatStore()
  const [streaming, setStreaming] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const { modelId }               = useAiModelStore()

  const send = useCallback(async (userMessage: string): Promise<{ fillAction: FillAction | null }> => {
    const userMsg: ChatMessage = { role: 'user', content: userMessage }
    const nextMessages = [...messages, userMsg]
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setStreaming(true)
    setError(null)

    const ctx    = buildResultContext(currentResult)
    const system = ctx ? `${SYSTEM_PROMPT}\n\n---\n${ctx}` : SYSTEM_PROMPT

    let fullText = ''
    try {
      const stream = anthropic.messages.stream({
        model: modelId,
        max_tokens: 1024,
        system,
        messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
      })

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullText += chunk.delta.text
          setMessages([...nextMessages, { role: 'assistant', content: fullText }])
        }
      }

      const fillAction = parseExtractedInputs(fullText)
      if (fillAction) {
        // Run the real calculator — result is attached to the assistant message
        const assistantMsgIdx = useAiChatStore.getState().messages.length - 1
        const payload = await runCalculator(fillAction)
        if (payload) setCalcResult(assistantMsgIdx, payload)

        // Store as pending so user can optionally open Calculator for manual edits
        setPendingFill(fillAction)
      }

      return { fillAction }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed'
      setError(msg)
      setMessages(nextMessages)
      return { fillAction: null }
    } finally {
      setStreaming(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentResult, modelId])

  const reset = useCallback(() => {
    setMessages([])
    setError(null)
  }, [setMessages])

  return { messages, streaming, error, send, reset }
}
