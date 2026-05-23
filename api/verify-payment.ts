import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed')
  }

  const paymentId = req.query.payment_id as string | undefined
  if (!paymentId) {
    return res.status(400).json({ error: 'Missing payment_id' })
  }

  if (!process.env.DODO_SECRET_KEY) {
    return res.status(500).json({ error: 'Payment service not configured.' })
  }

  try {
    // 1. Verify payment with Dodo
    const dodoRes = await fetch(`https://api.dodopayments.com/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.DODO_SECRET_KEY}` },
    })

    const data = await dodoRes.json() as {
      status?:   string
      metadata?: { credits?: string; user_id?: string }
      [key: string]: unknown
    }

    if (!dodoRes.ok) throw new Error(JSON.stringify(data))

    if (data.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed', status: data.status })
    }

    const credits = parseInt(data.metadata?.credits ?? '0', 10)
    if (!credits) {
      return res.status(400).json({ error: 'No credits in payment metadata' })
    }

    // 2. Write credits to Supabase if JWT provided
    const authHeader = (req.headers['authorization'] as string) ?? ''
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (jwt && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VITE_SUPABASE_URL) {
      const supabaseAdmin = getSupabaseAdmin()
      const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(jwt)

      if (!authErr && user) {
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

        console.log(`verify-payment: added ${credits} credits to user ${user.id}`)
      } else {
        console.warn('verify-payment: JWT present but could not verify user:', authErr?.message)
      }
    }

    return res.status(200).json({ verified: true, credits })
  } catch (err) {
    console.error('verify-payment error:', err)
    return res.status(500).json({ error: String(err) })
  }
}
