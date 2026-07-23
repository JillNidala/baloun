import { Pressable } from '@/components/motion/Pressable'
import type { Decision } from '@/features/feed/types/main'

type Props = {
  onDecide: (decision: Decision) => void
  disabled?: boolean
}

// Due pulsanti molto grandi, alti 88px: impossibili da sbagliare col pollice.
export function DecisionButtons({ onDecide, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Pressable
        onClick={() => onDecide('pop')}
        disabled={disabled}
        className="flex h-[88px] flex-col items-center justify-center gap-1.5 rounded-card bg-paper hairline disabled:opacity-50"
      >
        <span className="text-[26px] leading-none" aria-hidden="true">
          🎈
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Pop the balloon
        </span>
      </Pressable>

      <Pressable
        onClick={() => onDecide('keep')}
        disabled={disabled}
        className="flex h-[88px] flex-col items-center justify-center gap-1.5 rounded-card bg-ink disabled:opacity-50"
      >
        <span className="text-[26px] leading-none" aria-hidden="true">
          ❤️
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream">
          Keep the balloon
        </span>
      </Pressable>
    </div>
  )
}
