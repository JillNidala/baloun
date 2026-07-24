import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * La bozza dell'onboarding vive nel telefono finché non si arriva in fondo.
 * Se chiudi l'app a metà, riapri e ritrovi tutto dov'eri.
 * Solo all'ultimo passo il contenuto finisce nel database.
 */
export type Bozza = {
  passo: number
  displayName: string
  birthDate: string
  city: string
  gender: string | null
  interestedIn: string[]
  religion: string | null
  politics: string | null
  profession: string
  tags: string[]
  prompts: { prompt_id: string; answer: string }[]
  /** le foto si caricano subito: qui restano solo i percorsi */
  photos: { position: number; full: string; small: string }[]
}

const VUOTA: Bozza = {
  passo: 0,
  displayName: '',
  birthDate: '',
  city: '',
  gender: null,
  interestedIn: [],
  religion: null,
  politics: null,
  profession: '',
  tags: [],
  prompts: [],
  photos: [],
}

type Stato = {
  bozza: Bozza
  aggiorna: (patch: Partial<Bozza>) => void
  vaiA: (passo: number) => void
  azzera: () => void
}

export const useBozza = create<Stato>()(
  persist(
    (set) => ({
      bozza: VUOTA,
      aggiorna: (patch) => set((s) => ({ bozza: { ...s.bozza, ...patch } })),
      vaiA: (passo) => set((s) => ({ bozza: { ...s.bozza, passo } })),
      azzera: () => set({ bozza: VUOTA }),
    }),
    { name: 'baloun-onboarding' },
  ),
)

/** Regole minime: i passi obbligatori non si saltano. */
export const LIMITI = {
  TAG_MIN: 3,
  TAG_MAX: 8,
  SPUNTI_MIN: 3,
  FOTO_MIN: 1,
  ETA_MIN: 18,
} as const
