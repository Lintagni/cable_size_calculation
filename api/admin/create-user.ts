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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')

  // Verify caller is an admin
  const jwt = (req.headers['authorization'] as string ?? '').replace('Bearer ', '')
  if (!jwt) return res.status(401).json({ error: 'Unauthorized' })

  const supabaseAdmin = getSupabaseAdmin()
  const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(jwt)
  if (authErr || !caller || !ADMIN_EMAILS.includes(caller.email ?? '')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { email, password, plan = 'free' } = req.body as {
    email: string
    password: string
    plan: 'free' | 'pro' | 'business'
  }

  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  try {
    // Create auth user (auto-confirmed)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) return res.status(400).json({ error: error.message })

    const userId = data.user.id

    // Upsert the profile row with chosen plan
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, email, plan, ai_credits_used: 0, created_at: new Date().toISOString() })

    return res.status(200).json({ success: true, userId })
  } catch (err) {
    console.error('create-user error:', err)
    return res.status(500).json({ error: String(err) })
  }
}
