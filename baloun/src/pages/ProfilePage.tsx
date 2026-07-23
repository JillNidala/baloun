import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/store/session'
import { PATHS } from '@/routes/paths'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, signOut } = useSession()

  const logout = () => {
    signOut()
    navigate(PATHS.login, { replace: true })
  }

  return (
    <div className="safe-top px-5 py-4">
      <header className="mb-6 flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-blush-soft hairline" />
        <div>
          <h1 className="font-display text-3xl font-bold leading-none">
            {user?.displayName ?? 'tu'}
          </h1>
          <p className="caption mt-1.5">{user?.email}</p>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat value="3" label="Stanze" />
        <Stat value="1" label="Match" />
        <Stat value="12" label="Balloon" />
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="secondary">Modifica profilo</Button>
        <Button variant="ghost" onClick={logout} className="text-balloon">
          Esci
        </Button>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card className="flex flex-col items-center gap-0.5 p-4">
      <span className="font-display text-3xl font-bold">{value}</span>
      <span className="caption">{label}</span>
    </Card>
  )
}
