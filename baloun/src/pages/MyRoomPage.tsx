import { Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useMyRoomWaitlist, useMyKeeps } from '@/features/feed/api/feed'

// V1: la stanza mostra chi ha premuto KEEP su di te.
// Round, eliminazioni e chat arriveranno dopo.
export function MyRoomPage() {
  const { data: waitlist, isLoading } = useMyRoomWaitlist()
  const { data: keeps } = useMyKeeps()

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

      <p className="kicker mb-3">Sei in attesa in {keeps?.length ?? 0} stanze</p>
      <div className="flex flex-col gap-2.5">
        {(keeps?.length ?? 0) === 0 && (
          <p className="caption">Nessuna attesa. Torna alla Home e scopri qualcuno.</p>
        )}
        {keeps?.map((k) => (
          <Card key={k.room_id} className="flex items-center gap-3 p-3">
            <span className="h-2 w-2 shrink-0 rounded-full bg-blush" />
            <p className="font-display text-[17px]">{k.main_name}</p>
            <span className="caption ml-auto">in waitlist</span>
          </Card>
        ))}
      </div>
    </div>
  )
}
