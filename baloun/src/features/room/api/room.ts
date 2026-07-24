import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import { avatarUrl, fullAvatarUrl } from '@/services/storage/avatar'
import { decorUrl } from '@/features/decor/api/decor'
import type { SceneBalloon } from '@/features/room/components/RoomScene'

type SceneRow = {
  room_id: string
  main_id: string
  main_name: string | null
  is_mine: boolean
  opens_at: string | null
  is_open: boolean
  is_closed: boolean
  room_image_path: string | null
  balloons: {
    balloon_id: string
    name: string | null
    small: string | null
    full: string | null
    is_me: boolean
    joined_at: string
  }[]
}

/** Tutto ciò che serve a disegnare una stanza. */
export function useRoomScene(roomId: string | undefined) {
  return useQuery({
    queryKey: ['room-scene', roomId],
    enabled: Boolean(roomId),
    refetchInterval: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_room_scene', { p_room_id: roomId })
      if (error) throw error

      const row = ((data ?? []) as SceneRow[])[0]
      if (!row) return null

      const balloons: SceneBalloon[] = await Promise.all(
        (row.balloons ?? []).map(async (b) => ({
          balloon_id: b.balloon_id,
          name: b.name,
          // nitida se sei il Main della stanza oppure se è la tua foto
          photoUrl:
            row.is_mine || b.is_me
              ? await fullAvatarUrl(b.full)
              : avatarUrl(b.small),
          clear: row.is_mine || b.is_me,
        })),
      )

      return {
        ...row,
        sceneBalloons: balloons,
        // la stanza personalizzata sostituisce l'immagine di serie
        roomUrl: decorUrl(row.room_image_path),
      }
    },
  })
}

/** Il Main elimina qualcuno dalla propria stanza. */
export function usePopBalloon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (balloonId: string) => {
      const { error } = await supabase.rpc('pop_balloon', { p_balloon_id: balloonId })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['room-scene'] })
      void queryClient.invalidateQueries({ queryKey: ['my-room-waitlist'] })
      void queryClient.invalidateQueries({ queryKey: ['room-candidates'] })
    },
  })
}

/** L'elenco delle emoji consentite. */
export function useApprovedEmojis() {
  return useQuery({
    queryKey: ['approved-emojis'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approved_emojis')
        .select('emoji, sort')
        .order('sort')
      if (error) throw error
      return (data ?? []) as { emoji: string; sort: number }[]
    },
  })
}

export function useSendReaction(roomId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (emoji: string) => {
      const { error } = await supabase.rpc('send_room_reaction', {
        p_room_id: roomId,
        p_emoji: emoji,
      })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['room-reactions', roomId] })
    },
  })
}

export function useRoomReactions(roomId: string | undefined) {
  return useQuery({
    queryKey: ['room-reactions', roomId],
    enabled: Boolean(roomId),
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_room_reactions', { p_room_id: roomId })
      if (error) throw error
      return (data ?? []) as { id: string; emoji: string; sender_id: string; created_at: string }[]
    },
  })
}

/** La mia stanza (come Main). */
export function useMyRoomId() {
  return useQuery({
    queryKey: ['my-room-id'],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return null

      const { data, error } = await supabase
        .from('rooms')
        .select('id')
        .eq('main_id', auth.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data?.id as string | undefined) ?? null
    },
  })
}

export type BalloonProfile = {
  balloon_id: string
  name: string | null
  age: number
  city: string | null
  bio: string | null
  photos: { path: string; position: number }[]
  tags: { slug: string; label: string; icon: string }[]
  prompts: { id: string; label: string; answer: string }[]
}

/** Profilo completo di un Balloon: lo vede solo il Main della sua stanza. */
export function useBalloonProfile(balloonId: string | null) {
  return useQuery({
    queryKey: ['balloon-profile', balloonId],
    enabled: Boolean(balloonId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_balloon_profile', {
        p_balloon_id: balloonId,
      })
      if (error) throw error

      const row = ((data ?? []) as BalloonProfile[])[0]
      if (!row) return null

      const gallery = (
        await Promise.all((row.photos ?? []).map((ph) => fullAvatarUrl(ph.path)))
      ).filter((u): u is string => Boolean(u))

      return { ...row, gallery }
    },
  })
}
