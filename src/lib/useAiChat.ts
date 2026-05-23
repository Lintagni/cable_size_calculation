import { useState, useCallback } from 'react'
import { anthropic, SYSTEM_PROMPT, buildResultContext, parseExtractedInputs } from './claude'
import type { FillAction } from './claude'
import type { LvCableResult } from '../calculators/lvCableSizing'
import { useAiModelStore } from '../store/aiModelStore'
import { useAiChatStore } from '../store/aiChatStore'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function useAiChat(currentResult: LvCableResult | null) {
  const { messages, setMessages } = useAiChatStore()
  const { setPendingFill }        = useAiChatStore()
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
      // Store the pending fill so the component can show a button — don't auto-navigate
      if (fillAction) setPendingFill(fillAction)
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
