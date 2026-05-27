import { useState, useCallback } from 'react'
import { SYSTEM_PROMPT, buildResultContext, type ChatMessage } from '../../lib/claude'
import { streamAiResponse } from '../../lib/aiProvider'
import type { LvCableResult } from '../../calculators/lvCableSizing'

export function useChatStream(currentResult: LvCableResult | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(async (userText: string) => {
    if (!userText.trim() || streaming) return

    const userMsg: ChatMessage = { role: 'user', content: userText }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setStreaming(true)
    setError(null)

    const resultCtx = buildResultContext(currentResult)
    const systemWithCtx = resultCtx
      ? `${SYSTEM_PROMPT}\n\n---\n${resultCtx}`
      : SYSTEM_PROMPT

    let assistantText = ''
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      for await (const chunk of streamAiResponse({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemWithCtx,
        messages: updated.map(m => ({ role: m.role, content: m.content })),
      })) {
        assistantText += chunk
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: assistantText },
        ])
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'API error'
      setError(msg)
      setMessages(prev => prev.slice(0, -1)) // remove empty assistant bubble
    } finally {
      setStreaming(false)
    }
  }, [messages, streaming, currentResult])

  const clear = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, streaming, error, send, clear }
}
