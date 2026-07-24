import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Pressable } from '@/components/motion/Pressable'
import { BalloonPop } from '@/features/room/components/BalloonPop'
import type { Decision } from '@/features/feed/types/main'

type Props = {
  onDecide: (decision: Decision) => void
  disabled?: boolean
}

// Due sole icone, senza sfondo e senza testo.
// Il palloncino esplode davvero prima di passare al Main successivo.
export function DecisionButtons({ onDecide, disabled }: Props) {
  const [popping, setPopping] = useState(false)

  return (
    <div className="flex items-center justify-center gap-16">
      <Pressable
        onClick={() => setPopping(true)}
        disabled={disabled || popping}
        aria-label="Pop the balloon"
        className="flex h-20 w-20 items-center justify-center disabled:opacity-100"
      >
        <BalloonPop
          popping={popping}
          onPopEnd={() => {
            setPopping(false)
            onDecide('pop')
          }}
          className="h-14 w-auto"
        />
      </Pressable>

      <Pressable
        onClick={() => onDecide('keep')}
        disabled={disabled || popping}
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
