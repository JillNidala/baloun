import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Pressable } from '@/components/motion/Pressable'
import { TagChips } from '@/features/feed/components/TagChips'
import { PromptBlock } from '@/features/feed/components/PromptBlock'
import { SpritePop } from './SpritePop'
import { useBalloonProfile } from '@/features/room/api/room'
import { spring } from '@/components/motion/springs'

type Props = {
  balloonId: string
  onClose: () => void
  /** chiamato quando l'animazione dello scoppio è finita */
  onPopped: () => void
}

// Il Main tocca un palloncino: il profilo si apre a tutto schermo.
export function BalloonProfile({ balloonId, onClose, onPopped }: Props) {
  const { data, isLoading } = useBalloonProfile(balloonId)
  const [popping, setPopping] = useState(false)

  const contenuto = (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={spring}
      className="fixed inset-0 z-50 overflow-y-auto bg-cream"
    >
      <div className="mx-auto max-w-md px-5 pb-16 safe-top">
        <button
          onClick={onClose}
          className="mb-5 flex items-center gap-1 font-mono text-[13px] text-muted"
        >
          <ChevronLeft size={17} /> Chiudi
        </button>

        {isLoading && <p className="caption">Carico il profilo…</p>}
        {!isLoading && !data && <p className="caption">Profilo non disponibile.</p>}

        {data && (
          <>
            {data.gallery[0] && (
              <div className="mb-6 aspect-[4/5] w-full overflow-hidden rounded-card bg-blush-soft">
                <img src={data.gallery[0]} alt="" className="h-full w-full object-cover" />
              </div>
            )}

            <header className="mb-6 text-center">
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

            <div className="flex flex-col">
              {data.prompts.map((prompt, i) => (
                <div key={prompt.id}>
                  <div className="border-t border-hairline">
                    <PromptBlock prompt={prompt} />
                  </div>
                  {data.gallery[i + 1] && (
                    <div className="mb-6 aspect-[4/5] w-full overflow-hidden rounded-card bg-blush-soft">
                      <img src={data.gallery[i + 1]} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Nelle stanze si può solo poppare: niente cuore. */}
            <div className="mt-10 flex flex-col items-center gap-3">
              <Pressable
                onClick={() => setPopping(true)}
                disabled={popping}
                aria-label="Poppa"
                className="flex h-20 w-20 items-center justify-center disabled:opacity-100"
              >
                <SpritePop
                  kind="balloon"
                  popping={popping}
                  onPopEnd={onPopped}
                  className="h-16 w-auto"
                />
              </Pressable>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                Poppa
              </span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )

  // Fuori dall'albero della pagina: altrimenti lo scorrimento del profilo
  // finirebbe per trascinare anche la barra My room / Others sottostante.
  return createPortal(contenuto, document.body)
}
