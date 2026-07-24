// ============================================================
// BALOUN — personalizzazione della stanza con Gemini
//
// NON genera oggetti da incollare: manda a Gemini la FOTO della stanza
// e le chiede di modificarla nei punti indicati. Così luci, ombre e
// prospettiva restano coerenti.
//
// Da pubblicare su Supabase:
//   Edge Functions → Deploy a new function → Via Editor
//   nome: generate-decor
//
// Segreti richiesti:
//   GEMINI_API_KEY   chiave di un progetto con fatturazione attiva
//   GEMINI_MODEL     (facoltativo) per forzare un modello preciso
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2'

const API = 'https://generativelanguage.googleapis.com/v1beta'

/** Descrizione della scena: serve a Gemini per sapere dove intervenire. */
const SCENA = `The image shows a small isometric miniature room seen from a 3/4 top-down angle,
open on two sides. Its parts are:
- the LEFT wall, entirely covered by a red velvet theatre curtain;
- the RIGHT wall, a plain white wall;
- the FLOOR, dark wooden planks;
- a small white toy figure standing on the left, near the curtain, holding an oversized sewing needle.`

/** Regole valide per qualunque richiesta. */
const REGOLE = `STRICT RULES:
- Return the SAME room: same camera angle, same framing, same proportions, same lighting.
- NEVER change the red velvet curtain on the left wall.
- NEVER change the wooden floor planks.
- Do not add people, text, logos or watermarks.
- Do not crop, rotate or zoom. Output the same scene, edited.`

const RICETTE: Record<string, (input: string) => string> = {
  wall: (input) => `${SCENA}

TASK: repaint ONLY the plain white RIGHT wall so that it looks like: "${input}".
The new wall must follow exactly the same perspective and receive the same light
as before. Leave the white top edge of the wall untouched.
${REGOLE}`,

  decoration: (input) => `${SCENA}

TASK: place "${input}" standing on the wooden floor, in the CENTRE of the empty
floor area, roughly halfway between the front corner and the right wall.
It must rest on the floor with a natural contact shadow, match the room's lighting
and isometric perspective, and stay small enough to leave the walls and the white
figure clearly visible. Do not cover the figure.
${REGOLE}`,

  outfit: (input) => `${SCENA}

TASK: dress the small white toy figure with "${input}".
Keep the figure in exactly the same position, pose, size and orientation, still
holding the needle. Only its clothing changes. The clothes must look like part of
the same 3D render, with the same lighting and soft shadows.
${REGOLE}`,
}

const BLOCKLIST = [
  'nudo', 'nuda', 'nude', 'naked', 'sex', 'sesso', 'porn', 'erotic', 'erotico',
  'gun', 'pistola', 'arma', 'weapon', 'knife', 'coltello', 'blood', 'sangue',
  'nazi', 'svastica', 'swastika', 'isis', 'droga', 'drug', 'cocaine',
  'suicid', 'suicidio', 'kill', 'uccidi', 'corpse', 'cadavere',
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

type Modello = { name: string; methods: string[] }

async function elencaModelli(apiKey: string): Promise<Modello[]> {
  const res = await fetch(`${API}/models?key=${apiKey}&pageSize=200`)
  if (!res.ok) return []
  const data = await res.json()
  return (data?.models ?? []).map((m: Record<string, unknown>) => ({
    name: String(m.name ?? '').replace(/^models\//, ''),
    methods: (m.supportedGenerationMethods ?? []) as string[],
  }))
}

/** Modelli capaci di modificare immagini, dal migliore al peggiore. */
async function candidati(apiKey: string): Promise<string[]> {
  const forzato = Deno.env.get('GEMINI_MODEL')
  if (forzato) return [forzato]

  const modelli = await elencaModelli(apiKey)
  return modelli
    .filter((m) => m.methods.includes('generateContent'))
    .filter((m) => /image/i.test(m.name))
    .filter((m) => !/embedding|vision/i.test(m.name))
    .map((m) => m.name)
    .sort((a, b) => {
      // "lite" e "preview" solo se non c'è di meglio
      const penalita = (n: string) =>
        (/lite/i.test(n) ? 2 : 0) + (/preview|exp/i.test(n) ? 1 : 0)
      const d = penalita(a) - penalita(b)
      return d !== 0 ? d : b.localeCompare(a, 'en', { numeric: true })
    })
}

/** Scarica un'immagine e la converte nel formato che vuole Gemini. */
async function scaricaBase64(url: string): Promise<{ data: string; mime: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Non riesco a leggere l'immagine della stanza (${res.status})`)
  const buf = new Uint8Array(await res.arrayBuffer())
  let bin = ''
  for (let i = 0; i < buf.length; i += 0x8000) {
    bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
  }
  return { data: btoa(bin), mime: res.headers.get('content-type') ?? 'image/jpeg' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) return json({ error: 'Manca GEMINI_API_KEY nei segreti della funzione.' }, 500)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const { data: userData, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !userData.user) return json({ error: 'Non autenticato.' }, 401)
    const userId = userData.user.id

    const body = await req.json()

    // Diagnostica
    if (body?.ping) {
      const modelli = await elencaModelli(apiKey)
      return json({
        ok: true,
        gemini_key_presente: true,
        modelli_totali: modelli.length,
        modelli_per_immagini: modelli
          .filter((m) => m.methods.includes('generateContent') && /image/i.test(m.name))
          .map((m) => m.name),
        ordine_di_preferenza: await candidati(apiKey),
      })
    }

    const { kind, prompt, baseUrl } = body
    const ricetta = RICETTE[kind]
    if (!ricetta) return json({ error: 'Categoria non valida.' }, 400)
    if (!baseUrl || typeof baseUrl !== 'string') {
      return json({ error: "Manca l'immagine di partenza della stanza." }, 400)
    }

    const testo = String(prompt ?? '').trim()
    if (testo.length < 2) return json({ error: 'Scrivi cosa vuoi cambiare.' }, 400)
    if (testo.length > 140) return json({ error: 'Descrizione troppo lunga (max 140 caratteri).' }, 400)
    if (BLOCKLIST.some((w) => testo.toLowerCase().includes(w))) {
      return json({ error: 'Questa richiesta non è ammessa nelle stanze.' }, 400)
    }

    const { data: room } = await supabase
      .from('rooms')
      .select('id')
      .eq('main_id', userId)
      .neq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!room) return json({ error: 'Non hai una stanza attiva.' }, 400)

    // La foto di partenza è la stanza com'è adesso: le modifiche si sommano.
    const base = await scaricaBase64(baseUrl)

    const lista = await candidati(apiKey)
    if (lista.length === 0) {
      return json({ error: 'La tua chiave non ha modelli capaci di modificare immagini.' }, 400)
    }

    let res: Response | null = null
    let model = ''
    let ultimoErrore = ''
    let quotaEsaurita = false

    for (const m of lista) {
      model = m
      res = await fetch(`${API}/models/${m}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                // prima l'immagine, poi l'istruzione: è una modifica, non una creazione
                { inline_data: { mime_type: base.mime, data: base.data } },
                { text: ricetta(testo) },
              ],
            },
          ],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      })
      if (res.ok) break

      const t = await res.text()
      ultimoErrore = `[${m}] ${t.slice(0, 300)}`
      if (res.status === 429) quotaEsaurita = true
      if (res.status !== 429 && res.status !== 404) break
    }

    if (!res || !res.ok) {
      if (quotaEsaurita) {
        return json({
          error: 'Quota Gemini esaurita per questa chiave.',
          detail:
            "Il credito è legato al progetto, non all'account: usa una chiave " +
            'del progetto con fatturazione attiva.',
        }, 429)
      }
      return json({ error: `Gemini ha rifiutato la richiesta (${model}).`, detail: ultimoErrore }, 502)
    }

    const out = await res.json()
    const part = out?.candidates?.[0]?.content?.parts?.find(
      (p: Record<string, unknown>) => p.inlineData ?? p.inline_data,
    )
    const inline = part?.inlineData ?? part?.inline_data
    if (!inline?.data) {
      const risposta = out?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text)
        .filter(Boolean)
        .join(' ')
      return json({
        error: "Gemini non ha restituito un'immagine.",
        detail: String(risposta ?? '').slice(0, 300),
      }, 502)
    }

    const bytes = Uint8Array.from(atob(inline.data), (c) => c.charCodeAt(0))
    const path = `${userId}/room-${Date.now()}.png`
    const { error: upErr } = await supabase.storage
      .from('decor')
      .upload(path, bytes, { contentType: 'image/png', upsert: true })
    if (upErr) return json({ error: 'Salvataggio fallito.', detail: upErr.message }, 500)

    await supabase.from('room_customizations').upsert(
      {
        room_id: room.id,
        main_id: userId,
        room_image_path: path,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'room_id' },
    )

    return json({ ok: true, kind, path, model })
  } catch (e) {
    return json({ error: 'Errore imprevisto.', detail: String(e).slice(0, 300) }, 500)
  }
})
