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
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')

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
    // 1. Create the auth user (auto-confirmed, no email verification)
    const { data, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createErr) return res.status(400).json({ error: createErr.message })

    const userId = data.user.id

    // 2. Small delay — give any DB trigger time to create the profile row
    await delay(500)

    // 3. Try to UPDATE the existing profile row (if the trigger already created it)
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ plan })
      .eq('id', userId)
      .select('id')

    if (updateErr) {
      console.warn('profile update error:', updateErr.message)
    }

    // 4. If no row was updated (trigger didn't create it), INSERT one manually
    const rowExists = Array.isArray(updated) && updated.length > 0
    if (!rowExists) {
      const now = new Date().toISOString()
      const { error: insertErr } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email,
          plan,
          credits_used: 0,
          credits_purchased: 0,
          credits_period: now.slice(0, 7), // "YYYY-MM"
          created_at: now,
        })

      if (insertErr) {
        console.error('profile insert error:', insertErr.message)
        // Auth user created but profile failed — still return success,
        // the row will be created on first login via the trigger/auth flow
        return res.status(200).json({ success: true, userId, warning: insertErr.message })
      }
    }

    return res.status(200).json({ success: true, userId })
  } catch (err) {
    console.error('create-user error:', err)
    return res.status(500).json({ error: String(err) })
  }
}
