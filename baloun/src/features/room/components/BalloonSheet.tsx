import { motion } from 'framer-motion'
import { Pressable } from '@/components/motion/Pressable'
import { BalloonIcon } from '@/components/ui/BalloonIcon'
import { spring } from '@/components/motion/springs'
import type { SceneBalloon } from './RoomScene'

type Props = {
  balloon: SceneBalloon
  onPop: () => void
  onClose: () => void
  popping?: boolean
}

// Cosa vede il Main quando tocca un palloncino.
// Qui non c'è il cuore: nella stanza si può solo poppare.
export function BalloonSheet({ balloon, onPop, onClose, popping }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 260 }}
        animate={{ y: 0 }}
        exit={{ y: 260 }}
        transition={spring}
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom w-full max-w-md rounded-t-[28px] bg-cream px-6 pt-3"
      >
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-ink/15" />

        <div className="flex flex-col items-center">
          <div className="mb-4 h-24 w-24 overflow-hidden rounded-full bg-blush-soft">
            {balloon.photoUrl && (
              <img src={balloon.photoUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <p className="font-display text-[26px] font-bold">{balloon.name ?? 'Anonimo'}</p>
          <p className="caption mt-1.5">è nella tua stanza</p>
        </div>

        <div className="mb-4 mt-8 flex flex-col items-center gap-3">
          <Pressable
            onClick={onPop}
            disabled={popping}
            aria-label="Poppa"
            className="flex h-16 w-16 items-center justify-center disabled:opacity-40"
          >
            <BalloonIcon className="h-14 w-14" title="Poppa" />
          </Pressable>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Poppa
          </span>
        </div>

        <button onClick={onClose} className="caption mb-2 w-full py-3 text-center">
          Chiudi
        </button>
      </motion.div>
    </motion.div>
  )
}
