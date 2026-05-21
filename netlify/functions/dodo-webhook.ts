import type { Handler } from '@netlify/functions'
import crypto from 'node:crypto'
import { PLAN_MAP } from './_products'

function verifySignature(
  webhookId: string,
  webhookTimestamp: string,
  payload: string,
  signatureHeader: string,
  secret: string,
): boolean {
  try {
    const signedContent = `${webhookId}\n${webhookTimestamp}\n${payload}`
    const secretBytes   = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
    const mac           = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64')
    return signatureHeader.split(' ').some(token => {
      const sig = token.split(',')[1]
      if (!sig) return false
      try { return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(sig)) }
      catch { return false }
    })
  } catch { return false }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const webhookId        = event.headers['webhook-id']        ?? ''
  const webhookTimestamp = event.headers['webhook-timestamp'] ?? ''
  const webhookSignature = event.headers['webhook-signature'] ?? ''
  const payload          = event.body ?? ''

  if (!verifySignature(webhookId, webhookTimestamp, payload, webhookSignature, process.env.DODO_WEBHOOK_SECRET ?? '')) {
    console.error('Dodo webhook: invalid signature')
    return { statusCode: 401, body: 'Invalid signature' }
  }

  const { type, data } = JSON.parse(payload) as { type: string; data: Record<string, unknown> }
  console.log(`Dodo webhook: ${type}`, JSON.stringify(data))

  switch (type) {
    case 'payment.succeeded':
      console.log(`Payment succeeded: ${data['payment_id']} — ${(data['metadata'] as Record<string, string>)?.credits} credits`)
      break
    case 'subscription.active': {
      const plan = PLAN_MAP[data['product_id'] as string]
      console.log(`Subscription active → plan: ${plan ?? 'unknown'}`)
      // TODO: update user plan in Supabase (when auth is added)
      break
    }
    case 'subscription.cancelled':
    case 'subscription.expired':
      console.log(`Subscription ended: ${data['subscription_id']}`)
      // TODO: downgrade user to free in Supabase
      break
    case 'subscription.plan_changed':
      console.log(`Plan changed: ${data['subscription_id']}`)
      break
    case 'subscription.renewed':
      console.log(`Subscription renewed: ${data['subscription_id']}`)
      break
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}
