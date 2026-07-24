import { supabase } from '@/services/supabase/client'

export async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}

// Messaggi di errore leggibili al posto di quelli tecnici di Supabase.
export function authErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  if (raw.includes('Invalid login credentials')) return 'Email o password non corretti.'
  if (raw.includes('already registered')) return 'Questa email è già registrata.'
  if (raw.includes('Email not confirmed')) return 'Devi confermare la tua email prima di entrare.'
  if (raw.includes('Password should be')) return 'La password deve avere almeno 6 caratteri.'
  if (raw.toLowerCase().includes('fetch')) return 'Nessuna connessione al server. Riprova.'
  return 'Qualcosa non ha funzionato. Riprova.'
}
