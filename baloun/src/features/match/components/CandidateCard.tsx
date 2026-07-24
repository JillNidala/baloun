import { Card } from '@/components/ui/Card'
import { Pressable } from '@/components/motion/Pressable'
import { TagChips } from '@/features/feed/components/TagChips'
import type { CandidateRow } from '@/services/supabase/types'

type Props = {
  candidate: CandidateRow & { photoUrl?: string }
  onChoose: (balloonId: string) => void
  disabled?: boolean
}

export function CandidateCard({ candidate, onChoose, disabled }: Props) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center gap-3.5">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-blush-soft">
          {candidate.photoUrl && (
            <img src={candidate.photoUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-display text-[20px] font-bold leading-none">
            {candidate.name}
            <span className="mx-2 font-normal text-muted">•</span>
            <span className="font-normal">{candidate.age}</span>
          </p>
          {candidate.city && <p className="caption mt-1.5">{candidate.city}</p>}
        </div>
      </div>

      {candidate.tags.length > 0 && (
        <div className="mb-4">
          <TagChips tags={candidate.tags} />
        </div>
      )}

      {candidate.prompts.slice(0, 2).map((prompt) => (
        <div key={prompt.id} className="mb-3">
          <p className="kicker mb-1">{prompt.label}</p>
          <p className="font-display text-[16px] leading-snug">{prompt.answer}</p>
        </div>
      ))}

      <Pressable
        onClick={() => onChoose(candidate.balloon_id)}
        disabled={disabled}
        className="w-full rounded-control bg-ink py-3 font-mono text-[13px] uppercase tracking-[0.14em] text-cream disabled:opacity-40"
      >
        Scegli
      </Pressable>
    </Card>
  )
}
