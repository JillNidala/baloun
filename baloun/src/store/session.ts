import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import type { ProfileRow } from '@/services/supabase/types'

type SessionState = {
  /** null = non autenticato. undefined = non ancora saputo (avvio dell'app). */
  session: Session | null | undefined
  profile: ProfileRow | null
  setSession: (session: Session | null) => void
  setProfile: (profile: ProfileRow | null) => void
}

export const useSession = create<SessionState>((set) => ({
  session: undefined,
  profile: null,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
}))
