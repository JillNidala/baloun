import { create } from 'zustand'
import { FEED } from '@/config/limits'

// Stato della SESSIONE di feed. Volutamente NON persistito:
// riaprendo l'app inizia una nuova sessione.
type FeedState = {
  seenIds: string[]
  markSeen: (mainId: string) => void
  reset: () => void
}

export const useFeedSession = create<FeedState>((set) => ({
  seenIds: [],
  markSeen: (mainId) =>
    set((s) => (s.seenIds.includes(mainId) ? s : { seenIds: [...s.seenIds, mainId] })),
  reset: () => set({ seenIds: [] }),
}))

export function isSessionOver(seenCount: number): boolean {
  return seenCount >= FEED.MAX_MAINS_PER_SESSION
}
