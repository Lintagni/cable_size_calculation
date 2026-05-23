import { createClient } from '@supabase/supabase-js'

export type Profile = {
  id: string
  email: string | null
  plan: 'free' | 'pro' | 'business'
  credits_purchased: number
  credits_period: string
  credits_used: number
}

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string | undefined
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnon) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — auth will not work.')
}

export const supabase = createClient(
  supabaseUrl  ?? 'https://placeholder.supabase.co',
  supabaseAnon ?? 'placeholder-anon-key',
)
