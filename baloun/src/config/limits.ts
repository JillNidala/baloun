// Regole di dominio della V1 — un unico posto.
// Nota: lato app servono solo per la UX; le regole "vere" verranno imposte
// dal database (vincoli + funzioni RPC) nello Step 3.
export const LIMITS = {
  MAX_BALLOONS_PER_ROOM: 20,
  MAX_ACTIVE_BALLOONS: 10,
  MAX_OPEN_ROOMS_AS_MAIN: 1,
  ROOM_DURATION_HOURS: 24,
} as const

export const BRAND = {
  name: 'BALOUN',
  tagline: 'Non accumuli like. Arrivi alla fine.',
} as const
