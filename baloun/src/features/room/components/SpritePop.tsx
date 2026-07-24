import { useEffect, useState } from 'react'

/**
 * I due sprite dello scoppio. Il palloncino rosso elimina, il cuore sceglie:
 * l'animazione è la stessa in tutta l'app, cambia solo il soggetto.
 */
export const SHEETS = {
  balloon: {
    idle: '/scene/balloon.png',
    sheet: '/scene/pop.png',
    cols: 5,
    rows: 4,
    frames: 20,
    ratio: '160 / 134',
  },
  heart: {
    idle: '/scene/heart.png',
    sheet: '/scene/heart-pop.png',
    cols: 4,
    rows: 4,
    frames: 16,
    ratio: '128 / 121',
  },
} as const

export type SpriteKind = keyof typeof SHEETS

const FRAME_MS = 34

type Props = {
  kind: SpriteKind
  /** true = riproduci lo scoppio */
  popping?: boolean
  onPopEnd?: () => void
  className?: string
}

export function SpritePop({ kind, popping, onPopEnd, className }: Props) {
  const cfg = SHEETS[kind]
  const [frame, setFrame] = useState<number | null>(null)

  useEffect(() => {
    if (!popping) {
      setFrame(null)
      return
    }

    setFrame(0)
    let current = 0
    const id = window.setInterval(() => {
      current += 1
      if (current >= cfg.frames) {
        window.clearInterval(id)
        onPopEnd?.()
        return
      }
      setFrame(current)
    }, FRAME_MS)

    return () => window.clearInterval(id)
  }, [popping, onPopEnd, cfg.frames])

  if (frame === null) {
    return <img src={cfg.idle} alt="" className={className} draggable={false} />
  }

  const col = frame % cfg.cols
  const row = Math.floor(frame / cfg.cols)

  return (
    <span
      className={className}
      style={{
        display: 'block',
        aspectRatio: cfg.ratio,
        backgroundImage: `url(${cfg.sheet})`,
        backgroundSize: `${cfg.cols * 100}% ${cfg.rows * 100}%`,
        backgroundPosition: `${(col / (cfg.cols - 1)) * 100}% ${(row / (cfg.rows - 1)) * 100}%`,
      }}
      aria-hidden="true"
    />
  )
}

export const POP_DURATION_MS = 20 * FRAME_MS
