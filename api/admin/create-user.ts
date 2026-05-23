import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAILS = ['gweerasinghe67@gmail.com', 'cryptopal95@gmail.com']

function getSupabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const jwt = ((req.headers['authorization'] as string) ?? '').replace('Bearer ', '').trim()
    if (!jwt) return res.status(401).json({ error: 'Unauthorized' })

    const supabaseAdmin = getSupabaseAdmin()
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(jwt)
    if (authErr || !caller || !ADMIN_EMAILS.includes(caller.email ?? '')) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { email, password, plan = 'free' } = (req.body ?? {}) as {
      email: string; password: string; plan: 'free' | 'pro' | 'business'
    }
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    // 1. Create auth user
    const { data, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (createErr) return res.status(400).json({ error: createErr.message })

    const userId = data.user.id
    const now    = new Date().toISOString()

    // 2. Wait briefly for any DB trigger to auto-create the profile row
    await delay(800)

    // 3. Upsert profile row
    const { error: upsertErr } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id:                userId,
          email,
          plan,
          credits_used:      0,
          credits_purchased: 0,
          credits_period:    now.slice(0, 7),
          created_at:        now,
        },
        { onConflict: 'id', ignoreDuplicates: false },
      )

    if (upsertErr) {
      console.error('profile upsert error:', JSON.stringify(upsertErr))
      return res.status(500).json({
        error: `User created in Auth but profile failed: ${upsertErr.message}`,
        detail: upsertErr,
        userId,
      })
    }

    const { data: check } = await supabaseAdmin
      .from('profiles')
      .select('id, plan')
      .eq('id', userId)
      .single()

    return res.status(200).json({ success: true, userId, profile: check })

  } catch (err) {
    console.error('create-user error:', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
}
