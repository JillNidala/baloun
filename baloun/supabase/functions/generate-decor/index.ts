// ============================================================
// BALOUN — generazione immagini per la stanza (Gemini)
//
// Da pubblicare su Supabase:
//   Edge Functions → Deploy a new function → Via Editor
//   nome: generate-decor
//   poi incolla questo file e premi Deploy.
//
// Segreti da impostare (Edge Functions → Secrets):
//   GEMINI_API_KEY   la tua chiave di Google AI Studio
//
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ci sono già di serie.
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2'

// Modello: si può cambiare dai segreti senza ripubblicare la funzione.
// Se quello nuovo non fosse disponibile sulla tua chiave, la funzione
// riprova da sola con il precedente.
const MODELS = [
  Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.1-flash-image',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-image-preview',
]
const endpointFor = (m: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`

/**
 * Cosa si può generare. Il testo dell'utente viene SEMPRE inserito dentro
 * una di queste istruzioni: non può sostituirle né aggiungerne altre.
 * Tenda rossa e pavimento in legno non sono modificabili.
 */
const RECIPES: Record<string, { instruction: string }> = {
  wall: {
    instruction: `Interior wall texture for an isometric miniature room, seen straight on.
Flat, evenly lit, no perspective, no furniture, no people, no floor, no curtain.
The wall should read as a single continuous surface.
Style requested by the user: "%INPUT%".
Keep it tasteful and minimal, soft colours, suitable as a background wall.`,
  },
  decoration: {
    instruction: `A single small piece of furniture or decor object for a miniature isometric room,
photographed from a 3/4 top-down isometric angle, matching a clean 3D render style.
The object must be COMPLETELY isolated on a pure white background, centred, with no shadow,
no floor, no wall, no people, no text.
Object requested by the user: "%INPUT%".
It must be a harmless household object: plant, vase, lamp, chair, rug, shelf, books, artwork on a stand.`,
  },
  outfit: {
    instruction: `A simple stylised 3D white mannequin figure, smooth rounded shapes, no facial features,
standing, seen from a 3/4 isometric angle, holding nothing.
The figure wears: "%INPUT%".
Pure white background, no shadow, no scenery, full body visible, centred.
Keep the same proportions as a simple toy figure.`,
  },
}

/** Parole che non hanno posto in una stanza di BALOUN. */
const BLOCKLIST = [
  'nudo', 'nuda', 'nude', 'naked', 'sex', 'sesso', 'porn', 'erotic', 'erotico',
  'gun', 'pistola', 'arma', 'weapon', 'knife', 'coltello', 'blood', 'sangue',
  'nazi', 'svastica', 'swastika', 'isis', 'droga', 'drug', 'cocaine',
  'suicid', 'suicidio', 'kill', 'uccidi', 'morto', 'corpse', 'cadavere',
]

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) return json({ error: 'Manca GEMINI_API_KEY nei segreti della funzione.' }, 500)

    // --- chi sta chiedendo? deve essere autenticato ---
    const authHeader = req.headers.get('Authorization') ?? ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !userData.user) return json({ error: 'Non autenticato.' }, 401)
    const userId = userData.user.id

    const body = await req.json()

    // Modalità diagnostica: { "ping": true } dice cosa è configurato,
    // senza mai rivelare il valore dei segreti.
    if (body?.ping) {
      return json({
        ok: true,
        gemini_key_presente: Boolean(apiKey),
        modelli_provati: MODELS,
        utente: userId,
      })
    }

    const { kind, prompt, slot } = body

    const recipe = RECIPES[kind]
    if (!recipe) return json({ error: 'Categoria non valida.' }, 400)

    const testo = String(prompt ?? '').trim()
    if (testo.length < 2) return json({ error: 'Scrivi cosa vuoi.' }, 400)
    if (testo.length > 120) return json({ error: 'Descrizione troppo lunga (max 120 caratteri).' }, 400)

    const lower = testo.toLowerCase()
    if (BLOCKLIST.some((w) => lower.includes(w))) {
      return json({ error: 'Questa richiesta non è ammessa nelle stanze.' }, 400)
    }

    // --- la stanza dev'essere la sua ---
    const { data: room } = await supabase
      .from('rooms')
      .select('id')
      .eq('main_id', userId)
      .neq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!room) return json({ error: 'Non hai una stanza attiva.' }, 400)

    // --- generazione ---
    const instruction = recipe.instruction.replace('%INPUT%', testo)

    // Provo i modelli in ordine: se il primo non c'è, passo al successivo.
    let res: Response | null = null
    let lastDetail = ''
    for (const model of MODELS) {
      res = await fetch(`${endpointFor(model)}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: instruction }] }],
          generationConfig: {
            // servono entrambe: il modello risponde con testo + immagine
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      })
      if (res.ok) break
      lastDetail = `[${model}] ${(await res.text()).slice(0, 400)}`
    }

    if (!res || !res.ok) {
      return json({ error: 'Gemini ha rifiutato la richiesta.', detail: lastDetail }, 502)
    }

    const out = await res.json()
    const part = out?.candidates?.[0]?.content?.parts?.find(
      (p: Record<string, unknown>) => p.inlineData ?? p.inline_data,
    )
    const inline = part?.inlineData ?? part?.inline_data
    if (!inline?.data) return json({ error: 'Nessuna immagine restituita.' }, 502)

    // --- salvataggio ---
    const bytes = Uint8Array.from(atob(inline.data), (c) => c.charCodeAt(0))
    const path = `${userId}/${kind}-${Date.now()}.png`
    const { error: upErr } = await supabase.storage
      .from('decor')
      .upload(path, bytes, { contentType: 'image/png', upsert: true })
    if (upErr) return json({ error: 'Salvataggio fallito.', detail: upErr.message }, 500)

    // --- registrazione ---
    if (kind === 'decoration') {
      const s = Number.isInteger(slot) && slot >= 0 && slot <= 2 ? slot : 0
      await supabase
        .from('room_decorations')
        .upsert(
          { room_id: room.id, slot: s, image_path: path, prompt: testo },
          { onConflict: 'room_id,slot' },
        )
    } else {
      const field = kind === 'wall' ? 'wall_path' : 'outfit_path'
      await supabase
        .from('room_customizations')
        .upsert(
          { room_id: room.id, main_id: userId, [field]: path, updated_at: new Date().toISOString() },
          { onConflict: 'room_id' },
        )
    }

    return json({ ok: true, kind, path })
  } catch (e) {
    return json({ error: 'Errore imprevisto.', detail: String(e).slice(0, 300) }, 500)
  }
})
