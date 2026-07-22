import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Clock, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Pressable } from '@/components/motion/Pressable'
import { MOCK_ROOMS, formatTimeLeft, type MockRoom } from '@/services/mockData'
import { LIMITS } from '@/config/limits'
import { PATHS } from '@/routes/paths'
import { spring } from '@/components/motion/springs'

export function HomePage() {
  return (
    <div className="py-4">
      <header className="mb-6">
        <p className="kicker mb-1">Le stanze aperte</p>
        <h1 className="font-display text-4xl font-bold">Chi stai per conoscere</h1>
      </header>

      <div className="flex flex-col gap-4">
        {MOCK_ROOMS.map((room, i) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: i * 0.05 }}
          >
            <RoomCard room={room} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function RoomCard({ room }: { room: MockRoom }) {
  const navigate = useNavigate()
  const full = room.balloons >= LIMITS.MAX_BALLOONS_PER_ROOM

  return (
    <Card>
      <div className="h-44 w-full" style={{ background: room.hue }} />
      <div className="p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold">
            {room.name}, <span className="font-normal">{room.age}</span>
          </h2>
          <span className="caption flex items-center gap-1">
            <MapPin size={13} strokeWidth={1.75} /> {room.distanceKm} km
          </span>
        </div>

        <div className="mb-4 flex items-center gap-4">
          <span className="caption flex items-center gap-1.5">
            <Users size={14} strokeWidth={1.75} /> {room.balloons}/{LIMITS.MAX_BALLOONS_PER_ROOM}
          </span>
          <span className="caption flex items-center gap-1.5">
            <Clock size={14} strokeWidth={1.75} /> {formatTimeLeft(room.minutesLeft)}
          </span>
        </div>

        <Pressable
          onClick={() => navigate(PATHS.room(room.id))}
          className="w-full rounded-control bg-ink py-3 font-mono text-[14px] text-cream disabled:opacity-40"
          disabled={full}
        >
          {full ? 'Stanza al completo' : 'Entra 🎈'}
        </Pressable>
      </div>
    </Card>
  )
}
