import { createClient } from '@supabase/supabase-js'

export type Profile = {
  id: string
  email: string | null
  plan: 'free' | 'pro' | 'business'
  credits_purchased: number
  credits_period: string
  credits_used: number
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
)
