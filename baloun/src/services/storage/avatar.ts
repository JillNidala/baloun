import { supabase } from '@/services/supabase/client'

// Due versioni della stessa foto:
// - "small"  96px  → bucket pubblico, usata SFOCATA nel feed.
//                    Anche scaricandola non è riconoscibile.
// - "full"  800px  → bucket PRIVATO, visibile solo a chi è in waitlist
//                    di una stanza già aperta (regola nel database).
const SMALL_SIZE = 96
const FULL_SIZE = 800

async function resize(file: File, max: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(max / bitmap.width, max / bitmap.height, 1)
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, w, h)

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Conversione immagine fallita'))),
      'image/jpeg',
      quality,
    ),
  )
}

export type AvatarPaths = { small: string; full: string }

/** Carica entrambe le versioni e restituisce i due percorsi. */
export async function uploadAvatar(userId: string, file: File): Promise<AvatarPaths> {
  const [small, full] = await Promise.all([
    resize(file, SMALL_SIZE, 0.8),
    resize(file, FULL_SIZE, 0.85),
  ])

  const smallPath = `${userId}/avatar.jpg`
  const fullPath = `${userId}/full.jpg`

  const [a, b] = await Promise.all([
    supabase.storage
      .from('avatars')
      .upload(smallPath, small, { upsert: true, contentType: 'image/jpeg' }),
    supabase.storage
      .from('avatars-full')
      .upload(fullPath, full, { upsert: true, contentType: 'image/jpeg' }),
  ])
  if (a.error) throw a.error
  if (b.error) throw b.error

  return { small: smallPath, full: fullPath }
}

/** URL pubblico della versione piccola (quella sfocata del feed). */
export function avatarUrl(path: string | null): string | undefined {
  if (!path) return undefined
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

/**
 * URL temporaneo della foto ad alta risoluzione.
 * Funziona SOLO se il database ti autorizza (stanza aperta e tu in waitlist):
 * altrimenti Supabase rifiuta e restituiamo undefined.
 */
export async function fullAvatarUrl(path: string | null): Promise<string | undefined> {
  if (!path) return undefined
  const { data, error } = await supabase.storage
    .from('avatars-full')
    .createSignedUrl(path, 300)
  if (error) return undefined
  return data?.signedUrl
}
