import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '@/store/session'
import { PATHS } from '@/routes/paths'

export function PublicOnlyRoute() {
  const session = useSession((s) => s.session)
  const profile = useSession((s) => s.profile)

  if (session && profile?.onboarded) return <Navigate to={PATHS.home} replace />
  if (session && profile && !profile.onboarded) return <Navigate to={PATHS.onboarding} replace />
  return <Outlet />
}
