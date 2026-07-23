import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import { fullAvatarUrl } from '@/services/storage/avatar'
import type { CandidateRow, MatchRow } from '@/services/supabase/types'

/** Chi è rimasto nella mia stanza dopo il secondo giro (vista Main). */
export function useRoomCandidates() {
  return useQuery({
    queryKey: ['room-candidates'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_room_candidates')
      if (error) throw error

      const rows = (data ?? []) as CandidateRow[]
      return Promise.all(
        rows.map(async (row) => ({
          ...row,
          photoUrl: await fullAvatarUrl(row.avatar_full_path),
        })),
      )
    },
  })
}

/** Il Main sceglie: nasce il match. */
export function useChooseBalloon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (balloonId: string) => {
      const { data, error } = await supabase.rpc('choose_balloon', {
        p_balloon_id: balloonId,
      })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['room-candidates'] })
      void queryClient.invalidateQueries({ queryKey: ['my-matches'] })
      void queryClient.invalidateQueries({ queryKey: ['my-room-waitlist'] })
    },
  })
}

/** Le mie conversazioni. */
export function useMyMatches() {
  return useQuery({
    queryKey: ['my-matches'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_matches')
      if (error) throw error

      const rows = (data ?? []) as MatchRow[]
      return Promise.all(
        rows.map(async (row) => ({
          ...row,
          photoUrl: await fullAvatarUrl(row.avatar_full_path),
        })),
      )
    },
    refetchInterval: 30_000,
  })
}

/** L'animazione del match si vede una volta sola. */
export function useMarkMatchSeen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase.rpc('mark_match_seen', { p_match_id: matchId })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-matches'] })
    },
  })
}
