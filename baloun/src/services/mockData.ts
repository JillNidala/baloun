// STEP 2 — dati finti per rendere l'app navigabile e testabile subito.
// Nello Step 3 verranno sostituiti da query reali a Supabase.
export type MockRoom = {
  id: string
  name: string
  age: number
  city: string
  distanceKm: number
  balloons: number
  minutesLeft: number
  hue: string
}

export const MOCK_ROOMS: MockRoom[] = [
  { id: 'r1', name: 'Giulia', age: 27, city: 'Milano', distanceKm: 3, balloons: 14, minutesLeft: 320, hue: '#F2C9D3' },
  { id: 'r2', name: 'Marco', age: 31, city: 'Torino', distanceKm: 12, balloons: 8, minutesLeft: 90, hue: '#D9C3E8' },
  { id: 'r3', name: 'Sara', age: 24, city: 'Milano', distanceKm: 1, balloons: 19, minutesLeft: 45, hue: '#F6D9C3' },
  { id: 'r4', name: 'Luca', age: 29, city: 'Bergamo', distanceKm: 40, balloons: 5, minutesLeft: 610, hue: '#C3E0E8' },
]

export function formatTimeLeft(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h <= 0) return `${m} min`
  return `${h}h ${m.toString().padStart(2, '0')}m`
}
