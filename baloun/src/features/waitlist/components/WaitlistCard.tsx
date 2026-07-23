import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Pressable } from '@/components/motion/Pressable'
import { useCountdown } from '@/hooks/useCountdown'
import { PATHS } from '@/routes/paths'
import { cn } from '@/lib/cn'
import type { MyKeepRow } from '@/services/supabase/types'

type Keep = MyKeepRow & { blurredUrl?: string; fullUrl?: string }

// Foto a sinistra (sfocata finché la stanza è chiusa), nome al centro,
// tempo a destra. Quando si apre, la foto diventa nitida.
export function WaitlistCard({ keep }: { keep: Keep }) {
  const navigate = useNavigate()
  const { label, isOver } = useCountdown(keep.opens_at)
  const open = keep.is_open || isOver
  const showFull = open && Boolean(keep.fullUrl)

  const inner = (
    <Card
      className={cn(
        'flex items-center gap-3.5 p-3.5',
        keep.is_closed && 'opacity-60',
        open && !keep.is_closed && 'border-blush',
      )}
    >
      <Avatar
        url={showFull ? keep.fullUrl : keep.blurredUrl}
        blurred={!showFull}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[20px] font-bold leading-none">
          {keep.main_name}
        </p>
        <p className="caption mt-1.5">
          {keep.is_closed
            ? 'Selezione conclusa'
            : keep.decision === 'kept'
              ? 'Sei rimastə'
              : open
                ? 'La stanza è aperta'
                : 'In attesa'}
        </p>
      </div>

      <div className="shrink-0 text-right">
        {keep.is_closed ? (
          <span className="font-mono text-[12px] text-muted">—</span>
        ) : open ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-balloon">
            {keep.decision === 'kept' ? 'In gioco' : 'Entra'}
          </span>
        ) : (
          <span className="font-mono text-[17px] tabular-nums tracking-[0.04em]">
            {label}
          </span>
        )}
      </div>
    </Card>
  )

  const canEnter = open && !keep.is_closed && keep.decision === 'pending'
  if (!canEnter) return inner

  return (
    <Pressable onClick={() => navigate(PATHS.room(keep.room_id))} className="w-full text-left">
      <motion.div
        initial={{ scale: 0.99, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
      >
        {inner}
      </motion.div>
    </Pressable>
  )
}

function Avatar({ url, blurred }: { url?: string; blurred: boolean }) {
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-blush-soft">
      {url && (
        <div
          className="absolute inset-0"
          style={{
            background: `center/cover no-repeat url(${url})`,
            filter: blurred ? 'blur(9px)' : 'none',
            transform: blurred ? 'scale(1.25)' : 'none',
          }}
        />
      )}
      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/5" />
    </div>
  )
}
