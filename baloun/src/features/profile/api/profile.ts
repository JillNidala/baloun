import { supabase } from '@/services/supabase/client'
import type { ProfileRow } from '@/services/supabase/types'
import type { InterestKind } from '@/features/feed/types/main'

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
  interests: { kind: InterestKind; value: string }[]
}

/** Salva il profilo e i suoi interessi. Con onboarded=true nasce anche la stanza. */
export async function saveProfile(userId: string, input: ProfileInput): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: input.displayName,
      birth_date: input.birthDate,
      city: input.city,
      bio: input.bio ?? null,
      ...(input.avatarPath !== undefined ? { avatar_path: input.avatarPath } : {}),
      onboarded: true,
    })
    .eq('id', userId)
    .select('id, display_name, birth_date, city, bio, avatar_path, onboarded')
    .single()

  if (error) throw error

  const rows = input.interests
    .filter((i) => i.value.trim().length > 0)
    .map((i) => ({ profile_id: userId, kind: i.kind, value: i.value.trim() }))

  if (rows.length > 0) {
    const { error: iErr } = await supabase
      .from('profile_interests')
      .upsert(rows, { onConflict: 'profile_id,kind' })
    if (iErr) throw iErr
  }

  return data as ProfileRow
}

export async function fetchMyInterests(userId: string) {
  const { data, error } = await supabase
    .from('profile_interests')
    .select('kind, value')
    .eq('profile_id', userId)
  if (error) throw error
  return (data ?? []) as { kind: InterestKind; value: string }[]
}
