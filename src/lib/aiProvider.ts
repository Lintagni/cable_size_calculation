import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

const gemini = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')

/** True when the Anthropic error is a billing/quota error (not a logic error) */
function isQuotaError(e: unknown): boolean {
  if (e instanceof Error) {
    const msg = e.message.toLowerCase()
    return msg.includes('credit balance is too low') || msg.includes('quota exceeded')
  }
  return false
}

function toGeminiModel(claudeModel: string): string {
  // Use Flash for Haiku-class (cheap/fast), Flash for Sonnet-class as fallback
  if (claudeModel.includes('haiku')) return 'gemini-2.0-flash'
  return 'gemini-2.0-flash'
}

export interface StreamParams {
  model: string
  max_tokens: number
  system: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

/**
 * Streams text chunks from Claude. Falls back to Gemini automatically
 * when Claude returns a "credit balance too low" error.
 */
export async function* streamAiResponse(params: StreamParams): AsyncGenerator<string> {
  // ── Try Claude ───────────────────────────────────────────────────────────────
  try {
    const stream = anthropic.messages.stream({
      model: params.model as Parameters<typeof anthropic.messages.stream>[0]['model'],
      max_tokens: params.max_tokens,
      system: params.system,
      messages: params.messages,
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text
      }
    }
    return
  } catch (e) {
    if (!isQuotaError(e)) throw e
    console.warn('[AI] Claude quota exhausted — falling back to Gemini')
  }

  // ── Gemini fallback ──────────────────────────────────────────────────────────
  const model = gemini.getGenerativeModel({
    model: toGeminiModel(params.model),
    systemInstruction: params.system,
  })

  // Convert history (all but last message) to Gemini's format
  const lastMsg = params.messages[params.messages.length - 1]
  const history = params.messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const chat   = model.startChat({ history })
  const result = await chat.sendMessageStream(lastMsg.content)

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) yield text
  }
}

/**
 * Single-turn (non-streaming) completion. Used for fast parameter extraction.
 * Falls back to Gemini on Claude quota error.
 */
export async function completeAiRequest(params: {
  model: string
  max_tokens: number
  system: string
  message: string
}): Promise<string> {
  // ── Try Claude ───────────────────────────────────────────────────────────────
  try {
    const response = await anthropic.messages.create({
      model: params.model as Parameters<typeof anthropic.messages.create>[0]['model'],
      max_tokens: params.max_tokens,
      system: params.system,
      messages: [{ role: 'user', content: params.message }],
    })
    return response.content[0]?.type === 'text' ? response.content[0].text : ''
  } catch (e) {
    if (!isQuotaError(e)) throw e
    console.warn('[AI] Claude quota exhausted — falling back to Gemini for extraction')
  }

  // ── Gemini fallback ──────────────────────────────────────────────────────────
  const model  = gemini.getGenerativeModel({
    model: toGeminiModel(params.model),
    systemInstruction: params.system,
  })
  const result = await model.generateContent(params.message)
  return result.response.text()
}
