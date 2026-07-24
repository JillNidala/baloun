import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/cn'

export type SceneBalloon = {
  balloon_id: string
  name?: string | null
  photoUrl?: string
  /** true = foto nitida (solo il Main), false = sfocata */
  clear: boolean
}

export type SceneReaction = { id: string; emoji: string; sender_id: string }

type Props = {
  balloons: SceneBalloon[]
  onSelect?: (balloonId: string) => void
  /** id del palloncino che sta esplodendo: mostra l'animazione */
  poppingId?: string | null
  onPopEnd?: () => void
  /** reazioni ricevute: le vede solo il Main, una ogni 2 secondi, in ciclo */
  reactions?: SceneReaction[]
  /**
   * Stanza personalizzata: è la stessa foto modificata da Gemini,
   * quindi basta sostituirla. Niente più elementi incollati sopra.
   */
  roomUrl?: string
}


/**
 * La stanza è un'immagine fissa; i palloncini sono elementi sovrapposti.
 *
 * Le coordinate qui sotto NON sono a occhio: sono state ricavate misurando
 * il render originale, dove i cinque palloncini stavano su una retta
 * (scarto massimo 1,3 px). Tutto è espresso in pixel dell'immagine e
 * convertito in percentuali, così la scena resta identica su ogni schermo.
 */
const IMG = { w: 1264, h: 843 }

/**
 * Le cinque postazioni, misurate una per una sul render originale.
 * Una stanza ospita al massimo 5 Balloon, così restano sempre schierati bene.
 *
 * Nel render il primo palloncino è tagliato dall'angolo del muro (risultava
 * largo 45 px invece di 61): qui gli ho restituito la larghezza piena e
 * spostato il centro di conseguenza.
 */
const SLOTS = [
  { x: 656.0, y: 282.0 },
  { x: 724.0, y: 319.0 },
  { x: 794.5, y: 352.0 },
  { x: 865.5, y: 385.0 },
  { x: 937.0, y: 417.5 },
] as const

/** Larghezza del palloncino, in pixel dell'immagine. */
const BALLOON_W = 61

const SHEET = { cols: 5, rows: 4, frames: 20, frameMs: 34 }

function pct(px: number, total: number) {
  return (px / total) * 100
}

export function RoomScene({ balloons, onSelect, poppingId, onPopEnd, reactions, roomUrl }: Props) {
  const visible = balloons.slice(0, SLOTS.length)

  return (
    <div
      className="relative w-full select-none"
      style={{ aspectRatio: `${IMG.w} / ${IMG.h}`, background: '#F5F5F4' }}
    >
      <img
        src={roomUrl ?? '/scene/room.jpg'}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {visible.map((balloon, i) => (
        <BalloonPin
          key={balloon.balloon_id}
          balloon={balloon}
          slot={SLOTS[i]}
          depth={i}
          popping={poppingId === balloon.balloon_id}
          onSelect={onSelect}
          onPopEnd={onPopEnd}
          reactions={reactions?.filter((r) => r.sender_id === balloon.balloon_id)}
        />
      ))}

      {balloons.length === 0 && (
        <p
          className="caption absolute w-full text-center"
          style={{ top: `${pct(SLOTS[2].y, IMG.h)}%` }}
        >
          Ancora nessuno
        </p>
      )}
    </div>
  )
}

type PinProps = {
  balloon: SceneBalloon
  slot: { x: number; y: number }
  /** ordine di profondità: chi è più avanti passa sopra agli altri */
  depth: number
  popping: boolean
  reactions?: SceneReaction[]
  onSelect?: (id: string) => void
  onPopEnd?: () => void
}

function BalloonPin({ balloon, slot, depth, popping, onSelect, onPopEnd, reactions }: PinProps) {
  const left = pct(slot.x, IMG.w)
  const top = pct(slot.y, IMG.h)
  const width = pct(BALLOON_W, IMG.w)
  const interactive = Boolean(onSelect)

  if (popping) {
    return <PopBurst left={left} top={top} width={width} onEnd={onPopEnd} />
  }

  return (
    <div
      className="absolute"
      style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, zIndex: depth + 1 }}
    >
      <motion.div
        className="relative -translate-x-1/2 -translate-y-1/2"
        animate={{ y: [0, -3.5, 0] }}
        transition={{
          duration: 4.2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: (slot.x % 7) * 0.3,
        }}
      >
        {/* filo: nello sprite non c'è, nel render originale sì */}
        <svg
          viewBox="0 0 20 90"
          className="absolute left-1/2 top-[92%] w-[26%] -translate-x-1/2"
          aria-hidden="true"
        >
          <path
            d="M10 0 C15 22 4 40 11 62 C16 76 8 82 10 90"
            fill="none"
            stroke="#B4232F"
            strokeOpacity="0.55"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>

        <button
          type="button"
          onClick={() => onSelect?.(balloon.balloon_id)}
          disabled={!interactive}
          aria-label={balloon.name ? `Apri ${balloon.name}` : 'Palloncino'}
          className={cn('relative block w-full', interactive && 'cursor-pointer')}
        >
          <img src="/scene/balloon.png" alt="" className="w-full" draggable={false} />
        </button>

        {/* Foto profilo: staccata dal palloncino e più grande.
            Sta sopra, con un margine, come una targhetta sospesa. */}
        <button
          type="button"
          onClick={() => onSelect?.(balloon.balloon_id)}
          disabled={!interactive}
          tabIndex={-1}
          className={cn(
            'absolute bottom-[124%] left-1/2 aspect-square w-[178%] -translate-x-1/2',
            'overflow-hidden rounded-full border-[3px] border-white bg-blush-soft shadow-lg',
            interactive && 'cursor-pointer',
          )}
          aria-hidden="true"
        >
          {balloon.photoUrl && (
            <img
              src={balloon.photoUrl}
              alt=""
              className="h-full w-full object-cover"
              style={{
                filter: balloon.clear ? 'none' : 'blur(6px)',
                transform: balloon.clear ? 'none' : 'scale(1.3)',
              }}
              draggable={false}
            />
          )}
        </button>

        {reactions && reactions.length > 0 && (
          <FloatingReactions reactions={reactions} />
        )}
      </motion.div>
    </div>
  )
}

/**
 * Le emoji ricevute salgono dalla foto del mittente: una ogni 2 secondi,
 * poi si ricomincia da capo.
 */
function FloatingReactions({ reactions }: { reactions: SceneReaction[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % reactions.length)
    }, 2000)
    return () => window.clearInterval(id)
  }, [reactions.length])

  const current = reactions[index]

  return (
    <span className="pointer-events-none absolute bottom-[210%] left-1/2 z-30 -translate-x-1/2">
      <AnimatePresence mode="wait">
        <motion.span
          key={`${current.id}-${index}`}
          initial={{ opacity: 0, y: 14, scale: 0.6 }}
          animate={{ opacity: [0, 1, 1, 0], y: [14, -6, -18, -30], scale: [0.6, 1, 1, 0.9] }}
          transition={{ duration: 2, times: [0, 0.18, 0.7, 1], ease: 'easeOut' }}
          className="block text-[13px] leading-none drop-shadow-sm"
        >
          {current.emoji}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/** Riproduce i 20 fotogrammi dello scoppio, una volta sola. */
function PopBurst({
  left,
  top,
  width,
  onEnd,
}: {
  left: number
  top: number
  width: number
  onEnd?: () => void
}) {
  const [frame, setFrame] = useState(0)

  // Stesso accorgimento: il riferimento evita che l'animazione riparta
  // ogni volta che la pagina si ridisegna.
  const fineRef = useRef(onEnd)
  useEffect(() => {
    fineRef.current = onEnd
  })

  useEffect(() => {
    let current = 0
    const id = window.setInterval(() => {
      current += 1
      if (current >= SHEET.frames) {
        window.clearInterval(id)
        fineRef.current?.()
        return
      }
      setFrame(current)
    }, SHEET.frameMs)
    return () => window.clearInterval(id)
  }, [])

  const col = frame % SHEET.cols
  const row = Math.floor(frame / SHEET.cols)

  return (
    <AnimatePresence>
      <motion.div
        className="absolute"
        style={{ left: `${left}%`, top: `${top}%`, width: `${width * 3.4}%` }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="-translate-x-1/2 -translate-y-1/2"
          style={{
            aspectRatio: '160 / 134',
            backgroundImage: 'url(/scene/pop.png)',
            backgroundSize: `${SHEET.cols * 100}% ${SHEET.rows * 100}%`,
            backgroundPosition: `${(col / (SHEET.cols - 1)) * 100}% ${(row / (SHEET.rows - 1)) * 100}%`,
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}
