import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { springBouncy } from '@/components/motion/springs'

// Conferma piccola e veloce dopo il KEEP. Niente coriandoli, niente attese.
export function KeepConfirmation({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-cream/85 backdrop-blur-[2px]"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={springBouncy}
        className="flex flex-col items-center gap-4"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blush-soft">
          <Heart size={26} strokeWidth={1.75} className="text-blush-deep" fill="currentColor" />
        </span>
        <p className="font-display text-xl">Sei nella stanza di {name}</p>
        <p className="caption">In attesa della selezione</p>
      </motion.div>
    </motion.div>
  )
}
