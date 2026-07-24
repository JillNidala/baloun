import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'

export type Opzione = { slug: string; label: string; sort: number }

export type Impostazioni = {
  profile_id: string
  gender: string | null
  religion: string | null
  politics: string | null
  show_gender: boolean
  show_religion: boolean
  show_politics: boolean
  phone: string | null
  plan: 'free' | 'plus' | 'premium'
  search_city: string | null
  search_radius_km: number
}

const CAMPI =
  'profile_id, gender, religion, politics, show_gender, show_religion, show_politics, phone, plan, search_city, search_radius_km'

/** I tre cataloghi di opzioni, caricati insieme. */
export function useCataloghi() {
  return useQuery({
    queryKey: ['cataloghi'],
    staleTime: Infinity,
    queryFn: async () => {
      const [g, r, p] = await Promise.all([
        supabase.from('gender_options').select('slug, label, sort').order('sort'),
        supabase.from('religion_options').select('slug, label, sort').order('sort'),
        supabase.from('politics_options').select('slug, label, sort').order('sort'),
      ])
      if (g.error) throw g.error
      if (r.error) throw r.error
      if (p.error) throw p.error
      return {
        generi: (g.data ?? []) as Opzione[],
        religioni: (r.data ?? []) as Opzione[],
        politiche: (p.data ?? []) as Opzione[],
      }
    },
  })
}

export function useImpostazioni(userId: string | undefined) {
  return useQuery({
    queryKey: ['impostazioni', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_settings')
        .select(CAMPI)
        .eq('profile_id', userId)
        .maybeSingle()
      if (error) throw error
      return data as Impostazioni | null
    },
  })
}

export function useSalvaImpostazioni(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (patch: Partial<Impostazioni>) => {
      const { error } = await supabase
        .from('profile_settings')
        .upsert(
          { profile_id: userId, ...patch, updated_at: new Date().toISOString() },
          { onConflict: 'profile_id' },
        )
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impostazioni', userId] }),
  })
}

/** "Mi piacciono…": più risposte insieme. */
export function useMiPiacciono(userId: string | undefined) {
  return useQuery({
    queryKey: ['mi-piacciono', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_interested_in')
        .select('gender_slug')
        .eq('profile_id', userId)
      if (error) throw error
      return (data ?? []).map((r) => r.gender_slug as string)
    },
  })
}

export function useCambiaMiPiacciono(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ slug, attivo }: { slug: string; attivo: boolean }) => {
      if (attivo) {
        const { error } = await supabase
          .from('profile_interested_in')
          .delete()
          .eq('profile_id', userId)
          .eq('gender_slug', slug)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('profile_interested_in')
          .insert({ profile_id: userId, gender_slug: slug })
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mi-piacciono', userId] }),
  })
}

/** Città e professione: gli unici dati anagrafici modificabili. */
export function useSalvaAnagrafica(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (patch: { city?: string; profession?: string | null }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', userId)
        .select('id, display_name, birth_date, city, bio, avatar_path, onboarded')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-profile'] })
    },
  })
}
