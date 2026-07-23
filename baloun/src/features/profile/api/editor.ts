import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import { uploadPhoto, deletePhotoFiles, fullAvatarUrl, avatarUrl } from '@/services/storage/avatar'
import type { Tag } from '@/services/supabase/types'

export type PhotoRow = {
  id: string
  profile_id: string
  position: number
  full_path: string
  small_path: string
}

/** Le mie 6 foto, con link temporaneo per vederle in alta risoluzione. */
export function useMyPhotos(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-photos', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_photos')
        .select('id, profile_id, position, full_path, small_path')
        .eq('profile_id', userId)
        .order('position')
      if (error) throw error

      const rows = (data ?? []) as PhotoRow[]
      return Promise.all(
        rows.map(async (row) => ({ ...row, url: await fullAvatarUrl(row.full_path) })),
      )
    },
  })
}

export function useAddPhoto(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, position }: { file: File; position: number }) => {
      if (!userId) throw new Error('Sessione mancante')
      const paths = await uploadPhoto(userId, file, position)

      const { error } = await supabase.from('profile_photos').upsert(
        {
          profile_id: userId,
          position,
          full_path: paths.full,
          small_path: paths.small,
        },
        { onConflict: 'profile_id,position' },
      )
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-photos', userId] }),
  })
}

export function useRemovePhoto(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (photo: PhotoRow) => {
      const { error } = await supabase.from('profile_photos').delete().eq('id', photo.id)
      if (error) throw error
      await deletePhotoFiles(photo.full_path, photo.small_path)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-photos', userId] }),
  })
}

/** Sceglie quale foto è quella del profilo (quella sfocata nel feed). */
export function useSetProfilePhoto(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (photo: PhotoRow) => {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_path: photo.small_path, avatar_full_path: photo.full_path })
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      void queryClient.invalidateQueries({ queryKey: ['my-photos', userId] })
    },
  })
}

// ---------------------------------------------------------------- interessi

export function useTagCatalog() {
  return useQuery({
    queryKey: ['tag-catalog'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interest_tags')
        .select('slug, label, icon, sort')
        .order('sort')
      if (error) throw error
      return (data ?? []) as (Tag & { sort: number })[]
    },
  })
}

export type MyTag = { tag_slug: string; in_feed: boolean }

export function useMyTags(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-tags', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_tags')
        .select('tag_slug, in_feed')
        .eq('profile_id', userId)
      if (error) throw error
      return (data ?? []) as MyTag[]
    },
  })
}

export function useToggleTag(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ slug, selected }: { slug: string; selected: boolean }) => {
      if (selected) {
        const { error } = await supabase
          .from('profile_tags')
          .delete()
          .eq('profile_id', userId)
          .eq('tag_slug', slug)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('profile_tags')
          .insert({ profile_id: userId, tag_slug: slug })
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-tags', userId] }),
  })
}

export function useToggleTagInFeed(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ slug, inFeed }: { slug: string; inFeed: boolean }) => {
      const { error } = await supabase
        .from('profile_tags')
        .update({ in_feed: !inFeed })
        .eq('profile_id', userId)
        .eq('tag_slug', slug)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-tags', userId] }),
  })
}

// ------------------------------------------------------------------ spunti

export type PromptTemplate = { id: string; label: string; sort: number }
export type MyPrompt = { prompt_id: string; answer: string; in_room: boolean; in_feed: boolean }

export function usePromptCatalog() {
  return useQuery({
    queryKey: ['prompt-catalog'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('id, label, sort')
        .order('sort')
      if (error) throw error
      return (data ?? []) as PromptTemplate[]
    },
  })
}

export function useMyPrompts(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-prompts', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_prompts')
        .select('prompt_id, answer, in_room, in_feed')
        .eq('profile_id', userId)
      if (error) throw error
      return (data ?? []) as MyPrompt[]
    },
  })
}

export function useSavePrompt(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (prompt: MyPrompt) => {
      if (!prompt.answer.trim()) {
        const { error } = await supabase
          .from('profile_prompts')
          .delete()
          .eq('profile_id', userId)
          .eq('prompt_id', prompt.prompt_id)
        if (error) throw error
        return
      }

      const { error } = await supabase.from('profile_prompts').upsert(
        {
          profile_id: userId,
          prompt_id: prompt.prompt_id,
          answer: prompt.answer.trim(),
          in_room: prompt.in_room,
          in_feed: prompt.in_feed,
        },
        { onConflict: 'profile_id,prompt_id' },
      )
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-prompts', userId] }),
  })
}

export { avatarUrl }
