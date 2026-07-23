import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import { avatarUrl } from '@/services/storage/avatar'
import { FEED } from '@/config/limits'
import type { FeedRow, RoomWaitlistRow, MyKeepRow } from '@/services/supabase/types'
import type { Main } from '@/features/feed/types/main'

// Palette di riserva quando un Main non ha ancora caricato la foto.
const HUES = ['#E8859B', '#A78BC8', '#E8A87C', '#7EB8C4', '#C9A87C', '#8FB58A']

function toMain(row: FeedRow, index: number): Main {
  return {
    id: row.main_id,
    roomId: row.room_id,
    name: row.name,
    age: row.age,
    city: row.city,
    avatarUrl: avatarUrl(row.avatar_path),
    avatarHue: HUES[index % HUES.length],
    interests: row.interests ?? [],
  }
}

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: async (): Promise<Main[]> => {
      const { data, error } = await supabase.rpc('get_feed', {
        p_limit: FEED.MAX_MAINS_PER_SESSION,
      })
      if (error) throw error
      return ((data ?? []) as FeedRow[]).map(toMain)
    },
    staleTime: 5 * 60 * 1000,
  })
}

/** KEEP → entra nella waitlist della stanza. POP non salva nulla. */
export async function joinWaitlist(main: Main): Promise<void> {
  const { error } = await supabase
    .from('room_waitlist')
    .insert({ room_id: main.roomId, main_id: main.id })
  // 23505 = record già presente: va benissimo, l'utente è già in lista.
  if (error && error.code !== '23505') throw error
}

/** Chi è entrato nella mia stanza (vista Main). */
export function useMyRoomWaitlist() {
  return useQuery({
    queryKey: ['my-room-waitlist'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_room_waitlist')
      if (error) throw error
      return (data ?? []) as RoomWaitlistRow[]
    },
  })
}

/** Le stanze in cui sono in attesa (vista Balloon). */
export function useMyKeeps() {
  return useQuery({
    queryKey: ['my-keeps'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_keeps')
      if (error) throw error
      return (data ?? []) as MyKeepRow[]
    },
  })
}
