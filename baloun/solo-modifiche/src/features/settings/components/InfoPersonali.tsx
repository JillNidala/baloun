import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Pressable } from '@/components/motion/Pressable'
import { useSession } from '@/store/session'
import {
  useCataloghi,
  useImpostazioni,
  useSalvaImpostazioni,
  useMiPiacciono,
  useCambiaMiPiacciono,
  useSalvaAnagrafica,
  type Opzione,
} from '@/features/settings/api/settings'
import { cn } from '@/lib/cn'

/** Anni compiuti a partire dalla data di nascita. */
function eta(nascita: string | null | undefined): number | null {
  if (!nascita) return null
  const d = new Date(nascita)
  const oggi = new Date()
  let anni = oggi.getFullYear() - d.getFullYear()
  const m = oggi.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && oggi.getDate() < d.getDate())) anni--
  return anni
}

export function InfoPersonali() {
  const profile = useSession((s) => s.profile)
  const userId = useSession((s) => s.session?.user.id)

  const { data: cataloghi } = useCataloghi()
  const { data: imp } = useImpostazioni(userId)
  const salva = useSalvaImpostazioni(userId)
  const { data: piacciono } = useMiPiacciono(userId)
  const cambia = useCambiaMiPiacciono(userId)
  const salvaAnagrafica = useSalvaAnagrafica(userId)

  const [citta, setCitta] = useState<string | null>(null)
  const [professione, setProfessione] = useState<string | null>(null)

  const anni = eta(profile?.birth_date)

  return (
    <section>
      <h2 className="mb-1 font-display text-2xl font-bold">Informazioni personali</h2>
      <p className="caption mb-4">
        Nome ed età non si possono cambiare. Il resto è facoltativo.
      </p>

      {/* Bloccati */}
      <Card className="mb-3 divide-y divide-hairline">
        <RigaBloccata etichetta="Nome" valore={profile?.display_name ?? '—'} />
        <RigaBloccata etichetta="Età" valore={anni ? `${anni} anni` : '—'} />
      </Card>

      {/* Modificabili */}
      <Card className="mb-6 divide-y divide-hairline">
        <RigaTesto
          etichetta="Città"
          valore={citta ?? profile?.city ?? ''}
          placeholder="Milano"
          onChange={setCitta}
          onBlur={(v) => v && salvaAnagrafica.mutate({ city: v })}
        />
        <RigaTesto
          etichetta="Professione"
          valore={professione ?? ''}
          placeholder="Architetta"
          onChange={setProfessione}
          onBlur={(v) => salvaAnagrafica.mutate({ profession: v || null })}
        />
      </Card>

      {/* Genere */}
      <Selettore
        titolo="Genere"
        opzioni={cataloghi?.generi ?? []}
        scelto={imp?.gender ?? null}
        onScegli={(slug) => salva.mutate({ gender: slug })}
        visibile={imp?.show_gender ?? false}
        onVisibilita={(v) => salva.mutate({ show_gender: v })}
      />

      {/* Mi piacciono… */}
      <div className="mb-6">
        <p className="kicker mb-2.5">Mi piacciono…</p>
        <div className="flex flex-wrap gap-2">
          {cataloghi?.generi
            .filter((g) => g.slug !== 'non_dico')
            .map((g) => {
              const attivo = piacciono?.includes(g.slug) ?? false
              return (
                <Pressable
                  key={g.slug}
                  onClick={() => cambia.mutate({ slug: g.slug, attivo })}
                  className={cn(
                    'rounded-full px-3.5 py-2 font-mono text-[12px]',
                    attivo ? 'bg-blush text-white' : 'bg-paper text-ink hairline',
                  )}
                >
                  {g.label}
                </Pressable>
              )
            })}
        </div>
        <p className="caption mt-2">
          Serve solo a mostrarti persone in linea. Non compare sul profilo.
        </p>
      </div>

      <Selettore
        titolo="Religione"
        opzioni={cataloghi?.religioni ?? []}
        scelto={imp?.religion ?? null}
        onScegli={(slug) => salva.mutate({ religion: slug })}
        visibile={imp?.show_religion ?? false}
        onVisibilita={(v) => salva.mutate({ show_religion: v })}
      />

      <Selettore
        titolo="Orientamento politico"
        opzioni={cataloghi?.politiche ?? []}
        scelto={imp?.politics ?? null}
        onScegli={(slug) => salva.mutate({ politics: slug })}
        visibile={imp?.show_politics ?? false}
        onVisibilita={(v) => salva.mutate({ show_politics: v })}
      />
    </section>
  )
}

function RigaBloccata({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex-1">
        <p className="kicker mb-0.5">{etichetta}</p>
        <p className="font-display text-[17px]">{valore}</p>
      </div>
      <Lock size={14} strokeWidth={1.75} className="text-muted" aria-label="Non modificabile" />
    </div>
  )
}

function RigaTesto({
  etichetta,
  valore,
  placeholder,
  onChange,
  onBlur,
}: {
  etichetta: string
  valore: string
  placeholder: string
  onChange: (v: string) => void
  onBlur: (v: string) => void
}) {
  return (
    <label className="block px-4 py-3">
      <span className="kicker">{etichetta}</span>
      <input
        value={valore}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value.trim())}
        className="mt-1 w-full bg-transparent font-display text-[17px] outline-none"
      />
    </label>
  )
}

/**
 * Un dato particolare: si sceglie l'opzione e, separatamente, se mostrarla.
 * Di serie resta privata.
 */
function Selettore({
  titolo,
  opzioni,
  scelto,
  onScegli,
  visibile,
  onVisibilita,
}: {
  titolo: string
  opzioni: Opzione[]
  scelto: string | null
  onScegli: (slug: string) => void
  visibile: boolean
  onVisibilita: (v: boolean) => void
}) {
  return (
    <div className="mb-6">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="kicker">{titolo}</p>
        {scelto && (
          <Pressable
            onClick={() => onVisibilita(!visibile)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em]',
              visibile ? 'bg-blush text-white' : 'bg-cream text-muted hairline',
            )}
          >
            {visibile ? <Eye size={11} strokeWidth={2} /> : <EyeOff size={11} strokeWidth={2} />}
            {visibile ? 'Visibile' : 'Privato'}
          </Pressable>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {opzioni.map((o) => (
          <Pressable
            key={o.slug}
            onClick={() => onScegli(o.slug)}
            className={cn(
              'rounded-full px-3.5 py-2 font-mono text-[12px]',
              scelto === o.slug ? 'bg-ink text-cream' : 'bg-paper text-ink hairline',
            )}
          >
            {o.label}
          </Pressable>
        ))}
      </div>
    </div>
  )
}
