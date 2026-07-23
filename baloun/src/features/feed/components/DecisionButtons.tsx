import { Heart } from 'lucide-react'
import { Pressable } from '@/components/motion/Pressable'
import { BalloonIcon } from '@/components/ui/BalloonIcon'
import type { Decision } from '@/features/feed/types/main'

type Props = {
  onDecide: (decision: Decision) => void
  disabled?: boolean
}

// Solo due icone, senza sfondo e senza testo:
// il palloncino rosso per poppare, il cuore rosa per tenere.
export function DecisionButtons({ onDecide, disabled }: Props) {
  return (
    <div className="flex items-center justify-center gap-16">
      <Pressable
        onClick={() => onDecide('pop')}
        disabled={disabled}
        aria-label="Pop the balloon"
        className="flex h-20 w-20 items-center justify-center disabled:opacity-40"
      >
        <BalloonIcon className="h-14 w-14" title="Pop the balloon" />
      </Pressable>

      <Pressable
        onClick={() => onDecide('keep')}
        disabled={disabled}
        aria-label="Keep the balloon"
        className="flex h-20 w-20 items-center justify-center disabled:opacity-40"
      >
        <Heart
          size={56}
          strokeWidth={0}
          className="h-14 w-14 text-blush"
          fill="currentColor"
          aria-hidden="true"
        />
      </Pressable>
    </div>
  )
}
