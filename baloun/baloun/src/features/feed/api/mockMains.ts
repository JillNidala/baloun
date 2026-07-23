import type { Main } from '@/features/feed/types/main'

// STEP 2 — dati finti. Nello Step 3 arriveranno da Supabase
// (query sui Main con stanza aperta, esclusi quelli già decisi).
export const MOCK_MAINS: Main[] = [
  {
    id: 'm1',
    roomId: 'room-1',
    name: 'Giulia',
    age: 24,
    city: 'Milano',
    avatarHue: '#E8859B',
    interests: [
      { kind: 'music', value: 'After Hours — The Weeknd' },
      { kind: 'food', value: 'Sushi' },
    ],
  },
  {
    id: 'm2',
    roomId: 'room-2',
    name: 'Marco',
    age: 29,
    city: 'Torino',
    avatarHue: '#A78BC8',
    interests: [
      { kind: 'music', value: 'Blonde — Frank Ocean' },
      { kind: 'food', value: 'Ramen' },
    ],
  },
  {
    id: 'm3',
    roomId: 'room-3',
    name: 'Sara',
    age: 27,
    city: 'Milano',
    avatarHue: '#E8A87C',
    interests: [
      { kind: 'music', value: 'Cellophane — FKA twigs' },
      { kind: 'food', value: 'Tacos al pastor' },
    ],
  },
  {
    id: 'm4',
    roomId: 'room-4',
    name: 'Luca',
    age: 31,
    city: 'Bergamo',
    avatarHue: '#7EB8C4',
    interests: [
      { kind: 'music', value: 'In Rainbows — Radiohead' },
      { kind: 'food', value: 'Pizza napoletana' },
    ],
  },
  {
    id: 'm5',
    roomId: 'room-5',
    name: 'Chiara',
    age: 26,
    city: 'Bologna',
    avatarHue: '#C9A87C',
    interests: [
      { kind: 'music', value: 'Rumours — Fleetwood Mac' },
      { kind: 'food', value: 'Tortellini in brodo' },
    ],
  },
  {
    id: 'm6',
    roomId: 'room-6',
    name: 'Matteo',
    age: 28,
    city: 'Roma',
    avatarHue: '#8FB58A',
    interests: [
      { kind: 'music', value: 'Random Access Memories — Daft Punk' },
      { kind: 'food', value: 'Carbonara' },
    ],
  },
  {
    id: 'm7',
    roomId: 'room-7',
    name: 'Elena',
    age: 25,
    city: 'Firenze',
    avatarHue: '#D9899B',
    interests: [
      { kind: 'music', value: 'Punisher — Phoebe Bridgers' },
      { kind: 'food', value: 'Pad thai' },
    ],
  },
  {
    id: 'm8',
    roomId: 'room-8',
    name: 'Davide',
    age: 30,
    city: 'Milano',
    avatarHue: '#9AA9C4',
    interests: [
      { kind: 'music', value: 'Kind of Blue — Miles Davis' },
      { kind: 'food', value: 'Poke' },
    ],
  },
  {
    id: 'm9',
    roomId: 'room-9',
    name: 'Alice',
    age: 23,
    city: 'Verona',
    avatarHue: '#E0A3B8',
    interests: [
      { kind: 'music', value: 'SOS — SZA' },
      { kind: 'food', value: 'Gnocchi al pomodoro' },
    ],
  },
  {
    id: 'm10',
    roomId: 'room-10',
    name: 'Federico',
    age: 32,
    city: 'Padova',
    avatarHue: '#B0A88F',
    interests: [
      { kind: 'music', value: 'Currents — Tame Impala' },
      { kind: 'food', value: 'Bao' },
    ],
  },
  {
    id: 'm11',
    roomId: 'room-11',
    name: 'Martina',
    age: 27,
    city: 'Genova',
    avatarHue: '#C8A2C8',
    interests: [
      { kind: 'music', value: 'Norman Rockwell — Lana Del Rey' },
      { kind: 'food', value: 'Focaccia' },
    ],
  },
  {
    id: 'm12',
    roomId: 'room-12',
    name: 'Simone',
    age: 26,
    city: 'Milano',
    avatarHue: '#89B0AE',
    interests: [
      { kind: 'music', value: 'Igor — Tyler, The Creator' },
      { kind: 'food', value: 'Curry thai' },
    ],
  },
]
