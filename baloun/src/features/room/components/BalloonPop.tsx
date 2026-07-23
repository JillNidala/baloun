import { useEffect, useState } from 'react'

const SHEET = { cols: 5, rows: 4, frames: 20, frameMs: 34 }

type Props = {
  /** true = riproduci lo scoppio */
  popping?: boolean
  onPopEnd?: () => void
  className?: string
}

/**
 * Palloncino che esplode con i 20 fotogrammi dello sprite sheet.
 * Usato nel feed anonimo e nel profilo dentro le stanze, così lo scoppio
 * è sempre lo stesso ovunque.
 */
export function BalloonPop({ popping, onPopEnd, className }: Props) {
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
      if (current >= SHEET.frames) {
        window.clearInterval(id)
        onPopEnd?.()
        return
      }
      setFrame(current)
    }, SHEET.frameMs)

    return () => window.clearInterval(id)
  }, [popping, onPopEnd])

  if (frame === null) {
    return <img src="/scene/balloon.png" alt="" className={className} draggable={false} />
  }

  const col = frame % SHEET.cols
  const row = Math.floor(frame / SHEET.cols)

  return (
    <span
      className={className}
      style={{
        display: 'block',
        aspectRatio: '160 / 134',
        backgroundImage: 'url(/scene/pop.png)',
        backgroundSize: `${SHEET.cols * 100}% ${SHEET.rows * 100}%`,
        backgroundPosition: `${(col / (SHEET.cols - 1)) * 100}% ${(row / (SHEET.rows - 1)) * 100}%`,
      }}
      aria-hidden="true"
    />
  )
}

export const POP_DURATION_MS = SHEET.frames * SHEET.frameMs
