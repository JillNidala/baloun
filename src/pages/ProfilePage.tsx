import { useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Pressable } from '@/components/motion/Pressable'
import { InfoPersonali } from '@/features/settings/components/InfoPersonali'
import { PATHS } from '@/routes/paths'
import { Card } from '@/components/ui/Card'
import { useSession } from '@/store/session'
import { useMyRoomWaitlist } from '@/features/feed/api/feed'
import { useMyKeeps } from '@/features/waitlist/api/waitlist'
import { PhotoGrid } from '@/features/profile/components/PhotoGrid'
import { TagPicker } from '@/features/profile/components/TagPicker'
import { PromptEditor } from '@/features/profile/components/PromptEditor'

export function ProfilePage() {
  const navigate = useNavigate()
  const profile = useSession((s) => s.profile)
  const userId = useSession((s) => s.session?.user.id)
  const { data: waitlist } = useMyRoomWaitlist()
  const { data: keeps } = useMyKeeps()

  return (
    <div className="safe-top px-5 py-4">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="kicker mb-1">Il tuo profilo</p>
          <h1 className="font-display text-4xl font-bold">
            {profile?.display_name ?? 'Profilo'}
          </h1>
          {profile?.city && <p className="caption mt-1.5">{profile.city}</p>}
        </div>

        <Pressable
          onClick={() => navigate(PATHS.settings)}
          aria-label="Impostazioni"
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper hairline"
        >
          <Settings size={18} strokeWidth={1.75} className="text-muted" />
        </Pressable>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center gap-0.5 p-4">
          <span className="font-display text-3xl font-bold">{waitlist?.length ?? 0}</span>
          <span className="caption">nella tua stanza</span>
        </Card>
        <Card className="flex flex-col items-center gap-0.5 p-4">
          <span className="font-display text-3xl font-bold">{keeps?.length ?? 0}</span>
          <span className="caption">attese attive</span>
        </Card>
      </div>

      <div className="mb-10">
        <InfoPersonali />
      </div>

      <div className="mb-10">
        <h2 className="mb-1 font-display text-2xl font-bold">Foto</h2>
        <p className="caption mb-4">Fino a 6. Trascina una foto nel primo riquadro libero.</p>
        <PhotoGrid userId={userId} currentAvatarPath={profile?.avatar_path} />
      </div>

      <div className="mb-10">
        <TagPicker userId={userId} />
      </div>

      <div className="mb-10">
        <PromptEditor userId={userId} />
      </div>

      <Button variant="secondary" onClick={() => navigate(PATHS.settings)}>
        Impostazioni
      </Button>
    </div>
  )
}
