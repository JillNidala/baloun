import { Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useMyRoomWaitlist } from '@/features/feed/api/feed'
import { useMyKeeps } from '@/features/waitlist/api/waitlist'
import { useRoomCandidates, useChooseBalloon } from '@/features/match/api/match'
import { CandidateCard } from '@/features/match/components/CandidateCard'
import { MatchCelebration } from '@/features/match/components/MatchCelebration'
import { WaitlistCard } from '@/features/waitlist/components/WaitlistCard'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { PATHS } from '@/routes/paths'

// V1: la stanza mostra chi ha premuto KEEP su di te.
// Round, eliminazioni e chat arriveranno dopo.
export function MyRoomPage() {
  const { data: waitlist, isLoading } = useMyRoomWaitlist()
  const { data: keeps } = useMyKeeps()
  const { data: candidates } = useRoomCandidates()
  const choose = useChooseBalloon()
  const navigate = useNavigate()
  const [matched, setMatched] = useState<string | null>(null)

  const onChoose = (balloonId: string) => {
    const picked = candidates?.find((c) => c.balloon_id === balloonId)
    choose.mutate(balloonId, {
      onSuccess: () => setMatched(picked?.name ?? null),
    })
  }

  return (
    <div className="safe-top px-5 py-4">
      <header className="mb-6">
        <p className="kicker mb-1">Sei il Main</p>
        <h1 className="font-display text-4xl font-bold">La mia stanza</h1>
      </header>

      <Card className="mb-8 flex flex-col items-center gap-1 p-6">
        <Users size={20} strokeWidth={1.75} className="text-balloon" />
        <span className="font-display text-4xl font-bold">{waitlist?.length ?? 0}</span>
        <span className="caption">Balloon in attesa</span>
      </Card>

      <p className="kicker mb-3">Chi ti ha scelto</p>
      <div className="mb-10 flex flex-col gap-2.5">
        {isLoading && <p className="caption">Carico…</p>}
        {!isLoading && (waitlist?.length ?? 0) === 0 && (
          <p className="caption">Ancora nessuno. Il tuo profilo è nel feed degli altri.</p>
        )}
        {waitlist?.map((b) => (
          <Card key={b.id} className="flex items-center gap-3 p-3">
            <span className="h-9 w-9 shrink-0 rounded-full bg-blush-soft" />
            <div className="min-w-0">
              <p className="font-display text-[17px] leading-none">{b.balloon_name}</p>
              {b.balloon_city && <p className="caption mt-1">{b.balloon_city}</p>}
            </div>
          </Card>
        ))}
      </div>

      {(candidates?.length ?? 0) > 0 && (
        <section className="mb-10">
          <p className="kicker mb-1">La stanza è aperta</p>
          <h2 className="mb-4 font-display text-2xl font-bold">Scegli una persona</h2>
          <div className="flex flex-col gap-3">
            {candidates?.map((c) => (
              <CandidateCard
                key={c.balloon_id}
                candidate={c}
                onChoose={onChoose}
                disabled={choose.isPending}
              />
            ))}
          </div>
        </section>
      )}

      <p className="kicker mb-3">Sei in attesa in {keeps?.length ?? 0} stanze</p>
      <div className="flex flex-col gap-2.5">
        {(keeps?.length ?? 0) === 0 && (
          <p className="caption">Nessuna attesa. Torna alla Home e scopri qualcuno.</p>
        )}
        {keeps?.map((k) => (
          <WaitlistCard key={k.room_id} keep={k} />
        ))}
      </div>

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
    </div>
  )
}
