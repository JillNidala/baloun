import { Music, UtensilsCrossed, Clapperboard, Plane, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Interest, InterestKind } from '@/features/feed/types/main'

// Per aggiungere un nuovo interesse in futuro basta aggiungere una riga qui.
// La card non va toccata.
const REGISTRY: Record<InterestKind, { icon: LucideIcon; label: string }> = {
  music: { icon: Music, label: 'Canzone preferita' },
  food: { icon: UtensilsCrossed, label: 'Cibo preferito' },
  movie: { icon: Clapperboard, label: 'Film preferito' },
  travel: { icon: Plane, label: 'Viaggio del cuore' },
  book: { icon: BookOpen, label: 'Libro preferito' },
}

export function InterestRow({ interest }: { interest: Interest }) {
  const { icon: Icon, label } = REGISTRY[interest.kind]

  return (
    <div className="flex items-start gap-3.5 py-5">
      <Icon size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
      <div className="min-w-0">
        <p className="kicker mb-1.5">{label}</p>
        <p className="font-display text-[19px] leading-snug">{interest.value}</p>
      </div>
    </div>
  )
}
