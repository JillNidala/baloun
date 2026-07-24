import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { ProfileCard } from './ProfileCard'
import { EmptyFeedScreen } from './EmptyFeedScreen'
import { KeepConfirmation } from './KeepConfirmation'
import { useFeed, joinWaitlist } from '@/features/feed/api/feed'
import { useFeedSession, isSessionOver } from '@/store/feed'
import { FEED } from '@/config/limits'
import type { Decision } from '@/features/feed/types/main'

export function FeedContainer() {
  const { data: mains, isLoading, isError, refetch } = useFeed()
  const queryClient = useQueryClient()
  const { seenIds, markSeen } = useFeedSession()
  const [busy, setBusy] = useState(false)
  const [keptName, setKeptName] = useState<string | null>(null)
  const [atTop, setAtTop] = useState(true)

  const queue = useMemo(() => (mains ?? []).filter((m) => !seenIds.includes(m.id)), [mains, seenIds])
  const current = queue[0]

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
    setAtTop(true)
  }, [current?.id])

  const handleDecide = async (decision: Decision) => {
    if (!current || busy) return
    setBusy(true)

    if (decision === 'pop') {
      markSeen(current.id)
      setBusy(false)
      return
    }

    try {
      await joinWaitlist(current)
      queryClient.invalidateQueries({ queryKey: ['my-keeps'] })
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

  if (isLoading) return <FeedMessage title="Un attimo…" text="Sto cercando i Main." />

  if (isError)
    return (
      <FeedMessage
        title="Non riesco a caricare i Main."
        text="Controlla la connessione."
        action={{ label: 'Riprova', onClick: () => void refetch() }}
      />
    )

  if (!current || isSessionOver(seenIds.length)) return <EmptyFeedScreen />

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
          <ProfileCard main={current} onDecide={handleDecide} disabled={busy} showHint={atTop} />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>{keptName && <KeepConfirmation name={keptName} />}</AnimatePresence>
    </>
  )
}

function FeedMessage({
  title,
  text,
  action,
}: {
  title: string
  text: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-8 text-center">
      <h2 className="mb-2 font-display text-2xl font-bold">{title}</h2>
      <p className="caption">{text}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 rounded-control bg-ink px-6 py-3 font-mono text-[13px] text-cream"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

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
