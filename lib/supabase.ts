import { createClient } from '@supabase/supabase-js'
import { missingSupabaseEnvError } from './supabase/env'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw missingSupabaseEnvError()
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client for sensitive operations
export const supabaseServer = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}
