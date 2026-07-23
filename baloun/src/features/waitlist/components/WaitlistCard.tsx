import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Pressable } from '@/components/motion/Pressable'
import { useCountdown } from '@/hooks/useCountdown'
import { PATHS } from '@/routes/paths'
import type { MyKeepRow } from '@/services/supabase/types'

// Prima dell'apertura: nessuna informazione, solo il tempo che manca.
// È l'attesa a creare la curiosità.
export function WaitlistCard({ keep }: { keep: MyKeepRow }) {
  const navigate = useNavigate()
  const { label, isOver } = useCountdown(keep.opens_at)
  const open = keep.is_open || isOver

  if (keep.is_closed) {
    return (
      <Card className="flex items-center gap-3 px-4 py-5 opacity-70">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-muted" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[19px] leading-none">{keep.main_name}</p>
          <p className="caption mt-1.5">Selezione conclusa</p>
        </div>
      </Card>
    )
  }

  if (open && keep.decision === 'kept') {
    return (
      <Card className="flex items-center gap-3 px-4 py-5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blush" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[19px] leading-none">{keep.main_name}</p>
          <p className="caption mt-1.5">Sei rimastə — in attesa della selezione</p>
        </div>
      </Card>
    )
  }

  if (!open) {
    return (
      <Card className="flex flex-col items-center gap-2 px-4 py-6">
        <p className="kicker">Si apre tra</p>
        <p className="font-mono text-[32px] tracking-[0.06em] tabular-nums">{label}</p>
        <p className="caption">{keep.main_name}</p>
      </Card>
    )
  }

  return (
    <Pressable
      onClick={() => navigate(PATHS.room(keep.room_id))}
      className="w-full text-left"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
      >
        <Card className="flex items-center gap-3 border-blush bg-blush-soft/40 px-4 py-5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-balloon" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[19px] leading-none">{keep.main_name}</p>
            <p className="caption mt-1.5">La stanza è aperta</p>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-balloon">
            Entra
          </span>
        </Card>
      </motion.div>
    </Pressable>
  )
}
