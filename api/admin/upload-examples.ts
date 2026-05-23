import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAILS = ['gweerasinghe67@gmail.com', 'cryptopal95@gmail.com']

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // ── Auth check ────────────────────────────────────────────────────────────
    const token = (req.headers.authorization ?? '').replace('Bearer ', '').trim()
    if (!token) return res.status(401).json({ error: 'Missing auth token' })

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' })
    if (!ADMIN_EMAILS.includes(user.email ?? '')) {
      return res.status(403).json({ error: 'Admin only' })
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = (req.body ?? {}) as { examples?: unknown[] }
    const examples = body.examples

    if (!Array.isArray(examples) || examples.length === 0) {
      return res.status(400).json({ error: 'No examples provided' })
    }

    if (examples.length > 500) {
      return res.status(400).json({ error: 'Max 500 examples per upload' })
    }

    // ── Insert ────────────────────────────────────────────────────────────────
    const { data, error: insertErr } = await supabaseAdmin
      .from('calculation_examples')
      .insert(examples)
      .select('id')

    if (insertErr) {
      console.error('insert error:', insertErr)
      return res.status(500).json({ error: insertErr.message })
    }

    return res.status(200).json({
      inserted: data?.length ?? 0,
      message:  `${data?.length ?? 0} example(s) added to knowledge base`,
    })

  } catch (e) {
    console.error('upload-examples error:', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Internal error' })
  }
}
