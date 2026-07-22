import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// STEP 2 — sessione SIMULATA per poter testare subito il flusso su iPhone.
// Nello Step 3 questo store verrà collegato a supabase.auth (login reale).
type User = {
  id: string
  email: string
  displayName: string
}

type SessionState = {
  user: User | null
  onboarded: boolean
  signIn: (email: string) => void
  signOut: () => void
  completeOnboarding: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      onboarded: false,
      signIn: (email) =>
        set({
          user: {
            id: crypto.randomUUID(),
            email,
            displayName: email.split('@')[0] || 'tu',
          },
        }),
      signOut: () => set({ user: null, onboarded: false }),
      completeOnboarding: () => set({ onboarded: true }),
    }),
    { name: 'baloun-session' },
  ),
)
