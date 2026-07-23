import { useEffect, useState } from 'react'

/** Millisecondi mancanti a una data, aggiornati ogni secondo. */
export function useCountdown(target: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!target) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [target])

  if (!target) return { msLeft: 0, isOver: false, label: '--:--:--' }

  const msLeft = Math.max(0, new Date(target).getTime() - now)
  return { msLeft, isOver: msLeft <= 0, label: formatHMS(msLeft) }
}

/** Formato HH:MM:SS */
export function formatHMS(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':')
}
