import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// STEP 2: predisposto ma non ancora usato. Se le variabili non ci sono,
// l'app funziona comunque (auth simulata). Nello Step 3 le compileremo.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null
