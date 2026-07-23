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

export type RevealDecision = 'pending' | 'kept' | 'popped'

/** Riga restituita da get_my_keeps() — le stanze in cui sono in attesa */
export type MyKeepRow = {
  room_id: string
  main_id: string
  main_name: string | null
  created_at: string
  opens_at: string | null
  is_open: boolean
  decision: RevealDecision
  is_closed: boolean
}

/** Riga restituita da get_room_reveal() — il profilo completo del Main */
export type RevealRow = {
  main_id: string
  name: string | null
  age: number
  city: string | null
  bio: string | null
  avatar_full_path: string | null
  interests: { kind: InterestKind; value: string }[]
  decision: RevealDecision
}

/** Riga di get_room_candidates() — chi è rimasto, visto dal Main */
export type CandidateRow = {
  room_id: string
  balloon_id: string
  name: string | null
  age: number
  city: string | null
  bio: string | null
  avatar_full_path: string | null
  interests: { kind: InterestKind; value: string }[]
}

/** Riga di get_my_matches() */
export type MatchRow = {
  match_id: string
  other_id: string
  other_name: string | null
  other_city: string | null
  avatar_full_path: string | null
  created_at: string
  is_new: boolean
  last_message: string | null
  last_message_at: string | null
}

export type MessageRow = {
  id: string
  match_id: string
  sender_id: string
  body: string
  created_at: string
}
