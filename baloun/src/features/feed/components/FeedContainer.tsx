import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ProfileCard } from './ProfileCard'
import { EmptyFeedScreen } from './EmptyFeedScreen'
import { KeepConfirmation } from './KeepConfirmation'
import { MOCK_MAINS } from '@/features/feed/api/mockMains'
import { joinWaitlist } from '@/features/feed/api/waitlist'
import { useFeedSession, isSessionOver } from '@/store/feed'
import { FEED } from '@/config/limits'
import type { Decision } from '@/features/feed/types/main'

export function FeedContainer() {
  const { seenIds, markSeen } = useFeedSession()
  const [busy, setBusy] = useState(false)
  const [keptName, setKeptName] = useState<string | null>(null)
  const [atTop, setAtTop] = useState(true)

  // Coda: i Main non ancora decisi in questa sessione.
  const queue = useMemo(() => MOCK_MAINS.filter((m) => !seenIds.includes(m.id)), [seenIds])
  const current = queue[0]
  const sessionOver = isSessionOver(seenIds.length) || !current

  // Il suggerimento "scorri" sparisce appena l'utente scorre.
  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Ogni nuovo Main riparte dall'alto.
  useEffect(() => {
    window.scrollTo({ top: 0 })
    setAtTop(true)
  }, [current?.id])

  const handleDecide = async (decision: Decision) => {
    if (!current || busy) return
    setBusy(true)

    if (decision === 'pop') {
      // POP → non salva nulla. Avanti, subito.
      markSeen(current.id)
      setBusy(false)
      return
    }

    // KEEP → entra nella waitlist della stanza del Main.
    try {
      await joinWaitlist(current)
    } catch {
      // In V1 non blocchiamo il flusso per un errore di rete.
    }
    setKeptName(current.name)
    window.setTimeout(() => {
      setKeptName(null)
      markSeen(current.id)
      setBusy(false)
    }, FEED.KEEP_CONFIRMATION_MS)
  }

  if (sessionOver) return <EmptyFeedScreen />

  return (
    <>
      <ProgressLine seen={seenIds.length} total={FEED.MAX_MAINS_PER_SESSION} />

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <ProfileCard
            main={current}
            onDecide={handleDecide}
            disabled={busy}
            showHint={atTop}
          />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>{keptName && <KeepConfirmation name={keptName} />}</AnimatePresence>
    </>
  )
}

// Riga di avanzamento sottile: quanti Main restano in questa sessione.
function ProgressLine({ seen, total }: { seen: number; total: number }) {
  return (
    <div className="fixed inset-x-0 top-0 z-30 h-[2px] bg-transparent">
      <motion.div
        className="h-full bg-balloon/70"
        initial={false}
        animate={{ width: `${(seen / total) * 100}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  )
}
