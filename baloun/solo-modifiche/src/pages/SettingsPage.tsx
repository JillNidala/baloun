import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronDown,
  User,
  Sparkles,
  MapPin,
  CreditCard,
  ShieldCheck,
  FileText,
  LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Pressable } from '@/components/motion/Pressable'
import { useSession } from '@/store/session'
import { signOut } from '@/features/auth/api/auth'
import { supabase } from '@/services/supabase/client'
import { useImpostazioni, useSalvaImpostazioni } from '@/features/settings/api/settings'
import { PATHS } from '@/routes/paths'
import { spring } from '@/components/motion/springs'
import { cn } from '@/lib/cn'

const PIANI = [
  { id: 'free', nome: 'Free', prezzo: 'Gratis', cosa: '10 Main al giorno, 1 stanza' },
  { id: 'plus', nome: 'Plus', prezzo: 'in arrivo', cosa: 'Più Main, stanza personalizzabile' },
  { id: 'premium', nome: 'Premium', prezzo: 'in arrivo', cosa: 'Tutto, senza limiti' },
] as const

export function SettingsPage() {
  const navigate = useNavigate()
  const userId = useSession((s) => s.session?.user.id)
  const email = useSession((s) => s.session?.user.email)
  const { data: imp } = useImpostazioni(userId)
  const salva = useSalvaImpostazioni(userId)

  const [aperta, setAperta] = useState<string | null>('account')
  const [telefono, setTelefono] = useState<string | null>(null)
  const [esito, setEsito] = useState<string | null>(null)

  const cambiaPassword = async () => {
    if (!email) return
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setEsito(error ? error.message : `Ti ho mandato il link a ${email}.`)
  }

  return (
    <div className="safe-top px-5 pb-16">
      <button
        onClick={() => navigate(PATHS.profile)}
        className="mb-5 flex items-center gap-1 font-mono text-[13px] text-muted"
      >
        <ChevronLeft size={17} /> Profilo
      </button>

      <h1 className="mb-6 font-display text-4xl font-bold">Impostazioni</h1>

      <div className="flex flex-col gap-2.5">
        {/* ---------------- Account ---------------- */}
        <Sezione
          id="account"
          titolo="Informazioni account"
          icona={User}
          aperta={aperta}
          onApri={setAperta}
        >
          <Riga etichetta="Email" valore={email ?? '—'} nota="Non modificabile" />
          <label className="block py-3">
            <span className="kicker">Telefono</span>
            <input
              type="tel"
              inputMode="tel"
              placeholder="+39 333 1234567"
              value={telefono ?? imp?.phone ?? ''}
              onChange={(e) => setTelefono(e.target.value)}
              onBlur={(e) => salva.mutate({ phone: e.target.value.trim() || null })}
              className="mt-1 w-full bg-transparent font-display text-[17px] outline-none"
            />
          </label>
        </Sezione>

        {/* ---------------- Piano ---------------- */}
        <Sezione id="piano" titolo="Piano" icona={Sparkles} aperta={aperta} onApri={setAperta}>
          <div className="flex flex-col gap-2 py-2">
            {PIANI.map((p) => {
              const attivo = (imp?.plan ?? 'free') === p.id
              return (
                <div
                  key={p.id}
                  className={cn(
                    'rounded-control p-3',
                    attivo ? 'bg-ink text-cream' : 'bg-cream hairline',
                  )}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-[18px] font-bold">{p.nome}</span>
                    <span className="font-mono text-[11px]">{p.prezzo}</span>
                  </div>
                  <p
                    className={cn(
                      'mt-1 font-mono text-[11px]',
                      attivo ? 'text-cream/70' : 'text-muted',
                    )}
                  >
                    {p.cosa}
                  </p>
                  {attivo && (
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cream/60">
                      Piano attuale
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <p className="caption py-2">
            I piani a pagamento non sono ancora attivi: la struttura è pronta.
          </p>
        </Sezione>

        {/* ---------------- Posizione ---------------- */}
        <Sezione id="luogo" titolo="Dove cerchi" icona={MapPin} aperta={aperta} onApri={setAperta}>
          <label className="block py-3">
            <span className="kicker">Città di ricerca</span>
            <input
              placeholder="Milano"
              defaultValue={imp?.search_city ?? ''}
              onBlur={(e) => salva.mutate({ search_city: e.target.value.trim() || null })}
              className="mt-1 w-full bg-transparent font-display text-[17px] outline-none"
            />
          </label>

          <div className="py-3">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="kicker">Raggio</span>
              <span className="font-mono text-[13px]">{imp?.search_radius_km ?? 50} km</span>
            </div>
            <input
              type="range"
              min={5}
              max={500}
              step={5}
              defaultValue={imp?.search_radius_km ?? 50}
              onChange={(e) => salva.mutate({ search_radius_km: Number(e.target.value) })}
              className="w-full accent-balloon"
            />
          </div>
        </Sezione>

        {/* ---------------- Fatturazione ---------------- */}
        <Sezione
          id="pagamenti"
          titolo="Fatturazione e abbonamento"
          icona={CreditCard}
          aperta={aperta}
          onApri={setAperta}
        >
          <p className="caption py-3 leading-relaxed">
            Nessun metodo di pagamento collegato. Comparirà qui quando attiveremo
            i piani a pagamento, insieme a ricevute e rinnovi.
          </p>
        </Sezione>

        {/* ---------------- Privacy ---------------- */}
        <Sezione
          id="privacy"
          titolo="Privacy e sicurezza"
          icona={ShieldCheck}
          aperta={aperta}
          onApri={setAperta}
        >
          <button onClick={cambiaPassword} className="block w-full py-3 text-left">
            <p className="font-display text-[17px]">Cambia password</p>
            <p className="caption mt-0.5">Ti mandiamo un link via email</p>
          </button>

          <div className="py-3">
            <p className="font-display text-[17px]">Verifica in due passaggi</p>
            <p className="caption mt-0.5">
              Non ancora attiva. La aggiungeremo prima dell'apertura al pubblico.
            </p>
          </div>

          <div className="py-3">
            <p className="font-display text-[17px]">Dispositivi collegati</p>
            <p className="caption mt-0.5">
              Uscendo qui sotto la sessione viene chiusa su questo dispositivo.
            </p>
          </div>

          {esito && <p className="caption py-2 text-balloon">{esito}</p>}
        </Sezione>

        {/* ---------------- Termini ---------------- */}
        <Sezione
          id="termini"
          titolo="Termini e privacy"
          icona={FileText}
          aperta={aperta}
          onApri={setAperta}
        >
          <p className="caption py-3 leading-relaxed">
            Termini di servizio e informativa privacy saranno pubblicati prima
            dell'apertura al pubblico. I tuoi dati particolari — genere,
            religione, orientamento politico — restano privati salvo tua scelta
            esplicita.
          </p>
        </Sezione>
      </div>

      <div className="mt-8">
        <Button variant="ghost" onClick={() => void signOut()} className="text-balloon">
          <span className="flex items-center justify-center gap-2">
            <LogOut size={15} strokeWidth={2} /> Esci
          </span>
        </Button>
      </div>
    </div>
  )
}

function Sezione({
  id,
  titolo,
  icona: Icona,
  aperta,
  onApri,
  children,
}: {
  id: string
  titolo: string
  icona: LucideIcon
  aperta: string | null
  onApri: (id: string | null) => void
  children: React.ReactNode
}) {
  const isAperta = aperta === id

  return (
    <Card className="overflow-hidden">
      <Pressable
        onClick={() => onApri(isAperta ? null : id)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <Icona size={17} strokeWidth={1.75} className="text-muted" />
        <span className="flex-1 font-display text-[18px]">{titolo}</span>
        <motion.span animate={{ rotate: isAperta ? 180 : 0 }} transition={spring}>
          <ChevronDown size={17} strokeWidth={1.75} className="text-muted" />
        </motion.span>
      </Pressable>

      <AnimatePresence initial={false}>
        {isAperta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-hairline border-t border-hairline px-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function Riga({ etichetta, valore, nota }: { etichetta: string; valore: string; nota?: string }) {
  return (
    <div className="py-3">
      <p className="kicker mb-0.5">{etichetta}</p>
      <p className="font-display text-[17px]">{valore}</p>
      {nota && <p className="caption mt-0.5">{nota}</p>}
    </div>
  )
}
