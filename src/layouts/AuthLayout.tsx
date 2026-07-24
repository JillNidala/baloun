import { Outlet } from 'react-router-dom'

// Guscio pulito per splash / login / registrazione / onboarding.
export function AuthLayout() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-6 safe-top safe-bottom">
      <Outlet />
    </div>
  )
}
