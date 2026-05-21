import type { Handler } from '@netlify/functions'
import crypto from 'node:crypto'

// Standard Webhooks signature verification
// Signed string: "{webhook-id}\n{webhook-timestamp}\n{raw_body}"
function verifySignature(
  webhookId: string,
  webhookTimestamp: string,
  payload: string,
  signatureHeader: string,
  secret: string,
): boolean {
  try {
    const signedContent = `${webhookId}\n${webhookTimestamp}\n${payload}`
    // Dodo secrets are base64-encoded; strip the "whsec_" prefix
    const secretBytes  = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
    const mac          = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64')

    // Header may contain multiple space-separated "v1,<sig>" tokens
    return signatureHeader.split(' ').some(token => {
      const sig = token.split(',')[1]
      if (!sig) return false
      try {
        return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(sig))
      } catch { return false }
    })
  } catch { return false }
}

type Plan = 'pro' | 'business'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const webhookId        = event.headers['webhook-id']        ?? ''
  const webhookTimestamp = event.headers['webhook-timestamp'] ?? ''
  const webhookSignature = event.headers['webhook-signature'] ?? ''
  const payload          = event.body ?? ''

  const valid = verifySignature(
    webhookId,
    webhookTimestamp,
    payload,
    webhookSignature,
    process.env.DODO_WEBHOOK_SECRET ?? '',
  )

  if (!valid) {
    console.error('Dodo webhook: invalid signature')
    return { statusCode: 401, body: 'Invalid signature' }
  }

  const { type, data } = JSON.parse(payload) as {
    type: string
    data: Record<string, unknown>
  }

  const PLAN_PRODUCTS: Record<string, Plan> = {
    [process.env.PRODUCT_PLAN_PRO      ?? '']:  'pro',
    [process.env.PRODUCT_PLAN_BUSINESS ?? '']: 'business',
  }

  console.log(`Dodo webhook: ${type}`, JSON.stringify(data))

  switch (type) {
    case 'payment.succeeded':
      // One-time credit pack — credits are granted via verify-payment after redirect
      console.log(`Payment succeeded: ${data['payment_id']} — ${(data['metadata'] as Record<string,string>)?.credits} credits`)
      break

    case 'subscription.active': {
      const plan = PLAN_PRODUCTS[data['product_id'] as string]
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
      console.log(`Subscription plan changed: ${data['subscription_id']}`)
      break

    case 'subscription.renewed':
      console.log(`Subscription renewed: ${data['subscription_id']}`)
      break
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}
