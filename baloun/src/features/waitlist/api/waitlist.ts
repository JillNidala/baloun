import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import { fullAvatarUrl, avatarUrl } from '@/services/storage/avatar'
import type { MyKeepRow, RevealRow } from '@/services/supabase/types'

/** Le stanze in cui sono in attesa, con orario di apertura. */
export function useMyKeeps() {
  return useQuery({
    queryKey: ['my-keeps'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_keeps')
      if (error) throw error

      const rows = (data ?? []) as MyKeepRow[]
      return Promise.all(
        rows.map(async (row) => ({
          ...row,
          // sfocata prima dell'apertura, nitida dopo
          blurredUrl: avatarUrl(row.avatar_path),
          fullUrl: await fullAvatarUrl(row.avatar_full_path),
        })),
      )
    },
    // Il conto alla rovescia è locale, ma ogni tanto riallineiamo con il server.
    refetchInterval: 30_000,
  })
}

/**
 * Profilo completo del Main. Il database risponde solo se la stanza
 * è aperta e sei in waitlist: in caso contrario torna null.
 */
export function useRoomReveal(roomId: string | undefined) {
  return useQuery({
    queryKey: ['room-reveal', roomId],
    enabled: Boolean(roomId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_room_reveal', { p_room_id: roomId })
      if (error) throw error

      const row = ((data ?? []) as RevealRow[])[0]
      if (!row) return null

      // Le foto vere arrivano con link temporanei, validi pochi minuti.
      const photoUrl = await fullAvatarUrl(row.avatar_full_path)
      const gallery = (
        await Promise.all((row.photos ?? []).map((ph) => fullAvatarUrl(ph.path)))
      ).filter((url): url is string => Boolean(url))

      return { ...row, photoUrl, gallery }
    },
  })
}

export type RevealResult = { keep: boolean }

/** Seconda decisione, quella sul profilo completo. */
export function useRevealDecision(roomId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ keep }: RevealResult) => {
      const { error } = await supabase.rpc('submit_reveal_decision', {
        p_room_id: roomId,
        p_keep: keep,
      })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-keeps'] })
      void queryClient.invalidateQueries({ queryKey: ['room-reveal', roomId] })
    },
  })
}
