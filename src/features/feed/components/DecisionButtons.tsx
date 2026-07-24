import { useState } from 'react'
import { Pressable } from '@/components/motion/Pressable'
import { SpritePop } from '@/features/room/components/SpritePop'
import type { Decision } from '@/features/feed/types/main'

type Props = {
  onDecide: (decision: Decision) => void
  disabled?: boolean
}

/**
 * Due gesti, due scoppi: il palloncino rosso elimina, il cuore sceglie.
 * Nessuno sfondo, nessun testo.
 */
export function DecisionButtons({ onDecide, disabled }: Props) {
  const [popping, setPopping] = useState<Decision | null>(null)

  return (
    <div className="flex items-center justify-center gap-16">
      <Pressable
        onClick={() => setPopping('pop')}
        disabled={disabled || popping !== null}
        aria-label="Pop the balloon"
        className="flex h-20 w-20 items-center justify-center disabled:opacity-100"
      >
        <SpritePop
          kind="balloon"
          popping={popping === 'pop'}
          onPopEnd={() => {
            setPopping(null)
            onDecide('pop')
          }}
          className="h-14 w-auto"
        />
      </Pressable>

      <Pressable
        onClick={() => setPopping('keep')}
        disabled={disabled || popping !== null}
        aria-label="Keep the balloon"
        className="flex h-20 w-20 items-center justify-center disabled:opacity-100"
      >
        <SpritePop
          kind="heart"
          popping={popping === 'keep'}
          onPopEnd={() => {
            setPopping(null)
            onDecide('keep')
          }}
          className="h-14 w-auto"
        />
      </Pressable>
    </div>
  )
}
