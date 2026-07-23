import { supabase } from '@/services/supabase/client'

// Nel feed l'avatar si vede SOLO sfocato. Per non esporre la foto vera,
// carichiamo una versione volutamente minuscola (96px): anche scaricandola
// direttamente non è riconoscibile. La foto ad alta risoluzione arriverà
// quando implementeremo i round di rivelazione.
const MAX_SIZE = 96

async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(MAX_SIZE / bitmap.width, MAX_SIZE / bitmap.height, 1)
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
      0.8,
    ),
  )
}

/** Carica l'avatar e restituisce il percorso da salvare nel profilo. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const blob = await downscale(file)
  const path = `${userId}/avatar.jpg`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
  if (error) throw error
  return path
}

/** URL pubblico a partire dal percorso salvato. */
export function avatarUrl(path: string | null): string | undefined {
  if (!path) return undefined
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}
