import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'

export type DecorKind = 'wall' | 'outfit' | 'decoration'

export type DecorRequest = {
  kind: DecorKind
  prompt: string
  /** solo per le decorazioni: 0, 1 o 2 */
  slot?: number
}

/**
 * Chiede la generazione alla Edge Function.
 * La chiave di Gemini resta sul server: l'app non la vede mai.
 */
export function useGenerateDecor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (req: DecorRequest) => {
      const { data, error } = await supabase.functions.invoke('generate-decor', {
        body: req,
      })
      if (error) throw error
      if ((data as { error?: string })?.error) {
        throw new Error((data as { error: string }).error)
      }
      return data as { ok: true; kind: DecorKind; path: string }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['room-scene'] })
    },
  })
}

/** Rimette la stanza com'era. */
export function useResetDecor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ roomId, what }: { roomId: string; what: DecorKind | 'all' }) => {
      if (what === 'decoration' || what === 'all') {
        const { error } = await supabase.from('room_decorations').delete().eq('room_id', roomId)
        if (error) throw error
      }
      if (what !== 'decoration') {
        const patch =
          what === 'all'
            ? { wall_path: null, outfit_path: null }
            : what === 'wall'
              ? { wall_path: null }
              : { outfit_path: null }
        const { error } = await supabase
          .from('room_customizations')
          .update(patch)
          .eq('room_id', roomId)
        if (error) throw error
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['room-scene'] })
    },
  })
}

export function decorUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  return supabase.storage.from('decor').getPublicUrl(path).data.publicUrl
}
