import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '@/store/session'
import { PATHS } from '@/routes/paths'
import { Loading } from '@/components/feedback/Loading'

// L'onboarding richiede una sessione, ma NON un profilo completo.
export function OnboardingRoute() {
  const session = useSession((s) => s.session)
  const profile = useSession((s) => s.profile)

  if (session === undefined) return <Loading />
  if (session === null) return <Navigate to={PATHS.login} replace />
  if (profile?.onboarded) return <Navigate to={PATHS.home} replace />
  return <Outlet />
}
