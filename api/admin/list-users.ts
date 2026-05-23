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
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed')

  const jwt = (req.headers['authorization'] as string ?? '').replace('Bearer ', '')
  if (!jwt) return res.status(401).json({ error: 'Unauthorized' })

  const supabaseAdmin = getSupabaseAdmin()
  const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(jwt)
  if (authErr || !caller || !ADMIN_EMAILS.includes(caller.email ?? '')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, plan, credits_used, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ profiles: data ?? [] })
}
