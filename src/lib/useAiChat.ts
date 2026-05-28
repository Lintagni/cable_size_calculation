import { useState, useCallback } from 'react'
import {
  SYSTEM_PROMPT, EXTRACTION_PROMPT,
  buildResultContext, buildCalcPayloadContext,
  parseExtractedInputs,
} from './claude'
import type { FillAction } from './claude'
import { streamAiResponse, completeAiRequest } from './aiProvider'
import type { LvCableResult, LvCableInput } from '../calculators/lvCableSizing'
import type { AbcInput } from '../calculators/abcCableSizing'
import type { BusbarInput } from '../calculators/busbarSizing'
import type { RealModelId } from '../store/aiModelStore'
import { useAiModelStore } from '../store/aiModelStore'
import { useAiChatStore } from '../store/aiChatStore'
import type { CalcResultPayload } from '../store/aiChatStore'
import { detectCalcType, extractQuickParams } from './complexityRouter'
import { findSimilarExamples } from './exampleRetrieval'

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
      return { type: 'lv', result: calculate(input) }
    }
    if (fillAction.action === 'fill_abc') {
      const { calculateAbc } = await import('../calculators/abcCableSizing')
      const input: AbcInput = {
        designCurrent: 10, voltage: 400, cableLength: 100, isLighting: false,
        ...fillAction.inputs,
      } as AbcInput
      return { type: 'abc', result: calculateAbc(input) }
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
      return { type: 'busbar', result: calculateBusbar(input) }
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

  const send = useCallback(async (
    userMessage:    string,
    effectiveModel: RealModelId,
  ): Promise<{ fillAction: FillAction | null; provider: 'claude' | 'gemini' }> => {

    // Always read the latest messages directly from the store to avoid stale closure
    const currentMessages         = useAiChatStore.getState().messages
    const userMsg: ChatMessage    = { role: 'user', content: userMessage }
    const nextMessages            = [...currentMessages, userMsg]
    const assistantIdx            = nextMessages.length   // index of the about-to-be-added assistant msg
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setStreaming(true)
    setError(null)

    // ── 1. Retrieve similar examples + extract params in parallel ─────────────
    const calcTypeHint = detectCalcType(userMessage)
    const quickParams  = extractQuickParams(userMessage)

    const [examplesCtx, extractionResponse] = await Promise.all([
      findSimilarExamples({
        calcType:        calcTypeHint,
        designCurrent:   quickParams.designCurrent,
        cableLength:     quickParams.cableLength,
        voltage:         quickParams.voltage,
        referenceMethod: quickParams.referenceMethod,
      }),
      // Phase 1: Haiku extracts parameters — fast, cheap, no streaming
      completeAiRequest({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system:     EXTRACTION_PROMPT,
        message:    userMessage,
      }).then(text => ({ content: [{ type: 'text' as const, text }] }))
        .catch(() => null),   // silent fallback — extraction failure is non-fatal
    ])

    // ── 2. Run actual calculator if parameters were extracted ─────────────────
    let fillAction: FillAction | null = null
    let calcPayload: CalcResultPayload | null = null

    if (extractionResponse) {
      const extractText = extractionResponse.content[0]?.type === 'text'
        ? extractionResponse.content[0].text
        : ''
      fillAction = parseExtractedInputs(extractText)
    }

    if (fillAction) {
      calcPayload = await runCalculator(fillAction)
      if (calcPayload) {
        // Attach result card immediately — visible while Claude streams its explanation
        setCalcResult(assistantIdx, calcPayload)
        setPendingFill(fillAction)
      }
    }

    // ── 3. Build system context — inject ACTUAL result so Claude explains it ──
    const currentCtx = buildResultContext(currentResult)
    const actualCtx  = calcPayload ? buildCalcPayloadContext(calcPayload) : ''

    const system = [
      SYSTEM_PROMPT,
      examplesCtx,
      currentCtx ? `\n\n---\n${currentCtx}` : '',
      actualCtx  ? `\n\n---\nACTUAL CALCULATOR RESULT (use these exact numbers):\n${actualCtx}` : '',
    ].join('')

    // ── 4. Stream explanation based on actual results ─────────────────────────
    let fullText = ''
    let provider: 'claude' | 'gemini' = 'claude'
    try {
      for await (const chunk of streamAiResponse(
        {
          model:      effectiveModel,
          max_tokens: 1024,
          system,
          messages:   nextMessages.map(m => ({ role: m.role, content: m.content })),
        },
        () => { provider = 'gemini' },
      )) {
        fullText += chunk
        setMessages([...nextMessages, { role: 'assistant', content: fullText }])
      }

      // Fallback: if Haiku extraction failed, try parsing the AI's own response
      if (!fillAction) {
        const fallbackAction = parseExtractedInputs(fullText)
        if (fallbackAction) {
          const fallbackPayload = await runCalculator(fallbackAction)
          if (fallbackPayload) {
            setCalcResult(assistantIdx, fallbackPayload)
            setPendingFill(fallbackAction)
          }
          fillAction = fallbackAction
        }
      }

      return { fillAction, provider }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed'
      setError(msg)
      setMessages(nextMessages)
      return { fillAction: null, provider: 'claude' }
    } finally {
      setStreaming(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentResult, modelId])

  const reset = useCallback(() => {
    setMessages([])
    setError(null)
  }, [setMessages])

  return { messages, streaming, error, send, reset }
}
