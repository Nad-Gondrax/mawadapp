import { createBrowserClient } from '@supabase/ssr'
import { hasSupabaseEnv, missingSupabaseEnvError } from './env'

export function createClient() {
  if (!hasSupabaseEnv()) {
    throw missingSupabaseEnvError()
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
