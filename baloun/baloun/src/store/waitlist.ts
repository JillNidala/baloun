import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Un record di waitlist: il Balloon (utente corrente) è entrato
// nella waitlist della stanza di un Main.
export type WaitlistEntry = {
  roomId: string
  mainId: string
  mainName: string
  joinedAt: string
}

type WaitlistState = {
  entries: WaitlistEntry[]
  add: (entry: WaitlistEntry) => void
  clear: () => void
}

// STEP 2: salvataggio locale (persistente sul telefono).
// STEP 3: verrà sostituito dall'insert su Supabase (tabella room_waitlist).
export const useWaitlist = create<WaitlistState>()(
  persist(
    (set) => ({
      entries: [],
      add: (entry) =>
        set((s) =>
          s.entries.some((e) => e.roomId === entry.roomId)
            ? s
            : { entries: [entry, ...s.entries] },
        ),
      clear: () => set({ entries: [] }),
    }),
    { name: 'baloun-waitlist' },
  ),
)
