import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Se false, l'app mostra la schermata "backend da configurare". */
export const isSupabaseConfigured = Boolean(url && anonKey)

// Valori segnaposto quando manca la configurazione: l'app si avvia comunque
// e mostra le istruzioni, invece di schiantarsi con un errore incomprensibile.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
