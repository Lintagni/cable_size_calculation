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

// `||` rather than `??` on purpose: an unset Vite env var compiles to an empty
// string, which would otherwise reach createClient() and throw at import time
// (this module is imported during the build-time prerender).
export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnon || 'placeholder-anon-key',
)
