import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/store/session'
import { signOut } from '@/features/auth/api/auth'
import { useMyRoomWaitlist, useMyKeeps } from '@/features/feed/api/feed'
import { avatarUrl } from '@/services/storage/avatar'

export function ProfilePage() {
  const session = useSession((s) => s.session)
  const profile = useSession((s) => s.profile)
  const { data: waitlist } = useMyRoomWaitlist()
  const { data: keeps } = useMyKeeps()

  const photo = avatarUrl(profile?.avatar_path ?? null)

  return (
    <div className="safe-top px-5 py-4">
      <header className="mb-8 flex items-center gap-4">
        <span className="h-20 w-20 overflow-hidden rounded-full bg-blush-soft hairline">
          {photo && <img src={photo} alt="" className="h-full w-full object-cover" />}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold leading-none">
            {profile?.display_name ?? 'Profilo'}
          </h1>
          <p className="caption mt-1.5 truncate">{session?.user.email}</p>
        </div>
      </header>

      {profile?.bio && <p className="mb-8 font-display text-[17px] leading-relaxed">{profile.bio}</p>}

      <div className="mb-8 grid grid-cols-2 gap-3">
        <Stat value={String(waitlist?.length ?? 0)} label="Ti hanno scelto" />
        <Stat value={String(keeps?.length ?? 0)} label="Hai scelto" />
      </div>

      <Button variant="ghost" onClick={() => void signOut()} className="text-balloon">
        Esci
      </Button>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card className="flex flex-col items-center gap-0.5 p-4">
      <span className="font-display text-3xl font-bold">{value}</span>
      <span className="caption text-center">{label}</span>
    </Card>
  )
}
