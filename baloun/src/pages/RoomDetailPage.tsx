import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { RoomScene } from '@/features/room/components/RoomScene'
import { EmojiBar } from '@/features/room/components/EmojiBar'
import { useRoomScene } from '@/features/room/api/room'
import { useRoomReveal, useRevealDecision } from '@/features/waitlist/api/waitlist'
import { TagChips } from '@/features/feed/components/TagChips'
import { PromptBlock } from '@/features/feed/components/PromptBlock'
import { DecisionButtons } from '@/features/feed/components/DecisionButtons'
import { useCountdown } from '@/hooks/useCountdown'
import { PATHS } from '@/routes/paths'
import type { Decision } from '@/features/feed/types/main'

/**
 * Cosa vede un Balloon dentro la stanza di qualcun altro:
 * la stanza, le emoji da mandare e — quando si apre — il profilo completo
 * del Main con la seconda decisione.
 */
export function RoomDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: scene, isLoading } = useRoomScene(id)
  const { data: main } = useRoomReveal(id)
  const decide = useRevealDecision(id)
  const { label } = useCountdown(scene?.opens_at)

  const onDecide = (decision: Decision) => {
    decide.mutate({ keep: decision === 'keep' }, { onSuccess: () => navigate(PATHS.myRoom) })
  }

  if (isLoading) return <p className="caption px-6 py-16 text-center">Carico la stanza…</p>
  if (!scene) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-display text-xl">Stanza non accessibile</p>
        <button
          onClick={() => navigate(PATHS.myRoom)}
          className="caption mt-5 underline underline-offset-4"
        >
          Torna indietro
        </button>
      </div>
    )
  }

  return (
    <div className="safe-top pb-16">
      <div className="px-5">
        <button
          onClick={() => navigate(PATHS.myRoom)}
          className="mb-4 flex items-center gap-1 font-mono text-[13px] text-muted"
        >
          <ChevronLeft size={17} /> Le stanze
        </button>

        <p className="kicker mb-1">La stanza di</p>
        <h1 className="mb-4 font-display text-3xl font-bold">{scene.main_name}</h1>
      </div>

      <Card className="mx-5 overflow-hidden">
        <RoomScene balloons={scene.sceneBalloons} />
        <div className="flex items-center justify-between border-t border-hairline px-4 py-3">
          <span className="caption">{scene.sceneBalloons.length} palloncini</span>
          <span className="font-mono text-[15px] tabular-nums">
            {scene.is_closed ? 'Conclusa' : scene.is_open ? 'Aperta' : label}
          </span>
        </div>
      </Card>

      {/* Le emoji stanno sotto la stanza */}
      {!scene.is_closed && (
        <div className="mt-5 px-5">
          <EmojiBar roomId={scene.room_id} />
        </div>
      )}

      {/* Il profilo completo compare solo a stanza aperta */}
      {main ? (
        <div className="mt-10 px-5">
          {main.gallery[0] && (
            <div className="mb-6 aspect-[4/5] w-full overflow-hidden rounded-card bg-blush-soft">
              <img src={main.gallery[0]} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <header className="mb-6 text-center">
            <h2 className="font-display text-[30px] font-bold leading-tight tracking-tight">
              {main.name}
              <span className="mx-2.5 font-normal text-muted">•</span>
              <span className="font-normal">{main.age}</span>
            </h2>
            {main.city && (
              <p className="caption mt-2 flex items-center justify-center gap-1.5">
                <MapPin size={13} strokeWidth={1.75} /> {main.city}
              </p>
            )}
          </header>

          <div className="mb-7">
            <TagChips tags={main.tags} />
          </div>

          {main.bio && (
            <Card className="mb-6 p-5">
              <p className="font-display text-[17px] leading-relaxed">{main.bio}</p>
            </Card>
          )}

          <div className="flex flex-col">
            {main.prompts.map((prompt, i) => (
              <div key={prompt.id}>
                <div className="border-t border-hairline">
                  <PromptBlock prompt={prompt} />
                </div>
                {main.gallery[i + 1] && (
                  <div className="mb-6 aspect-[4/5] w-full overflow-hidden rounded-card bg-blush-soft">
                    <img src={main.gallery[i + 1]} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10">
            {main.decision === 'pending' ? (
              <DecisionButtons onDecide={onDecide} disabled={decide.isPending} />
            ) : (
              <p className="caption text-center">Hai già deciso per questa stanza.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="caption mt-10 px-8 text-center">
          Il profilo completo si vede quando la stanza si apre.
        </p>
      )}
    </div>
  )
}
