import { Card } from '@/components/ui/Card'

type Reaction = {
  id: string
  emoji: string
  sender_id: string
  sender_name: string | null
  created_at: string
}

/** Da quanto tempo, in forma breve. */
function quando(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'adesso'
  if (min < 60) return `${min} min fa`
  const ore = Math.floor(min / 60)
  if (ore < 24) return `${ore} h fa`
  return `${Math.floor(ore / 24)} g fa`
}

/**
 * Le reazioni ricevute, raggruppate per mittente: una scheda per persona
 * con tutte le emoji che ti ha mandato.
 */
export function ReactionCards({ reactions }: { reactions: Reaction[] }) {
  if (reactions.length === 0) return null

  const perMittente = new Map<string, { nome: string; emoji: string[]; ultima: string }>()
  for (const r of reactions) {
    const voce = perMittente.get(r.sender_id)
    if (voce) {
      voce.emoji.push(r.emoji)
    } else {
      perMittente.set(r.sender_id, {
        nome: r.sender_name ?? 'Anonimo',
        emoji: [r.emoji],
        ultima: r.created_at,
      })
    }
  }

  return (
    <section className="mt-8">
      <p className="kicker mb-3">Reazioni ricevute</p>

      <div className="flex flex-col gap-2.5">
        {[...perMittente.entries()].map(([id, v]) => (
          <Card key={id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="font-display text-[18px] leading-none">{v.nome}</p>
              <p className="caption mt-1.5">{quando(v.ultima)}</p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-1">
              {v.emoji.slice(0, 6).map((e, i) => (
                <span key={i} className="text-[20px] leading-none">
                  {e}
                </span>
              ))}
              {v.emoji.length > 6 && (
                <span className="caption self-center">+{v.emoji.length - 6}</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
