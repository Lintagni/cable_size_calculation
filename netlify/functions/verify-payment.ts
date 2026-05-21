import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const paymentId = event.queryStringParameters?.payment_id
  if (!paymentId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing payment_id' }) }
  }

  if (!process.env.DODO_SECRET_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Payment service not configured.' }) }
  }

  try {
    // ── 1. Verify the payment with Dodo ──────────────────────────────────────
    const res = await fetch(`https://api.dodopayments.com/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.DODO_SECRET_KEY}` },
    })

    const data = await res.json() as {
      status?:   string
      metadata?: { credits?: string; user_id?: string }
      [key: string]: unknown
    }

    if (!res.ok) throw new Error(JSON.stringify(data))

    if (data.status !== 'succeeded') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Payment not completed', status: data.status }),
      }
    }

    const credits = parseInt(data.metadata?.credits ?? '0', 10)
    if (!credits) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No credits in payment metadata' }) }
    }

    // ── 2. If a JWT is supplied, write credits to Supabase ───────────────────
    const authHeader = event.headers['authorization'] ?? ''
    const jwt        = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (jwt && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VITE_SUPABASE_URL) {
      const supabaseAdmin = getSupabaseAdmin()

      // Verify the JWT and get the user
      const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(jwt)

      if (!authErr && user) {
        // Read current purchased credits so we can increment
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('credits_purchased')
          .eq('id', user.id)
          .single()

        const currentPurchased = (profile as { credits_purchased?: number } | null)?.credits_purchased ?? 0

        await supabaseAdmin
          .from('profiles')
          .update({ credits_purchased: currentPurchased + credits })
          .eq('id', user.id)

        console.log(`verify-payment: added ${credits} credits to user ${user.id} (total purchased: ${currentPurchased + credits})`)
      } else {
        console.warn('verify-payment: JWT present but could not verify user:', authErr?.message)
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: true, credits }),
    }
  } catch (err) {
    console.error('verify-payment error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
  }
}
