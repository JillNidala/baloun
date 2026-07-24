import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, X, Check } from 'lucide-react'
import { Pressable } from '@/components/motion/Pressable'
import { Card } from '@/components/ui/Card'
import { useSession } from '@/store/session'
import { supabase } from '@/services/supabase/client'
import { uploadPhoto } from '@/services/storage/avatar'
import { useCataloghi } from '@/features/settings/api/settings'
import { usePromptCatalog, useTagCatalog } from '@/features/profile/api/editor'
import { tagIcon } from '@/features/profile/tagIcons'
import { useBozza, LIMITI } from '@/features/onboarding/store'
import { concludiOnboarding } from '@/features/onboarding/api/concludi'
import { PATHS } from '@/routes/paths'
import { cn } from '@/lib/cn'
import { spring } from '@/components/motion/springs'

const PASSI = [
  'account',
  'nome',
  'eta',
  'citta',
  'genere',
  'facoltativi',
  'interessi',
  'spunti',
  'foto',
] as const

const campo =
  'w-full rounded-control bg-paper px-4 py-3.5 hairline outline-none focus:border-ink font-display text-[18px]'

function anniDa(data: string): number {
  if (!data) return 0
  const d = new Date(data)
  const oggi = new Date()
  let a = oggi.getFullYear() - d.getFullYear()
  const m = oggi.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && oggi.getDate() < d.getDate())) a--
  return a
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const session = useSession((s) => s.session)
  const { bozza, vaiA, azzera } = useBozza()

  const [errore, setErrore] = useState<string | null>(null)
  const [occupato, setOccupato] = useState(false)

  // Chi ha già un accesso salta il primo passo.
  const primo = session ? 1 : 0
  const passo = Math.max(bozza.passo, primo)
  const nome = PASSI[passo]

  const puoAvanzare = useMemo(() => {
    switch (nome) {
      case 'account':
        return true
      case 'nome':
        return bozza.displayName.trim().length >= 2
      case 'eta':
        return anniDa(bozza.birthDate) >= LIMITI.ETA_MIN
      case 'citta':
        return bozza.city.trim().length >= 2
      case 'genere':
        return Boolean(bozza.gender) && bozza.interestedIn.length > 0
      case 'facoltativi':
        return true
      case 'interessi':
        return bozza.tags.length >= LIMITI.TAG_MIN
      case 'spunti':
        return bozza.prompts.filter((p) => p.answer.trim()).length >= LIMITI.SPUNTI_MIN
      case 'foto':
        return bozza.photos.length >= LIMITI.FOTO_MIN
      default:
        return false
    }
  }, [nome, bozza])

  const concludi = async () => {
    const userId = session?.user.id
    if (!userId) {
      setErrore('Sessione mancante: rifai il primo passo.')
      return
    }
    setOccupato(true)
    try {
      await concludiOnboarding(userId, bozza)
      azzera()
      navigate(PATHS.home, { replace: true })
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setOccupato(false)
    }
  }

  const avanti = () => {
    setErrore(null)
    if (nome === 'foto') {
      void concludi()
      return
    }
    vaiA(passo + 1)
  }

  return (
    <div className="flex min-h-full flex-col py-8">
      <Puntini totale={PASSI.length} corrente={passo} primo={primo} />

      <div className="flex-1 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={nome}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {nome === 'account' && <PassoAccount onFatto={() => vaiA(1)} />}
            {nome === 'nome' && <PassoNome />}
            {nome === 'eta' && <PassoEta />}
            {nome === 'citta' && <PassoCitta />}
            {nome === 'genere' && <PassoGenere />}
            {nome === 'facoltativi' && <PassoFacoltativi />}
            {nome === 'interessi' && <PassoInteressi />}
            {nome === 'spunti' && <PassoSpunti />}
            {nome === 'foto' && <PassoFoto />}
          </motion.div>
        </AnimatePresence>
      </div>

      {errore && <p className="mb-3 font-mono text-[12px] text-balloon">{errore}</p>}

      {nome !== 'account' && (
        <div className="safe-bottom flex items-center gap-3 pt-6">
          <Pressable
            onClick={() => vaiA(Math.max(primo, passo - 1))}
            disabled={passo <= primo}
            aria-label="Indietro"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-paper hairline disabled:opacity-30"
          >
            <ChevronLeft size={20} strokeWidth={1.75} />
          </Pressable>

          <Pressable
            onClick={avanti}
            disabled={!puoAvanzare || occupato}
            className="flex flex-1 items-center justify-center gap-2 rounded-control bg-ink py-4 font-mono text-[13px] text-cream disabled:opacity-30"
          >
            {nome === 'foto' ? (occupato ? 'Salvo…' : 'Fine') : 'Avanti'}
            {nome !== 'foto' && <ChevronRight size={16} strokeWidth={2} />}
          </Pressable>
        </div>
      )}
    </div>
  )
}

function Puntini({ totale, corrente, primo }: { totale: number; corrente: number; primo: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: totale - primo }, (_, i) => {
        const indice = i + primo
        return (
          <motion.span
            key={indice}
            animate={{
              width: indice === corrente ? 22 : 6,
              opacity: indice <= corrente ? 1 : 0.25,
            }}
            transition={spring}
            className="h-1.5 rounded-full bg-ink"
          />
        )
      })}
    </div>
  )
}

function Titolo({ testo, nota }: { testo: string; nota?: string }) {
  return (
    <header className="mb-7">
      <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight">{testo}</h1>
      {nota && <p className="caption mt-2">{nota}</p>}
    </header>
  )
}

// ------------------------------------------------------------- 1. account

function PassoAccount({ onFatto }: { onFatto: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [occupato, setOccupato] = useState(false)

  const registra = async () => {
    setErrore(null)
    setOccupato(true)
    const { error } = await supabase.auth.signUp({ email: email.trim(), password })
    setOccupato(false)
    if (error) {
      setErrore(error.message)
      return
    }
    onFatto()
  }

  return (
    <div>
      <Titolo testo="Iniziamo" nota="Bastano email e password." />
      <div className="flex flex-col gap-3">
        <input
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={campo}
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Password (min 6 caratteri)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={campo}
        />
      </div>

      {errore && <p className="mt-3 font-mono text-[12px] text-balloon">{errore}</p>}

      <Pressable
        onClick={registra}
        disabled={!email.includes('@') || password.length < 6 || occupato}
        className="mt-6 w-full rounded-control bg-ink py-4 font-mono text-[13px] text-cream disabled:opacity-30"
      >
        {occupato ? 'Un attimo…' : 'Continua'}
      </Pressable>
    </div>
  )
}

// ---------------------------------------------------------------- 2. nome

function PassoNome() {
  const { bozza, aggiorna } = useBozza()
  return (
    <div>
      <Titolo testo="Come ti chiami?" nota="Questo non si potrà più cambiare." />
      <input
        autoFocus
        placeholder="Il tuo nome"
        value={bozza.displayName}
        onChange={(e) => aggiorna({ displayName: e.target.value })}
        className={campo}
      />
    </div>
  )
}

// ----------------------------------------------------------------- 3. età

function PassoEta() {
  const { bozza, aggiorna } = useBozza()
  const anni = anniDa(bozza.birthDate)
  return (
    <div>
      <Titolo testo="Quando sei natə?" nota="Agli altri mostriamo solo l'età." />
      <input
        type="date"
        value={bozza.birthDate}
        onChange={(e) => aggiorna({ birthDate: e.target.value })}
        className={campo}
      />
      {bozza.birthDate && (
        <p className={cn('caption mt-3', anni < LIMITI.ETA_MIN && 'text-balloon')}>
          {anni >= LIMITI.ETA_MIN ? `${anni} anni` : 'Devi avere almeno 18 anni.'}
        </p>
      )}
    </div>
  )
}

// --------------------------------------------------------------- 4. città

function PassoCitta() {
  const { bozza, aggiorna } = useBozza()
  return (
    <div>
      <Titolo testo="Dove vivi?" nota="Serve a mostrarti persone vicine." />
      <input
        autoFocus
        placeholder="Milano"
        value={bozza.city}
        onChange={(e) => aggiorna({ city: e.target.value })}
        className={campo}
      />
    </div>
  )
}

// --------------------------------------------------------------- 5. genere

function PassoGenere() {
  const { bozza, aggiorna } = useBozza()
  const { data: cataloghi } = useCataloghi()

  const commuta = (slug: string) => {
    const dentro = bozza.interestedIn.includes(slug)
    aggiorna({
      interestedIn: dentro
        ? bozza.interestedIn.filter((g) => g !== slug)
        : [...bozza.interestedIn, slug],
    })
  }

  return (
    <div>
      <Titolo
        testo="Chi sei, e chi cerchi"
        nota="Serve all'algoritmo: senza, il feed mostrerebbe chiunque."
      />

      <p className="kicker mb-2.5">Il tuo genere</p>
      <div className="mb-7 flex flex-wrap gap-2">
        {cataloghi?.generi.map((g) => (
          <Pressable
            key={g.slug}
            onClick={() => aggiorna({ gender: g.slug })}
            className={cn(
              'rounded-full px-3.5 py-2 font-mono text-[12px]',
              bozza.gender === g.slug ? 'bg-ink text-cream' : 'bg-paper text-ink hairline',
            )}
          >
            {g.label}
          </Pressable>
        ))}
      </div>

      <p className="kicker mb-2.5">Mi piacciono…</p>
      <div className="flex flex-wrap gap-2">
        {cataloghi?.generi
          .filter((g) => g.slug !== 'non_dico')
          .map((g) => (
            <Pressable
              key={g.slug}
              onClick={() => commuta(g.slug)}
              className={cn(
                'rounded-full px-3.5 py-2 font-mono text-[12px]',
                bozza.interestedIn.includes(g.slug)
                  ? 'bg-blush text-white'
                  : 'bg-paper text-ink hairline',
              )}
            >
              {g.label}
            </Pressable>
          ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------- 6. facoltativi

function PassoFacoltativi() {
  const { bozza, aggiorna } = useBozza()
  const { data: cataloghi } = useCataloghi()

  return (
    <div>
      <Titolo testo="Qualcosa in più" nota="Tutto facoltativo: puoi andare avanti." />

      <p className="kicker mb-2">Professione</p>
      <input
        placeholder="Architetta"
        value={bozza.profession}
        onChange={(e) => aggiorna({ profession: e.target.value })}
        className={cn(campo, 'mb-6')}
      />

      <p className="kicker mb-2.5">Religione</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {cataloghi?.religioni.map((o) => (
          <Pressable
            key={o.slug}
            onClick={() => aggiorna({ religion: bozza.religion === o.slug ? null : o.slug })}
            className={cn(
              'rounded-full px-3 py-1.5 font-mono text-[11px]',
              bozza.religion === o.slug ? 'bg-ink text-cream' : 'bg-paper text-ink hairline',
            )}
          >
            {o.label}
          </Pressable>
        ))}
      </div>

      <p className="kicker mb-2.5">Orientamento politico</p>
      <div className="flex flex-wrap gap-2">
        {cataloghi?.politiche.map((o) => (
          <Pressable
            key={o.slug}
            onClick={() => aggiorna({ politics: bozza.politics === o.slug ? null : o.slug })}
            className={cn(
              'rounded-full px-3 py-1.5 font-mono text-[11px]',
              bozza.politics === o.slug ? 'bg-ink text-cream' : 'bg-paper text-ink hairline',
            )}
          >
            {o.label}
          </Pressable>
        ))}
      </div>

      <p className="caption mt-5">
        Religione e politica restano private finché non decidi di mostrarle dal profilo.
      </p>
    </div>
  )
}

// ----------------------------------------------------------- 7. interessi

function PassoInteressi() {
  const { bozza, aggiorna } = useBozza()
  const { data: catalogo } = useTagCatalog()

  const commuta = (slug: string) => {
    const dentro = bozza.tags.includes(slug)
    if (!dentro && bozza.tags.length >= LIMITI.TAG_MAX) return
    aggiorna({ tags: dentro ? bozza.tags.filter((t) => t !== slug) : [...bozza.tags, slug] })
  }

  return (
    <div>
      <Titolo
        testo="Cosa ti piace fare"
        nota={`Da ${LIMITI.TAG_MIN} a ${LIMITI.TAG_MAX}. I primi due si vedranno nel feed.`}
      />

      <div className="mb-3 flex justify-end">
        <span className="caption">
          {bozza.tags.length}/{LIMITI.TAG_MAX}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {catalogo?.map((t) => {
          const attivo = bozza.tags.includes(t.slug)
          const bloccato = !attivo && bozza.tags.length >= LIMITI.TAG_MAX
          const Icona = tagIcon(t.icon)
          return (
            <Pressable
              key={t.slug}
              onClick={() => commuta(t.slug)}
              disabled={bloccato}
              className={cn(
                'flex items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[12px]',
                attivo ? 'bg-ink text-cream' : 'bg-paper text-ink hairline',
                bloccato && 'opacity-30',
              )}
            >
              <Icona size={14} strokeWidth={1.75} />
              {t.label}
            </Pressable>
          )
        })}
      </div>
    </div>
  )
}

// -------------------------------------------------------------- 8. spunti

function PassoSpunti() {
  const { bozza, aggiorna } = useBozza()
  const { data: catalogo } = usePromptCatalog()
  const [aperto, setAperto] = useState<string | null>(null)

  const risposta = (id: string) => bozza.prompts.find((p) => p.prompt_id === id)?.answer ?? ''
  const compilati = bozza.prompts.filter((p) => p.answer.trim()).length

  const scrivi = (id: string, testo: string) => {
    const altri = bozza.prompts.filter((p) => p.prompt_id !== id)
    aggiorna({ prompts: testo.trim() ? [...altri, { prompt_id: id, answer: testo }] : altri })
  }

  return (
    <div>
      <Titolo
        testo="Raccontati"
        nota={`Almeno ${LIMITI.SPUNTI_MIN} risposte. Le prime due si vedranno nel feed.`}
      />

      <div className="mb-3 flex justify-end">
        <span className="caption">
          {compilati}/{LIMITI.SPUNTI_MIN} minimo
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {catalogo?.slice(0, 10).map((t) => (
          <Card key={t.id} className="p-4">
            <button
              onClick={() => setAperto(aperto === t.id ? null : t.id)}
              className="w-full text-left"
            >
              <p className="kicker mb-1.5">{t.label}</p>
              <p
                className={cn(
                  'font-display text-[17px] leading-snug',
                  !risposta(t.id) && 'text-muted',
                )}
              >
                {risposta(t.id) || 'Tocca per rispondere'}
              </p>
            </button>

            {aperto === t.id && (
              <textarea
                autoFocus
                rows={2}
                maxLength={200}
                value={risposta(t.id)}
                onChange={(e) => scrivi(t.id, e.target.value)}
                placeholder="La tua risposta…"
                className="mt-3 w-full resize-none rounded-control bg-cream px-3.5 py-2.5 hairline outline-none focus:border-ink"
              />
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- 9. foto

function PassoFoto() {
  const { bozza, aggiorna } = useBozza()
  const userId = useSession((s) => s.session?.user.id)
  const input = useRef<HTMLInputElement>(null)
  const [slot, setSlot] = useState(0)
  const [caricando, setCaricando] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  const scegli = (posizione: number) => {
    setSlot(posizione)
    input.current?.click()
  }

  const carica = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !userId) return
    setCaricando(true)
    setErrore(null)
    try {
      // Le foto si caricano subito: nel telefono resta solo il percorso,
      // perché un'immagine non si può conservare nella bozza locale.
      const paths = await uploadPhoto(userId, file, slot)
      aggiorna({
        photos: [
          ...bozza.photos.filter((f) => f.position !== slot),
          { position: slot, full: paths.full, small: paths.small },
        ].sort((a, b) => a.position - b.position),
      })
    } catch (err) {
      setErrore((err as Error).message)
    } finally {
      setCaricando(false)
    }
  }

  return (
    <div>
      <Titolo
        testo="Le tue foto"
        nota="La prima sarà quella del profilo. Nel feed appare sfocata."
      />

      <input ref={input} type="file" accept="image/*" onChange={carica} className="hidden" />

      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2, 3, 4, 5].map((posizione) => {
          const foto = bozza.photos.find((f) => f.position === posizione)
          if (!foto) {
            return (
              <Pressable
                key={posizione}
                onClick={() => scegli(posizione)}
                disabled={caricando}
                className="flex aspect-[3/4] items-center justify-center rounded-card bg-paper text-muted hairline disabled:opacity-50"
              >
                <Plus size={20} strokeWidth={1.75} />
              </Pressable>
            )
          }
          return (
            <div
              key={posizione}
              className={cn(
                'relative flex aspect-[3/4] items-center justify-center rounded-card bg-blush-soft',
                posizione === 0 && 'ring-2 ring-balloon',
              )}
            >
              <Check size={22} strokeWidth={2} className="text-balloon" />
              <button
                onClick={() =>
                  aggiorna({ photos: bozza.photos.filter((f) => f.position !== posizione) })
                }
                aria-label="Togli"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-cream/90"
              >
                <X size={12} strokeWidth={2.2} />
              </button>
            </div>
          )
        })}
      </div>

      {caricando && <p className="caption mt-3">Carico la foto…</p>}
      {errore && <p className="mt-3 font-mono text-[12px] text-balloon">{errore}</p>}
    </div>
  )
}
