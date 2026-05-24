import { supabase } from './supabase'

/** Read the global test-mode flag from the settings table (public read, no auth needed). */
export async function getGlobalTestMode(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'global_test_mode')
      .single()
    if (error || !data) return false
    return data.value === 'true'
  } catch {
    return false
  }
}

/** Write the global test-mode flag — requires admin auth (RLS enforced server-side). */
export async function setGlobalTestMode(on: boolean): Promise<void> {
  await supabase
    .from('settings')
    .upsert({ key: 'global_test_mode', value: String(on) })
}
