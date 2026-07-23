import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '@/store/session'
import { PATHS } from '@/routes/paths'

// Serve una sessione. Se manca il profilo, spinge all'onboarding.
export function ProtectedRoute() {
  const { user, onboarded } = useSession()
  if (!user) return <Navigate to={PATHS.login} replace />
  if (!onboarded) return <Navigate to={PATHS.onboarding} replace />
  return <Outlet />
}
