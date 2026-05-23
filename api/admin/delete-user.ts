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
  if (req.method !== 'DELETE') return res.status(405).send('Method Not Allowed')

  // Verify caller is an admin
  const jwt = (req.headers['authorization'] as string ?? '').replace('Bearer ', '')
  if (!jwt) return res.status(401).json({ error: 'Unauthorized' })

  const supabaseAdmin = getSupabaseAdmin()
  const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(jwt)
  if (authErr || !caller || !ADMIN_EMAILS.includes(caller.email ?? '')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { userId } = req.body as { userId: string }
  if (!userId) return res.status(400).json({ error: 'userId required' })

  // Prevent admin from deleting themselves
  if (userId === caller.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' })
  }

  try {
    // Delete profile row first (FK constraint)
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // Delete auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) return res.status(400).json({ error: error.message })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('delete-user error:', err)
    return res.status(500).json({ error: String(err) })
  }
}
