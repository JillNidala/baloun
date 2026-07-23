import { useState } from 'react'
import { Users, Clock, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Pressable } from '@/components/motion/Pressable'
import { LIMITS } from '@/config/limits'
import { formatTimeLeft } from '@/services/mockData'
import { useWaitlist } from '@/store/waitlist'

type Balloon = { id: string; name: string; age: number; hue: string }

const INITIAL: Balloon[] = [
  { id: 'b1', name: 'Alex', age: 26, hue: '#F2C9D3' },
  { id: 'b2', name: 'Deniz', age: 30, hue: '#D9C3E8' },
  { id: 'b3', name: 'Robin', age: 28, hue: '#F6D9C3' },
  { id: 'b4', name: 'Noa', age: 25, hue: '#C3E0E8' },
  { id: 'b5', name: 'Sam', age: 33, hue: '#E8D6C3' },
]

export function MyRoomPage() {
  const [balloons, setBalloons] = useState(INITIAL)
  const eliminate = (id: string) => setBalloons((b) => b.filter((x) => x.id !== id))

  return (
    <div className="safe-top px-5 py-4">
      <header className="mb-6">
        <p className="kicker mb-1">Sei il Main</p>
        <h1 className="font-display text-4xl font-bold">La mia stanza</h1>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center gap-1 p-4">
          <Users size={20} strokeWidth={1.75} className="text-balloon" />
          <span className="font-display text-3xl font-bold">
            {balloons.length}
            <span className="text-lg font-normal text-muted">/{LIMITS.MAX_BALLOONS_PER_ROOM}</span>
          </span>
          <span className="caption">Balloon</span>
        </Card>
        <Card className="flex flex-col items-center gap-1 p-4">
          <Clock size={20} strokeWidth={1.75} className="text-balloon" />
          <span className="font-display text-3xl font-bold">{formatTimeLeft(300)}</span>
          <span className="caption">rimaste</span>
        </Card>
      </div>

      <p className="kicker mb-3">Chi è entrato</p>
      <div className="mb-6 flex flex-col gap-2.5">
        {balloons.map((b) => (
          <Card key={b.id} className="flex items-center gap-3 p-3">
            <div className="h-11 w-11 shrink-0 rounded-full" style={{ background: b.hue }} />
            <div className="flex-1">
              <p className="font-display text-lg font-bold leading-none">{b.name}</p>
              <p className="caption mt-1">{b.age} anni</p>
            </div>
            <Pressable
              onClick={() => eliminate(b.id)}
              aria-label={`Elimina ${b.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-muted hairline"
            >
              <X size={16} strokeWidth={2} />
            </Pressable>
          </Card>
        ))}
        {balloons.length === 0 && <p className="caption py-6 text-center">Nessun Balloon in stanza.</p>}
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="secondary">Inizia la selezione</Button>
        <Button variant="danger">Chiudi la stanza</Button>
      </div>

      <WaitlistSection />
    </div>
  )
}

// Dove sei entratə con KEEP. Serve a vedere che il loop funziona davvero.
function WaitlistSection() {
  const entries = useWaitlist((s) => s.entries)

  return (
    <section className="mt-10">
      <p className="kicker mb-3">Sei in attesa in {entries.length} stanze</p>
      {entries.length === 0 ? (
        <p className="caption">Nessuna attesa. Torna alla Home e scopri qualcuno.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((e) => (
            <Card key={e.roomId} className="flex items-center gap-3 p-3">
              <span className="h-2 w-2 shrink-0 rounded-full bg-blush" />
              <p className="font-display text-[17px]">{e.mainName}</p>
              <span className="caption ml-auto">in waitlist</span>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
