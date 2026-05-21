import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '../lib/supabase'
import { usePlanStore } from './planStore'
import { useAiQuotaStore } from './aiQuotaStore'

interface AuthStore {
  user:        User | null
  session:     Session | null
  profile:     Profile | null
  initialised: boolean

  signUp:          (email: string, password: string) => Promise<{ error: string | null }>
  signIn:          (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut:         () => Promise<void>
  loadProfile:     () => Promise<Profile | null>
  _setSession:     (session: Session | null) => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user:        null,
  session:     null,
  profile:     null,
  initialised: false,

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return { error: error?.message ?? null }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.session) {
      set({ session: data.session, user: data.user })
      await get().loadProfile()
    }
    return { error: error?.message ?? null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    // Reset to free plan and zero quota on logout
    usePlanStore.getState().setPlan('free')
    useAiQuotaStore.getState().resetForDev()
    set({ user: null, session: null, profile: null })
  },

  loadProfile: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single()

    if (error || !data) return null

    const profile = data as Profile
    set({ profile })

    // Hydrate plan and quota stores from the database
    usePlanStore.getState().setPlan(profile.plan)
    useAiQuotaStore.getState().setFromProfile(profile)

    return profile
  },

  _setSession: (session) => {
    set({ session, user: session?.user ?? null, initialised: true })
  },
}))
