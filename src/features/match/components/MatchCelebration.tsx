import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Heart } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Pressable } from '@/components/motion/Pressable'

// Cuoricini disposti attorno al palloncino, ognuno con la sua tempistica:
// sfalsare i tempi evita l'effetto "sciame meccanico".
const HEARTS = [
  { x: -96, size: 18, delay: 0.0, drift: -18 },
  { x: -52, size: 26, delay: 0.7, drift: 10 },
  { x: -14, size: 15, delay: 1.5, drift: -8 },
  { x: 30, size: 22, delay: 0.35, drift: 14 },
  { x: 74, size: 17, delay: 1.1, drift: -12 },
  { x: 104, size: 24, delay: 1.9, drift: 8 },
]

type Props = {
  name: string | null
  onContinue: () => void
  ctaLabel?: string
}

export function MatchCelebration({ name, onContinue, ctaLabel = 'Apri la chat' }: Props) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream px-8"
    >
      <div className="relative flex h-72 w-full max-w-xs items-center justify-center">
        {/* I cuoricini salgono e svaniscono, in continuo */}
        {HEARTS.map((h, i) => (
          <motion.span
            key={i}
            className="absolute text-blush"
            style={{ left: `calc(50% + ${h.x}px)` }}
            initial={{ y: 60, opacity: 0, scale: 0.6 }}
            animate={{
              y: [-10, -150],
              x: [0, h.drift],
              opacity: [0, 1, 1, 0],
              scale: [0.6, 1, 1, 0.9],
            }}
            transition={{
              duration: 3.2,
              delay: h.delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          >
            <Heart size={h.size} fill="currentColor" strokeWidth={0} />
          </motion.span>
        ))}

        {/* Il palloncino fluttua piano al centro */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.35, duration: 0.9 }}
          className="relative z-10"
        >
          <motion.div
            animate={{ y: [0, -14, 0], rotate: [-2.5, 2.5, -2.5] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Logo className="h-44 w-auto" />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="mt-2 text-center"
      >
        <p className="kicker mb-3">È un match</p>
        <h1 className="font-display text-[32px] font-bold leading-tight tracking-tight">
          Tu e {name}
        </h1>
        <p className="caption mt-3">Il palloncino è arrivato fino alla fine.</p>
      </motion.div>

      <Pressable
        onClick={onContinue}
        className="mt-10 w-full max-w-xs rounded-control bg-ink py-4 font-mono text-[14px] text-cream"
      >
        {ctaLabel}
      </Pressable>
    </motion.div>,
    document.body,
  )
}
