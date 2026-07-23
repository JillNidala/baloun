import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Pressable } from '@/components/motion/Pressable'
import { useMyMatches, useMarkMatchSeen } from '@/features/match/api/match'
import { MatchCelebration } from '@/features/match/components/MatchCelebration'
import { PATHS } from '@/routes/paths'

export function MatchesPage() {
  const navigate = useNavigate()
  const { data: matches, isLoading } = useMyMatches()
  const markSeen = useMarkMatchSeen()
  const [dismissed, setDismissed] = useState<string[]>([])

  // Chi viene scelto scopre il match qui: animazione una volta sola.
  const fresh = matches?.find((m) => m.is_new && !dismissed.includes(m.match_id))

  const closeCelebration = (goToChat: boolean) => {
    if (!fresh) return
    setDismissed((d) => [...d, fresh.match_id])
    markSeen.mutate(fresh.match_id)
    if (goToChat) navigate(PATHS.chat(fresh.match_id))
  }

  return (
    <div className="safe-top px-5 py-4">
      <header className="mb-6">
        <p className="kicker mb-1">Chi ce l'ha fatta</p>
        <h1 className="font-display text-4xl font-bold">Chat</h1>
      </header>

      {isLoading && <p className="caption">Carico…</p>}

      {!isLoading && (matches?.length ?? 0) === 0 && (
        <p className="caption">
          Ancora nessun match. Continua a scoprire Main dalla Home.
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        {matches?.map((m) => (
          <Pressable
            key={m.match_id}
            onClick={() => navigate(PATHS.chat(m.match_id))}
            className="w-full text-left"
          >
            <Card className="flex items-center gap-3 p-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-blush-soft">
                {m.photoUrl && (
                  <img src={m.photoUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[18px] leading-none">{m.other_name}</p>
                <p className="caption mt-1.5 truncate">
                  {m.last_message ?? 'Iniziate a scrivervi'}
                </p>
              </div>
              {m.is_new && <span className="h-2 w-2 shrink-0 rounded-full bg-balloon" />}
            </Card>
          </Pressable>
        ))}
      </div>

      <AnimatePresence>
        {fresh && (
          <MatchCelebration
            name={fresh.other_name}
            onContinue={() => closeCelebration(true)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
