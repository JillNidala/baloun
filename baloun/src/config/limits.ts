// Regole di dominio della V1 — un unico posto.
// Nota: lato app servono solo per la UX; le regole "vere" verranno imposte
// dal database (vincoli + funzioni RPC) nello Step 3.
export const LIMITS = {
  MAX_BALLOONS_PER_ROOM: 20,
  MAX_ACTIVE_BALLOONS: 10,
  MAX_OPEN_ROOMS_AS_MAIN: 1,
  ROOM_DURATION_HOURS: 24,
} as const

// Regole del feed della Home.
export const FEED = {
  /** Quanti Main può vedere un utente in una sessione. */
  MAX_MAINS_PER_SESSION: 10,
  /** Durata della conferma dopo il KEEP, in ms. */
  KEEP_CONFIRMATION_MS: 900,
  /**
   * Quanto dura l'attesa prima che una stanza si apra.
   * ATTENZIONE: il valore vero sta nel database
   * (rooms.open_delay_seconds, oggi 60). Questo serve solo per i testi.
   */
  ROOM_OPEN_DELAY_SECONDS: 60,
} as const

export const BRAND = {
  name: 'BALOUN',
  tagline: 'Non accumuli like. Arrivi alla fine.',
} as const
