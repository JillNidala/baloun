import { supabase } from '@/services/supabase/client'
import type { Bozza } from '@/features/onboarding/store'

/**
 * Scrive la bozza nel database, in un colpo solo, alla fine dell'onboarding.
 * L'ultimo passaggio (onboarded = true) fa nascere la stanza.
 */
export async function concludiOnboarding(userId: string, b: Bozza): Promise<void> {
  // 1. dati riservati e preferenze
  const { error: e1 } = await supabase.from('profile_settings').upsert(
    {
      profile_id: userId,
      gender: b.gender,
      religion: b.religion,
      politics: b.politics,
      show_gender: true, // il genere serve all'algoritmo ed è utile mostrarlo
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id' },
  )
  if (e1) throw e1

  if (b.interestedIn.length > 0) {
    const { error } = await supabase
      .from('profile_interested_in')
      .upsert(
        b.interestedIn.map((g) => ({ profile_id: userId, gender_slug: g })),
        { onConflict: 'profile_id,gender_slug' },
      )
    if (error) throw error
  }

  // 2. interessi
  if (b.tags.length > 0) {
    const { error } = await supabase.from('profile_tags').upsert(
      b.tags.map((slug, i) => ({
        profile_id: userId,
        tag_slug: slug,
        in_feed: i < 2, // i primi due si vedono nel feed anonimo
      })),
      { onConflict: 'profile_id,tag_slug' },
    )
    if (error) throw error
  }

  // 3. spunti
  if (b.prompts.length > 0) {
    const { error } = await supabase.from('profile_prompts').upsert(
      b.prompts.map((p, i) => ({
        profile_id: userId,
        prompt_id: p.prompt_id,
        answer: p.answer.trim(),
        in_room: true,
        in_feed: i < 2,
      })),
      { onConflict: 'profile_id,prompt_id' },
    )
    if (error) throw error
  }

  // 4. foto (già caricate: qui si registrano soltanto)
  if (b.photos.length > 0) {
    const { error } = await supabase.from('profile_photos').upsert(
      b.photos.map((f) => ({
        profile_id: userId,
        position: f.position,
        full_path: f.full,
        small_path: f.small,
      })),
      { onConflict: 'profile_id,position' },
    )
    if (error) throw error
  }

  // 5. anagrafica + onboarded: da qui nasce la stanza
  const prima = b.photos[0]
  const { error: e5 } = await supabase
    .from('profiles')
    .update({
      display_name: b.displayName.trim(),
      birth_date: b.birthDate,
      city: b.city.trim(),
      profession: b.profession.trim() || null,
      ...(prima ? { avatar_path: prima.small, avatar_full_path: prima.full } : {}),
      onboarded: true,
    })
    .eq('id', userId)
  if (e5) throw e5
}
