import type { Handler } from '@netlify/functions'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { PLAN_MAP } from './_products'

function getSupabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

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

  const { type, data } = JSON.parse(payload) as {
    type: string
    data: Record<string, unknown>
  }
  const meta = (data['metadata'] as Record<string, string> | undefined) ?? {}
  console.log(`Dodo webhook: ${type}`, JSON.stringify(data))

  switch (type) {

    case 'payment.succeeded': {
      const credits = meta['credits']
      const userId  = meta['user_id']
      console.log(`Payment succeeded: ${data['payment_id']} — ${credits} credits, user: ${userId ?? 'anonymous'}`)

      if (userId && credits && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = getSupabaseAdmin()
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('credits_purchased')
          .eq('id', userId)
          .single()

        const current = (profile as { credits_purchased?: number } | null)?.credits_purchased ?? 0
        await supabaseAdmin
          .from('profiles')
          .update({ credits_purchased: current + parseInt(credits, 10) })
          .eq('id', userId)

        console.log(`Webhook: credited ${credits} to user ${userId}`)
      }
      break
    }

    case 'subscription.active': {
      const plan   = PLAN_MAP[data['product_id'] as string]
      const userId = meta['user_id']
      console.log(`Subscription active → plan: ${plan ?? 'unknown'}, user: ${userId ?? 'unknown'}`)

      if (plan && userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = getSupabaseAdmin()
        await supabaseAdmin
          .from('profiles')
          .update({ plan })
          .eq('id', userId)
        console.log(`Webhook: set plan=${plan} for user ${userId}`)
      }
      break
    }

    case 'subscription.cancelled':
    case 'subscription.expired': {
      const userId = meta['user_id']
      console.log(`Subscription ended: ${data['subscription_id']}, user: ${userId ?? 'unknown'}`)

      if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = getSupabaseAdmin()
        await supabaseAdmin
          .from('profiles')
          .update({ plan: 'free' })
          .eq('id', userId)
        console.log(`Webhook: downgraded user ${userId} to free`)
      }
      break
    }

    case 'subscription.plan_changed':
      console.log(`Plan changed: ${data['subscription_id']}`)
      break

    case 'subscription.renewed':
      console.log(`Subscription renewed: ${data['subscription_id']}`)
      break
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}
