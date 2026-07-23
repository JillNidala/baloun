import type { Transition } from 'framer-motion'

// Preset in stile Apple: spring, non durate fisse.
// Default critico (nessun rimbalzo) per le transizioni normali.
export const spring: Transition = { type: 'spring', bounce: 0, duration: 0.35 }

// Con un po' di rimbalzo — SOLO dove c'è "momentum" (pop, match, flick).
export const springBouncy: Transition = { type: 'spring', bounce: 0.28, duration: 0.45 }
