import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pressable } from '@/components/motion/Pressable'
import { useApprovedEmojis, useSendReaction } from '@/features/room/api/room'

// I Balloon non hanno una chat: mandano emoji, e solo quelle approvate.
export function EmojiBar({ roomId }: { roomId: string }) {
  const { data: emojis } = useApprovedEmojis()
  const send = useSendReaction(roomId)
  const [sent, setSent] = useState<string | null>(null)

  const onSend = (emoji: string) => {
    send.mutate(emoji, {
      onSuccess: () => {
        setSent(emoji)
        window.setTimeout(() => setSent(null), 900)
      },
    })
  }

  return (
    <div className="relative">
      <p className="kicker mb-2.5">Manda una reazione</p>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {emojis?.map(({ emoji }) => (
          <Pressable
            key={emoji}
            onClick={() => onSend(emoji)}
            disabled={send.isPending}
            aria-label={`Manda ${emoji}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper text-[21px] hairline"
          >
            {emoji}
          </Pressable>
        ))}
      </div>

      {/* piccola conferma: l'emoji vola via */}
      <AnimatePresence>
        {sent && (
          <motion.span
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -46, scale: 1.5 }}
            exit={{ opacity: 0, y: -70, scale: 1.2 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="pointer-events-none absolute left-1/2 top-0 text-[28px]"
          >
            {sent}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
