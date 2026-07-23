import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '@/store/session'
import { PATHS } from '@/routes/paths'

// Chi è già dentro non deve rivedere login/registrazione.
export function PublicOnlyRoute() {
  const { user, onboarded } = useSession()
  if (user && onboarded) return <Navigate to={PATHS.home} replace />
  return <Outlet />
}
