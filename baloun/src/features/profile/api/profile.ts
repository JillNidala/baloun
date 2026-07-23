import { supabase } from '@/services/supabase/client'
import type { ProfileRow } from '@/services/supabase/types'

export async function fetchMyProfile(): Promise<ProfileRow | null> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, birth_date, city, bio, avatar_path, onboarded')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (error) throw error
  return data as ProfileRow | null
}

export type ProfileInput = {
  displayName: string
  birthDate: string // formato YYYY-MM-DD
  city: string
  bio?: string
  avatarPath?: string | null
  avatarFullPath?: string | null
}

/** Salva i dati anagrafici. Con onboarded=true nasce anche la stanza. */
export async function saveProfile(userId: string, input: ProfileInput): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: input.displayName,
      birth_date: input.birthDate,
      city: input.city,
      bio: input.bio ?? null,
      ...(input.avatarPath !== undefined ? { avatar_path: input.avatarPath } : {}),
      ...(input.avatarFullPath !== undefined ? { avatar_full_path: input.avatarFullPath } : {}),
      onboarded: true,
    })
    .eq('id', userId)
    .select('id, display_name, birth_date, city, bio, avatar_path, onboarded')
    .single()

  if (error) throw error
  return data as ProfileRow
}
