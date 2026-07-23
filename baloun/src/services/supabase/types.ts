import type { InterestKind } from '@/features/feed/types/main'

// Righe del database usate dall'app (scritte a mano: nessun tool da terminale).
export type ProfileRow = {
  id: string
  display_name: string | null
  birth_date: string | null
  city: string | null
  bio: string | null
  avatar_path: string | null
  onboarded: boolean
}

/** Riga restituita da get_feed() */
export type FeedRow = {
  main_id: string
  room_id: string
  name: string
  age: number
  city: string
  avatar_path: string | null
  interests: { kind: InterestKind; value: string }[]
}

/** Riga restituita da get_my_room_waitlist() — chi ha premuto KEEP su di me */
export type RoomWaitlistRow = {
  id: string
  balloon_id: string
  balloon_name: string | null
  balloon_city: string | null
  created_at: string
}

/** Riga restituita da get_my_keeps() — le stanze in cui sono in attesa */
export type MyKeepRow = {
  room_id: string
  main_id: string
  main_name: string | null
  created_at: string
}
