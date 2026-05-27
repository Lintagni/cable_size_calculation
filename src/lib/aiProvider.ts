import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

const gemini = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')

/** True when an error is a billing/quota/rate-limit error from either provider */
function isQuotaError(e: unknown): boolean {
  if (e instanceof Error) {
    const msg = e.message.toLowerCase()
    return (
      msg.includes('credit balance is too low') ||   // Anthropic billing
      msg.includes('quota exceeded') ||              // generic
      msg.includes('429')                            // Gemini / any 429
    )
  }
  return false
}

const BOTH_EXHAUSTED =
  'AI service temporarily unavailable — Claude credits are exhausted and the Gemini fallback has hit its quota. Please top up Claude credits or enable billing on your Gemini API project.'

function toGeminiModel(_claudeModel: string): string {
  return 'gemini-2.5-flash'
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
 * Calls onFallback() before the first Gemini chunk so callers can update UI.
 */
export async function* streamAiResponse(
  params: StreamParams,
  onFallback?: () => void,
): AsyncGenerator<string> {
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
    onFallback?.()
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

  const chat = model.startChat({ history })
  try {
    const result = await chat.sendMessageStream(lastMsg.content)
    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) yield text
    }
  } catch (e) {
    if (isQuotaError(e)) throw new Error(BOTH_EXHAUSTED)
    throw e
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
  try {
    const result = await model.generateContent(params.message)
    return result.response.text()
  } catch (e) {
    if (isQuotaError(e)) throw new Error(BOTH_EXHAUSTED)
    throw e
  }
}
