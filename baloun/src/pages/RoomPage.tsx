import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, MapPin } from 'lucide-react'
import { MOCK_ROOMS } from '@/services/mockData'
import { Logo } from '@/components/ui/Logo'
import { Pressable } from '@/components/motion/Pressable'
import { PATHS } from '@/routes/paths'
import { spring, springBouncy } from '@/components/motion/springs'

type Decision = 'idle' | 'stay' | 'pop'

export function RoomPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const room = MOCK_ROOMS.find((r) => r.id === id) ?? MOCK_ROOMS[0]
  const [decision, setDecision] = useState<Decision>('idle')

  return (
    <div className="relative flex min-h-full flex-col safe-top" style={{ background: room.hue }}>
      <button
        onClick={() => navigate(PATHS.home)}
        className="absolute left-4 top-4 z-10 flex items-center gap-1 font-mono text-[13px] text-ink/70"
        style={{ marginTop: 'var(--safe-top)' }}
      >
        <ChevronLeft size={18} /> Esci
      </button>

      {/* "Palco" del Main */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="kicker mb-4">Round 1 · foto, età, distanza</p>
        <div className="mb-6 h-56 w-56 rounded-card bg-white/40 hairline" />
        <h1 className="font-display text-5xl font-bold">{room.name}</h1>
        <p className="mt-1 font-display text-2xl">{room.age} anni</p>
        <p className="caption mt-3 flex items-center gap-1.5">
          <MapPin size={14} strokeWidth={1.75} /> a {room.distanceKm} km da te
        </p>
      </div>

      {/* Decisione */}
      <div className="safe-bottom px-6 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <Pressable
            onClick={() => setDecision('stay')}
            className="rounded-control bg-ink py-4 font-mono text-[15px] text-cream"
          >
            🎈 Resta
          </Pressable>
          <Pressable
            onClick={() => setDecision('pop')}
            className="rounded-control bg-balloon py-4 font-mono text-[15px] text-white"
          >
            💥 Poppa
          </Pressable>
        </div>
      </div>

      <AnimatePresence>
        {decision !== 'idle' && (
          <Result room={room.name} decision={decision} onClose={() => navigate(PATHS.home)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function Result({
  room,
  decision,
  onClose,
}: {
  room: string
  decision: Exclude<Decision, 'idle'>
  onClose: () => void
}) {
  const stayed = decision === 'stay'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-cream/95 px-8 text-center backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={springBouncy}
      >
        {stayed ? (
          <Logo className="h-28 w-auto" />
        ) : (
          <span className="text-7xl">💥</span>
        )}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.1 }}
        className="font-display text-3xl font-bold"
      >
        {stayed ? `Sei rimastə nella stanza di ${room}` : 'Hai poppato'}
      </motion.h2>
      <p className="caption max-w-xs">
        {stayed
          ? 'Aspetti la fine della selezione. Se resti l’ultimə, è Match.'
          : 'Sei uscitə da questa stanza.'}
      </p>
      <Pressable
        onClick={onClose}
        className="mt-2 rounded-control bg-ink px-8 py-3 font-mono text-[14px] text-cream"
      >
        Torna alle stanze
      </Pressable>
    </motion.div>
  )
}
