import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import type { MessageRow } from '@/services/supabase/types'

export function useMessages(matchId: string | undefined) {
  return useQuery({
    queryKey: ['messages', matchId],
    enabled: Boolean(matchId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, match_id, sender_id, body, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as MessageRow[]
    },
  })
}

export function useSendMessage(matchId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase
        .from('messages')
        .insert({ match_id: matchId, body: body.trim() })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messages', matchId] })
      void queryClient.invalidateQueries({ queryKey: ['my-matches'] })
    },
  })
}

/** I messaggi dell'altra persona arrivano senza ricaricare. */
export function useMessagesRealtime(matchId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!matchId) return

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['messages', matchId] })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [matchId, queryClient])
}
