import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, MapPin } from 'lucide-react'
import { useRoomReveal, useRevealDecision } from '@/features/waitlist/api/waitlist'
import { TagChips } from '@/features/feed/components/TagChips'
import { PromptBlock } from '@/features/feed/components/PromptBlock'
import { DecisionButtons } from '@/features/feed/components/DecisionButtons'
import { Card } from '@/components/ui/Card'
import { PATHS } from '@/routes/paths'
import { spring } from '@/components/motion/springs'
import type { Decision } from '@/features/feed/types/main'

// Round 2: la stanza è aperta, il profilo si vede per intero.
export function RoomRevealPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useRoomReveal(id)
  const decide = useRevealDecision(id)

  const onDecide = (decision: Decision) => {
    decide.mutate({ keep: decision === 'keep' }, { onSuccess: () => navigate(PATHS.myRoom) })
  }

  if (isLoading) return <p className="caption px-6 py-16 text-center">Apro la stanza…</p>

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

  const gallery = data.gallery.length > 0 ? data.gallery : data.photoUrl ? [data.photoUrl] : []
  const alreadyDecided = data.decision !== 'pending'

  return (
    <div className="safe-top px-5 pb-12">
      <button
        onClick={() => navigate(PATHS.myRoom)}
        className="mb-5 flex items-center gap-1 font-mono text-[13px] text-muted"
      >
        <ChevronLeft size={17} /> Indietro
      </button>

      <p className="kicker mb-4">La stanza è aperta</p>

      {/* Prima foto grande */}
      {gallery[0] && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={spring}
          className="mb-6 aspect-[4/5] w-full overflow-hidden rounded-card bg-blush-soft"
        >
          <img src={gallery[0]} alt={data.name ?? ''} className="h-full w-full object-cover" />
        </motion.div>
      )}

      <header className="mb-7 text-center">
        <h1 className="font-display text-[32px] font-bold leading-tight tracking-tight">
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

      <div className="mb-7">
        <TagChips tags={data.tags} />
      </div>

      {data.bio && (
        <Card className="mb-6 p-5">
          <p className="font-display text-[17px] leading-relaxed">{data.bio}</p>
        </Card>
      )}

      {/* Spunti e altre foto, alternati */}
      <div className="flex flex-col">
        {data.prompts.map((prompt, i) => (
          <div key={prompt.id}>
            <div className="border-t border-hairline">
              <PromptBlock prompt={prompt} />
            </div>
            {gallery[i + 1] && (
              <div className="mb-6 aspect-[4/5] w-full overflow-hidden rounded-card bg-blush-soft">
                <img src={gallery[i + 1]} alt="" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10">
        {alreadyDecided ? (
          <p className="caption text-center">Hai già deciso per questa stanza.</p>
        ) : (
          <DecisionButtons onDecide={onDecide} disabled={decide.isPending} />
        )}
      </div>

      {decide.isError && (
        <p className="mt-4 text-center font-mono text-[12px] text-balloon">
          Non è stato possibile salvare la scelta. Riprova.
        </p>
      )}
    </div>
  )
}
