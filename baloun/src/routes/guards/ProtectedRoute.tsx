import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '@/store/session'
import { PATHS } from '@/routes/paths'
import { Loading } from '@/components/feedback/Loading'

export function ProtectedRoute() {
  const session = useSession((s) => s.session)
  const profile = useSession((s) => s.profile)

  if (session === undefined) return <Loading />
  if (session === null) return <Navigate to={PATHS.login} replace />
  if (profile && !profile.onboarded) return <Navigate to={PATHS.onboarding} replace />
  if (!profile) return <Loading />
  return <Outlet />
}
