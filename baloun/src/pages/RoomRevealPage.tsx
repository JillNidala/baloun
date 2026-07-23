import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, MapPin } from 'lucide-react'
import { useRoomReveal, useRevealDecision } from '@/features/waitlist/api/waitlist'
import { InterestRow } from '@/features/feed/components/InterestRow'
import { DecisionButtons } from '@/features/feed/components/DecisionButtons'
import { Card } from '@/components/ui/Card'
import { PATHS } from '@/routes/paths'
import { spring } from '@/components/motion/springs'
import type { Decision } from '@/features/feed/types/main'

// Round 2: qui il volto si vede davvero, e si decide di nuovo.
export function RoomRevealPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useRoomReveal(id)
  const decide = useRevealDecision(id)

  const onDecide = (decision: Decision) => {
    decide.mutate(
      { keep: decision === 'keep' },
      { onSuccess: () => navigate(PATHS.myRoom) },
    )
  }

  if (isLoading) {
    return <p className="caption px-6 py-16 text-center">Apro la stanza…</p>
  }

  if (!data) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-display text-xl">Questa stanza non è accessibile</p>
        <p className="caption mt-2">Forse non è ancora aperta, o hai già deciso.</p>
        <button
          onClick={() => navigate(PATHS.myRoom)}
          className="caption mt-6 underline underline-offset-4"
        >
          Torna indietro
        </button>
      </div>
    )
  }

  const alreadyDecided = data.decision !== 'pending'

  return (
    <div className="safe-top px-6 pb-10">
      <button
        onClick={() => navigate(PATHS.myRoom)}
        className="mb-6 flex items-center gap-1 font-mono text-[13px] text-muted"
      >
        <ChevronLeft size={17} /> Indietro
      </button>

      <p className="kicker mb-4">La stanza è aperta</p>

      {/* La foto, finalmente nitida */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring}
        className="mx-auto mb-7 h-64 w-64 overflow-hidden rounded-full bg-blush-soft"
      >
        {data.photoUrl ? (
          <img
            src={data.photoUrl}
            alt={data.name ?? 'Profilo'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="caption">Nessuna foto</span>
          </div>
        )}
      </motion.div>

      <header className="mb-6 text-center">
        <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight">
          {data.name}
          <span className="mx-2.5 font-normal text-muted">•</span>
          <span className="font-normal">{data.age}</span>
        </h1>
        {data.city && (
          <p className="caption mt-2 flex items-center justify-center gap-1.5">
            <MapPin size={13} strokeWidth={1.75} /> {data.city}
          </p>
        )}
      </header>

      {data.bio && (
        <Card className="mb-6 p-5">
          <p className="font-display text-[17px] leading-relaxed">{data.bio}</p>
        </Card>
      )}

      <div className="mb-10 divide-y divide-hairline border-y border-hairline">
        {data.interests.map((interest) => (
          <InterestRow key={interest.kind} interest={interest} />
        ))}
      </div>

      {alreadyDecided ? (
        <p className="caption text-center">Hai già deciso per questa stanza.</p>
      ) : (
        <DecisionButtons onDecide={onDecide} disabled={decide.isPending} />
      )}

      {decide.isError && (
        <p className="mt-4 text-center font-mono text-[12px] text-balloon">
          Non è stato possibile salvare la scelta. Riprova.
        </p>
      )}
    </div>
  )
}
