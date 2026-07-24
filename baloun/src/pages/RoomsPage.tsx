import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { RoomScene } from '@/features/room/components/RoomScene'
import { WaitlistCard } from '@/features/waitlist/components/WaitlistCard'
import { DecorChat } from '@/features/decor/components/DecorChat'
import { BalloonProfile } from '@/features/room/components/BalloonProfile'
import { useMyRoomId, useRoomScene, usePopBalloon, useRoomReactions } from '@/features/room/api/room'
import { useMyKeeps } from '@/features/waitlist/api/waitlist'
import { useRoomCandidates, useChooseBalloon } from '@/features/match/api/match'
import { CandidateCard } from '@/features/match/components/CandidateCard'
import { MatchCelebration } from '@/features/match/components/MatchCelebration'
import { useCountdown } from '@/hooks/useCountdown'
import { PATHS } from '@/routes/paths'
import { cn } from '@/lib/cn'
import { spring } from '@/components/motion/springs'

type Tab = 'mine' | 'others'

export function RoomsPage() {
  const [tab, setTab] = useState<Tab>('mine')

  return (
    <div className="safe-top py-4">
      <div className="px-5">
        <p className="kicker mb-1">Le stanze</p>
        <h1 className="mb-5 font-display text-4xl font-bold">
          {tab === 'mine' ? 'La mia stanza' : 'Le stanze degli altri'}
        </h1>
        <Segmented tab={tab} onChange={setTab} />
      </div>

      {/* Trascina in orizzontale per cambiare sezione */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.14}
        onDragEnd={(_, info) => {
          if (info.offset.x < -70) setTab('others')
          if (info.offset.x > 70) setTab('mine')
        }}
        className="mt-5 px-5"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: tab === 'mine' ? -18 : 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'mine' ? <MyRoomSection /> : <OthersSection />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function Segmented({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="relative flex rounded-full bg-paper p-1 hairline">
      {(['mine', 'others'] as Tab[]).map((value) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className="relative flex-1 py-2.5 font-mono text-[12px] uppercase tracking-[0.12em]"
        >
          {tab === value && (
            <motion.span
              layoutId="segmented-pill"
              transition={spring}
              className="absolute inset-0 rounded-full bg-ink"
            />
          )}
          <span className={cn('relative', tab === value ? 'text-cream' : 'text-muted')}>
            {value === 'mine' ? 'My room' : 'Others'}
          </span>
        </button>
      ))}
    </div>
  )
}

// ------------------------------------------------------------------ la mia

function MyRoomSection() {
  const { data: roomId } = useMyRoomId()
  const { data: scene, isLoading } = useRoomScene(roomId ?? undefined)
  const pop = usePopBalloon()
  const { data: reactions } = useRoomReactions(roomId ?? undefined)
  const [selected, setSelected] = useState<string | null>(null)
  const [matched, setMatched] = useState<string | null>(null)
  const [popping, setPopping] = useState<string | null>(null)
  const { data: candidates } = useRoomCandidates()
  const choose = useChooseBalloon()
  const navigate = useNavigate()

  const { label } = useCountdown(scene?.opens_at)
  const balloon = scene?.sceneBalloons.find((b) => b.balloon_id === selected)

  if (isLoading) return <p className="caption">Carico la stanza…</p>
  if (!scene) return <p className="caption">La tua stanza non è ancora aperta.</p>

  return (
    <>
      <Card className="overflow-hidden">
        <RoomScene
          balloons={scene.sceneBalloons}
          onSelect={setSelected}
          poppingId={popping}
          reactions={reactions}
          roomUrl={scene.roomUrl}
          onPopEnd={() => {
            // prima si vede lo scoppio, poi si toglie davvero
            if (popping) pop.mutate(popping)
            setPopping(null)
          }}
        />
        <div className="flex items-center justify-between border-t border-hairline px-4 py-3">
          <span className="caption">
            {scene.sceneBalloons.length} nella stanza
          </span>
          <span className="font-mono text-[15px] tabular-nums">
            {scene.is_closed ? '—' : scene.is_open ? 'Aperta' : label}
          </span>
        </div>
      </Card>

      <p className="caption mt-3">
        Tocca un palloncino per vedere chi è e, se vuoi, poparlo.
      </p>

      {/* La chat che personalizza la stanza, subito sotto l'immagine */}
      <div className="mt-5">
        <DecorChat roomId={scene.room_id} roomUrl={scene.roomUrl} />
      </div>

      {/* A stanza aperta il Main sceglie fra chi è rimasto: nasce il match */}
      {(candidates?.length ?? 0) > 0 && (
        <section className="mt-8">
          <p className="kicker mb-1">Chi è rimasto</p>
          <h2 className="mb-4 font-display text-2xl font-bold">Scegli una persona</h2>
          <div className="flex flex-col gap-3">
            {candidates?.map((c) => (
              <CandidateCard
                key={c.balloon_id}
                candidate={c}
                disabled={choose.isPending}
                onChoose={(id) =>
                  choose.mutate(id, {
                    onSuccess: () =>
                      setMatched(candidates.find((x) => x.balloon_id === id)?.name ?? null),
                  })
                }
              />
            ))}
          </div>
        </section>
      )}

      {(reactions?.length ?? 0) > 0 && (
        <section className="mt-8">
          <p className="kicker mb-2.5">Reazioni ricevute</p>
          <div className="flex flex-wrap gap-1.5">
            {reactions?.slice(0, 18).map((r) => (
              <span
                key={r.id}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-paper text-[19px] hairline"
              >
                {r.emoji}
              </span>
            ))}
          </div>
        </section>
      )}

      <AnimatePresence>
        {matched && (
          <MatchCelebration
            name={matched}
            onContinue={() => {
              setMatched(null)
              navigate(PATHS.matches)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {balloon && (
          <BalloonProfile
            balloonId={balloon.balloon_id}
            onClose={() => setSelected(null)}
            onPopped={() => {
              pop.mutate(balloon.balloon_id)
              setSelected(null)
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// --------------------------------------------------------------- degli altri

function OthersSection() {
  const { data: keeps, isLoading } = useMyKeeps()

  if (isLoading) return <p className="caption">Carico…</p>
  if ((keeps?.length ?? 0) === 0) {
    return (
      <p className="caption">
        Non sei ancora in nessuna stanza. Scopri qualcuno dalla Home.
      </p>
    )
  }

  // Solo le schede: la stanza in 3D si apre toccandone una.
  return (
    <div className="flex flex-col gap-2.5">
      {keeps?.map((keep) => (
        <WaitlistCard key={keep.room_id} keep={keep} />
      ))}
    </div>
  )
}
