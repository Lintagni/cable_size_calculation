import { useState, useCallback } from 'react'
import { SYSTEM_PROMPT, buildResultContext, parseExtractedInputs } from './claude'
import { streamAiResponse } from './aiProvider'
import type { LvCableResult, LvCableInput } from '../calculators/lvCableSizing'

export interface AiCompleteResult {
  text: string
  extractedInputs: Partial<LvCableInput> | null
}

export function useAiComplete(currentResult: LvCableResult | null) {
  const [streaming, setStreaming] = useState(false)
  const [response, setResponse] = useState<string>('')
  const [extracted, setExtracted] = useState<Partial<LvCableInput> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const complete = useCallback(async (userPrompt: string): Promise<AiCompleteResult> => {
    setStreaming(true)
    setResponse('')
    setExtracted(null)
    setError(null)

    const ctx = buildResultContext(currentResult)
    const system = ctx ? `${SYSTEM_PROMPT}\n\n---\n${ctx}` : SYSTEM_PROMPT

    let fullText = ''
    try {
      for await (const chunk of streamAiResponse({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: userPrompt }],
      })) {
        fullText += chunk
        setResponse(fullText)
      }

      const parsed = parseExtractedInputs(fullText)
      setExtracted(parsed?.inputs ?? null)
      return { text: fullText, extractedInputs: parsed?.inputs ?? null }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed'
      setError(msg)
      return { text: '', extractedInputs: null }
    } finally {
      setStreaming(false)
    }
  }, [currentResult])

  const reset = useCallback(() => {
    setResponse('')
    setExtracted(null)
    setError(null)
  }, [])

  return { streaming, response, extracted, error, complete, reset }
}
