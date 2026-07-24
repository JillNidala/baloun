import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'

export type DecorKind = 'wall' | 'outfit' | 'decoration'

export type DecorRequest = {
  kind: DecorKind
  prompt: string
  /** immagine di partenza: la stanza com'è adesso */
  baseUrl: string
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

      // Quando la funzione risponde con un errore, supabase-js restituisce
      // solo "non-2xx status" e nasconde il messaggio vero: lo tiriamo fuori.
      if (error) throw new Error(await leggiErrore(error))
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
    mutationFn: async ({ roomId }: { roomId: string }) => {
      // Rimette la stanza originale: basta togliere l'immagine modificata.
      const { error } = await supabase
        .from('room_customizations')
        .update({ room_image_path: null })
        .eq('room_id', roomId)
      if (error) throw error
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

/** Estrae il messaggio vero dall'errore della Edge Function. */
async function leggiErrore(error: unknown): Promise<string> {
  const contesto = (error as { context?: Response })?.context
  if (contesto && typeof contesto.json === 'function') {
    try {
      const corpo = await contesto.json()
      const parti = [corpo?.error, corpo?.detail].filter(Boolean)
      if (parti.length) return parti.join(' — ')
    } catch {
      try {
        const testo = await contesto.text()
        if (testo) return testo.slice(0, 300)
      } catch {
        /* niente da leggere */
      }
    }
    if (contesto.status === 404) {
      return 'Funzione non trovata: pubblicala su Supabase con il nome generate-decor.'
    }
  }
  return (error as Error)?.message ?? 'Errore sconosciuto'
}

/** Diagnostica: dice se la funzione è pubblicata e la chiave configurata. */
export async function verificaDecor(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-decor', {
    body: { ping: true },
  })
  if (error) return await leggiErrore(error)
  const d = data as {
    gemini_key_presente?: boolean
    modelli_totali?: number
    modelli_per_immagini?: string[]
    scelto?: string | null
  }

  if (!d?.gemini_key_presente) {
    return 'Funzione attiva, ma manca il segreto GEMINI_API_KEY.'
  }
  if (!d.modelli_totali) {
    return 'La chiave non risponde: controlla che sia valida e attiva.'
  }
  if (!d.scelto) {
    return `Nessun modello per immagini su questa chiave (${d.modelli_totali} modelli disponibili). Serve una chiave con accesso ai modelli "image".`
  }
  return `Pronto. Userò ${d.scelto} (${d.modelli_per_immagini?.length ?? 0} modelli per immagini disponibili).`
}
