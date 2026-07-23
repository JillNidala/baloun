import { supabase, isSupabaseConfigured } from '@/services/supabase/client'
import { useWaitlist } from '@/store/waitlist'
import type { Main } from '@/features/feed/types/main'

// KEEP → il Balloon entra nella waitlist della stanza del Main.
// POP  → non salva nulla (per questo non esiste una funzione "pop").
//
// Questa è l'UNICA funzione da cambiare nello Step 3: il resto della UI
// non sa se i dati finiscono in locale o su Supabase.
export async function joinWaitlist(main: Main): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('room_waitlist').insert({
      room_id: main.roomId,
      main_id: main.id,
    })
    if (error) throw error
    return
  }

  // Fallback locale (Step 2)
  useWaitlist.getState().add({
    roomId: main.roomId,
    mainId: main.id,
    mainName: main.name,
    joinedAt: new Date().toISOString(),
  })
}
